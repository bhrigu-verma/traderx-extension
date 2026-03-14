// === TRADERX BACKGROUND SERVICE WORKER ===
// Handles price fetching, notifications, and alert storage

// === ALERT HISTORY ===
let alertHistory = [];
const MAX_ALERT_HISTORY = 500;

// === INITIALIZATION ===
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[TraderX BG] Extension installed:', details.reason);

    if (details.reason === 'install') {
        // Open settings on first install
        chrome.tabs.create({ url: 'settings/settings.html' });
    }

    // Initialize storage
    chrome.storage.local.get(['alertHistory'], (result) => {
        alertHistory = result.alertHistory || [];
    });
});

// === MESSAGE HANDLERS ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[TraderX BG] Message received:', message.action || message.type);

    // Handle both action and type for compatibility
    const messageType = message.action || message.type;

    switch (messageType) {
        case 'FETCH_STOCK_PRICE':
            fetchSingleStockPrice(message.ticker)
                .then(data => sendResponse({ data }))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'FETCH_CRYPTO_PRICE':
            fetchCryptoPrice(message.coinId)
                .then(data => sendResponse({ data }))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'fetchQuotes':
            fetchQuotes(message.tickers)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ error: error.message }));
            return true; // Keep message channel open for async response

        case 'triggerAlert':
            handleAlert(message.alert)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'getAlertHistory':
            sendResponse({ history: alertHistory });
            return false;

        case 'clearAlertHistory':
            alertHistory = [];
            chrome.storage.local.set({ alertHistory: [] });
            sendResponse({ success: true });
            return false;

        case 'openSettings':
            chrome.runtime.openOptionsPage();
            sendResponse({ success: true });
            return false;
    }
});

// === SINGLE STOCK PRICE FETCH (for PriceFetcher) ===
async function fetchSingleStockPrice(ticker) {
    try {
        // Fetch 5 days to ensure we get accurate previous close
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[TraderX BG] Fetched ${ticker}:`, {
            price: data.chart?.result?.[0]?.meta?.regularMarketPrice,
            prevClose: data.chart?.result?.[0]?.meta?.previousClose,
            chartPrevClose: data.chart?.result?.[0]?.meta?.chartPreviousClose
        });

        return data;
    } catch (error) {
        console.error(`[TraderX BG] Stock price fetch error for ${ticker}:`, error);
        throw error;
    }
}

// === SINGLE CRYPTO PRICE FETCH (for PriceFetcher - CORS bypass) ===
async function fetchCryptoPrice(coinId) {
    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`CoinGecko HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[TraderX BG] Fetched crypto ${coinId}:`, data);
        return data;
    } catch (error) {
        console.error(`[TraderX BG] Crypto price fetch error for ${coinId}:`, error);
        throw error;
    }
}

// === YAHOO FINANCE API (v8 Chart - No Auth Required) ===
async function fetchQuotes(tickers) {
    if (!tickers || tickers.length === 0) {
        return { quotes: {}, error: 'No tickers provided' };
    }

    console.log('[TraderX BG] Fetching quotes for:', tickers.join(', '));

    const quotes = {};

    // Fetch each ticker using the v8 chart API (no auth required)
    const fetchPromises = tickers.map(async (ticker) => {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[TraderX BG] Error for ${ticker}: HTTP ${response.status}`);
                quotes[ticker] = { price: 0, change: 0, ok: false };
                return;
            }

            const data = await response.json();

            if (data.chart?.result?.[0]) {
                const meta = data.chart.result[0].meta;

                const price = meta.regularMarketPrice || 0;
                const prevClose = meta.previousClose || meta.chartPreviousClose || price;
                const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

                quotes[ticker] = {
                    price: price,
                    change: change,
                    volume: meta.regularMarketVolume || 0,
                    name: meta.shortName || ticker,
                    ok: true
                };
            } else {
                quotes[ticker] = { price: 0, change: 0, ok: false };
            }
        } catch (error) {
            console.error(`[TraderX BG] Error fetching ${ticker}:`, error.message);
            quotes[ticker] = { price: 0, change: 0, ok: false };
        }
    });

    await Promise.all(fetchPromises);

    const okCount = Object.values(quotes).filter(q => q.ok).length;
    console.log(`[TraderX BG] Fetched ${okCount}/${tickers.length} quotes`);

    return { quotes, error: okCount === 0 ? 'Failed to fetch prices' : null };
}

// === ALERT HANDLING ===
async function handleAlert(alert) {
    console.log('[TraderX BG] Alert triggered:', alert.name);

    // Add to history
    alertHistory.unshift({
        ...alert,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });

    // Trim to max size
    if (alertHistory.length > MAX_ALERT_HISTORY) {
        alertHistory = alertHistory.slice(0, MAX_ALERT_HISTORY);
    }

    // Save to storage
    chrome.storage.local.set({ alertHistory });

    // Get config for notification settings
    const config = await getConfig();

    if (config.alerts?.enabled !== false) {
        // Send browser notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: `⚡ TraderX: ${alert.name}`,
            message: `@${alert.author}: ${alert.text}`,
            priority: 2
        });
    }

    return true;
}

// === CONFIG HELPER ===
async function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['config'], (result) => {
            resolve(result.config || {});
        });
    });
}

// === NOTIFICATION CLICK HANDLER ===
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open X.com when notification clicked
    chrome.tabs.create({ url: 'https://x.com' });
});

console.log('[TraderX BG] Service worker loaded');
