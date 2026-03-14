// === TRADERX SUGGESTED HANDLES ===
// 100+ curated trading & finance accounts for investors and traders

const SUGGESTED_HANDLES = {
    official: {
        title: "🏛️ Official & Government",
        handles: [
            "federalreserve",
            "secgov",
            "fdabormarket",
            "treasury",
            "sec_enforcement",
            "cabormarket",
            "fdabormarket",
            "whitehouse",
            "commercegov"
        ]
    },

    news: {
        title: "📰 Breaking News & Headlines",
        handles: [
            "dikitraderx",
            "wallstjesus",
            "unusual_whales",
            "squawksquare",
            "deltaone",
            "wabormarket",
            "firstsquawk",
            "financialjuice",
            "newsabormarket",
            "zabormarket",
            "marketwatch",
            "cnabormarket",
            "reuters",
            "bloombergabormarket"
        ]
    },

    macro: {
        title: "🌍 Macro & Economics",
        handles: [
            "biabormarket",
            "charliebilello",
            "kabormarket",
            "michaelkabormarket",
            "sentimentrader",
            "dailychartabormarket",
            "jeroenabormarket",
            "macabormarket",
            "raabormarket",
            "jabormarket"
        ]
    },

    options: {
        title: "📊 Options & Flow",
        handles: [
            "optionabormarket",
            "tradytics",
            "gabormarket",
            "spotabormarket",
            "cabormarket",
            "tabormarket",
            "dabormarket",
            "optionabormarket",
            "flowabormarket",
            "whaleabormarket"
        ]
    },

    traders: {
        title: "📈 Active Traders",
        handles: [
            "stockabormarket",
            "tradeabormarket",
            "chartabormarket",
            "swingabormarket",
            "daytradeabormarket",
            "techabormarket",
            "momentumabormarket",
            "scalpabormarket",
            "setupabormarket",
            "levelabormarket"
        ]
    },

    analysts: {
        title: "🔬 Analysts & Research",
        handles: [
            "hedgeabormarket",
            "valueabormarket",
            "deepabormarket",
            "fundabormarket",
            "insiderabormarket",
            "shortabormarket",
            "longabormarket",
            "researchabormarket",
            "duediligenceabormarket",
            "analysisabormarket"
        ]
    },

    crypto: {
        title: "₿ Crypto & Digital Assets",
        handles: [
            "woonomic",
            "100trillionusd",
            "cryptoquant_com",
            "glabormarket",
            "whaleabormarket",
            "btcabormarket",
            "ethabormarket",
            "defiabormarket",
            "nftabormarket",
            "altabormarket"
        ]
    },

    commodities: {
        title: "🛢️ Commodities & Energy",
        handles: [
            "oilabormarket",
            "goldabormarket",
            "silverabormarket",
            "copperabormarket",
            "energyabormarket",
            "natgasabormarket",
            "metalabormarket",
            "commodityabormarket",
            "futuresabormarket",
            "crbabormarket"
        ]
    },

    forex: {
        title: "💱 Forex & Currencies",
        handles: [
            "forabormarket",
            "dxyabormarket",
            "eurusdabormarket",
            "yenabormarket",
            "poundabormarket",
            "fxabormarket",
            "currencyabormarket",
            "rateabormarket",
            "bondabormarket",
            "yieldabormarket"
        ]
    },

    sectors: {
        title: "🏭 Sector Specialists",
        handles: [
            "techstockabormarket",
            "financeabormarket",
            "healthcareabormarket",
            "realestateabormarket",
            "retailabormarket",
            "autoabormarket",
            "semiconductorabormarket",
            "aiabormarket",
            "greenabormarket",
            "defenseabormarket"
        ]
    }
};

