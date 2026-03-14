// ============================================================================
// TRADERX TWITTER FETCHER v4.0 - Real Tweet Fetching (No Synthetic Data)
// ============================================================================
// Fetches tweets using multiple strategies:
// 1. Scan current page DOM
// 2. Inject fetch into Twitter's search API
// 3. Use background script for cross-origin requests
// REMOVED: Strategy 4 (synthetic tweet generation) — was poisoning sentiment
// ============================================================================

class TwitterFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 25000; // 25 seconds cache
    this.lastFetch = new Map();
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.maxTweetsPerTicker = 50;

    // For deduplication
    this.JACCARD_THRESHOLD = 0.85;
  }

  // ========================================================================
  // MAIN FETCH FUNCTION
  // ========================================================================

  async fetchTickerTweets(ticker, options = {}) {
    const normalizedTicker = ticker.toUpperCase().replace(/^\$/, "");
    const cacheKey = normalizedTicker;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(
        `[Fetcher] Cache hit for $${normalizedTicker} (${cached.tweets.length} tweets)`,
      );
      return cached;
    }

    // Rate limiting
    const lastFetchTime = this.lastFetch.get(cacheKey) || 0;
    if (Date.now() - lastFetchTime < this.rateLimitDelay && cached) {
      return cached;
    }

    this.lastFetch.set(cacheKey, Date.now());
    console.log(`[Fetcher] Fetching fresh tweets for $${normalizedTicker}...`);

    let allTweets = [];

    try {
      // Strategy 1: Scan current page DOM
      const domTweets = this.fetchFromDOM(normalizedTicker);
      allTweets.push(...domTweets);
      console.log(`[Fetcher] DOM: ${domTweets.length} tweets`);

      // Strategy 2: If on search page, get all visible tweets
      if (window.location.pathname.includes("/search")) {
        const searchTweets = this.fetchFromSearchPage(normalizedTicker);
        searchTweets.forEach((t) => {
          if (!this.isDuplicate(t, allTweets)) {
            allTweets.push(t);
          }
        });
        console.log(`[Fetcher] Search page: ${searchTweets.length} tweets`);
      }

      // Strategy 3: Try to fetch from Twitter's search endpoint
      if (allTweets.length < 20) {
        const fetchedTweets =
          await this.fetchFromTwitterSearch(normalizedTicker);
        fetchedTweets.forEach((t) => {
          if (!this.isDuplicate(t, allTweets)) {
            allTweets.push(t);
          }
        });
        console.log(`[Fetcher] API: ${fetchedTweets.length} tweets`);
      }

      // NO Strategy 4 — we never generate fake tweets
    } catch (error) {
      console.error(`[Fetcher] Error:`, error);
      // On error, return whatever we have — never generate fake data
    }

    // Deduplicate with fuzzy matching
    allTweets = this.deduplicateFuzzy(allTweets);

    // Limit and build result
    const finalTweets = allTweets.slice(0, this.maxTweetsPerTicker);

    // Determine data confidence level
    const confidence = this.computeConfidence(finalTweets);

    const result = {
      tweets: finalTweets,
      confidence, // 'high' | 'medium' | 'low'
      insufficientData: finalTweets.length < 5,
      sampleSize: finalTweets.length,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);

    // --- NEW: Sync to Local Backend Engine ---
    if (finalTweets.length > 0) {
      this.syncWithBackend(normalizedTicker, finalTweets);
    }

    console.log(
      `[Fetcher] Total for $${normalizedTicker}: ${finalTweets.length} tweets (confidence: ${confidence})`,
    );
    return result;
  }

  // ========================================================================
  // BACKEND SYNC (To Local Node Server)
  // API key and backend URL are loaded from chrome.storage — never hardcoded.
  // ========================================================================
  async syncWithBackend(ticker, tweets) {
    try {
      // Load API key and backend URL from chrome.storage (set in Settings page)
      const stored = await new Promise((resolve) =>
        chrome.storage.local.get(
          ["traderx_api_key", "traderx_backend_url"],
          resolve,
        ),
      );

      const apiKey = stored.traderx_api_key || null;
      const backendUrl = (
        stored.traderx_backend_url || "http://localhost:3001"
      ).replace(/\/$/, "");

      // Skip sync if no API key is configured — avoids 401 spam in console
      if (!apiKey) {
        console.debug(
          `[Sync] No API key configured — skipping backend sync for $${ticker}. Set one in Settings.`,
        );
        return;
      }

      const response = await fetch(`${backendUrl}/api/sync/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ ticker, tweets }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `[Sync] Synced ${tweets.length} tweets for $${ticker}. Alerts triggered: ${data.alertsTriggered}`,
        );
      } else {
        console.warn(
          `[Sync] Backend returned ${response.status} for $${ticker}`,
        );
      }
    } catch (e) {
      // Server offline is expected in dev — don't flood the console
      console.debug(
        `[Sync] Backend offline or unreachable for $${ticker}: ${e.message}`,
      );
    }
  }

  // ========================================================================
  // CONFIDENCE SCORING
  // ========================================================================

  computeConfidence(tweets) {
    if (tweets.length >= 25) return "high";
    if (tweets.length >= 10) return "medium";
    return "low";
  }

  // ========================================================================
  // DEDUPLICATION (Tweet ID + Jaccard Similarity)
  // ========================================================================

  isDuplicate(newTweet, existingTweets) {
    const newText = (newTweet.text || "").trim();
    if (!newText) return true;

    // Check exact match first (fast path)
    for (const existing of existingTweets) {
      if (existing.text === newText) return true;

      // Check tweet ID if available
      if (
        newTweet.tweetId &&
        existing.tweetId &&
        newTweet.tweetId === existing.tweetId
      ) {
        return true;
      }
    }

    // Fuzzy match via Jaccard similarity
    for (const existing of existingTweets) {
      if (
        this.jaccardSimilarity(newText, existing.text || "") >
        this.JACCARD_THRESHOLD
      ) {
        return true;
      }
    }

    return false;
  }

  deduplicateFuzzy(tweets) {
    const unique = [];
    for (const tweet of tweets) {
      if (!this.isDuplicate(tweet, unique)) {
        unique.push(tweet);
      }
    }
    return unique;
  }

  jaccardSimilarity(a, b) {
    if (!a || !b) return 0;

    const setA = new Set(
      a
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
    const setB = new Set(
      b
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) intersection++;
    }

    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  // ========================================================================
  // STRATEGY 1: Fetch from current page DOM
  // ========================================================================

  fetchFromDOM(ticker) {
    const tweets = [];
    const tweetElements = document.querySelectorAll(
      'article[data-testid="tweet"]',
    );

    tweetElements.forEach((element) => {
      const textElement = element.querySelector('[data-testid="tweetText"]');
      if (!textElement) return;

      const text = textElement.textContent || "";
      const textUpper = text.toUpperCase();

      // Check for ticker mention (cashtag or word)
      const hasCashtag = textUpper.includes(`$${ticker}`);
      const hasWord = new RegExp(`\\b${ticker}\\b`).test(textUpper);

      if (hasCashtag || hasWord) {
        const author = this.extractAuthor(element);
        const timestamp = this.extractTimestamp(element);
        const metrics = this.extractMetrics(element);
        const tweetId = this.extractTweetId(element);

        tweets.push({
          text,
          author,
          timestamp,
          tweetId,
          ...metrics,
          source: "dom",
        });
      }
    });

    return tweets;
  }

  // ========================================================================
  // STRATEGY 2: Fetch from search results page
  // ========================================================================

  fetchFromSearchPage(ticker) {
    const tweets = [];
    const tweetElements = document.querySelectorAll(
      'article[data-testid="tweet"]',
    );

    tweetElements.forEach((element) => {
      const textElement = element.querySelector('[data-testid="tweetText"]');
      if (!textElement) return;

      const text = textElement.textContent || "";
      const author = this.extractAuthor(element);
      const timestamp = this.extractTimestamp(element);
      const metrics = this.extractMetrics(element);
      const tweetId = this.extractTweetId(element);

      tweets.push({
        text,
        author,
        timestamp,
        tweetId,
        ...metrics,
        source: "search",
      });
    });

    return tweets;
  }

  // ========================================================================
  // STRATEGY 3: Fetch from Twitter's Search (via fetch)
  // ========================================================================

  async fetchFromTwitterSearch(ticker) {
    const tweets = [];

    try {
      // Build search query
      const query = encodeURIComponent(
        `$${ticker} lang:en min_faves:1 -filter:replies`,
      );
      const searchUrl = `https://x.com/search?q=${query}&src=typed_query&f=live`;

      // Try to fetch the search page
      const response = await fetch(searchUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        console.log(`[Fetcher] Search fetch failed: ${response.status}`);
        return tweets;
      }

      const html = await response.text();

      // Parse tweets from HTML
      const dataMatches = html.match(/"full_text":"([^"]+)"/g);

      if (dataMatches) {
        dataMatches.forEach((match) => {
          const textMatch = match.match(/"full_text":"([^"]+)"/);
          if (textMatch && textMatch[1]) {
            const text = textMatch[1]
              .replace(/\\n/g, " ")
              .replace(/\\u[\dA-Fa-f]{4}/g, (char) => {
                return String.fromCharCode(
                  parseInt(char.replace("\\u", ""), 16),
                );
              })
              .trim();

            if (text.length > 10 && text.toUpperCase().includes(ticker)) {
              tweets.push({
                text,
                author: "twitter_user",
                source: "api",
              });
            }
          }
        });
      }
    } catch (error) {
      console.log(`[Fetcher] Search fetch error:`, error.message);
    }

    return tweets.slice(0, 30);
  }

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  extractAuthor(element) {
    try {
      const authorLink = element.querySelector('a[href^="/"][role="link"]');
      if (authorLink) {
        const href = authorLink.getAttribute("href");
        if (href && !href.includes("/status")) {
          return href.substring(1);
        }
      }
    } catch (e) {}
    return "unknown";
  }

  extractTimestamp(element) {
    try {
      const timeElement = element.querySelector("time");
      if (timeElement) {
        return timeElement.getAttribute("datetime");
      }
    } catch (e) {}
    return null;
  }

  extractTweetId(element) {
    try {
      // Try data-tweet-id attribute first
      const id = element.getAttribute("data-tweet-id");
      if (id) return id;

      // Try to extract from status link
      const statusLink = element.querySelector('a[href*="/status/"]');
      if (statusLink) {
        const href = statusLink.getAttribute("href");
        const match = href.match(/\/status\/(\d+)/);
        if (match) return match[1];
      }
    } catch (e) {}
    return null;
  }

  extractMetrics(element) {
    const metrics = { likes: 0, retweets: 0, replies: 0 };

    try {
      const buttons = element.querySelectorAll('[data-testid$="-button"]');
      buttons.forEach((btn) => {
        const label = btn.getAttribute("aria-label") || "";
        const count = parseInt(label.match(/\d+/)?.[0] || "0");

        if (label.includes("like")) metrics.likes = count;
        if (label.includes("repost") || label.includes("retweet"))
          metrics.retweets = count;
        if (label.includes("repl")) metrics.replies = count;
      });
    } catch (e) {}

    return metrics;
  }

  // ========================================================================
  // BATCH FETCH
  // ========================================================================

  async fetchMultipleTickers(tickers) {
    const results = {};

    // Use Promise.allSettled for true parallel fetch
    const promises = tickers.map(async (ticker) => {
      const result = await this.fetchTickerTweets(ticker);
      return { ticker, result };
    });

    const settled = await Promise.allSettled(promises);

    settled.forEach((outcome) => {
      if (outcome.status === "fulfilled") {
        results[outcome.value.ticker] = outcome.value.result;
      } else {
        results[outcome.value?.ticker || "unknown"] = {
          tweets: [],
          confidence: "low",
          insufficientData: true,
          sampleSize: 0,
          timestamp: Date.now(),
        };
      }
    });

    return results;
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  clearCache(ticker = null) {
    if (ticker) {
      this.cache.delete(ticker.toUpperCase().replace(/^\$/, ""));
    } else {
      this.cache.clear();
    }
  }

  getCacheStatus() {
    const status = {};
    this.cache.forEach((value, key) => {
      status[key] = {
        count: value.tweets.length,
        confidence: value.confidence,
        age: Math.round((Date.now() - value.timestamp) / 1000) + "s",
      };
    });
    return status;
  }
}

// Singleton instance
window.TraderXFetcher = window.TraderXFetcher || new TwitterFetcher();

console.log("[TraderX] Twitter Fetcher v4.0 initialized (no synthetic data)");
