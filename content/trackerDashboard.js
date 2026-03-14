// ============================================================================
// TRADERX TRACKER DASHBOARD - FINTECH EDITION v2.0
// ============================================================================
// Professional grade UI with Glassmorphism and SVG icons
// Real-time sentiment analysis
// v2.0: LOW DATA badge, sparklines, visibility-based polling
// ============================================================================

class TrackerDashboard {
  constructor() {
    // Load saved tickers or use defaults
    const savedTickers = localStorage.getItem('traderx_pulse_tickers');
    this.tickers = savedTickers ? JSON.parse(savedTickers) : ['BTC', 'ETH', 'TSLA', 'NVDA'];

    this.updateInterval = 30000;
    this.intervalId = null;
    this.isVisible = true;
    this.isMinimized = false;
    this.element = null;
    this.tabVisible = true; // For visibility-based polling

    // Card data state (enhanced)
    this.cardData = {};
    this.tickers.forEach(ticker => {
      this.cardData[ticker] = {
        status: 'LOADING',
        sentiment: 0,
        lastUpdated: null,
        sampleSize: 0,
        isStale: false,
        tweets: [],
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        confidence: 'low',
        insufficientData: false
      };
    });
  }

  init() {
    this.createDashboard();
    this.startTracking();
  }

  createDashboard() {
    if (document.getElementById('traderx-tracker-dashboard')) {
      this.element = document.getElementById('traderx-tracker-dashboard');
      return;
    }

    const dashboard = document.createElement('div');
    dashboard.id = 'traderx-tracker-dashboard';
    dashboard.className = 'market-pulse-container';
    dashboard.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        #traderx-tracker-dashboard {
          /* Design Tokens */
          --graphite: #141820;
          --soft-gray: #232830;
          --emerald: #00A36C;
          --brass: #C9A66B;
          --text-primary: #F2F6F8;
          --graphite-lighter: #1A1F2A;
          --soft-gray-darker: #1C2028;
          --emerald-dark: #008C5A;
          --emerald-transparent: rgba(0, 163, 108, 0.12);
          --brass-transparent: rgba(201, 166, 107, 0.12);
          --text-secondary: rgba(242, 246, 248, 0.6);
          --text-tertiary: rgba(242, 246, 248, 0.4);
          --error: #EF4444;

          position: fixed;
          top: 80px;
          left: 20px;
          width: 320px;
          max-height: 520px;
          background: var(--graphite);
          border: 1px solid rgba(242, 246, 248, 0.08);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 9998;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--text-primary);
          overflow: hidden;
          transition: height 0.3s ease, transform 0.2s ease;
        }
        
        #traderx-tracker-dashboard.minimized {
          height: 64px;
          max-height: 64px;
        }
        
        #traderx-tracker-dashboard.hidden {
          display: none;
        }
        
        .market-pulse-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: grab;
          user-select: none;
          border-bottom: 1px solid rgba(242, 246, 248, 0.06);
        }
        
        .market-pulse-header:active {
          cursor: grabbing;
        }
        
        .market-pulse-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .market-pulse-icon {
          width: 20px;
          height: 20px;
          color: var(--emerald);
          display: flex;
          align-items: center;
        }
        
        .market-pulse-actions {
          display: flex;
          gap: 8px;
        }
        
        .icon-button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--soft-gray);
          border: 1px solid rgba(242, 246, 248, 0.08);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-button:hover {
          background: var(--graphite-lighter);
          border-color: var(--emerald);
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        
        .td-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 420px;
          overflow-y: auto;
          background: var(--graphite);
        }
        
        .td-content::-webkit-scrollbar {
          width: 4px;
        }
        
        .td-content::-webkit-scrollbar-thumb {
          background: var(--soft-gray);
          border-radius: 2px;
        }
        
        /* Ticker Card */
        .ticker-card {
          background: var(--soft-gray);
          border: 1px solid rgba(242, 246, 248, 0.06);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .ticker-card:hover {
          border-color: var(--emerald);
          box-shadow: 0 4px 16px rgba(0, 163, 108, 0.12);
          transform: translateX(2px);
        }

        .ticker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .ticker-symbol {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .ticker-price {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-left: 8px;
        }

        .price-change {
          font-size: 12px;
          font-weight: 600;
          margin-left: 6px;
        }

        .price-change.positive { color: var(--emerald); }
        .price-change.negative { color: var(--error); }

        /* Volatility Badge */
        .volatility-badge {
          background: var(--brass-transparent);
          border: 1px solid var(--brass);
          color: var(--brass);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .volatility-badge.bullish {
          background: var(--emerald-transparent);
          border-color: var(--emerald);
          color: var(--emerald);
        }

        .volatility-badge.bearish {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error);
          color: var(--error);
        }

        .volatility-badge.neutral {
          background: var(--soft-gray-darker);
          border-color: var(--text-tertiary);
          color: var(--text-tertiary);
        }

        /* Sentiment Bar */
        .sentiment-bar {
          height: 4px;
          background: rgba(242, 246, 248, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
          position: relative;
        }

        .sentiment-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.5s ease;
          position: absolute;
          left: 50%;
        }

        .sentiment-fill.bullish {
          background: linear-gradient(90deg, var(--emerald) 0%, #00D68F 100%);
        }

        .sentiment-fill.bearish {
          background: linear-gradient(90deg, var(--error) 0%, #F97316 100%);
        }

        .ticker-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tweet-count {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .last-update {
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 400;
        }

        /* Live Feed Indicator */
        .live-feed-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid rgba(242, 246, 248, 0.06);
          background: var(--graphite);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--emerald);
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          box-shadow: 0 0 8px rgba(0, 163, 108, 0.4);
        }

        .live-dot.loading {
          background: var(--brass);
          box-shadow: 0 0 8px rgba(201, 166, 107, 0.4);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .live-text {
          font-size: 11px;
          font-weight: 700;
          color: var(--emerald);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
      </style>
      
      <div class="market-pulse-header" id="td-header">
        <div class="market-pulse-title">
          <div class="market-pulse-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          Market Pulse
        </div>
        <div class="market-pulse-actions">
          <button class="icon-button" id="td-manage" title="Manage Tickers">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
          <button class="icon-button" id="td-refresh" title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button class="icon-button" id="td-minimize" title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="td-content" id="td-cards">
        ${this.tickers.map(ticker => this.createCardHTML(ticker)).join('')}
      </div>
      
      <div class="live-feed-indicator">
        <div class="live-dot" id="td-status-dot"></div>
        <span class="live-text">Live Feed Active</span>
      </div>
    `;

    document.body.appendChild(dashboard);
    this.element = dashboard;
    this.setupEventListeners();
  }

  createCardHTML(ticker) {
    const data = this.cardData[ticker];
    const { badgeClass, icon, label } = this.getStatusConfig(data.status);

    const sentiment = data.sentiment || 0;
    const barWidth = Math.min(Math.abs(sentiment) * 50, 50);
    const barLeft = sentiment >= 0 ? 50 : 50 - barWidth;
    const sentimentType = sentiment >= 0 ? 'bullish' : 'bearish';

    return `
      <div class="ticker-card" id="td-card-${ticker}" title="Click to search $${ticker} tweets">
        <div class="ticker-header">
          <div style="display: flex; align-items: baseline;">
            <span class="ticker-symbol">$${ticker}</span>
            <span class="ticker-price" id="td-price-${ticker}">--</span>
            <span class="price-change" id="td-change-${ticker}">--</span>
          </div>
          <div class="volatility-badge ${badgeClass}" id="td-badge-${ticker}">
            ${icon}
            <span id="td-label-${ticker}">${label}</span>
          </div>
        </div>
        <div class="sentiment-bar">
          <div class="sentiment-fill ${sentimentType}" id="td-bar-${ticker}"
               style="left: ${barLeft}%; width: ${barWidth}%;">
          </div>
        </div>
        <canvas id="td-sparkline-${ticker}" width="280" height="30" style="width:100%;height:30px;margin-bottom:8px;border-radius:4px;background:rgba(242,246,248,0.03);"></canvas>
        <div class="ticker-footer">
          <span class="tweet-count" id="td-vol-${ticker}">${data.sampleSize} tweets</span>
          <span class="last-update" id="td-time-${ticker}">${data.lastUpdated || '--:--'}</span>
        </div>
      </div>
    `;
  }

  getStatusConfig(status) {
    const statusUpper = (status || 'NEUTRAL').toUpperCase();

    if (statusUpper.includes('LOW DATA') || statusUpper.includes('INSUFFICIENT')) {
      return {
        badgeClass: 'neutral',
        label: 'LOW DATA',
        icon: '⚠️'
      };
    } else if (statusUpper.includes('BULLISH')) {
      return {
        badgeClass: 'bullish',
        label: 'BULLISH',
        icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
      };
    } else if (statusUpper.includes('BEARISH')) {
      return {
        badgeClass: 'bearish',
        label: 'BEARISH',
        icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>'
      };
    } else if (statusUpper.includes('VOL')) {
      return {
        badgeClass: 'volatile',
        label: 'VOLATILE',
        icon: '⚡'
      };
    } else if (statusUpper.includes('LOADING')) {
      return {
        badgeClass: 'neutral',
        label: 'SYNCING',
        icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"></path></svg>'
      };
    } else {
      return {
        badgeClass: 'neutral',
        label: 'NEUTRAL',
        icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
      };
    }
  }

  updateCardUI(ticker, data) {
    const card = document.getElementById(`td-card-${ticker}`);
    if (!card) return;

    // Update badge info
    const { badgeClass, icon, label } = this.getStatusConfig(data.status);
    const badge = document.getElementById(`td-badge-${ticker}`);
    if (badge) {
      badge.className = `volatility-badge ${badgeClass}`;
      badge.innerHTML = `${icon} <span id="td-label-${ticker}">${label}</span>`;
    }

    // Update metric bars
    const bar = document.getElementById(`td-bar-${ticker}`);
    if (bar) {
      const sentiment = data.sentiment || 0;
      const barWidth = Math.min(Math.abs(sentiment) * 50, 50);
      const barLeft = sentiment >= 0 ? 50 : 50 - barWidth;
      const sentimentType = sentiment >= 0 ? 'bullish' : 'bearish';

      bar.style.width = `${barWidth}%`;
      bar.style.left = `${barLeft}%`;
      bar.className = `sentiment-fill ${sentimentType}`;
    }

    // Update meta - show influencer count if available
    const vol = document.getElementById(`td-vol-${ticker}`);
    if (vol) {
      let metaText = `${data.sampleSize || 0} tweets`;
      if (data.influencerCount > 0) {
        metaText += ` (${data.influencerCount} 👤)`;
      }
      vol.textContent = metaText;
    }

    const time = document.getElementById(`td-time-${ticker}`);
    if (time) time.textContent = data.lastUpdated;

    // Apply volume spike indicator
    if (data.volumeSpike) {
      card.classList.add('volume-spike');
      card.style.position = 'relative';
    } else {
      card.classList.remove('volume-spike');
    }
  }


  // ... (Rest of logic: startTracking, refreshAll, etc. mostly same but calling updateCardUI)

  setupEventListeners() {
    document.getElementById('td-minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMinimize();
    });

    // Dragging functionality
    const header = document.getElementById('td-header');
    const dashboard = this.element;
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return; // Don't drag when clicking buttons

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = dashboard.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      header.style.cursor = 'grabbing';
      dashboard.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      // Keep within viewport bounds
      const maxX = window.innerWidth - dashboard.offsetWidth;
      const maxY = window.innerHeight - dashboard.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      dashboard.style.left = newX + 'px';
      dashboard.style.top = newY + 'px';
      dashboard.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'grab';
        dashboard.style.transition = 'all 0.3s ease';
      }
    });

    document.getElementById('td-refresh').addEventListener('click', (e) => {
      e.stopPropagation();
      this.refreshAll();
    });

    document.getElementById('td-manage').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showManageTickersDialog();
    });

    // Add click handlers to all cards
    this.tickers.forEach(ticker => {
      const card = document.getElementById(`td-card-${ticker}`);
      if (card) {
        card.addEventListener('click', () => this.openTickerSearch(ticker));
      }
    });
  }

  openTickerSearch(ticker) {
    console.log(`[TrackerDashboard] Opening tweets for $${ticker}`);

    const data = this.cardData[ticker];
    if (!data || !data.tweets || data.tweets.length === 0) {
      // No tweets yet, open search
      const query = encodeURIComponent(`$${ticker} lang:en min_faves:1 -filter:replies -filter:retweets`);
      window.open(`https://x.com/search?q=${query}&src=typed_query&f=live`, '_blank');
      return;
    }

    // Show modal with analyzed tweets
    this.showTweetsModal(ticker, data);
  }

  showTweetsModal(ticker, data) {
    // Remove existing modal if any
    const existing = document.getElementById('traderx-tweets-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'traderx-tweets-modal';
    modal.innerHTML = `
      <style>
        #traderx-tweets-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .tweets-modal-content {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 16px;
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .tweets-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .tweets-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #F8FAFC;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .tweets-modal-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #94A3B8;
        }
        
        .tweets-modal-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .tweets-modal-close {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .tweets-modal-close:hover {
          background: #334155;
          color: #F8FAFC;
        }
        
        .tweets-modal-body {
          padding: 16px 24px;
          overflow-y: auto;
          flex: 1;
        }
        
        .tweet-item {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        
        .tweet-item:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: #00ADB5;
        }
        
        .tweet-author {
          font-weight: 600;
          color: #00ADB5;
          font-size: 13px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .tweet-text {
          color: #E2E8F0;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 8px;
        }
        
        .tweet-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748B;
        }
        
        .tweet-sentiment {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 10px;
        }
        
        .tweet-sentiment.bullish {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }
        
        .tweet-sentiment.bearish {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }
        
        .tweet-sentiment.neutral {
          background: rgba(148, 163, 184, 0.2);
          color: #94A3B8;
        }
        
        .influencer-badge {
          background: rgba(59, 130, 246, 0.2);
          color: #60A5FA;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
      </style>
      
      <div class="tweets-modal-content">
        <div class="tweets-modal-header">
          <div>
            <div class="tweets-modal-title">
              <span>$${ticker} Analysis</span>
              <span class="td-badge ${this.getStatusConfig(data.status).badgeClass}">
                ${this.getStatusConfig(data.status).icon}
                ${data.status}
              </span>
            </div>
            <div class="tweets-modal-stats">
              <div class="tweets-modal-stat">
                <span>🟢 ${data.bullishCount || 0} Bullish</span>
              </div>
              <div class="tweets-modal-stat">
                <span>🔴 ${data.bearishCount || 0} Bearish</span>
              </div>
              <div class="tweets-modal-stat">
                <span>⚪ ${data.neutralCount || 0} Neutral</span>
              </div>
              ${data.influencerCount > 0 ? `<div class="tweets-modal-stat"><span>👤 ${data.influencerCount} Influencers</span></div>` : ''}
            </div>
          </div>
          <button class="tweets-modal-close" id="close-tweets-modal">×</button>
        </div>
        
        <div class="tweets-modal-body">
          ${this.renderTweets(data.tweets, ticker)}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('close-tweets-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  renderTweets(tweets, ticker) {
    if (!tweets || tweets.length === 0) {
      return '<p style="color: #64748B; text-align: center; padding: 40px;">No tweets analyzed yet.</p>';
    }

    const engine = window.TraderXAnalysisEngine;

    return tweets.slice(0, 50).map(tweet => {
      const text = typeof tweet === 'string' ? tweet : (tweet.text || tweet.content || '');
      const author = typeof tweet === 'object' ? (tweet.author || tweet.username || 'Unknown') : 'Unknown';

      // Get sentiment
      let score = 0;
      if (engine) {
        score = engine.analyzeText(text);
      }

      let sentimentClass = 'neutral';
      let sentimentLabel = 'Neutral';
      if (score > 0.2) {
        sentimentClass = 'bullish';
        sentimentLabel = 'Bullish';
      } else if (score < -0.2) {
        sentimentClass = 'bearish';
        sentimentLabel = 'Bearish';
      }

      // Check if influencer
      const influencerInfo = engine ? engine.getInfluencerInfo(author) : null;

      return `
        <div class="tweet-item">
          <div class="tweet-author">
            @${author}
            ${influencerInfo ? `<span class="influencer-badge">${influencerInfo.label}</span>` : ''}
          </div>
          <div class="tweet-text">${this.escapeHtml(text)}</div>
          <div class="tweet-meta">
            <span class="tweet-sentiment ${sentimentClass}">${sentimentLabel}</span>
            <span>Score: ${score.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  showManageTickersDialog() {
    const currentTickers = this.tickers.join(', ');
    const newTickers = prompt(
      'Enter tickers to track (comma-separated):\nExample: BTC, ETH, TSLA, NVDA, SPY',
      currentTickers
    );

    if (newTickers !== null && newTickers.trim()) {
      const tickerArray = newTickers
        .split(',')
        .map(t => t.trim().toUpperCase().replace('$', ''))
        .filter(t => t.length > 0 && t.length <= 10);

      if (tickerArray.length > 0) {
        this.tickers = tickerArray;
        localStorage.setItem('traderx_pulse_tickers', JSON.stringify(this.tickers));

        // Reinitialize
        this.cardData = {};
        this.tickers.forEach(ticker => {
          this.cardData[ticker] = {
            status: 'LOADING',
            sentiment: 0,
            lastUpdated: null,
            sampleSize: 0,
            isStale: false,
            tweets: [],
            bullishCount: 0,
            bearishCount: 0,
            neutralCount: 0
          };
        });

        // Rebuild UI
        const cardsContainer = document.getElementById('td-cards');
        if (cardsContainer) {
          cardsContainer.innerHTML = this.tickers.map(ticker => this.createCardHTML(ticker)).join('');
          this.setupEventListeners();
          this.refreshAll();
        }
      }
    }
  }


  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.element.classList.toggle('minimized', this.isMinimized);
  }

  startTracking() {
    this.refreshAll();
    this.intervalId = setInterval(() => {
      // Pause polling when tab is not visible
      if (document.visibilityState === 'visible') {
        this.refreshAll();
      } else {
        console.log('[TrackerDashboard] Tab hidden, skipping refresh');
      }
    }, this.updateInterval);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[TrackerDashboard] Tab visible again, refreshing...');
        this.refreshAll();
      }
    });
  }

  async refreshAll() {
    const dot = document.getElementById('td-status-dot');
    if (dot) dot.classList.add('loading');

    for (const ticker of this.tickers) {
      this.updateCardUI(ticker, { status: 'LOADING' });
      await this.updateTicker(ticker);
      await new Promise(r => setTimeout(r, 200));
    }

    if (dot) dot.classList.remove('loading');
  }

  async updateTicker(ticker) {
    try {
      const fetcher = window.TraderXFetcher;
      const engine = window.TraderXAnalysisEngine;

      // Fetch tweets — v4.0 returns {tweets, confidence, insufficientData}
      const fetchResult = fetcher ? await fetcher.fetchTickerTweets(ticker, {
        maxTweets: 100,
        includeRetweets: false,
        includeReplies: false
      }) : { tweets: [], confidence: 'low', insufficientData: true };

      // Handle both old array format and new result object
      const tweets = Array.isArray(fetchResult) ? fetchResult : (fetchResult.tweets || []);
      const confidence = fetchResult.confidence || 'low';
      const insufficientData = fetchResult.insufficientData || false;

      let analysis;

      if (engine && tweets.length > 0) {
        analysis = await engine.analyzeTicker(fetchResult, ticker);

        // Calculate detailed breakdown
        const bullishCount = tweets.filter(t => {
          const score = engine.analyzeText(typeof t === 'string' ? t : (t.text || ''));
          return score > 0.2;
        }).length;

        const bearishCount = tweets.filter(t => {
          const score = engine.analyzeText(typeof t === 'string' ? t : (t.text || ''));
          return score < -0.2;
        }).length;

        const neutralCount = tweets.length - bullishCount - bearishCount;

        this.cardData[ticker] = {
          status: analysis.status,
          sentiment: analysis.sentiment,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sampleSize: analysis.sampleSize,
          tweets: tweets,
          bullishCount,
          bearishCount,
          neutralCount,
          volumeSpike: analysis.volumeSpike || false,
          spikeIntensity: analysis.spikeIntensity || 0,
          influencerCount: analysis.influencerCount || 0,
          confidence,
          insufficientData
        };
      } else {
        this.cardData[ticker] = {
          status: insufficientData ? 'LOW DATA' : 'NEUTRAL',
          sentiment: 0,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sampleSize: tweets.length,
          tweets: tweets,
          bullishCount: 0,
          bearishCount: 0,
          neutralCount: tweets.length,
          volumeSpike: false,
          spikeIntensity: 0,
          influencerCount: 0,
          confidence,
          insufficientData
        };
      }

      this.updateCardUI(ticker, this.cardData[ticker]);
      this.drawSparkline(ticker);

      // Also fetch price data
      this.updatePriceUI(ticker);

    } catch (e) {
      console.error('[TrackerDashboard] Error updating ticker:', e);
      this.updateCardUI(ticker, { status: 'ERROR', sampleSize: 0 });
    }
  }

  async updatePriceUI(ticker) {
    const priceFetcher = window.TraderXPriceFetcher;
    if (!priceFetcher) return;

    try {
      const priceData = await priceFetcher.getPrice(ticker);

      const priceEl = document.getElementById(`td-price-${ticker}`);
      const changeEl = document.getElementById(`td-change-${ticker}`);

      if (priceEl && priceData.price !== null) {
        priceEl.textContent = priceFetcher.formatPrice(priceData.price, priceData.type);
      }

      if (changeEl && priceData.change24h !== null) {
        changeEl.textContent = priceFetcher.formatChange(priceData.change24h);
        changeEl.style.color = priceFetcher.getChangeColor(priceData.change24h);
      }
    } catch (e) {
      console.warn(`[TrackerDashboard] Price fetch failed for ${ticker}:`, e);
    }
  }

  // Public APIs
  toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) this.element.classList.remove('hidden');
    else this.element.classList.add('hidden');
  }

  // ========================================================================
  // SPARKLINE CHART (Sentiment History)
  // ========================================================================

  drawSparkline(ticker) {
    const canvas = document.getElementById(`td-sparkline-${ticker}`);
    if (!canvas) return;

    const engine = window.TraderXAnalysisEngine;
    if (!engine) return;

    const history = engine.getSentimentHistory(ticker);
    if (!history || history.length < 2) {
      // Not enough data — draw flat line
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(242, 246, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const padding = 2;

    ctx.clearRect(0, 0, w, h);

    // Draw zero line
    ctx.strokeStyle = 'rgba(242, 246, 248, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw sentiment line
    const points = history.slice(-50); // Last 50 data points
    const stepX = (w - padding * 2) / (points.length - 1);

    // Map sentiment (-1 to 1) to canvas Y (h-padding to padding)
    const mapY = (val) => {
      const clamped = Math.max(-1, Math.min(1, val));
      return h - padding - ((clamped + 1) / 2) * (h - padding * 2);
    };

    // Determine line color based on latest sentiment
    const latestSentiment = points[points.length - 1].sentiment;
    let lineColor, fillColor;
    if (latestSentiment > 0.1) {
      lineColor = '#00A36C';
      fillColor = 'rgba(0, 163, 108, 0.15)';
    } else if (latestSentiment < -0.1) {
      lineColor = '#EF4444';
      fillColor = 'rgba(239, 68, 68, 0.15)';
    } else {
      lineColor = '#C9A66B';
      fillColor = 'rgba(201, 166, 107, 0.1)';
    }

    // Draw fill area
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(padding, h / 2);
    points.forEach((p, i) => {
      ctx.lineTo(padding + i * stepX, mapY(p.sentiment));
    });
    ctx.lineTo(padding + (points.length - 1) * stepX, h / 2);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padding + i * stepX;
      const y = mapY(p.sentiment);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw latest point
    const lastX = padding + (points.length - 1) * stepX;
    const lastY = mapY(latestSentiment);
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Init
window.TraderXTrackerDashboard = window.TraderXTrackerDashboard || new TrackerDashboard();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.TraderXTrackerDashboard.init());
} else {
  setTimeout(() => window.TraderXTrackerDashboard.init(), 1000);
}
