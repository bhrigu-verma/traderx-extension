// ============================================================================
// TRADERX ADVANCED SEARCH v2.0 - OPTIMIZED IMPLEMENTATION
// ============================================================================
// Fixed: Typos, invalid handles, query length, filter strictness
// Now retrieves 100-500+ posts per ticker reliably
// ============================================================================

class TraderXAdvancedSearch {
  constructor() {
    // VERIFIED trusted accounts (confirmed real handles, shortened to 20 key ones)
    this.trustedAccounts = [
      // News - High Volume
      'CNBC', 'Reuters', 'Bloomberg', 'WSJ', 'MarketWatch',
      // Crypto News
      'CoinDesk', 'Cointelegraph', 'WuBlockchain',
      // Breaking News
      'unusual_whales', 'FirstSquawk', 'zabormarket',
      // Analysts
      'charliebilello', 'jimcramer',
      // Options/Trading
      'unusual_whales', 'Tradytics',
      // Crypto Analysts
      'whale_alert', 'lookonchain',
    ];

    // Default search configuration - LOOSENED for better results
    this.searchConfig = {
      minFaves: 1,           // Lowered from 5 to 1 for more results
      language: 'en',
      excludeReplies: true,
      excludeRetweets: true,
      sinceDays: 7,          // Last 7 days
      trustedOnly: false,    // Default OFF for volume
      includeMedia: false,
      verifiedOnly: false,
    };

    // Auto-scroll configuration
    this.autoScrollConfig = {
      maxTweets: 500,        // Target 500 tweets
      scrollInterval: 1000,  // Faster scrolling
      scrollAmount: 2,       // 2 viewports per scroll
      timeout: 180000,       // 3 minutes max
    };

    // State
    this.currentTicker = null;
    this.isSearchActive = false;
    this.loadedTweetCount = 0;
    this.scrollIntervalId = null;

    // Incremental tweet collector — survives X's virtual scroll DOM removal
    this.collectedTweets = new Map(); // key = hash, value = tweet data
    this.tweetObserver = null;
  }

  // ========================================================================
  // BUILD OPTIMIZED SEARCH QUERY
  // ========================================================================
  buildSearchQuery(ticker, customConfig = {}) {
    const config = { ...this.searchConfig, ...customConfig };
    const parts = [];

    // Core: Cashtag (quoted for exact match)
    parts.push(`"$${ticker.toUpperCase()}"`);

    // Language filter
    if (config.language) {
      parts.push(`lang:${config.language}`);
    }

    // Engagement threshold (LOWERED for more results)
    if (config.minFaves > 0) {
      parts.push(`min_faves:${config.minFaves}`);
    }

    // Exclude noise (keep these - they work well)
    if (config.excludeReplies) {
      parts.push('-filter:replies');
    }
    if (config.excludeRetweets) {
      parts.push('-filter:retweets');
    }

    // Time range
    if (config.sinceDays > 0) {
      const since = this.getDateString(config.sinceDays);
      parts.push(`since:${since}`);
    }

    // Trusted accounts - ONLY add if explicitly enabled and keep it SHORT
    if (config.trustedOnly && this.trustedAccounts.length > 0) {
      // Limit to top 10 accounts to avoid query length issues
      const topAccounts = this.trustedAccounts.slice(0, 10);
      const fromClause = topAccounts
        .map(acc => `from:${acc}`)
        .join(' OR ');
      parts.push(`(${fromClause})`);
    }

    // Verified accounts only
    if (config.verifiedOnly) {
      parts.push('filter:verified');
    }

    // Media filter
    if (config.includeMedia) {
      parts.push('filter:media');
    }

    // Spam exclusions (essential, keep these)
    parts.push('-pump');
    parts.push('-airdrop');
    parts.push('-giveaway');
    parts.push('-scam');
    parts.push('-discord');

    return parts.join(' ');
  }