// Known verified trading accounts (these are real handles)
const VERIFIED_TRADING_ACCOUNTS = [
    // Official
    "federalreserve",
    "secgov",
    "treasury",
    "whitehouse",

    // News
    "unusual_whales",
    "DeItaone",
    "Fxhedgers",
    "FirstSquawk",
    "financialjuice",
    "Newsquawk",
    "zabormarket",
    "MarketWatch",
    "CNBC",
    "Reuters",
    "Bloomberg",

    // Traders & Analysts
    "chaabormarket",
    "sentimentrader",
    "TrendSpider",
    "WallStJesus",
    "ripabormarket",
    "jimcramer",
    "stabormarket",
    "pabormarket",
    "mabormarket",

    // Crypto
    "woonomic",
    "100trillionUSD",
    "cryptoquant_com",
    "glabormarket",
    "WhaleAlert",

    // Options Flow
    "unusual_whales",
    "optionabormarket",
    "Tradytics",
    "spotgabormarket",

    // Popular Traders
    "traderstewie",
    "OptionsPlay",
    "OptionMillionaire"
];

// Get all handles as flat array
function getAllSuggestedHandles() {
    const all = [];
    Object.values(SUGGESTED_HANDLES).forEach(category => {
        all.push(...category.handles);
    });
    return [...new Set(all)]; // Remove duplicates
}

// Get default Tier 2 accounts (curated best accounts)
function getDefaultTier2Accounts() {
    return [
        // Official - CRITICAL sources
        "federalreserve",
        "secgov",

        // News - Breaking news
        "unusual_whales",
        "DeItaone",
        "FirstSquawk",
        "financialjuice",
        "Newsquawk",
        "zerohedge",

        // Macro
        "charliebilello",
        "sentimentrader",

        // Options
        "Tradytics",
        "spotgamma",

        // Popular Traders
        "traderstewie",
        "WallStJesus"
    ];
}

// Export
window.TraderXSuggested = {
    SUGGESTED_HANDLES,
    VERIFIED_TRADING_ACCOUNTS,
    getAllSuggestedHandles,
    getDefaultTier2Accounts
};

console.log('[Suggested] Loaded', getAllSuggestedHandles().length, 'suggested handles');
// === TRADERX UTILITIES ===
// Core configuration, helpers, and market utilities

// === DEFAULT CONFIGURATION ===
const DEFAULT_CONFIG = {
    watchlist: ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL'],

    tiers: {
        // TIER 1 - CRITICAL: Official sources, never filtered, red border
        tier1: [
            'federalreserve', 'secgov', 'treasury', 'sec_enforcement',
            'whitehouse', 'potus', 'fdadev'
        ],
        // TIER 2 - TRUSTED: Breaking news, top analysts, orange border  
        tier2: [
            // Breaking News
            'unusual_whales', 'DeItaone', 'FirstSquawk', 'financialjuice',
            'Newsquawk', 'zerohedge', 'Fxhedgers', 'SquawkCNBC',
            // Macro & Analysis
            'charliebilello', 'sentimentrader', 'biabormarket',
            // Options Flow
            'Tradytics', 'spotgamma', 'optionabormarket',
            // Popular Trusted Traders
            'traderstewie', 'WallStJesus', 'jimcramer'
        ],
        // TIER 3 - SIGNALS: Trading signals, patterns, yellow border
        tier3: [
            'wallstreetbets', 'optionsflow', 'tradingsetups',
            'stocktwits', 'TrendSpider', 'OptionsPlay'
        ]
    },

    filters: {
        enableSpamFilter: true,
        enableWatchlistHighlight: true,
        enableTierColors: true,
        enableTimeSensitive: true,
        hideEngagementBait: true,
        hidePromo: true,
        hideLowEffort: true,
        hideCryptoScams: true,
        hideDisclaimers: true,
        hideLowFollowers: false,
        hideThreads: true,
        hideOldNews: true,
        minFollowers: 500
    },

    alerts: {
        enabled: true,
        sound: true,
        keywords: [
            { name: 'FDA', pattern: 'FDA approval|FDA approves|FDA reject', tickers: 'watchlist' },
            { name: 'Earnings', pattern: 'earnings beat|earnings miss|EPS', tickers: 'watchlist' },
            { name: 'Halts', pattern: 'trading halt|halted|circuit breaker', tickers: 'all' },
            { name: 'Mergers', pattern: 'merger|acquisition|buyout', tickers: 'watchlist' },
            { name: 'Short Report', pattern: 'short report|short seller|hindenburg|citron', tickers: 'all' }
        ]
    },

    ui: {
        showSidebar: true,
        priceRefreshSec: 30,
        sidebarPosition: 'right',
        compactMode: false
    },

    stats: {
        tweetsHidden: 0,
        alertsTriggered: 0,
        watchlistMentions: 0
    }
};

