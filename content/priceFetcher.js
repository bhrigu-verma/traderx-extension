// ============================================================================
// TRADERX PRICE FETCHER - Real-time Market Data
// ============================================================================
// Fetches live prices from CoinGecko (crypto) and Yahoo Finance (stocks)
// No API keys required - uses public endpoints
// ============================================================================

class PriceFetcher {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 30000; // 30 seconds cache

        // Mapping of tickers to CoinGecko IDs
        this.cryptoIds = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'DOGE': 'dogecoin',
            'SOL': 'solana',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'AVAX': 'avalanche-2',
            'DOT': 'polkadot',
            'MATIC': 'matic-network',
            'LINK': 'chainlink',
            'ATOM': 'cosmos',
            'LTC': 'litecoin',
            'UNI': 'uniswap',
            'SHIB': 'shiba-inu',
            'PEPE': 'pepe',
            'ARB': 'arbitrum',
            'OP': 'optimism',
            'APT': 'aptos',
            'NEAR': 'near',
            'FTM': 'fantom',
            'INJ': 'injective-protocol',
            'SUI': 'sui',
            'SEI': 'sei-network',
            'TIA': 'celestia',
            'JUP': 'jupiter-exchange-solana',
            'WIF': 'dogwifcoin',
            'BONK': 'bonk',
            'RENDER': 'render-token',
            'FET': 'fetch-ai',
            'TAO': 'bittensor',
            'RNDR': 'render-token',
            'GRT': 'the-graph',
            'IMX': 'immutable-x',
            'STX': 'stacks',
            'MINA': 'mina-protocol',
            'AAVE': 'aave',
            'MKR': 'maker',
            'CRV': 'curve-dao-token',
            'SNX': 'synthetix-network-token',
            'LDO': 'lido-dao',
            'RPL': 'rocket-pool',
            'ENS': 'ethereum-name-service',
            'BLUR': 'blur',
            'SAND': 'the-sandbox',
            'MANA': 'decentraland',
            'AXS': 'axie-infinity',
            'APE': 'apecoin',
        };

        // Known stock tickers (will use Yahoo Finance)
        this.stockTickers = new Set([
            'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA',
            'BRK.A', 'BRK.B', 'UNH', 'JNJ', 'V', 'XOM', 'JPM', 'WMT', 'PG',
            'MA', 'HD', 'CVX', 'LLY', 'MRK', 'ABBV', 'PEP', 'KO', 'COST',
            'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT', 'DHR', 'WFC', 'NEE',
            'DIS', 'VZ', 'ADBE', 'PM', 'TXN', 'CRM', 'RTX', 'NKE', 'CMCSA',
            'AMD', 'BMY', 'INTC', 'NFLX', 'COP', 'UPS', 'MS', 'T', 'QCOM',
            'GS', 'BA', 'CAT', 'IBM', 'GE', 'DE', 'SBUX', 'PFE', 'LOW', 'BLK',
            'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO', 'ARKK', 'XLF', 'XLE',
            'COIN', 'MSTR', 'SQ', 'PYPL', 'HOOD', 'PLTR', 'SNOW', 'NET',
            'UBER', 'ABNB', 'DASH', 'RBLX', 'U', 'DKNG', 'RIVN', 'LCID',
            'SOFI', 'AFRM', 'UPST', 'ZM', 'DOCU', 'OKTA', 'CRWD', 'ZS',
            'DDOG', 'MDB', 'SHOP', 'SE', 'MELI', 'NU', 'BABA', 'JD', 'PDD',
            'NIO', 'XPEV', 'LI', 'BIDU', 'TCEHY', 'TME', 'BILI', 'IQ'
        ]);
    }

    // ========================================================================
    // MAIN FETCH METHOD
    // ========================================================================

    async getPrice(ticker) {
        const normalizedTicker = ticker.toUpperCase().replace('$', '');

        // Check cache
        const cached = this.cache.get(normalizedTicker);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        let result;

        // Determine if crypto or stock
        if (this.cryptoIds[normalizedTicker]) {
            result = await this.fetchCryptoPrice(normalizedTicker);
        } else if (this.stockTickers.has(normalizedTicker)) {
            result = await this.fetchStockPrice(normalizedTicker);
        } else {
            // Try crypto first (more common in trading X), fallback to stock
            result = await this.fetchCryptoPrice(normalizedTicker);
            if (!result.price) {
                result = await this.fetchStockPrice(normalizedTicker);
            }
        }

        // Cache result
        this.cache.set(normalizedTicker, {
            data: result,
            timestamp: Date.now()
        });

        return result;
    }

    // ========================================================================
    // COINGECKO API (Crypto)
    // ========================================================================

    async fetchCryptoPrice(ticker) {
        const coinId = this.cryptoIds[ticker] || ticker.toLowerCase();

        try {
            // Use background script to bypass CORS
            const response = await chrome.runtime.sendMessage({
                type: 'FETCH_CRYPTO_PRICE',
                coinId: coinId,
                ticker: ticker
            });

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.data || !response.data[coinId]) {
                return { price: null, change24h: null, volume24h: null, type: 'crypto', error: 'Not found' };
            }

            const coinData = response.data[coinId];

            return {
                price: coinData.usd,
                change24h: coinData.usd_24h_change,
                volume24h: coinData.usd_24h_vol,
                type: 'crypto',
                ticker: ticker
            };
        } catch (error) {
            console.error(`[PriceFetcher] CoinGecko error for ${ticker}:`, error);
            return { price: null, change24h: null, type: 'crypto', error: error.message };
        }
    }

    // ========================================================================
    // YAHOO FINANCE (Stocks) - Using background script for CORS bypass
    // ========================================================================

    async fetchStockPrice(ticker) {
        try {
            // Use background script to bypass CORS
            const response = await chrome.runtime.sendMessage({
                type: 'FETCH_STOCK_PRICE',
                ticker: ticker
            });

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.data) {
                return { price: null, change24h: null, type: 'stock', error: 'No data' };
            }

            const data = response.data;
            const result = data.chart?.result?.[0];

            if (!result) {
                return { price: null, change24h: null, type: 'stock', error: 'Not found' };
            }

            const meta = result.meta;
            const price = meta.regularMarketPrice;

            // Use previousClose (official previous day close) instead of chartPreviousClose
            // previousClose is more accurate for % change calculation
            const prevClose = meta.previousClose || meta.chartPreviousClose;

            // Calculate change
            let change24h = null;
            if (prevClose && prevClose > 0) {
                change24h = ((price - prevClose) / prevClose) * 100;
            }

            const volume = meta.regularMarketVolume;

            console.log(`[PriceFetcher] ${ticker}:`, {
                price,
                prevClose,
                change24h: change24h?.toFixed(2) + '%',
                source: meta.previousClose ? 'previousClose' : 'chartPreviousClose'
            });

            return {
                price: price,
                change24h: change24h,
                volume24h: volume,
                type: 'stock',
                ticker: ticker,
                marketState: meta.marketState // 'REGULAR', 'PRE', 'POST', 'CLOSED'
            };
        } catch (error) {
            console.error(`[PriceFetcher] Yahoo error for ${ticker}:`, error);
            return { price: null, change24h: null, type: 'stock', error: error.message };
        }
    }

    // ========================================================================
    // BATCH FETCH (Multiple tickers at once)
    // ========================================================================

    async getPrices(tickers) {
        const results = {};

        // Separate crypto and stocks
        const crypto = [];
        const stocks = [];

        tickers.forEach(ticker => {
            const normalized = ticker.toUpperCase().replace('$', '');
            if (this.cryptoIds[normalized]) {
                crypto.push(normalized);
            } else {
                stocks.push(normalized);
            }
        });

        // Batch fetch crypto from CoinGecko
        if (crypto.length > 0) {
            try {
                const ids = crypto.map(t => this.cryptoIds[t] || t.toLowerCase()).join(',');
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
                    { cache: 'no-store' }
                );
                const data = await response.json();

                crypto.forEach(ticker => {
                    const coinId = this.cryptoIds[ticker] || ticker.toLowerCase();
                    const coinData = data[coinId];
                    results[ticker] = coinData ? {
                        price: coinData.usd,
                        change24h: coinData.usd_24h_change,
                        type: 'crypto',
                        ticker
                    } : { price: null, type: 'crypto', ticker };
                });
            } catch (e) {
                crypto.forEach(t => results[t] = { price: null, type: 'crypto', error: e.message });
            }
        }

        // Fetch stocks individually (Yahoo doesn't support batch well)
        for (const ticker of stocks) {
            results[ticker] = await this.fetchStockPrice(ticker);
        }

        return results;
    }

    // ========================================================================
    // UTILITY: Format price display
    // ========================================================================

    formatPrice(price, type = 'stock') {
        if (price === null || price === undefined) return '--';

        if (type === 'crypto') {
            if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            if (price >= 1) return `$${price.toFixed(2)}`;
            if (price >= 0.01) return `$${price.toFixed(4)}`;
            return `$${price.toFixed(6)}`;
        }

        return `$${price.toFixed(2)}`;
    }

    formatChange(change) {
        if (change === null || change === undefined) return '--';
        const prefix = change >= 0 ? '+' : '';
        return `${prefix}${change.toFixed(2)}%`;
    }

    getChangeColor(change) {
        if (change === null || change === undefined) return '#94A3B8'; // gray
        return change >= 0 ? '#10B981' : '#EF4444'; // green / red
    }
}

// Singleton
window.TraderXPriceFetcher = window.TraderXPriceFetcher || new PriceFetcher();
console.log('[TraderX] PriceFetcher v1.0 loaded');
