// ============================================================================
// TRADERX PRO — Constants & Default Configuration
// ============================================================================

export const EXTENSION_VERSION = "3.0.0";
export const EXTENSION_NAME = "TraderX Pro";

// ============================================================================
// DEFAULT CONFIG (used by popup, content scripts, settings)
// ============================================================================

export const DEFAULT_CONFIG = {
  version: EXTENSION_VERSION,

  // Core feature toggles
  filters: {
    enableSpamFilter: true,
    enableWatchlistHighlight: true,
    enableTierColors: true,
    enableTimeSensitive: true,
    hideEngagementBait: true,
    hidePromoContent: true,
    hideLowEffort: true,
    hideCryptoScams: true,
  },

  // UI preferences
  ui: {
    showSidebar: true,
    showDashboard: true,
    dashboardPosition: { x: null, y: null },
    theme: "dark",
  },

  // Watchlist (tickers the user tracks)
  watchlist: ["BTC", "ETH", "TSLA", "NVDA", "SPY"],

  // Combo alert rules (enabled by default)
  alerts: {
    enabled: true,
    comboAlerts: true,
    priceAlerts: true,
  },

  // Influencer tiers (custom additions per user)
  tiers: {
    tier1: [],
    tier2: [],
    tier3: [],
  },

  // Trusted mode (show only verified accounts in feed)
  trustedMode: false,

  // Backend sync
  backend: {
    enabled: true,
    url: "http://localhost:3001",
    // API key pulled from storage — never hardcoded here
  },

  // Stats counters
  stats: {
    totalFiltered: 0,
    alertsFired: 0,
    watchlistMentions: 0,
    lastResetDate: null,
  },

  // Debug
  debugMode: false,
};

// ============================================================================
// SENTIMENT THRESHOLDS
// ============================================================================

export const SENTIMENT = {
  VERY_BULLISH: 0.3,
  BULLISH: 0.15,
  BEARISH: -0.15,
  VERY_BEARISH: -0.3,

  STATUS_LABELS: {
    VERY_BULLISH: "VERY BULLISH",
    BULLISH: "BULLISH",
    NEUTRAL: "NEUTRAL",
    BEARISH: "BEARISH",
    VERY_BEARISH: "VERY BEARISH",
    VOLATILE: "VOLATILE",
    LOW_DATA: "LOW DATA",
    NO_DATA: "NO DATA",
  },

  CONFIDENCE: {
    HIGH: 25, // min tweets for high confidence
    MEDIUM: 10, // min tweets for medium confidence
    LOW: 5, // min tweets for low confidence
  },
};

// ============================================================================
// INFLUENCER TIER WEIGHTS
// ============================================================================

export const TIER_WEIGHTS = {
  tier1: 3.0,
  tier2: 2.0,
  tier3: 1.5,
  default: 1.0,
};

// ============================================================================
// SPAM FILTER PATTERNS
// ============================================================================

export const SPAM_PATTERNS = {
  // Engagement bait
  engagementBait: [
    /agree\?$/i,
    /thoughts\?$/i,
    /what do you think\?$/i,
    /your take\?$/i,
    /tag someone who/i,
    /retweet if/i,
    /like if you/i,
    /follow for more/i,
    /follow me for/i,
    /dm me/i,
    /dm for/i,
    /link in bio/i,
    /check my bio/i,
  ],

  // Crypto scam signals
  cryptoScam: [
    /guaranteed (profit|return|gain)/i,
    /\d{3,}x (profit|return|gain)/i,
    /free (btc|eth|crypto|money|signal)/i,
    /airdrop.*claim/i,
    /whitelist.*spot/i,
    /presale.*now/i,
    /limited.*spots/i,
    /signal.*group/i,
    /vip.*signal/i,
    /paid.*signal/i,
    /t\.me\//i,
  ],

  // Promotional spam
  promotional: [
    /sponsor(ed)?/i,
    /partner(ed|ship)?/i,
    /affiliate/i,
    /promo code/i,
    /discount/i,
    /buy now/i,
    /click here/i,
  ],
};

// ============================================================================
// BULLISH / BEARISH KEYWORD BANKS (used by content.js sentiment)
// ============================================================================

export const BULLISH_WORDS = [
  "moon",
  "mooning",
  "breakout",
  "bullish",
  "pump",
  "rally",
  "surge",
  "soar",
  "ath",
  "all time high",
  "new high",
  "bullrun",
  "bull run",
  "parabolic",
  "explosion",
  "exploding",
  "skyrocket",
  "buy",
  "buying",
  "long",
  "longing",
  "accumulate",
  "accumulation",
  "load up",
  "undervalued",
  "oversold",
  "dip",
  "support",
  "holding",
  "hodl",
  "green",
  "gains",
  "profit",
  "up",
  "bullish divergence",
  "golden cross",
  "higher low",
  "higher high",
  "recovery",
  "recovering",
  "rebound",
  "reversal",
  "uptrend",
  "breakout",
];