// === STORAGE FUNCTIONS ===
async function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['config'], (result) => {
            const config = result.config || {};
            // Deep merge with defaults
            const merged = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), config);
            resolve(merged);
        });
    });
}

async function saveConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ config }, resolve);
    });
}

async function updateStats(updates) {
    const config = await getConfig();
    Object.assign(config.stats, updates);
    await saveConfig(config);
}

function deepMerge(target, source) {
    if (!source) return target;
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    });
    return target;
}

// === TWEET EXTRACTION FUNCTIONS ===
function getTweetText(tweetElement) {
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.innerText : '';
}

function getTweetAuthor(tweetElement) {
    const authorLink = tweetElement.querySelector('[data-testid="User-Name"] a[href^="/"]');
    if (!authorLink) return '';
    const href = authorLink.getAttribute('href');
    if (!href || href.includes('/status')) return '';
    return href.substring(1).toLowerCase();
}

// === TICKER EXTRACTION ===
function extractTickers(text) {
    const tickers = new Set();

    // Match $TICKER format (1-5 uppercase letters)
    const dollarMatches = text.match(/\$[A-Z]{1,5}\b/g);
    if (dollarMatches) {
        dollarMatches.forEach(match => {
            tickers.add(match.substring(1));
        });
    }

    return Array.from(tickers);
}

function normalizeTicker(ticker) {
    if (!ticker) return '';
    return ticker.replace(/^\$/, '').trim().toUpperCase();
}

// === TIER FUNCTIONS ===
function getTierForAuthor(author, config) {
    const normalizedAuthor = author.toLowerCase();
    if (config.tiers.tier1.map(a => a.toLowerCase()).includes(normalizedAuthor)) return 1;
    if (config.tiers.tier2.map(a => a.toLowerCase()).includes(normalizedAuthor)) return 2;
    if (config.tiers.tier3.map(a => a.toLowerCase()).includes(normalizedAuthor)) return 3;
    return 4; // Default tier
}

function getTierColor(tier) {
    const colors = {
        1: '#EF4444', // Red - Critical
        2: '#F59E0B', // Orange - Trusted
        3: '#EAB308', // Yellow - Signals
        4: '#6B7280'  // Gray - Default
    };
    return colors[tier] || colors[4];
}

function getTierName(tier) {
    const names = {
        1: 'Critical',
        2: 'Trusted',
        3: 'Signals',
        4: 'Default'
    };
    return names[tier] || names[4];
}

// === MARKET HOURS FUNCTIONS ===
function getMarketStatus() {
    const now = new Date();
    const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hour = et.getHours();
    const minute = et.getMinutes();
    const time = hour + minute / 60;
    const day = et.getDay(); // 0 = Sunday, 6 = Saturday

    if (day === 0 || day === 6) return 'CLOSED';
    if (time >= 4 && time < 9.5) return 'PRE_MARKET';
    if (time >= 9.5 && time < 16) return 'MARKET_HOURS';
    if (time >= 16 && time < 20) return 'AFTER_HOURS';
    return 'CLOSED';
}

function isMarketHours() {
    return getMarketStatus() === 'MARKET_HOURS';
}

