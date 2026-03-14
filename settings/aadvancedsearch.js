// ============================================================================
// TRADERX ADVANCED SEARCH - OPTIMAL IMPLEMENTATION
// ============================================================================
// Uses Twitter's native advanced search with sophisticated operators
// to retrieve 200-1000+ posts per ticker in chronological order
// ============================================================================

class TraderXAdvancedSearch {
  constructor() {
    // Trusted financial accounts (expand this list to your 50+ accounts)
    this.trustedAccounts = [
      // Tier 1: Major news
      'CNBC', 'Reuters', 'Bloomberg', 'WSJ', 'WSJmarkets', 'FT',
      'MarketWatch', 'Benzinga', 'YahooFinance', 'business',
      
      // Tier 2: Crypto news
      'CoinDesk', 'Cointelegraph', 'crypto', 'TheBlock__',
      
      // Tier 3: Analysts & traders
      'APompliano', 'Schuldensuehner', 'saxena_puru', 'novogratz',
      'WuBlockchain', 'DocumentingBTC', 'BitcoinMagazine',
      
      // Add your remaining 30+ accounts here
    ];
    
    // Search configuration
    this.searchConfig = {
      minFaves: 5,           // Min likes to filter quality
      language: 'en',         // English only
      excludeReplies: true,   // Focus on original posts
      excludeRetweets: true,  // No duplicate content
      sinceDays: 7,          // Last 7 days (max for free tier)
      trustedOnly: false,     // Toggle for trusted accounts filter
      includeMedia: false,    // Toggle for posts with charts/images
      verifiedOnly: false,    // Toggle for verified accounts only
    };
    
    // Auto-scroll configuration
    this.autoScrollConfig = {
      maxTweets: 1000,       // Stop after loading this many
      scrollInterval: 1500,   // ms between scrolls
      scrollAmount: 3,        // viewports per scroll
      timeout: 120000,        // 2 minutes max
    };
    
    // State
    this.currentTicker = null;
    this.isSearchActive = false;
    this.loadedTweetCount = 0;
    this.scrollObserver = null;
  }

  // ========================================================================
  // STEP 1: Build Advanced Search Query
  // ========================================================================
  buildSearchQuery(ticker, customConfig = {}) {
    const config = { ...this.searchConfig, ...customConfig };
    const parts = [];
    
    // Core: Cashtag (always quoted for exact match)
    parts.push(`"$${ticker.toUpperCase()}"`);
    
    // Language filter
    if (config.language) {
      parts.push(`lang:${config.language}`);
    }
    
    // Engagement threshold (quality filter)
    if (config.minFaves > 0) {
      parts.push(`min_faves:${config.minFaves}`);
    }
    
    // Exclude noise
    if (config.excludeReplies) {
      parts.push('-filter:replies');
    }
    if (config.excludeRetweets) {
      parts.push('-filter:retweets');
    }
    
    // Time range (last N days)
    if (config.sinceDays > 0) {
      const since = this.getDateString(config.sinceDays);
      parts.push(`since:${since}`);
    }
    
    // Today as upper bound (exclusive)
    const until = this.getTodayString();
    parts.push(`until:${until}`);
    
    // Trusted accounts only (powerful filter)
    if (config.trustedOnly && this.trustedAccounts.length > 0) {
      const fromClause = this.trustedAccounts
        .map(acc => `from:${acc}`)
        .join(' OR ');
      parts.push(`(${fromClause})`);
    }
    
    // Media filter (charts, screenshots)
    if (config.includeMedia) {
      parts.push('filter:media');
    }
    
    // Verified accounts only
    if (config.verifiedOnly) {
      parts.push('filter:verified');
    }
    
    // Additional noise reduction
    parts.push('-pump');        // Exclude pump schemes
    parts.push('-airdrop');     // Exclude spam
    parts.push('-giveaway');    // Exclude giveaways
    
    return parts.join(' ');
  }

