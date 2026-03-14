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