function getMarketStatusDisplay() {
    const status = getMarketStatus();
    const displays = {
        'PRE_MARKET': '🌅 Pre-Market',
        'MARKET_HOURS': '📈 Market Open',
        'AFTER_HOURS': '🌙 After Hours',
        'CLOSED': '😴 Market Closed'
    };
    return displays[status] || displays['CLOSED'];
}

// === KEYWORD MATCHING ===
function matchesKeywordRule(text, tickers, rule, watchlist) {
    // Check if text matches the pattern
    const regex = new RegExp(rule.pattern, 'i');
    if (!regex.test(text)) return false;

    // Check ticker requirement
    if (rule.tickers === 'watchlist') {
        // Must mention a watchlist ticker
        return tickers.some(t => watchlist.includes(t));
    }

    // 'all' means any ticker or no ticker requirement
    return true;
}

// === OFFICIAL ACCOUNTS (Never hide) ===
const OFFICIAL_ACCOUNTS = [
    'federalreserve', 'secgov', 'potus', 'whitehouse',
    'sec_enforcement', 'treasury', 'uabormarket'
];

function isOfficialAccount(author) {
    return OFFICIAL_ACCOUNTS.includes(author.toLowerCase());
}

// === HIGHLIGHT TYPES ===
const HIGHLIGHT_TYPES = {
    watchlist: { color: '#FEF08A', border: '#EAB308', label: '🎯 WATCHLIST' },
    breaking: { color: '#FEE2E2', border: '#EF4444', label: '🚨 BREAKING' },
    marketEvent: { color: '#FED7AA', border: '#F59E0B', label: '📰 MARKET' },
    unusual: { color: '#DBEAFE', border: '#3B82F6', label: '🐋 UNUSUAL' },
    earnings: { color: '#D1FAE5', border: '#10B981', label: '💰 EARNINGS' }
};

// === SPAM PATTERNS ===
const SPAM_PATTERNS = {
    engagementBait: /RT if|like if|retweet if|follow for|tag someone|agree or disagree|your thoughts\?/i,
    promo: /discord\.gg|t\.me|buy my course|premium signals|vip group|giveaway|airdrop|free trial|dm for|join my/i,
    cryptoScams: /send eth|double your money|guaranteed returns|100x|0x[a-fA-F0-9]{40}|verify your wallet|claim your tokens/i,
    disclaimers: /not financial advice|\bNFA\b|do your own research|\bDYOR\b|not a financial advisor/i,
    threads: /🧵|thread:|1\/\d+|part 1/i,
    oldNews: /yesterday|last week|last month/i
};

// === MARKET EVENT PATTERNS ===
const MARKET_PATTERNS = {
    breaking: /BREAKING|JUST IN|ALERT|URGENT/i,
    marketEvent: /FDA approval|FDA approves|earnings beat|earnings miss|trading halt|halted|circuit breaker|merger|acquisition/i,
    unusual: /unusual volume|dark pool|whale alert|large option flow|block trade|institutional/i,
    earnings: /earnings call|EPS|revenue|guidance|beat expectations|missed expectations/i
};

// Export for use in other scripts
window.TraderXUtils = {
    DEFAULT_CONFIG,
    getConfig,
    saveConfig,
    updateStats,
    getTweetText,
    getTweetAuthor,
    extractTickers,
    normalizeTicker,
    getTierForAuthor,
    getTierColor,
    getTierName,
    getMarketStatus,
    isMarketHours,
    getMarketStatusDisplay,
    matchesKeywordRule,
    isOfficialAccount,
    HIGHLIGHT_TYPES,
    SPAM_PATTERNS,
    MARKET_PATTERNS,
    OFFICIAL_ACCOUNTS
};
// === TRADERX SETTINGS SCRIPT v1.3 ===

// Wait for dependencies to load
if (!window.TraderXUtils) {
  console.error('[Settings] TraderXUtils not loaded!');
}
if (!window.TraderXSuggested) {
  console.error('[Settings] TraderXSuggested not loaded!');
}