  // ========================================================================
  // STEP 2: Navigate to Twitter Search
  // ========================================================================
  performSearch(ticker, customConfig = {}) {
    this.currentTicker = ticker.toUpperCase();
    this.isSearchActive = true;
    this.loadedTweetCount = 0;
    
    // Build query
    const query = this.buildSearchQuery(ticker, customConfig);
    
    console.log('[TraderX] Advanced Search Query:', query);
    
    // Build search URL
    const searchUrl = this.buildSearchURL(query);
    
    console.log('[TraderX] Navigating to:', searchUrl);
    
    // Navigate to search page
    window.location.href = searchUrl;
    
    // Note: Auto-scroll will be set up on page load via content script
  }

  buildSearchURL(query) {
    const baseUrl = 'https://x.com/search';
    const params = new URLSearchParams({
      q: query,
      src: 'typed_query',
      f: 'live',  // Latest mode for chronological order (recent first)
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // ========================================================================
  // STEP 3: Enhanced Auto-Scroll for Search Results
  // ========================================================================
  setupAutoScroll() {
    // Only run on search pages
    if (!window.location.pathname.startsWith('/search')) {
      console.log('[TraderX] Not on search page, skipping auto-scroll');
      return;
    }
    
    console.log('[TraderX] Setting up enhanced auto-scroll...');
    
    // Wait for feed to load
    this.waitForElement('[data-testid="primaryColumn"]').then(() => {
      this.startAutoScroll();
    });
  }

  startAutoScroll() {
    const { maxTweets, scrollInterval, scrollAmount, timeout } = this.autoScrollConfig;
    
    let scrollCount = 0;
    let lastHeight = 0;
    let stuckCount = 0;
    const startTime = Date.now();
    
    const scrollInterval_id = setInterval(() => {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.log('[TraderX] Auto-scroll timeout reached');
        clearInterval(scrollInterval_id);
        this.showCompletionMessage();
        return;
      }
      
      // Check tweet count
      const currentTweetCount = this.countVisibleTweets();
      this.loadedTweetCount = currentTweetCount;
      
      if (currentTweetCount >= maxTweets) {
        console.log(`[TraderX] Reached max tweets (${maxTweets})`);
        clearInterval(scrollInterval_id);
        this.showCompletionMessage();
        return;
      }
      
      // Check if page is stuck (not loading new content)
      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === lastHeight) {
        stuckCount++;
        if (stuckCount > 5) {
          console.log('[TraderX] No new content loading, stopping');
          clearInterval(scrollInterval_id);
          this.showCompletionMessage();
          return;
        }
      } else {
        stuckCount = 0;
        lastHeight = currentHeight;
      }
      
      // Scroll aggressively
      const scrollBy = window.innerHeight * scrollAmount;
      window.scrollBy({
        top: scrollBy,
        behavior: 'smooth'
      });
      
      scrollCount++;
      
      // Update UI
      this.updateLoadingIndicator(currentTweetCount, maxTweets);
      
      console.log(`[TraderX] Scroll ${scrollCount}: Loaded ${currentTweetCount} tweets`);
      
    }, scrollInterval);
    
    // Show initial loading indicator
    this.showLoadingIndicator();
  }

  // ========================================================================
  // STEP 4: UI Indicators & Helpers
  // ========================================================================
  
  showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'traderx-loading';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 70px;
        right: 20px;
        background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(29, 161, 242, 0.3);
        z-index: 99999;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
      ">
        <div class="spinner" style="
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <div>
          <div style="font-size: 14px;">Loading $${this.currentTicker} posts...</div>
          <div id="traderx-count" style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
            0 tweets loaded
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(indicator);
  }

  updateLoadingIndicator(current, max) {
    const countEl = document.getElementById('traderx-count');
    if (countEl) {
      const percentage = Math.round((current / max) * 100);
      countEl.textContent = `${current} tweets loaded (${percentage}%)`;
    }
  }