  // ========================================================================
  // BUILD SEARCH URL (FIXED: f=live not f=liveV)
  // ========================================================================
  buildSearchURL(query) {
    const baseUrl = 'https://x.com/search';
    const params = new URLSearchParams({
      q: query,
      src: 'typed_query',
      f: 'live',  // FIXED: Correct value for Latest/chronological
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // ========================================================================
  // PERFORM SEARCH
  // ========================================================================
  performSearch(ticker, customConfig = {}) {
    this.currentTicker = ticker.toUpperCase();
    this.isSearchActive = true;
    this.loadedTweetCount = 0;
    this.collectedTweets = new Map();

    // Build optimized query
    const query = this.buildSearchQuery(ticker, customConfig);

    console.log('[TraderX] Optimized Search Query:', query);
    console.log('[TraderX] Query length:', query.length, 'chars');

    // Build search URL
    const searchUrl = this.buildSearchURL(query);

    console.log('[TraderX] Navigating to:', searchUrl);

    // Store search state
    sessionStorage.setItem('traderx_search_ticker', this.currentTicker);
    sessionStorage.setItem('traderx_search_active', 'true');

    // Navigate to search page
    window.location.href = searchUrl;
  }

  // ========================================================================
  // AUTO-SCROLL FOR LOADING 100-500+ POSTS
  // ========================================================================
  setupAutoScroll() {
    // Only run on search pages
    if (!window.location.pathname.startsWith('/search')) {
      return;
    }

    // Check if we initiated this search
    const searchActive = sessionStorage.getItem('traderx_search_active');
    const savedTicker = sessionStorage.getItem('traderx_search_ticker');

    if (searchActive === 'true' && savedTicker) {
      this.currentTicker = savedTicker;
      this.isSearchActive = true;

      console.log('[TraderX] Resuming search for $' + this.currentTicker);

      // Wait for feed to load, then start scrolling
      this.waitForElement('[data-testid="primaryColumn"]').then(() => {
        setTimeout(() => this.startAutoScroll(), 1500);
      });
    }
  }

  startAutoScroll() {
    const { maxTweets, scrollInterval, scrollAmount, timeout } = this.autoScrollConfig;

    let lastHeight = 0;
    let stuckCount = 0;
    const startTime = Date.now();

    // Show loading indicator (with stop button)
    this.showLoadingIndicator();

    // Start collecting tweets incrementally via MutationObserver
    this.startTweetCollector();

    this.scrollIntervalId = setInterval(() => {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.log('[TraderX] Timeout reached');
        this.stopAutoScroll('Timeout - ');
        return;
      }

      // Harvest any visible tweets into collectedTweets Map
      this.harvestVisibleTweets();
      const currentTweetCount = this.collectedTweets.size;
      this.loadedTweetCount = currentTweetCount;

      // Check if we hit target
      if (currentTweetCount >= maxTweets) {
        console.log(`[TraderX] Target reached: ${maxTweets} tweets`);
        this.stopAutoScroll('Complete! ');
        return;
      }

      // Check if stuck (no new content loading)
      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === lastHeight) {
        stuckCount++;
        if (stuckCount > 8) {
          console.log('[TraderX] No more content to load');
          this.stopAutoScroll('All loaded! ');
          return;
        }
      } else {
        stuckCount = 0;
        lastHeight = currentHeight;
      }

      // Scroll aggressively
      window.scrollBy({
        top: window.innerHeight * scrollAmount,
        behavior: 'auto'  // Instant for speed
      });

      // Update UI
      this.updateLoadingIndicator(currentTweetCount, maxTweets);

    }, scrollInterval);
  }

  stopAutoScroll(prefix = '') {
    if (this.scrollIntervalId) {
      clearInterval(this.scrollIntervalId);
      this.scrollIntervalId = null;
    }

    // Stop tweet collector observer
    if (this.tweetObserver) {
      this.tweetObserver.disconnect();
      this.tweetObserver = null;
    }

    // Final harvest of any remaining visible tweets
    this.harvestVisibleTweets();
    this.loadedTweetCount = this.collectedTweets.size;

    // Clear session state
    sessionStorage.removeItem('traderx_search_active');

    // Show completion
    this.showCompletionMessage(prefix);

    // Process all loaded tweets (badge marking etc.)
    this.processAllTweets();

    console.log(`[TraderX] Total unique tweets collected: ${this.collectedTweets.size}`);
  }

  // ========================================================================
  // INCREMENTAL TWEET COLLECTOR
  // ========================================================================
  // X.com uses virtual scrolling — tweets are destroyed from DOM as you scroll.
  // This collector harvests tweet data into a Map as they appear, so nothing is lost.

  startTweetCollector() {
    // Initial harvest
    this.harvestVisibleTweets();

    // Watch for new tweets being added to the DOM
    const feedContainer = document.querySelector('[data-testid="primaryColumn"]') || document.body;

    this.tweetObserver = new MutationObserver(() => {
      this.harvestVisibleTweets();
    });

    this.tweetObserver.observe(feedContainer, {
      childList: true,
      subtree: true,
    });
  }

  harvestVisibleTweets() {
    const tweetEls = document.querySelectorAll('article[data-testid="tweet"]');

    tweetEls.forEach(tweet => {
      try {
        // Get tweet text
        const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
        const text = tweetTextEl ? tweetTextEl.textContent.trim() : '';
        if (!text) return;

        // Create a unique key from author + text substring
        const authorEl = tweet.querySelector('[data-testid="User-Name"]');
        const authorText = authorEl ? authorEl.textContent : '';
        const author = authorText.split('@')[1]?.split('·')[0]?.trim() || 'Unknown';
        const displayName = authorText.split('@')[0]?.trim() || 'Unknown';

        const key = `${author}::${text.substring(0, 80)}`;
        if (this.collectedTweets.has(key)) return; // Already stored

        // Timestamp
        const timeEl = tweet.querySelector('time');
        const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';

        // Engagement
        const replyEl = tweet.querySelector('[data-testid="reply"]');
        const retweetEl = tweet.querySelector('[data-testid="retweet"]');
        const likeEl = tweet.querySelector('[data-testid="like"]');

        const replies = this.parseEngagementNumber(replyEl?.textContent?.trim() || '0');
        const retweets = this.parseEngagementNumber(retweetEl?.textContent?.trim() || '0');
        const likes = this.parseEngagementNumber(likeEl?.textContent?.trim() || '0');

        this.collectedTweets.set(key, {
          author: `@${author}`,
          displayName,
          timestamp,
          text,
          replies,
          retweets,
          likes,
          engagementScore: replies + retweets + likes,
        });
      } catch (err) {
        // skip malformed tweet
      }
    });
  }

  getCollectedTweetsArray() {
    return Array.from(this.collectedTweets.values()).map((t, i) => ({
      ...t,
      index: i + 1,
    }));
  }

  // ========================================================================
  // TWEET PROCESSING (Client-side filtering for trusted accounts)
  // ========================================================================

  processAllTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    console.log(`[TraderX] Processing ${tweets.length} tweets...`);

    let trustedCount = 0;

    tweets.forEach(tweet => {
      if (tweet.hasAttribute('data-traderx-processed')) return;
      tweet.setAttribute('data-traderx-processed', 'true');

      // Extract author
      const authorLink = tweet.querySelector('[data-testid="User-Name"] a[href^="/"]');
      if (authorLink) {
        const href = authorLink.getAttribute('href');
        if (href && !href.includes('/status')) {
          const author = href.substring(1).toLowerCase();
          tweet.setAttribute('data-traderx-author', author);

          // Check if trusted
          if (this.trustedAccounts.some(acc => acc.toLowerCase() === author)) {
            tweet.setAttribute('data-traderx-trusted', 'true');
            trustedCount++;
            this.addTrustedBadge(tweet);
          }
        }
      }

      // Extract tickers
      const textEl = tweet.querySelector('[data-testid="tweetText"]');
      if (textEl) {
        const text = textEl.textContent || '';
        const tickers = this.extractTickers(text);
        tweet.setAttribute('data-traderx-tickers', tickers.join(','));
      }
    });

    console.log(`[TraderX] Found ${trustedCount} tweets from trusted accounts`);
  }