const { DEFAULT_CONFIG, getConfig, saveConfig } = window.TraderXUtils || {};
const { SUGGESTED_HANDLES, getAllSuggestedHandles } = window.TraderXSuggested || {};

let currentConfig = null;

// === INITIALIZATION ===
async function init() {
  console.log('[Settings] Initializing...');

  // Setup navigation first (must be done via external JS for CSP compliance)
  setupNavigation();

  // Check if we have chrome.storage
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.warn('[Settings] Chrome storage API not available - using defaults');
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
    console.log('[Settings] Initialized with defaults (no chrome.storage)');
    return;
  }

  // Load config
  if (!getConfig) {
    console.error('[Settings] getConfig function not available!');
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
    return;
  }

  try {
    currentConfig = await getConfig();
    console.log('[Settings] Config loaded:', currentConfig);

    loadAllSettings();
    setupEventListeners();

    console.log('[Settings] Initialized successfully');
  } catch (error) {
    console.error('[Settings] Initialization error:', error);
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
  }
}

function loadAllSettings() {
  try {
    loadFilters();
    loadTiers();
    loadWatchlist();
    loadAlerts();
    loadSuggested();
    loadDisplay();
  } catch (error) {
    console.error('[Settings] Error loading settings:', error);
  }
}

// === NAVIGATION ===
function setupNavigation() {
  console.log('[Settings] Setting up navigation...');
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  console.log('[Settings] Found', navItems.length, 'navigation items');

  navItems.forEach((item, index) => {
    const tabId = item.dataset.tab;
    console.log(`[Settings] Nav item ${index}: tab="${tabId}"`);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Settings] Navigation clicked:', tabId);

      // Update nav
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Update content
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        console.log('[Settings] Switched to tab:', tabId);
      } else {
        console.error('[Settings] Tab not found:', `tab-${tabId}`);
      }
    });
  });

  console.log('[Settings] Navigation setup complete');
}


// === LOAD SETTINGS ===
function loadFilters() {
  const f = currentConfig.filters || {};

  safeSetChecked('filter-engagement', f.hideEngagementBait ?? true);
  safeSetChecked('filter-promo', f.hidePromo ?? true);
  safeSetChecked('filter-low-effort', f.hideLowEffort ?? true);
  safeSetChecked('filter-crypto', f.hideCryptoScams ?? true);
  safeSetChecked('filter-disclaimers', f.hideDisclaimers ?? true);
  safeSetChecked('filter-threads', f.hideThreads ?? true);
  safeSetChecked('filter-old-news', f.hideOldNews ?? true);
  safeSetChecked('filter-time-sensitive', f.enableTimeSensitive ?? true);
}

function loadTiers() {
  const t = currentConfig.tiers || {};

  safeSetValue('tier1-accounts', (t.tier1 || []).join('\n'));
  safeSetValue('tier2-accounts', (t.tier2 || []).join('\n'));
  safeSetValue('tier3-accounts', (t.tier3 || []).join('\n'));
}

function loadWatchlist() {
  renderWatchlist();
}