export const BEARISH_WORDS = [
  "crash",
  "crashed",
  "crashing",
  "dump",
  "dumping",
  "plunge",
  "plummeting",
  "collapse",
  "bearish",
  "selloff",
  "sell-off",
  "capitulation",
  "liquidation",
  "liquidated",
  "rekt",
  "wrecked",
  "destroyed",
  "sell",
  "selling",
  "short",
  "shorting",
  "overbought",
  "overvalued",
  "resistance",
  "breakdown",
  "break down",
  "breaking down",
  "red",
  "loss",
  "losses",
  "down",
  "bearish divergence",
  "death cross",
  "lower high",
  "lower low",
  "rejection",
  "downtrend",
];

export const NEGATION_WORDS = [
  "not",
  "don't",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "can't",
  "never",
  "no",
  "without",
  "barely",
  "hardly",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "hasn't",
  "haven't",
  "hadn't",
  "shouldn't",
];

export const NEGATION_WINDOW = 4;

// ============================================================================
// COMMON TICKERS (fast-path extraction)
// ============================================================================

export const COMMON_TICKERS = new Set([
  // Crypto majors
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "MATIC",
  "DOT",
  "LINK",
  "BNB",
  "LTC",
  "UNI",
  "SHIB",
  "PEPE",
  "ARB",
  "OP",
  "APT",
  "NEAR",
  "FTM",
  "INJ",
  "SUI",
  "SEI",
  "TIA",
  "JUP",
  "WIF",
  "BONK",
  "RENDER",
  "FET",
  "TAO",
  "AAVE",
  "MKR",
  "CRV",
  "SNX",
  "LDO",
  "RPL",
  "ENS",
  "GRT",
  "IMX",
  "STX",
  // Large cap stocks
  "AAPL",
  "MSFT",
  "GOOGL",
  "GOOG",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "BRK",
  "JPM",
  "V",
  "JNJ",
  "WMT",
  "PG",
  "MA",
  "HD",
  "CVX",
  "LLY",
  "MRK",
  "ABBV",
  "PEP",
  "KO",
  "COST",
  "AVGO",
  "MCD",
  "CSCO",
  "CRM",
  "ADBE",
  "AMD",
  "INTC",
  "NFLX",
  "QCOM",
  "GS",
  "BA",
  "IBM",
  "GE",
  "SBUX",
  "PFE",
  "BLK",
  // ETFs / Macro
  "SPY",
  "QQQ",
  "DIA",
  "IWM",
  "VTI",
  "VOO",
  "ARKK",
  "XLF",
  "XLE",
  "TLT",
  "VIX",
  "DXY",
  "GLD",
  "SLV",
  "USO",
  // High momentum / popular
  "COIN",
  "MSTR",
  "SQ",
  "PYPL",
  "HOOD",
  "PLTR",
  "SNOW",
  "NET",
  "UBER",
  "ABNB",
  "DASH",
  "RIVN",
  "LCID",
  "SOFI",
  "AFRM",
  "UPST",
  "CRWD",
  "ZS",
  "DDOG",
  "SHOP",
  "MARA",
  "RIOT",
  "CLSK",
  "NIO",
  "XPEV",
  "GME",
  "AMC",
]);

// Crypto name → ticker mapping
export const CRYPTO_NAMES = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  ripple: "XRP",
  dogecoin: "DOGE",
  cardano: "ADA",
  avalanche: "AVAX",
  polygon: "MATIC",
  polkadot: "DOT",
  chainlink: "LINK",
  binance: "BNB",
  litecoin: "LTC",
  uniswap: "UNI",
  shiba: "SHIB",
  arbitrum: "ARB",
  optimism: "OP",
  aptos: "APT",
  cosmos: "ATOM",
  fantom: "FTM",
  injective: "INJ",
  celestia: "TIA",
  bittensor: "TAO",
  render: "RENDER",
  pepe: "PEPE",
};

// ============================================================================
// SECTOR MAP (for heatmap + sector aggregation)
// ============================================================================

export const SECTOR_MAP = {
  // Crypto
  BTC: "Crypto",
  ETH: "Crypto",
  SOL: "Crypto",
  XRP: "Crypto",
  DOGE: "Crypto",
  ADA: "Crypto",
  AVAX: "Crypto",
  MATIC: "Crypto",
  DOT: "Crypto",
  LINK: "Crypto",
  BNB: "Crypto",
  SHIB: "Crypto",
  PEPE: "Crypto",
  ARB: "Crypto",
  OP: "Crypto",
  INJ: "Crypto",
  // AI / Tech
  NVDA: "AI/Tech",
  AMD: "AI/Tech",
  INTC: "AI/Tech",
  AVGO: "AI/Tech",
  MSFT: "AI/Tech",
  GOOGL: "AI/Tech",
  GOOG: "AI/Tech",
  META: "AI/Tech",
  AAPL: "AI/Tech",
  AMZN: "AI/Tech",
  PLTR: "AI/Tech",
  SNOW: "AI/Tech",
  NET: "AI/Tech",
  CRWD: "AI/Tech",
  ZS: "AI/Tech",
  DDOG: "AI/Tech",
  // EV / Auto
  TSLA: "EV/Auto",
  RIVN: "EV/Auto",
  LCID: "EV/Auto",
  NIO: "EV/Auto",
  XPEV: "EV/Auto",
  // Finance / Fintech
  V: "Finance",
  MA: "Finance",
  JPM: "Finance",
  GS: "Finance",
  COIN: "Finance",
  HOOD: "Finance",
  SOFI: "Finance",
  SQ: "Finance",
  PYPL: "Finance",
  MSTR: "Finance",
  XLF: "Finance",
  // Crypto mining
  MARA: "Crypto Mining",
  RIOT: "Crypto Mining",
  CLSK: "Crypto Mining",
  // ETF / Macro
  SPY: "ETF/Macro",
  QQQ: "ETF/Macro",
  DIA: "ETF/Macro",
  IWM: "ETF/Macro",
  TLT: "ETF/Macro",
  VIX: "ETF/Macro",
  DXY: "ETF/Macro",
  // Commodities
  GLD: "Commodities",
  SLV: "Commodities",
  USO: "Commodities",
  XOM: "Commodities",
  CVX: "Commodities",
  // Meme / Speculative
  GME: "Meme/Spec",
  AMC: "Meme/Spec",
};