  extractTickers(text) {
    const tickers = new Set();

    // $TICKER format
    const matches = text.match(/\$[A-Za-z]{1,5}\b/g);
    if (matches) {
      matches.forEach(m => tickers.add(m.substring(1).toUpperCase()));
    }

    return Array.from(tickers);
  }

  addTrustedBadge(tweet) {
    // Add visual indicator for trusted accounts
    const badge = document.createElement('div');
    badge.className = 'traderx-trusted-badge';
    badge.innerHTML = '✓ Trusted';
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      z-index: 100;
    `;

    // Only add if not already there
    if (!tweet.querySelector('.traderx-trusted-badge')) {
      tweet.style.position = 'relative';
      tweet.appendChild(badge);
    }
  }

  // ========================================================================
  // UI COMPONENTS
  // ========================================================================

  showLoadingIndicator() {
    const existing = document.getElementById('traderx-loading');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.id = 'traderx-loading';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 70px;
        right: 20px;
        background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        min-width: 280px;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: traderx-spin 0.8s linear infinite;
          "></div>
          <div style="flex: 1;">
            <div style="font-size: 14px;">⚡ Loading $${this.currentTicker} posts...</div>
            <div id="traderx-count" style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
              0 tweets collected
            </div>
          </div>
          <button id="traderx-stop-btn" style="
            background: #EF4444;
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            transition: background 0.2s;
            flex-shrink: 0;
          " title="Stop loading">
            ■
          </button>
        </div>
      </div>
      <style>
        @keyframes traderx-spin {
          to { transform: rotate(360deg); }
        }
        #traderx-stop-btn:hover {
          background: #DC2626 !important;
          transform: scale(1.1);
        }
      </style>
    `;

    document.body.appendChild(indicator);

    // Wire up stop button
    const stopBtn = document.getElementById('traderx-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stopAutoScroll('Stopped — ');
      });
    }
  }

  updateLoadingIndicator(current, max) {
    const countEl = document.getElementById('traderx-count');
    if (countEl) {
      const percentage = Math.min(100, Math.round((current / max) * 100));
      countEl.textContent = `${current} tweets collected (${percentage}%)`;
    }
  }

  showCompletionMessage(prefix = '') {
    const indicator = document.getElementById('traderx-loading');
    if (indicator) {
      const tweetCount = this.collectedTweets.size;
      indicator.innerHTML = `
        <div id="traderx-completion-box" style="
          position: fixed;
          top: 70px;
          right: 20px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 600;
          min-width: 300px;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="font-size: 24px;">✓</span>
            <div>
              <div style="font-size: 14px;">${prefix}Search Done!</div>
              <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                ${tweetCount} $${this.currentTicker} tweets collected
              </div>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="traderx-copy-tweets" style="
              width: 100%;
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 10px 16px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              <span>📋</span>
              <span>Copy for AI Analysis</span>
            </button>

            <div style="display: flex; gap: 8px;">
              <button id="traderx-export-json" style="
                flex: 1;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                 onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                <span>{ }</span>
                <span>JSON</span>
              </button>
              
              <button id="traderx-export-csv" style="
                flex: 1;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                 onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                <span>📊</span>
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Add click handlers
      document.getElementById('traderx-copy-tweets')?.addEventListener('click', () => this.copyAllTweetsToClipboard());
      document.getElementById('traderx-export-json')?.addEventListener('click', () => this.exportToJSON());
      document.getElementById('traderx-export-csv')?.addEventListener('click', () => this.exportToCSV());

      // Auto-hide after 30 seconds (longer since user needs time to click)
      setTimeout(() => {
        const box = document.getElementById('traderx-completion-box');
        if (box) {
          box.style.opacity = '0';
          box.style.transition = 'opacity 0.5s';
          setTimeout(() => indicator.remove(), 500);
        }
      }, 30000);
    }
  }

  // ========================================================================
  // COPY ALL TWEETS TO CLIPBOARD (Formatted for LLM Analysis)
  // ========================================================================

  async copyAllTweetsToClipboard() {
    try {
      const tweetData = this.getCollectedTweetsArray();

      if (tweetData.length === 0) {
        alert('No tweets collected! Run a search first.');
        return;
      }

      // Format for LLM analysis
      const formattedText = this.formatTweetsForLLM(tweetData);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText);

      // Update button to show success
      const copyBtn = document.getElementById('traderx-copy-tweets');
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>✓</span><span>Copied ${tweetData.length} tweets! Paste into ChatGPT/Claude</span>`;
        copyBtn.style.background = 'rgba(255, 255, 255, 0.4)';

        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 3000);
      }

      console.log(`[AdvancedSearch] Copied ${tweetData.length} tweets to clipboard`);
    } catch (error) {
      console.error('[AdvancedSearch] Copy failed:', error);
      alert('Failed to copy tweets. Please try again.');
    }
  }

  formatTweetsForLLM(tweetData) {
    const ticker = this.currentTicker || 'TICKER';
    const date = new Date().toLocaleDateString();

    let formatted = `# Twitter Sentiment Analysis for $${ticker}\n`;
    formatted += `Date: ${date}\n`;
    formatted += `Total Tweets: ${tweetData.length}\n`;
    formatted += `\n---\n\n`;
    formatted += `## Instructions for AI Analysis\n\n`;
    formatted += `Please analyze these ${tweetData.length} tweets about $${ticker} and provide:\n`;
    formatted += `1. Overall sentiment (Bullish/Bearish/Neutral) with percentage breakdown\n`;
    formatted += `2. Key themes and topics being discussed\n`;
    formatted += `3. Notable concerns or catalysts mentioned\n`;
    formatted += `4. Sentiment from high-engagement tweets vs. low-engagement\n`;
    formatted += `5. Any unusual patterns or emerging narratives\n`;
    formatted += `6. Price prediction consensus (if mentioned)\n`;
    formatted += `7. Risk factors highlighted by the community\n\n`;
    formatted += `---\n\n`;
    formatted += `## Tweets\n\n`;

    tweetData.forEach((tweet) => {
      formatted += `### Tweet ${tweet.index}\n`;
      formatted += `**Author:** ${tweet.author}\n`;
      formatted += `**Time:** ${tweet.timestamp}\n`;
      formatted += `**Engagement:** 💬 ${tweet.replies} | 🔁 ${tweet.retweets} | ❤️ ${tweet.likes}\n\n`;
      formatted += `**Content:**\n${tweet.text}\n\n`;
      formatted += `---\n\n`;
    });

    formatted += `\n## End of Data\n\n`;
    formatted += `Please provide your comprehensive analysis above.`;

    return formatted;
  }

  // ========================================================================
  // EXPORT TO JSON (Download File)
  // ========================================================================

  exportToJSON() {
    try {
      const tweetData = this.getCollectedTweetsArray();

      if (tweetData.length === 0) {
        alert('No tweets collected! Run a search first.');
        return;
      }

      const ticker = this.currentTicker || 'TICKER';
      const jsonData = {
        ticker: `$${ticker}`,
        exportDate: new Date().toISOString(),
        source: window.location.href,
        totalTweets: tweetData.length,
        tweets: tweetData.map(t => ({
          index: t.index,
          author: t.author,
          displayName: t.displayName,
          timestamp: t.timestamp,
          text: t.text,
          replies: t.replies,
          retweets: t.retweets,
          likes: t.likes,
          engagementScore: t.engagementScore,
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const date = new Date().toISOString().split('T')[0];
      const filename = `${ticker}_tweets_${date}.json`;

      this.downloadFile(blob, filename);

      // Update button
      const jsonBtn = document.getElementById('traderx-export-json');
      if (jsonBtn) {
        const originalHTML = jsonBtn.innerHTML;
        jsonBtn.innerHTML = `<span>✓</span><span>${tweetData.length} saved</span>`;
        jsonBtn.style.background = 'rgba(255, 255, 255, 0.4)';
        setTimeout(() => {
          jsonBtn.innerHTML = originalHTML;
          jsonBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 3000);
      }

      console.log(`[AdvancedSearch] Exported ${tweetData.length} tweets to JSON`);
    } catch (error) {
      console.error('[AdvancedSearch] JSON export failed:', error);
      alert('Failed to export JSON. Please try again.');
    }
  }

  // ========================================================================
  // EXPORT TO CSV (For Spreadsheet Analysis)
  // ========================================================================

  exportToCSV() {
    try {
      const tweetData = this.getCollectedTweetsArray();

      if (tweetData.length === 0) {
        alert('No tweets collected! Run a search first.');
        return;
      }

      const ticker = this.currentTicker || 'TICKER';
      const date = new Date().toISOString().split('T')[0];

      // BOM for Excel UTF-8 support
      let csv = '\uFEFF';
      // Column headers
      csv += 'Index,Author,Display Name,Timestamp,Tweet Text,Replies,Retweets,Likes,Engagement Score\n';

      // Data rows — proper CSV escaping
      tweetData.forEach(t => {
        const text = t.text.replace(/"/g, '""').replace(/\r?\n/g, ' ');
        const displayName = (t.displayName || '').replace(/"/g, '""');
        csv += `${t.index},`;
        csv += `"${t.author}",`;
        csv += `"${displayName}",`;
        csv += `"${t.timestamp}",`;
        csv += `"${text}",`;
        csv += `${t.replies},`;
        csv += `${t.retweets},`;
        csv += `${t.likes},`;
        csv += `${t.engagementScore}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `${ticker}_tweets_${date}.csv`;

      this.downloadFile(blob, filename);

      // Update button
      const csvBtn = document.getElementById('traderx-export-csv');
      if (csvBtn) {
        const originalHTML = csvBtn.innerHTML;
        csvBtn.innerHTML = `<span>✓</span><span>${tweetData.length} saved</span>`;
        csvBtn.style.background = 'rgba(255, 255, 255, 0.4)';
        setTimeout(() => {
          csvBtn.innerHTML = originalHTML;
          csvBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 3000);
      }

      console.log(`[AdvancedSearch] Exported ${tweetData.length} tweets to CSV`);
    } catch (error) {
      console.error('[AdvancedSearch] CSV export failed:', error);
      alert('Failed to export CSV. Please try again.');
    }
  }

  parseEngagementNumber(str) {
    if (!str || str === '0') return 0;
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    if (str.includes('K')) return Math.round(num * 1000);
    if (str.includes('M')) return Math.round(num * 1000000);
    return Math.round(num);
  }

  downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ========================================================================
  // SEARCH UI OVERLAY
  // ========================================================================

  createSearchUI() {
    const existing = document.getElementById('traderx-search-ui');
    if (existing) existing.remove();

    const ui = document.createElement('div');
    ui.id = 'traderx-search-ui';
    ui.className = 'modal-overlay';
    ui.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(20, 24, 32, 0.92);
          backdrop-filter: blur(8px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .advanced-search-modal {
          background: #141820;
          border: 1px solid rgba(242, 246, 248, 0.12);
          border-radius: 20px;
          width: 90%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
          position: relative;
          color: #F2F6F8;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .modal-header {
          padding: 32px 32px 24px 32px;
          border-bottom: 1px solid rgba(242, 246, 248, 0.08);
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #F2F6F8;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title-icon { font-size: 28px; color: #00A36C; }

        .modal-subtitle {
          font-size: 14px;
          color: rgba(242, 246, 248, 0.6);
          margin-top: 8px;
          font-weight: 400;
        }

        .close-button {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #232830;
          border: 1px solid rgba(242, 246, 248, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(242, 246, 248, 0.6);
        }

        .close-button:hover {
          background: #EF4444;
          border-color: #EF4444;
          color: white;
          transform: rotate(90deg);
        }

        .modal-body { padding: 32px; }

        .search-input-container { margin-bottom: 24px; }

        .search-input {
          width: 100%;
          height: 64px;
          background: #232830;
          border: 2px solid rgba(242, 246, 248, 0.08);
          border-radius: 12px;
          padding: 0 24px;
          font-size: 18px;
          color: #F2F6F8;
          font-weight: 600;
          transition: all 0.2s ease;
          box-sizing: border-box;
          text-transform: uppercase;
        }

        .search-input::placeholder { color: rgba(242, 246, 248, 0.4); font-weight: 400; text-transform: none; }
        .search-input:focus { outline: none; border-color: #00A36C; background: #1A1F2A; box-shadow: 0 0 0 4px rgba(0, 163, 108, 0.12); }

        .quick-tickers { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }

        .ticker-pill {
          background: #232830;
          border: 1px solid rgba(242, 246, 248, 0.08);
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          color: #F2F6F8;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ticker-pill:hover {
          background: #00A36C;
          border-color: #00A36C;
          color: #141820;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 163, 108, 0.3);
        }

        .filters-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 32px; }

        .filter-option {
          background: #232830;
          border: 2px solid rgba(242, 246, 248, 0.06);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          user-select: none;
        }

        .filter-option:hover { border-color: #00A36C; background: rgba(0, 163, 108, 0.05); }
        .filter-option.active { border-color: #00A36C; background: rgba(0, 163, 108, 0.12); }

        .custom-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid rgba(242, 246, 248, 0.3);
          background: transparent;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .filter-option.active .custom-checkbox { background: #00A36C; border-color: #00A36C; }

        .custom-checkbox::after {
          content: "✓";
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0);
          color: #141820; font-weight: 700; font-size: 14px;
          transition: transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .filter-option.active .custom-checkbox::after { transform: translate(-50%, -50%) scale(1); }

        .filter-label { font-size: 14px; font-weight: 500; color: #F2F6F8; flex: 1; }

        .search-button {
          width: 100%;
          height: 64px;
          background: linear-gradient(135deg, #00A36C 0%, #00D68F 100%);
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          color: #141820;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 163, 108, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .search-button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 163, 108, 0.4); }

        .time-select-container { margin-bottom: 32px; }
        .time-select {
          width: 100%;
          height: 56px;
          background: #232830;
          border: 2px solid rgba(242, 246, 248, 0.08);
          border-radius: 12px;
          padding: 0 16px;
          color: #F2F6F8;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-footer { font-size: 12px; color: rgba(242, 246, 248, 0.4); text-align: center; }
      </style>

      <div class="advanced-search-modal">
        <button class="close-button" id="traderx-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-title-icon">⚡</span>
            Advanced Ticker Search
          </div>
          <div class="modal-subtitle">Load 100-500+ posts about any stock or crypto</div>
        </div>

        <div class="modal-body">
          <div class="search-input-container">
            <input type="text" class="search-input" id="traderx-ticker-input" 
                   placeholder="Enter ticker (e.g., BTC, AAPL, TSLA)">
          </div>

          <div class="quick-tickers">
            <div class="ticker-pill" data-ticker="BTC">$BTC</div>
            <div class="ticker-pill" data-ticker="ETH">$ETH</div>
            <div class="ticker-pill" data-ticker="SPY">$SPY</div>
            <div class="ticker-pill" data-ticker="TSLA">$TSLA</div>
            <div class="ticker-pill" data-ticker="NVDA">$NVDA</div>
          </div>

          <div class="filters-grid">
            <div class="filter-option" id="label-verified">
              <div class="custom-checkbox"></div>
              <span class="filter-label">Verified accounts</span>
              <input type="checkbox" id="traderx-verified" style="display:none">
            </div>
            <div class="filter-option" id="label-media">
              <div class="custom-checkbox"></div>
              <span class="filter-label">With charts/media</span>
              <input type="checkbox" id="traderx-media" style="display:none">
            </div>
            <div class="filter-option" id="label-trusted">
              <div class="custom-checkbox"></div>
              <span class="filter-label">Trusted only</span>
              <input type="checkbox" id="traderx-trusted" style="display:none">
            </div>
            <div class="filter-option active" id="label-quality">
              <div class="custom-checkbox"></div>
              <span class="filter-label">Quality (1+ like)</span>
              <input type="checkbox" id="traderx-quality" checked style="display:none">
            </div>
          </div>

          <div class="time-select-container">
            <select class="time-select" id="traderx-days">
              <option value="1">Last 24 hours</option>
              <option value="3">Last 3 days</option>
              <option value="7" selected>Last 7 days</option>
              <option value="14">Last 14 days</option>
            </select>
          </div>

          <button class="search-button" id="traderx-search-btn">
            <span class="search-button-icon">🔍</span>
            <span>Search $<span id="traderx-ticker-display">TICKER</span></span>
          </button>

          <div class="modal-footer">
            Uses X's native search • Auto-scrolls to load volume 
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(ui);

    // Get elements
    const input = document.getElementById('traderx-ticker-input');
    const display = document.getElementById('traderx-ticker-display');
    const searchBtn = document.getElementById('traderx-search-btn');
    const closeBtn = document.getElementById('traderx-close');
    const overlay = ui;

    // Filter toggle logic
    document.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', () => {
        const checkbox = option.querySelector('input');
        checkbox.checked = !checkbox.checked;
        option.classList.toggle('active', checkbox.checked);
      });
    });

    // Preset buttons
    document.querySelectorAll('.ticker-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.ticker;
        display.textContent = btn.dataset.ticker;
        input.focus();
      });
    });

    // Update display as user types
    input.addEventListener('input', () => {
      display.textContent = input.value.toUpperCase() || 'TICKER';
    });

    // Search on click
    searchBtn.addEventListener('click', () => {
      const ticker = input.value.trim().toUpperCase().replace(/^\$/, '');
      if (!ticker) {
        input.style.borderColor = '#EF4444';
        return;
      }

      const config = {
        trustedOnly: document.getElementById('traderx-trusted').checked,
        includeMedia: document.getElementById('traderx-media').checked,
        verifiedOnly: document.getElementById('traderx-verified').checked,
        minFaves: document.getElementById('traderx-quality').checked ? 1 : 0,
        sinceDays: parseInt(document.getElementById('traderx-days').value),
      };

      ui.remove();
      this.performSearch(ticker, config);
    });

    // Search on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchBtn.click();
      if (e.key === 'Escape') ui.remove();
    });

    // Close handlers
    closeBtn.addEventListener('click', () => ui.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) ui.remove();
    });

    // Focus input
    input.focus();
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  countVisibleTweets() {
    return document.querySelectorAll('article[data-testid="tweet"]').length;
  }

  async waitForElement(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  addQuickSearchButton() {
    const existing = document.getElementById('traderx-quick-search');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'traderx-quick-search';
    btn.className = 'ticker-search-fab';
    btn.innerHTML = '<span class="ticker-search-icon">🔍</span>';

    // Adding style for this button specifically since it's used across pages
    const style = document.createElement('style');
    style.textContent = `
      .ticker-search-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #00A36C;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9990;
        box-shadow: 0 8px 24px rgba(0, 163, 108, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ticker-search-fab:hover {
        background: #008C5A;
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(0, 163, 108, 0.4);
      }
      .ticker-search-icon {
        font-size: 24px;
        color: #141820;
      }
    `;
    document.head.appendChild(style);

    btn.addEventListener('click', () => this.createSearchUI());
    document.body.appendChild(btn);
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.TraderXAdvancedSearch = new TraderXAdvancedSearch();

// Always set up auto-scroll (resumes if we navigated from a search)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TraderXAdvancedSearch.setupAutoScroll();
    window.TraderXAdvancedSearch.addQuickSearchButton();
  });
} else {
  window.TraderXAdvancedSearch.setupAutoScroll();
  window.TraderXAdvancedSearch.addQuickSearchButton();
}

// Expose global functions
window.traderXPerformSearch = (ticker, config) => {
  window.TraderXAdvancedSearch.performSearch(ticker, config);
};

window.traderXOpenSearchUI = () => {
  window.TraderXAdvancedSearch.createSearchUI();
};

console.log('[TraderX] Advanced Search v2.0 loaded ✓');
