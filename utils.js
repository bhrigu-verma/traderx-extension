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
