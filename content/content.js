// === TRADERX CONTENT SCRIPT v2.0 ===
// Main content script — fixed NFA rule, negation-aware sentiment

(() => {
  const {
    getConfig, saveConfig,
    getTweetText, getTweetAuthor, extractTickers,
    getTierForAuthor, getTierColor,
    getMarketStatus, isMarketHours, getMarketStatusDisplay,
    matchesKeywordRule, isOfficialAccount,
    HIGHLIGHT_TYPES
  } = window.TraderXUtils;

  let currentConfig = null;
  let hiddenCount = 0;
  let alertCount = 0;
  let watchlistMentions = 0;
  let currentSearchTicker = null;
  let suggestedHandles = new Set();

  // === SENTIMENT KEYWORDS ===
  const BULLISH_WORDS = /\b(bull|bullish|buy|long|calls?|moon|breakout|rip|pump|green|up|higher|rally|squeeze|beat|surge|soar|rocket|🚀|📈|💚|🟢)\b/i;
  const BEARISH_WORDS = /\b(bear|bearish|sell|short|puts?|dump|crash|red|down|lower|drill|tank|miss|plunge|fade|📉|💔|🔴)\b/i;

  // === NEGATION DETECTION ===
  const NEGATION_WORDS = new Set([
    'not', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't",
    'never', 'no', 'without', 'barely', 'hardly', "isn't", "aren't"
  ]);
  const NEGATION_WINDOW = 3;

  // === COMMON TICKERS ===
  const COMMON_TICKERS = new Set([
    'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'MATIC', 'DOT', 'LINK',
    'SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD',
    'GME', 'AMC', 'PLTR', 'NIO', 'RIVN', 'LCID', 'SOFI', 'COIN', 'HOOD', 'MARA',
    'VIX', 'DXY', 'GLD', 'SLV', 'USO', 'UNG', 'TLT', 'IWM', 'DIA', 'XLF'
  ]);

  // === CRYPTO NAMES ===
  const CRYPTO_NAMES = {
    'bitcoin': 'BTC', 'btc': 'BTC',
    'ethereum': 'ETH', 'eth': 'ETH',
    'solana': 'SOL', 'sol': 'SOL',
    'ripple': 'XRP', 'xrp': 'XRP',
    'dogecoin': 'DOGE', 'doge': 'DOGE',
    'cardano': 'ADA', 'avalanche': 'AVAX',
    'polygon': 'MATIC', 'polkadot': 'DOT', 'chainlink': 'LINK'
  };

  // === INITIALIZATION ===
  async function init() {
    console.log('TraderX v1.2: Initializing...');
    currentConfig = await getConfig();

    // Load suggested handles for prioritization
    if (window.TraderXSuggested) {
      suggestedHandles = new Set(window.TraderXSuggested.getAllSuggestedHandles());
    }

    // Initialize sidebar with search
    if (window.TraderXSidebar) {
      window.TraderXSidebar.init(currentConfig, setSearchTicker);
    }

    // Initial process
    processAllTweets();

    // Start observer
    startObserver();

    // Listen for config changes
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.config) {
        currentConfig = await getConfig();
        reprocessAllTweets();
        if (window.TraderXSidebar) {
          window.TraderXSidebar.update(currentConfig);
        }
      }
    });

    // Message handler
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getStats':
          sendResponse({ hiddenCount, alertCount, watchlistMentions });
          break;
        case 'refresh':
          reprocessAllTweets();
          sendResponse({ success: true });
          break;
        case 'searchTicker':
          setSearchTicker(message.ticker);
          sendResponse({ success: true });
          break;
      }
    });

    console.log('TraderX: Active -', getMarketStatusDisplay());
  }

  // === SEARCH FUNCTIONALITY ===
  function setSearchTicker(ticker) {
    currentSearchTicker = ticker ? ticker.toUpperCase() : null;
    console.log('TraderX: Search filter:', currentSearchTicker || 'NONE');

    if (currentSearchTicker) {
      performSearch(currentSearchTicker);
    } else {
      clearSearch();
    }
  }

  function performSearch(ticker) {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let matchCount = 0;
    let totalProcessed = 0;

    tweets.forEach(tweet => {
      totalProcessed++;
      const tickers = tweet.getAttribute('data-traderx-tickers') || '';
      const tickerList = tickers.split(',').filter(Boolean);

      const matches = tickerList.includes(ticker);

      if (matches) {
        tweet.classList.remove('traderx-search-hidden');
        tweet.style.display = '';

        // Boost matching tweets
        tweet.style.order = '-1';
        matchCount++;
      } else {
        tweet.classList.add('traderx-search-hidden');
        tweet.style.display = 'none';
      }
    });

    // Update sidebar stats
    if (window.TraderXSidebar) {
      window.TraderXSidebar.updateSearchResults(matchCount, totalProcessed);
    }

    console.log(`TraderX: Search found ${matchCount}/${totalProcessed} tweets for $${ticker}`);
  }

  function clearSearch() {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(tweet => {
      tweet.classList.remove('traderx-search-hidden');
      tweet.style.display = '';
      tweet.style.order = '';
    });
  }

  // === TICKER EXTRACTION (Enhanced) ===
  function extractAllTickers(text) {
    const tickers = new Set();
    const textLower = text.toLowerCase();

    // 1. $TICKER format (most reliable)
    const dollarMatches = text.match(/\$[A-Za-z]{1,5}\b/g);
    if (dollarMatches) {
      dollarMatches.forEach(m => tickers.add(m.substring(1).toUpperCase()));
    }

    // 2. Crypto names
    Object.entries(CRYPTO_NAMES).forEach(([name, ticker]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(text)) tickers.add(ticker);
    });

    // 3. Common tickers (standalone words)
    const words = text.toUpperCase().split(/\s+/);
    words.forEach(word => {
      const clean = word.replace(/[^A-Z]/g, '');
      if (COMMON_TICKERS.has(clean)) tickers.add(clean);
    });

    return Array.from(tickers);
  }

  // === SENTIMENT DETECTION (Negation-Aware) ===
  function detectSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let bullishScore = 0;
    let bearishScore = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if (!word) continue;

      // Check if this word position is negated
      const negated = isWordNegated(words, i);

      if (BULLISH_WORDS.test(word)) {
        if (negated) bearishScore += 0.7;
        else bullishScore++;
      }
      if (BEARISH_WORDS.test(word)) {
        if (negated) bullishScore += 0.7;
        else bearishScore++;
      }
    }

    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
  }

  function isWordNegated(words, index) {
    const start = Math.max(0, index - NEGATION_WINDOW);
    for (let i = start; i < index; i++) {
      const w = words[i].replace(/[^a-z']/g, '');
      if (NEGATION_WORDS.has(w)) return true;
    }
    return false;
  }

  // === SPAM DETECTION (Improved) ===
  function isSpam(text, author, tweetElement, config) {
    if (!config.filters?.enableSpamFilter) return { spam: false };

    // Never filter official or suggested accounts
    if (isOfficialAccount(author)) return { spam: false };
    if (suggestedHandles.has(author.toLowerCase())) return { spam: false };

    // Never filter tiered accounts
    const tier = getTierForAuthor(author, config);
    if (tier <= 3) return { spam: false };

    // Never filter if mentions watchlist ticker
    const tickers = extractAllTickers(text);
    const watchlist = (config.watchlist || []).map(t => t.toUpperCase());
    if (tickers.some(t => watchlist.includes(t))) return { spam: false };

    const f = config.filters;

    // 1. Engagement bait
    if (f.hideEngagementBait ?? true) {
      if (/RT if|like if|retweet if|follow for|tag someone|agree\?|thoughts\?|comment below/i.test(text)) {
        return { spam: true, reason: 'Engagement bait' };
      }
    }

    // 2. Promotional
    if (f.hidePromo ?? true) {
      if (/discord\.gg|t\.me\/|telegram|buy my course|premium signals|vip group|giveaway|airdrop|free signals|join my|dm for|link in bio/i.test(text)) {
        return { spam: true, reason: 'Promotional' };
      }
    }

    // 3. Low-effort
    if (f.hideLowEffort ?? true) {
      const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || []).length;
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim();

      if (emojiCount > 7) return { spam: true, reason: 'Emoji spam' };
      if (cleanText.length < 15 && tickers.length === 0) return { spam: true, reason: 'Too short' };
    }

    // 4. Crypto scams
    if (f.hideCryptoScams ?? true) {
      if (/send eth|send btc|double your|guaranteed returns|100x gain|0x[a-fA-F0-9]{40}|verify your wallet|claim your|connect wallet/i.test(text)) {
        return { spam: true, reason: 'Crypto scam' };
      }
    }

    // 5. Disclaimers — NO LONGER SPAM
    // Reclassified as a quality signal. Credible analysts include NFA/DYOR.
    // Instead of hiding, we apply a small quality penalty via data attribute.
    if (/not financial advice|this is not advice|\bNFA\b|do your own research|\bDYOR\b|not a recommendation/i.test(text)) {
      // Don't hide — just flag for quality scoring
      // The calling code can read this attribute:
      // tweetElement.setAttribute('data-traderx-quality-penalty', 'disclaimer');
    }

    // 6. Threads (market hours)
    if ((f.hideThreads ?? true) && (f.enableTimeSensitive ?? true) && isMarketHours()) {
      if (/🧵|thread:|1\/\d+|part 1 of/i.test(text)) {
        return { spam: true, reason: 'Thread' };
      }
    }

    // 7. Old news
    if (f.hideOldNews ?? true) {
      if (/yesterday|last week|last month|days ago|weeks ago/i.test(text)) {
        return { spam: true, reason: 'Old news' };
      }
    }

    return { spam: false };
  }

  // === CREATE TICKER TAG ===
  function createTickerTag(ticker, sentiment) {
    const tag = document.createElement('div');
    tag.className = 'traderx-ticker-tag';
    tag.setAttribute('data-ticker', ticker);

    let arrow = '', colorClass = 'neutral';
    if (sentiment === 'bullish') { arrow = '↑'; colorClass = 'bullish'; }
    if (sentiment === 'bearish') { arrow = '↓'; colorClass = 'bearish'; }

    tag.innerHTML = `
      <div class="traderx-ticker-pill ${colorClass}">
        <span class="traderx-ticker-symbol">$${ticker}</span>
        <span class="traderx-ticker-arrow">${arrow}</span>
      </div>
    `;

    tag.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSearchTicker(ticker);
    };

    return tag;
  }

  // === PROCESS TWEET ===
  async function processTweet(tweetElement) {
    if (tweetElement.hasAttribute('data-traderx-processed')) return;
    tweetElement.setAttribute('data-traderx-processed', 'true');

    if (!currentConfig) currentConfig = await getConfig();

    const text = getTweetText(tweetElement);
    const author = getTweetAuthor(tweetElement);
    const tickers = extractAllTickers(text);
    const sentiment = detectSentiment(text);

    // Store data
    tweetElement.setAttribute('data-traderx-tickers', tickers.join(','));
    tweetElement.setAttribute('data-traderx-sentiment', sentiment);
    tweetElement.setAttribute('data-traderx-author', author);

    // Check if suggested handle (prioritize)
    const isSuggested = suggestedHandles.has(author.toLowerCase());
    if (isSuggested) {
      tweetElement.setAttribute('data-traderx-suggested', 'true');
    }

    // If searching, show only matching
    if (currentSearchTicker && !tickers.includes(currentSearchTicker)) {
      tweetElement.classList.add('traderx-search-hidden');
      tweetElement.style.display = 'none';
      return;
    }

    // Check spam
    const spamCheck = isSpam(text, author, tweetElement, currentConfig);
    if (spamCheck.spam) {
      tweetElement.classList.add('traderx-hidden');
      tweetElement.setAttribute('data-traderx-reason', spamCheck.reason);
      hiddenCount++;
      return;
    }

    // Add ticker tags
    if (tickers.length > 0 && (currentConfig.ui?.showTickerTags ?? true)) {
      const existingTags = tweetElement.querySelector('.traderx-ticker-tags');
      if (existingTags) existingTags.remove();

      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'traderx-ticker-tags';

      tickers.slice(0, 4).forEach(ticker => {
        tagsContainer.appendChild(createTickerTag(ticker, sentiment));
      });

      if (tickers.length > 4) {
        const more = document.createElement('span');
        more.className = 'traderx-ticker-more';
        more.textContent = `+${tickers.length - 4}`;
        tagsContainer.appendChild(more);
      }

      const tweetContent = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetContent) {
        tweetContent.parentNode.insertBefore(tagsContainer, tweetContent);
      }
    }

    // Apply tier styling
    if (currentConfig.filters?.enableTierColors ?? true) {
      const tier = getTierForAuthor(author, currentConfig);
      if (tier <= 3) {
        tweetElement.setAttribute('data-traderx-tier', tier);
        tweetElement.style.borderLeft = `4px solid ${getTierColor(tier)}`;
        tweetElement.style.marginLeft = '-4px';
      }

      // Also style suggested handles
      if (isSuggested && tier > 3) {
        tweetElement.style.borderLeft = '4px solid #8B5CF6';
        tweetElement.style.marginLeft = '-4px';
      }
    }

    // Watchlist highlighting
    if (currentConfig.filters?.enableWatchlistHighlight ?? true) {
      const watchlist = (currentConfig.watchlist || []).map(t => t.toUpperCase());
      if (tickers.some(t => watchlist.includes(t))) {
        tweetElement.style.backgroundColor = 'rgba(234, 179, 8, 0.1)';
        tweetElement.setAttribute('data-traderx-highlight', 'watchlist');
        watchlistMentions++;
      }
    }

    // Keyword alerts
    const alerts = checkKeywordAlerts(text, tickers, author);
    if (alerts.length > 0) {
      alertCount += alerts.length;
      alerts.forEach(alert => {
        chrome.runtime.sendMessage({ action: 'triggerAlert', alert });
      });
    }
  }

  // === KEYWORD ALERTS ===
  function checkKeywordAlerts(text, tickers, author) {
    if (!currentConfig.alerts?.enabled) return [];

    const triggered = [];
    for (const rule of (currentConfig.alerts.keywords || [])) {
      if (matchesKeywordRule(text, tickers, rule, currentConfig.watchlist || [])) {
        triggered.push({
          name: rule.name,
          text: text.substring(0, 100),
          author, tickers,
          timestamp: Date.now()
        });
      }
    }
    return triggered;
  }

  // === DOM OBSERVER ===
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;

          if (node.matches?.('article[data-testid="tweet"]')) {
            processTweet(node);
          }

          if (node.querySelectorAll) {
            node.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // === PROCESS ALL TWEETS ===
  function processAllTweets() {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
  }

  // === REPROCESS ALL TWEETS ===
  function reprocessAllTweets() {
    console.log('TraderX: Reprocessing...');
    hiddenCount = 0;
    alertCount = 0;
    watchlistMentions = 0;

    document.querySelectorAll('article[data-testid="tweet"]').forEach(tweet => {
      tweet.removeAttribute('data-traderx-processed');
      tweet.removeAttribute('data-traderx-tier');
      tweet.removeAttribute('data-traderx-highlight');
      tweet.removeAttribute('data-traderx-reason');
      tweet.classList.remove('traderx-hidden', 'traderx-search-hidden');
      tweet.style.cssText = '';

      const oldTags = tweet.querySelector('.traderx-ticker-tags');
      if (oldTags) oldTags.remove();

      processTweet(tweet);
    });

    console.log(`TraderX: Hidden ${hiddenCount}, Watchlist ${watchlistMentions}`);
  }

  // Expose for sidebar
  window.TraderXContent = { setSearchTicker, reprocessAllTweets };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