// ============================================================================
// STORAGE KEYS (single source of truth for chrome.storage keys)
// ============================================================================

export const STORAGE_KEYS = {
  config: "traderx_config",
  alertHistory: "traderx_alert_history",
  sentimentHistory: "traderx_sentiment_history",
  volumeHistory: "traderx_volume_history",
  portfolio: "traderx_portfolio",
  comboAlerts: "traderx_combo_alerts",
  apiKey: "traderx_api_key",
  backendUrl: "traderx_backend_url",
};

// ============================================================================
// SMART MODES (preset filter configurations)
// ============================================================================

export const SMART_MODES = {
  signal: {
    name: "Signal Mode",
    description: "Trusted accounts only, all spam filtered",
    settings: {
      filters: {
        enableSpamFilter: true,
        enableWatchlistHighlight: true,
        enableTierColors: true,
        enableTimeSensitive: true,
        hideEngagementBait: true,
        hidePromoContent: true,
        hideLowEffort: true,
        hideCryptoScams: true,
      },
      trustedMode: true,
    },
  },
  research: {
    name: "Research Mode",
    description: "Maximum coverage, minimal filtering",
    settings: {
      filters: {
        enableSpamFilter: false,
        enableWatchlistHighlight: true,
        enableTierColors: true,
        enableTimeSensitive: false,
        hideEngagementBait: false,
        hidePromoContent: true,
        hideLowEffort: false,
        hideCryptoScams: true,
      },
      trustedMode: false,
    },
  },
  focus: {
    name: "Focus Mode",
    description: "Watchlist mentions only, strong spam filter",
    settings: {
      filters: {
        enableSpamFilter: true,
        enableWatchlistHighlight: true,
        enableTierColors: true,
        enableTimeSensitive: true,
        hideEngagementBait: true,
        hidePromoContent: true,
        hideLowEffort: true,
        hideCryptoScams: true,
      },
      trustedMode: false,
    },
  },
  custom: {
    name: "Custom",
    description: "Your own settings",
    settings: {},
  },
};

// ============================================================================
// ALERT TYPES (for UI dropdowns / documentation)
// ============================================================================

export const ALERT_TYPES = {
  divergence: {
    label: "Divergence",
    description: "Sentiment and price moving in opposite directions",
    icon: "🚨",
    priority: "high",
  },
  influencer_burst: {
    label: "Influencer Burst",
    description: "Multiple trusted accounts tweet same ticker rapidly",
    icon: "👤",
    priority: "critical",
  },
  sentiment_flip: {
    label: "Sentiment Flip",
    description: "Ticker flips from BULLISH to BEARISH or vice versa",
    icon: "🔄",
    priority: "medium",
  },
  volume_sentiment: {
    label: "Volume + Sentiment",
    description: "Volume spike AND strong directional sentiment",
    icon: "⚡",
    priority: "high",
  },
  sentiment_threshold: {
    label: "Sentiment Threshold",
    description: "Sentiment crosses a user-defined level",
    icon: "📊",
    priority: "medium",
  },
  price_change: {
    label: "Price Change",
    description: "Price moves by a specified percentage",
    icon: "💰",
    priority: "medium",
  },
};

// ============================================================================
// UI STRINGS
// ============================================================================

export const UI_STRINGS = {
  loadingText: "Syncing intelligence...",
  noDataText: "Insufficient data",
  errorText: "Error fetching data",
  trustedBadgeText: "Trusted",
  watchlistEmptyText: "Add tickers to track them here",
};

// ============================================================================
// MARKET HOURS (Eastern Time)
// ============================================================================

export const MARKET_HOURS = {
  preMarketOpen: 4, // 4:00 AM ET
  regularOpen: 9.5, // 9:30 AM ET
  regularClose: 16, // 4:00 PM ET
  afterHoursClose: 20, // 8:00 PM ET
};

export const MARKET_STATUS_LABELS = {
  preMarket: "🌅 Pre-Market",
  open: "📈 Market Open",
  afterHours: "🌙 After Hours",
  closed: "😴 Closed",
  weekend: "😴 Weekend",
};