  showCompletionMessage() {
    const indicator = document.getElementById('traderx-loading');
    if (indicator) {
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 70px;
          right: 20px;
          background: linear-gradient(135deg, #17bf63 0%, #0e9b4f 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(23, 191, 99, 0.3);
          z-index: 99999;
          font-weight: 600;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">✓</span>
            <div>
              <div style="font-size: 14px;">Search Complete!</div>
              <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                ${this.loadedTweetCount} $${this.currentTicker} tweets loaded
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.5s';
        setTimeout(() => indicator.remove(), 500);
      }, 5000);
    }
  }

  // ========================================================================
  // STEP 5: Utility Functions
  // ========================================================================
  
  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  getTodayString() {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Until tomorrow (exclusive)
    return today.toISOString().split('T')[0];
  }

  countVisibleTweets() {
    return document.querySelectorAll('article[data-testid="tweet"]').length;
  }

  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Element not found'));
      }, timeout);
    });
  }

  // ========================================================================
  // STEP 6: Extract Tweet Data (for your existing processing)
  // ========================================================================
  
  extractAllTickers(text) {
    if (!text) return [];
    
    const tickers = new Set();
    
    // Method 1: Dollar sign format
    const dollarMatches = text.match(/\$[A-Za-z]{1,5}\b/g);
    if (dollarMatches) {
      dollarMatches.forEach(match => {
        tickers.add(match.substring(1).toUpperCase());
      });
    }
    
    // Method 2: Crypto names
    const cryptoNames = {
      'BITCOIN': 'BTC', 'ETHEREUM': 'ETH', 'SOLANA': 'SOL',
      'CARDANO': 'ADA', 'DOGECOIN': 'DOGE', 'RIPPLE': 'XRP',
    };
    
    const upperText = text.toUpperCase();
    Object.entries(cryptoNames).forEach(([name, ticker]) => {
      if (upperText.includes(name)) {
        tickers.add(ticker);
      }
    });
    
    // Method 3: Common tickers
    const commonTickers = new Set([
      'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP',
      'SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL', 'MSFT',
    ]);
    
    const words = upperText.split(/\s+/);
    words.forEach(word => {
      const clean = word.replace(/[^A-Z]/g, '');
      if (commonTickers.has(clean)) {
        tickers.add(clean);
      }
    });
    
    return Array.from(tickers);
  }

  processTweet(tweetElement) {
    // Skip if already processed
    if (tweetElement.hasAttribute('data-traderx-processed')) return;
    tweetElement.setAttribute('data-traderx-processed', 'true');
    
    // Extract text
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    const text = textElement ? textElement.textContent : '';
    
    // Extract tickers
    const tickers = this.extractAllTickers(text);
    
    // Store metadata
    tweetElement.setAttribute('data-traderx-tickers', tickers.join(','));
    
    // Add visual ticker tags (optional)
    this.addTickerTags(tweetElement, tickers);
  }

  addTickerTags(tweetElement, tickers) {
    if (tickers.length === 0) return;
    
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (!textElement || !textElement.parentElement) return;
    
    // Remove old tags
    const oldTags = tweetElement.querySelector('.traderx-ticker-tags');
    if (oldTags) oldTags.remove();
    
    // Create tag container
    const container = document.createElement('div');
    container.className = 'traderx-ticker-tags';
    container.style.cssText = 'display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;';
    
    tickers.forEach(ticker => {
      const tag = document.createElement('span');
      tag.style.cssText = `
        background: linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        display: inline-block;
      `;
      tag.textContent = `$${ticker}`;
      container.appendChild(tag);
    });
    
    textElement.parentElement.insertBefore(container, textElement.nextSibling);
  }

  // ========================================================================
  // STEP 7: Process all tweets on search results page
  // ========================================================================
  
  processSearchResults() {
    // Process existing tweets
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    console.log(`[TraderX] Processing ${tweets.length} tweets on search page`);
    
    tweets.forEach(tweet => this.processTweet(tweet));
    
    // Watch for new tweets
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches?.('article[data-testid="tweet"]')) {
              this.processTweet(node);
            }
            const tweets = node.querySelectorAll?.('article[data-testid="tweet"]');
            tweets?.forEach(tweet => this.processTweet(tweet));
          }
        });
      });
    });
    
    const timeline = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    observer.observe(timeline, {
      childList: true,
      subtree: true,
    });
  }
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

window.traderXSearch = new TraderXAdvancedSearch();

// Set up auto-scroll on search pages
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.traderXSearch.setupAutoScroll();
    window.traderXSearch.processSearchResults();
  });
} else {
  window.traderXSearch.setupAutoScroll();
  window.traderXSearch.processSearchResults();
}

// Expose API
window.traderXPerformSearch = (ticker, config) => {
  window.traderXSearch.performSearch(ticker, config);
};

console.log('[TraderX] Advanced Search loaded ✓');