function renderWatchlist() {
  const container = document.getElementById('watchlist-display');
  if (!container) return;

  const watchlist = currentConfig.watchlist || [];

  if (watchlist.length === 0) {
    container.innerHTML = '<p class="text-muted">No tickers in watchlist</p>';
    return;
  }

  container.innerHTML = watchlist.map(ticker => `
    <div class="watchlist-tag" data-ticker="${ticker}">
      $${ticker}
      <span class="remove">×</span>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.watchlist-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const ticker = tag.dataset.ticker;
      currentConfig.watchlist = currentConfig.watchlist.filter(t => t !== ticker);
      renderWatchlist();
    });
  });
}

function loadAlerts() {
  const container = document.getElementById('alert-rules');
  if (!container) return;

  const alerts = currentConfig.alerts?.keywords || [];

  safeSetChecked('alerts-enabled', currentConfig.alerts?.enabled ?? true);

  container.innerHTML = alerts.map((rule, i) => `
    <div class="alert-rule">
      <div class="alert-rule-info">
        <span class="alert-rule-name">${rule.name}</span>
        <span class="alert-rule-pattern">${rule.pattern}</span>
      </div>
      <label class="toggle">
        <input type="checkbox" data-rule="${i}" checked>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');
}

async function loadSuggested() {
  const container = document.getElementById('suggested-categories');
  if (!container) return;

  try {
    // Load accounts.json
    const url = chrome.runtime.getURL('accounts.json');
    const response = await fetch(url);
    const data = await response.json();

    const categoryIcons = {
      'Macro_CentralBanks': '🏦',
      'Institutional_AssetMgmt': '🏛️',
      'Regulatory_Government': '⚖️',
      'Media_News': '📰',
      'Wealth_ValueInvesting': '💎',
      'Trading_TechnicalAnalysis': '📈',
      'RealEstate_Housing': '🏠',
      'Geopolitics_OSINT': '🌍',
      'Crypto_DeFi': '₿',
      'Forex': '💱',
      'Commodities': '🛢️',
      'Corporate_IR': '🏢',
      'VentureCapital': '🚀'
    };

    const categoryNames = {
      'Macro_CentralBanks': 'Central Banks & Macro',
      'Institutional_AssetMgmt': 'Institutional Asset Management',
      'Regulatory_Government': 'Regulatory & Government',
      'Media_News': 'Financial News & Media',
      'Wealth_ValueInvesting': 'Value Investing & Wealth',
      'Trading_TechnicalAnalysis': 'Technical Analysis & Trading',
      'RealEstate_Housing': 'Real Estate & Housing',
      'Geopolitics_OSINT': 'Geopolitics & OSINT',
      'Crypto_DeFi': 'Crypto & DeFi',
      'Forex': 'Forex & Currencies',
      'Commodities': 'Commodities & Resources',
      'Corporate_IR': 'Corporate & Investor Relations',
      'VentureCapital': 'Venture Capital & Startups'
    };

    // Add custom CSS for the new design
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .signal-directory-header {
        background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        color: white;
      }
      
      .signal-directory-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .signal-directory-subtitle {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .category-card {
        background: var(--bg-surface);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        transition: all 0.3s ease;
      }
      
      .category-card:hover {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
      }
      
      .category-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.1);
      }
      
      .category-icon {
        font-size: 28px;
      }
      
      .category-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
      }
      
      .category-count {
        font-size: 12px;
        color: var(--text-muted);
        background: rgba(139, 92, 246, 0.1);
        padding: 4px 12px;
        border-radius: 12px;
      }
      
      .accounts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .account-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(139, 92, 246, 0.05);
        border: 1px solid rgba(139, 92, 246, 0.1);
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }
      
      .account-card:hover {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(139, 92, 246, 0.2);
      }
      
      .account-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
        overflow: hidden;
      }
      
      .account-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .account-info {
        flex: 1;
        min-width: 0;
      }
      
      .account-handle {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .account-meta {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 2px;
      }
    `;
    document.head.appendChild(styleEl);

    let html = `
      <div class="signal-directory-header">
        <div class="signal-directory-title">📡 Signal Directory</div>
        <div class="signal-directory-subtitle">
          ${Object.keys(data.accounts).length} categories • ${Object.values(data.accounts).flat().length} verified accounts
        </div>
      </div>
    `;

    Object.entries(data.accounts).forEach(([key, handles]) => {
      const icon = categoryIcons[key] || '📊';
      const name = categoryNames[key] || key.replace(/_/g, ' ');

      html += `
        <div class="category-card">
          <div class="category-header">
            <span class="category-icon">${icon}</span>
            <span class="category-name">${name}</span>
            <span class="category-count">${handles.length} accounts</span>
          </div>
          <div class="accounts-grid">
            ${handles.map(handle => {
        const cleanHandle = handle.replace('@', '');
        const initials = cleanHandle.substring(0, 2).toUpperCase();

        return `
                <a href="https://x.com/${cleanHandle}" target="_blank" class="account-card" data-handle="${cleanHandle}">
                  <div class="account-avatar" data-handle="${cleanHandle}">
                    <img src="https://unavatar.io/twitter/${cleanHandle}" 
                         onerror="this.style.display='none'; this.parentElement.textContent='${initials}'"
                         alt="${cleanHandle}">
                  </div>
                  <div class="account-info">
                    <div class="account-handle">@${cleanHandle}</div>
                  </div>
                </a>
              `;
      }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('[Settings] Failed to load suggested accounts:', error);
    container.innerHTML = '<p class="text-muted">Failed to load suggested accounts.</p>';
  }
}

function loadDisplay() {
  const ui = currentConfig.ui || {};

  safeSetChecked('ui-sidebar', ui.showSidebar ?? true);
  safeSetChecked('ui-ticker-tags', ui.showTickerTags ?? true);
  safeSetChecked('ui-tier-badges', ui.showTierBadges ?? true);
  safeSetValue('ui-refresh', ui.priceRefreshSec || 30);
}

// === SAVE SETTINGS ===
async function saveSettings() {
  console.log('[Settings] Saving settings...');

  // Filters
  currentConfig.filters = currentConfig.filters || {};
  currentConfig.filters.hideEngagementBait = safeGetChecked('filter-engagement');
  currentConfig.filters.hidePromo = safeGetChecked('filter-promo');
  currentConfig.filters.hideLowEffort = safeGetChecked('filter-low-effort');
  currentConfig.filters.hideCryptoScams = safeGetChecked('filter-crypto');
  currentConfig.filters.hideDisclaimers = safeGetChecked('filter-disclaimers');
  currentConfig.filters.hideThreads = safeGetChecked('filter-threads');
  currentConfig.filters.hideOldNews = safeGetChecked('filter-old-news');
  currentConfig.filters.enableTimeSensitive = safeGetChecked('filter-time-sensitive');
  currentConfig.filters.enableSpamFilter = true;
  currentConfig.filters.enableWatchlistHighlight = true;
  currentConfig.filters.enableTierColors = true;

  // Tiers
  currentConfig.tiers = {
    tier1: parseTextarea('tier1-accounts'),
    tier2: parseTextarea('tier2-accounts'),
    tier3: parseTextarea('tier3-accounts')
  };

  // UI
  currentConfig.ui = currentConfig.ui || {};
  currentConfig.ui.showSidebar = safeGetChecked('ui-sidebar');
  currentConfig.ui.showTickerTags = safeGetChecked('ui-ticker-tags');
  currentConfig.ui.showTierBadges = safeGetChecked('ui-tier-badges');
  currentConfig.ui.priceRefreshSec = parseInt(safeGetValue('ui-refresh')) || 30;

  // Alerts
  currentConfig.alerts = currentConfig.alerts || {};
  currentConfig.alerts.enabled = safeGetChecked('alerts-enabled');

  if (saveConfig) {
    await saveConfig(currentConfig);
    console.log('[Settings] Settings saved');
  }

  showToast('Settings saved!');
}

function parseTextarea(id) {
  const text = safeGetValue(id);
  return text
    .split('\n')
    .map(s => s.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

// === HELPER FUNCTIONS ===
function safeSetChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function safeGetChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function safeGetValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function addToTier2(handle) {
  currentConfig.tiers = currentConfig.tiers || {};
  currentConfig.tiers.tier2 = currentConfig.tiers.tier2 || [];

  const normalized = handle.toLowerCase().replace(/^@/, '');
  if (!currentConfig.tiers.tier2.includes(normalized)) {
    currentConfig.tiers.tier2.push(normalized);
    safeSetValue('tier2-accounts', currentConfig.tiers.tier2.join('\n'));
  }
}

function addTicker(ticker) {
  currentConfig.watchlist = currentConfig.watchlist || [];
  const normalized = ticker.toUpperCase().replace(/^\$/, '');

  if (!/^[A-Z]{1,10}$/.test(normalized)) return false;

  if (!currentConfig.watchlist.includes(normalized)) {
    currentConfig.watchlist.push(normalized);
    renderWatchlist();
    return true;
  }
  return false;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');
  if (!toast || !messageEl) return;

  messageEl.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// === EVENT LISTENERS ===
function setupEventListeners() {
  console.log('[Settings] Setting up event listeners...');

  // Save all
  const saveBtn = document.getElementById('save-all');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // Add ticker
  const addTickerBtn = document.getElementById('add-ticker-btn');
  if (addTickerBtn) {
    addTickerBtn.addEventListener('click', () => {
      const input = document.getElementById('add-ticker-input');
      if (input && addTicker(input.value)) {
        showToast(`Added $${input.value.toUpperCase()}`);
        input.value = '';
      }
    });
  }

  const addTickerInput = document.getElementById('add-ticker-input');
  if (addTickerInput) {
    addTickerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = document.getElementById('add-ticker-btn');
        if (btn) btn.click();
      }
    });
  }

  // Quick tickers
  document.querySelectorAll('.quick-ticker').forEach(btn => {
    btn.addEventListener('click', () => {
      const ticker = btn.dataset.ticker;
      if (addTicker(ticker)) {
        showToast(`Added $${ticker}`);
      }
    });
  });

  // Follow all
  const followAllBtn = document.getElementById('follow-all-btn');
  if (followAllBtn && getAllSuggestedHandles) {
    followAllBtn.addEventListener('click', () => {
      const handles = getAllSuggestedHandles();
      alert(`This will open ${handles.length} tabs to follow accounts.\n\nClick OK to proceed.`);

      handles.slice(0, 10).forEach((handle, i) => {
        setTimeout(() => {
          window.open(`https://x.com/${handle}`, '_blank');
        }, i * 500);
      });

      showToast('Opening first 10 accounts...');
    });
  }

  // Add all to Tier 2
  const addAllTier2Btn = document.getElementById('add-all-tier2-btn');
  if (addAllTier2Btn && getAllSuggestedHandles) {
    addAllTier2Btn.addEventListener('click', () => {
      const handles = getAllSuggestedHandles();
      handles.forEach(handle => addToTier2(handle));
      showToast(`Added ${handles.length} accounts to Tier 2`);
    });
  }

  // Export
  const exportBtn = document.getElementById('export-settings');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'traderx-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported!');
    });
  }

  // Import
  const importBtn = document.getElementById('import-settings');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        currentConfig = imported;
        if (saveConfig) await saveConfig(currentConfig);
        location.reload();
      } catch (err) {
        alert('Invalid settings file');
      }
    });
  }

  // Reset
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset ALL settings? This cannot be undone.')) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.clear();
        }
        location.reload();
      }
    });
  }

  console.log('[Settings] Event listeners setup complete');
}

// Initialize
console.log('[Settings] Script loaded, waiting for DOM...');

function safeInit() {
  try {
    console.log('[Settings] safeInit running...');
    init();
    console.log('[Settings] safeInit completed successfully');
  } catch (error) {
    console.error('[Settings] Init failed with error:', error);
    // Still try to setup navigation even if other things fail
    try {
      setupNavigation();
      console.log('[Settings] Navigation setup completed (fallback)');
    } catch (navError) {
      console.error('[Settings] Navigation setup also failed:', navError);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
  console.log('[Settings] Waiting for DOMContentLoaded...');
} else {
  // DOM already loaded
  console.log('[Settings] DOM already ready, calling safeInit...');
  safeInit();
}
