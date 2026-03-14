// ============================================================================
// TRADERX SIDEBAR — OBSIDIAN INDIGO v4.0
// ============================================================================
// Unified design system: Indigo (#6366F1) + Deep Dark (#06080E)
// Matches popup.html, alerts.html, settings.css v4.0
// ============================================================================

class TraderXSidebar {
  constructor() {
    this.isVisible = false;
    this.trustedMode = localStorage.getItem('traderx_trusted_mode') === 'true';
    this.createSidebar();
    this.injectStyles();
  }

  // ========================================================================
  // STYLES — v4.0 OBSIDIAN INDIGO
  // ========================================================================
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #traderx-sidebar {
        position: fixed;
        top: 0;
        right: -480px;
        width: 480px;
        height: 100vh;
        background: #0D1117;
        border-left: 1px solid rgba(255, 255, 255, 0.06);
        z-index: 99999;
        transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        color: #F1F5F9;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: -16px 0 64px rgba(0, 0, 0, 0.6);
        overflow: hidden;
      }
      
      #traderx-sidebar::before {
        content: '';
        position: absolute;
        top: -100px;
        right: 0;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
        pointer-events: none;
      }
      
      #traderx-sidebar.visible {
        right: 0;
      }
      
      .pro-header {
        padding: 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        z-index: 1;
      }
      
      .pro-logo-container {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      
      .pro-icon {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, #6366F1 0%, #7C3AED 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      }
      
      .pro-title {
        font-size: 20px;
        font-weight: 800;
        color: #F1F5F9;
        letter-spacing: -0.02em;
      }
      
      .pro-title span {
        background: linear-gradient(135deg, #818CF8 0%, #A78BFA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .pro-version {
        font-size: 10px;
        background: #151B25;
        color: rgba(241, 245, 249, 0.3);
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-weight: 600;
        margin-left: 8px;
      }
      
      .tx-close {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #151B25;
        border: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: rgba(241, 245, 249, 0.4);
      }
      
      .tx-close:hover {
        background: #EF4444;
        border-color: #EF4444;
        color: white;
        transform: rotate(90deg);
      }
      
      .tx-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
        position: relative;
        z-index: 1;
      }
      
      .tx-content::-webkit-scrollbar { width: 4px; }
      .tx-content::-webkit-scrollbar-track { background: transparent; }
      .tx-content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 4px; }
      
      .section-header {
        padding: 24px 24px 10px 24px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .section-label-line {
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
      }
      
      .section-title {
        font-size: 10px;
        font-weight: 700;
        color: rgba(241, 245, 249, 0.3);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      
      .toggle-card {
        margin: 0 24px 16px 24px;
        background: #151B25;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: border-color 0.2s;
      }
      
      .toggle-card:hover { border-color: rgba(255, 255, 255, 0.12); }
      
      .toggle-info { flex: 1; }
      .toggle-title { font-size: 15px; font-weight: 600; color: #F1F5F9; margin-bottom: 4px; }
      .toggle-description { font-size: 12px; color: rgba(241, 245, 249, 0.4); font-weight: 400; }
      
      .toggle-switch {
        width: 48px;
        height: 26px;
        background: #1C2333;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 13px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }
      
      .toggle-switch.active {
        background: #6366F1;
        border-color: #6366F1;
      }
      
      .toggle-knob {
        width: 20px;
        height: 20px;
        background: rgba(241, 245, 249, 0.3);
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .toggle-switch.active .toggle-knob {
        left: 24px;
        background: white;
      }
      
      .action-button {
        margin: 0 24px 10px 24px;
        height: 52px;
        background: #151B25;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        gap: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: calc(100% - 48px);
        outline: none;
      }
      
      .action-button:hover {
        background: #1C2333;
        border-color: rgba(99, 102, 241, 0.25);
        transform: translateX(4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
      
      .action-button:hover .button-text { color: #F1F5F9; }
      .action-button:hover .btn-emoji { transform: scale(1.15); }
      
      .btn-emoji {
        font-size: 18px;
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      
      .button-text {
        font-size: 14px;
        font-weight: 600;
        color: rgba(241, 245, 249, 0.7);
        transition: color 0.2s ease;
        font-family: inherit;
      }
      
      .btn-arrow {
        margin-left: auto;
        color: rgba(241, 245, 249, 0.15);
        transition: all 0.2s;
      }
      
      .action-button:hover .btn-arrow {
        color: #818CF8;
        transform: translateX(2px);
      }
      
      .premium-button {
        margin: 4px 24px 20px 24px;
        height: 56px;
        background: linear-gradient(135deg, #6366F1 0%, #7C3AED 100%);
        border: none;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        width: calc(100% - 48px);
        outline: none;
      }
      
      .premium-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.45);
      }
      
      .premium-button-icon { font-size: 20px; }
      .premium-button-text { font-size: 15px; font-weight: 700; color: white; font-family: inherit; }
      
      .export-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 0 24px 24px 24px;
      }
      
      .export-grid .action-button {
        margin: 0;
        width: 100%;
        justify-content: center;
        height: 48px;
      }
      
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        position: relative;
        z-index: 1;
      }
      
      .footer-text {
        font-size: 11px;
        color: rgba(241, 245, 249, 0.2);
        text-align: center;
        font-weight: 500;
      }
      
      .footer-link {
        color: #818CF8;
        text-decoration: none;
        font-weight: 600;
      }
      
      .footer-link:hover { text-decoration: underline; }
      
      /* Market Pulse FAB */
      .market-pulse-fab {
        position: fixed;
        top: 80px;
        right: 20px;
        background: #0D1117;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 9998;
      }
      
      .market-pulse-fab::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 14px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), transparent);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      
      .market-pulse-fab:hover {
        background: #6366F1;
        border-color: #6366F1;
        transform: translateY(-2px);
        box-shadow: 0 12px 36px rgba(99, 102, 241, 0.35);
      }
      
      .market-pulse-fab:hover .fab-text { color: white; }
      .market-pulse-fab:hover .fab-dot { background: white; }
      
      .fab-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6366F1;
        animation: fabPulse 2s ease-in-out infinite;
        transition: background 0.2s;
      }
      
      @keyframes fabPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      
      .fab-text {
        font-size: 13px;
        font-weight: 700;
        color: #F1F5F9;
        letter-spacing: 0.02em;
        transition: color 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }

  // ========================================================================
  // COMPONENT
  // ========================================================================
  createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'traderx-sidebar';

    sidebar.innerHTML = `
      <div class="pro-header">
        <div class="pro-logo-container">
          <div class="pro-icon">⚡</div>
          <div>
            <div class="pro-title">TraderX <span>Pro</span> <span class="pro-version">v4.0</span></div>
          </div>
        </div>
        <button class="tx-close" id="tx-close-btn" title="Close Panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="tx-content">
        <!-- MODE SETTINGS -->
        <div class="section-header">
          <span class="section-title">Filtering Mode</span>
          <div class="section-label-line"></div>
        </div>
        
        <div class="toggle-card">
          <div class="toggle-info">
            <div class="toggle-title">🛡️ Trusted Mode</div>
            <div class="toggle-description">Only show verified signal accounts</div>
          </div>
          <div class="toggle-switch ${this.trustedMode ? 'active' : ''}" id="tx-trusted-toggle">
            <div class="toggle-knob"></div>
          </div>
        </div>
        
        <!-- TOOLS -->
        <div class="section-header">
          <span class="section-title">Analysis Tools</span>
          <div class="section-label-line"></div>
        </div>
        
        <button class="action-button" id="tx-adv-search">
          <span class="btn-emoji">🔍</span>
          <span class="button-text">Advanced Search</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        
        <button class="action-button" id="tx-directory-open">
          <span class="btn-emoji">📁</span>
          <span class="button-text">Signal Directory</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <button class="action-button" id="tx-tracker-toggle">
          <span class="btn-emoji">📊</span>
          <span class="button-text">Market Pulse Dashboard</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <button class="action-button" id="tx-portfolio-open">
          <span class="btn-emoji">💼</span>
          <span class="button-text">Portfolio Tracker</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <button class="action-button" id="tx-heatmap-open">
          <span class="btn-emoji">🗺️</span>
          <span class="button-text">Sector Heatmap</span>
          <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        
        <!-- PREMIUM ACTIONS -->
        <div class="section-header">
          <span class="section-title">Export & AI</span>
          <div class="section-label-line"></div>
        </div>
        
        <button class="premium-button" id="tx-copy-ai">
          <span class="premium-button-icon">✨</span>
          <span class="premium-button-text">AI Sentiment Analysis</span>
        </button>
        
        <div class="export-grid">
          <button class="action-button" id="tx-copy-json">
            <span class="btn-emoji">{ }</span>
            <span class="button-text">JSON</span>
          </button>
          <button class="action-button" id="tx-copy-csv">
            <span class="btn-emoji">📊</span>
            <span class="button-text">CSV</span>
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="footer-text">
          Built by <a href="https://github.com/bhrigu-verma" target="_blank" class="footer-link">Bhrigu Verma</a> · TraderX Pro v4.0
        </div>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Market Pulse FAB
    const trigger = document.createElement('div');
    trigger.id = 'tx-trigger';
    trigger.className = 'market-pulse-fab';
    trigger.innerHTML = `
      <div class="fab-dot"></div>
      <div class="fab-text">MARKET PULSE</div>
    `;
    trigger.addEventListener('click', () => this.toggle());
    document.body.appendChild(trigger);

    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('tx-close-btn').addEventListener('click', () => this.close());

    const trustedToggle = document.getElementById('tx-trusted-toggle');
    if (trustedToggle) {
      trustedToggle.addEventListener('click', () => {
        this.trustedMode = !this.trustedMode;
        trustedToggle.classList.toggle('active', this.trustedMode);
        localStorage.setItem('traderx_trusted_mode', this.trustedMode);
        if (window.traderXToggleTrustedMode) {
          window.traderXToggleTrustedMode(this.trustedMode);
        }
      });
    }

    document.getElementById('tx-adv-search').addEventListener('click', () => {
      if (window.TraderXAdvancedSearch) {
        window.TraderXAdvancedSearch.createSearchUI();
        this.close();
      }
    });

    document.getElementById('tx-directory-open').addEventListener('click', () => {
      if (window.TraderXDirectory) {
        window.TraderXDirectory.show();
        this.close();
      }
    });

    document.getElementById('tx-tracker-toggle').addEventListener('click', () => {
      if (window.TraderXTrackerDashboard) {
        window.TraderXTrackerDashboard.toggle();
      }
    });

    document.getElementById('tx-portfolio-open').addEventListener('click', () => {
      if (window.TraderXPortfolio) {
        window.TraderXPortfolio.show();
        this.close();
      }
    });

    document.getElementById('tx-heatmap-open').addEventListener('click', () => {
      if (window.TraderXSectorHeatmap) {
        window.TraderXSectorHeatmap.show();
        this.close();
      }
    });

    document.getElementById('tx-copy-json').addEventListener('click', () => this.copyTweetsAsJSON());
    document.getElementById('tx-copy-csv').addEventListener('click', () => this.exportTweetsAsCSV());
    document.getElementById('tx-copy-ai').addEventListener('click', () => this.copyTweetsForAI());
  }

  // ========================================================================
  // EXPORT LOGIC
  // ========================================================================

  extractTweetsFromPage() {
    const selectors = [
      'article[data-testid="tweet"]',
      'article[role="article"]',
      '[data-testid="cellInnerDiv"] article',
      'div[data-testid="primaryColumn"] article'
    ];

    let tweets = [];
    for (const selector of selectors) {
      tweets = document.querySelectorAll(selector);
      if (tweets.length > 0) {
        console.log(`[TraderX] Found ${tweets.length} tweets using selector: ${selector}`);
        break;
      }
    }

    if (tweets.length === 0) {
      console.warn('[TraderX] No tweets found on page. Available articles:', document.querySelectorAll('article').length);
      return [];
    }

    const tweetData = [];

    tweets.forEach((tweet, index) => {
      try {
        let authorEl = tweet.querySelector('[data-testid="User-Name"]');
        if (!authorEl) authorEl = tweet.querySelector('a[role="link"][href*="/"]');

        const authorText = authorEl ? authorEl.textContent : '';
        const author = authorText.split('@')[1]?.split('·')[0]?.trim() || 'Unknown';
        const displayName = authorText.split('@')[0]?.trim() || 'Unknown';

        let tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
        if (!tweetTextEl) tweetTextEl = tweet.querySelector('div[lang]');
        const text = tweetTextEl ? tweetTextEl.textContent : '';

        const timeEl = tweet.querySelector('time');
        const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';

        const replyEl = tweet.querySelector('[data-testid="reply"]');
        const retweetEl = tweet.querySelector('[data-testid="retweet"]');
        const likeEl = tweet.querySelector('[data-testid="like"]');

        const replies = this.parseNumber(replyEl?.textContent?.trim() || '0');
        const retweets = this.parseNumber(retweetEl?.textContent?.trim() || '0');
        const likes = this.parseNumber(likeEl?.textContent?.trim() || '0');

        if (text && text.length > 0) {
          tweetData.push({
            id: index + 1,
            author: `@${author}`,
            displayName,
            timestamp,
            text,
            engagement: { replies, retweets, likes },
            engagementScore: replies + retweets + likes
          });
        }
      } catch (err) {
        console.warn(`[TraderX] Error parsing tweet ${index}:`, err);
      }
    });

    console.log(`[TraderX] Successfully extracted ${tweetData.length} tweets`);
    return tweetData;
  }

  parseNumber(str) {
    if (!str || str === '0') return 0;
    const num = parseFloat(str);
    if (str.includes('K')) return Math.round(num * 1000);
    if (str.includes('M')) return Math.round(num * 1000000);
    return Math.round(num);
  }

  getAllTweets() {
    if (window.TraderXAdvancedSearch && window.TraderXAdvancedSearch.collectedTweets?.size > 0) {
      return window.TraderXAdvancedSearch.getCollectedTweetsArray();
    }
    return this.extractTweetsFromPage();
  }

  async copyTweetsAsJSON() {
    const tweets = this.getAllTweets();
    if (tweets.length === 0) {
      this.showToast('No tweets found! Run a search first.', 'error');
      return;
    }

    const jsonData = {
      exportDate: new Date().toISOString(),
      source: window.location.href,
      totalTweets: tweets.length,
      tweets: tweets
    };

    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tweets_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      this.showToast(`✓ Downloaded ${tweets.length} tweets as JSON!`, 'success');
    } catch (error) {
      this.showToast('Failed to export. Please try again.', 'error');
    }
  }

  async exportTweetsAsCSV() {
    const tweets = this.getAllTweets();
    if (tweets.length === 0) {
      this.showToast('No tweets found! Run a search first.', 'error');
      return;
    }

    let csv = '\uFEFF';
    csv += 'Index,Author,Display Name,Timestamp,Text,Replies,Retweets,Likes,Engagement Score\n';

    tweets.forEach(t => {
      const text = (t.text || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      const displayName = (t.displayName || '').replace(/"/g, '""');
      const author = t.author || 'Unknown';
      const replies = t.replies ?? t.engagement?.replies ?? 0;
      const retweets = t.retweets ?? t.engagement?.retweets ?? 0;
      const likes = t.likes ?? t.engagement?.likes ?? 0;
      const score = t.engagementScore ?? (replies + retweets + likes);
      const idx = t.index ?? t.id ?? 0;
      csv += `${idx},"${author}","${displayName}","${t.timestamp || ''}","${text}",${replies},${retweets},${likes},${score}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tweets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.showToast(`✓ Downloaded ${tweets.length} tweets as CSV!`, 'success');
  }

  async copyTweetsForAI() {
    const tweets = this.getAllTweets();
    if (tweets.length === 0) {
      this.showToast('No tweets found! Run a search first.', 'error');
      return;
    }

    const sortedTweets = [...tweets].sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
    const topTweets = sortedTweets.slice(0, 10);

    const date = new Date().toLocaleDateString();
    const url = window.location.href;
    const tickerMatch = url.match(/\$([A-Za-z]+)/) || url.match(/q=.*?([A-Z]{1,5})/i);
    const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : (window.TraderXAdvancedSearch?.currentTicker || 'UNKNOWN');

    let prompt = `# 🎯 COMPREHENSIVE TWITTER SENTIMENT ANALYSIS REQUEST\n\n`;
    prompt += `## Asset Information\n`;
    prompt += `- **Ticker/Asset**: $${ticker}\n`;
    prompt += `- **Analysis Date**: ${date}\n`;
    prompt += `- **Data Source**: ${url}\n`;
    prompt += `- **Total Tweets Analyzed**: ${tweets.length}\n\n---\n\n`;
    prompt += `## 🧠 ANALYSIS INSTRUCTIONS\n\n`;
    prompt += `Please provide a COMPREHENSIVE analysis with the following sections:\n\n`;
    prompt += `### 1️⃣ EXECUTIVE SUMMARY\n`;
    prompt += `- One-paragraph overview of the overall sentiment and key takeaways\n`;
    prompt += `- Include a sentiment score from 1-100 (1 = extremely bearish, 100 = extremely bullish)\n\n`;
    prompt += `### 2️⃣ SENTIMENT BREAKDOWN\nProvide percentages for:\n`;
    prompt += `- 🟢 **Bullish**: X% (count: N tweets)\n`;
    prompt += `- 🔴 **Bearish**: X% (count: N tweets)\n`;
    prompt += `- ⚪ **Neutral**: X% (count: N tweets)\n\n`;
    prompt += `### 3️⃣ LIVE PRICE CHECK\n`;
    prompt += `**IMPORTANT**: Please fetch the current live price of $${ticker} and include:\n`;
    prompt += `- Current price, 24-hour change (%), Market cap, Volume trend\n\n`;
    prompt += `### 4️⃣ KEY THEMES & NARRATIVES\nIdentify the top 5 discussion themes with supporting tweet examples\n\n`;
    prompt += `### 5️⃣ INFLUENTIAL VOICES SUMMARY\nThe top 10 most engaged tweets are highlighted below.\n\n`;
    prompt += `### 6️⃣ CATALYSTS & EVENTS\nList upcoming events, recent news, regulatory developments, rumors.\n\n`;
    prompt += `### 7️⃣ RISK FACTORS\nTechnical concerns, fundamental concerns, market-wide risks.\n\n`;
    prompt += `### 8️⃣ TECHNICAL ANALYSIS MENTIONS\nSupport/resistance, chart patterns, price targets.\n\n`;
    prompt += `### 9️⃣ PRICE PREDICTIONS\nShort-term (1-7 days), Medium-term (1-4 weeks), Long-term (1-3 months).\n\n`;
    prompt += `### 🔟 FINAL RECOMMENDATION\nOutlook, Confidence Level, Time Horizon, Key Action Items.\n\n`;
    prompt += `---\n\n## 🌟 TOP 10 INFLUENTIAL TWEETS (by engagement)\n\n`;

    topTweets.forEach((t, i) => {
      const replies = t.replies ?? t.engagement?.replies ?? 0;
      const retweets = t.retweets ?? t.engagement?.retweets ?? 0;
      const likes = t.likes ?? t.engagement?.likes ?? 0;
      prompt += `### ${i + 1}. ${t.displayName || ''} (${t.author})\n`;
      prompt += `**Engagement**: 💬 ${replies} | 🔁 ${retweets} | ❤️ ${likes} | Score: ${t.engagementScore || 0}\n`;
      prompt += `**Time**: ${t.timestamp}\n\n`;
      prompt += `> ${t.text}\n\n---\n\n`;
    });

    prompt += `\n## 📊 ALL TWEETS DATA (${tweets.length} total)\n\n`;

    tweets.forEach((t, i) => {
      const replies = t.replies ?? t.engagement?.replies ?? 0;
      const retweets = t.retweets ?? t.engagement?.retweets ?? 0;
      const likes = t.likes ?? t.engagement?.likes ?? 0;
      prompt += `**[${i + 1}]** ${t.author} (${t.displayName || ''}) • 💬${replies} 🔁${retweets} ❤️${likes}\n${t.text}\n---\n`;
    });

    prompt += `\n\n## 📌 FINAL NOTES\n\n`;
    prompt += `1. Please generate a visual ASCII chart showing sentiment distribution\n`;
    prompt += `2. Create a watchlist of key price levels mentioned\n`;
    prompt += `3. Highlight any unusual activity or sentiment divergence\n`;
    prompt += `4. Compare current sentiment to typical market conditions\n`;
    prompt += `5. Provide 3 actionable trade ideas based on this analysis\n\n`;
    prompt += `---\n\n*Data exported by TraderX Pro • ${tweets.length} tweets analyzed*\n*Please proceed with the comprehensive analysis now.*\n`;

    try {
      await navigator.clipboard.writeText(prompt);
      this.showToast(`✓ AI Analysis Prompt copied! (${tweets.length} tweets)`, 'success');
    } catch (error) {
      this.showToast('Failed to copy. Please try again.', 'error');
    }
  }

  showToast(message, type = 'success') {
    const existing = document.getElementById('tx-toast');
    if (existing) existing.remove();

    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)';
    const borderColor = type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)';

    const toast = document.createElement('div');
    toast.id = 'tx-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 110px;
      right: 30px;
      padding: 14px 22px;
      border-radius: 12px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      z-index: 99999;
      background: #0D1117;
      color: #F1F5F9;
      border: 1px solid ${borderColor};
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: txSlideIn 0.3s cubic-bezier(0.2, 0, 0, 1);
    `;
    toast.innerHTML = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes txSlideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  toggle() {
    const sidebar = document.getElementById('traderx-sidebar');
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      sidebar.classList.add('visible');
    } else {
      sidebar.classList.remove('visible');
    }
  }

  close() {
    this.isVisible = false;
    document.getElementById('traderx-sidebar').classList.remove('visible');
  }
}

// Init
window.addEventListener('load', () => {
  window.TraderXSidebar = new TraderXSidebar();
});
