// ============================================================================
// TRADERX SECTOR HEATMAP v1.0 — Aggregate Sentiment by Sector
// ============================================================================
// Groups tracked tickers by sector and shows aggregate sentiment per sector.
// Useful for macro rotation trades — quickly see which sectors are hot/cold.
// ============================================================================

class SectorHeatmap {
    constructor() {
        // Sector classification for common tickers
        this.sectorMap = {
            // Tech
            'AAPL': 'Tech', 'MSFT': 'Tech', 'GOOGL': 'Tech', 'GOOG': 'Tech',
            'META': 'Tech', 'AMZN': 'Tech', 'NVDA': 'Tech', 'AMD': 'Tech',
            'INTC': 'Tech', 'TSM': 'Tech', 'AVGO': 'Tech', 'CRM': 'Tech',
            'ORCL': 'Tech', 'ADBE': 'Tech', 'PLTR': 'Tech', 'SNOW': 'Tech',

            // EV / Auto
            'TSLA': 'EV/Auto', 'RIVN': 'EV/Auto', 'LCID': 'EV/Auto',
            'NIO': 'EV/Auto', 'F': 'EV/Auto', 'GM': 'EV/Auto',

            // Fintech / Finance
            'SOFI': 'Finance', 'COIN': 'Finance', 'HOOD': 'Finance',
            'SQ': 'Finance', 'PYPL': 'Finance', 'V': 'Finance',
            'MA': 'Finance', 'JPM': 'Finance', 'GS': 'Finance',
            'XLF': 'Finance',

            // Crypto
            'BTC': 'Crypto', 'ETH': 'Crypto', 'SOL': 'Crypto',
            'XRP': 'Crypto', 'DOGE': 'Crypto', 'ADA': 'Crypto',
            'AVAX': 'Crypto', 'MATIC': 'Crypto', 'DOT': 'Crypto',
            'LINK': 'Crypto', 'MARA': 'Crypto', 'RIOT': 'Crypto',

            // Meme / Speculative
            'GME': 'Meme/Spec', 'AMC': 'Meme/Spec', 'BBBY': 'Meme/Spec',

            // Commodities / Energy
            'GLD': 'Commodities', 'SLV': 'Commodities', 'USO': 'Commodities',
            'UNG': 'Commodities', 'XOM': 'Commodities', 'CVX': 'Commodities',

            // ETF / Macro
            'SPY': 'ETF/Macro', 'QQQ': 'ETF/Macro', 'DIA': 'ETF/Macro',
            'IWM': 'ETF/Macro', 'TLT': 'ETF/Macro', 'VIX': 'ETF/Macro',
            'DXY': 'ETF/Macro',

            // Forex
            'EURUSD': 'Forex', 'GBPUSD': 'Forex', 'USDJPY': 'Forex'
        };

        this.element = null;
    }

    getSector(ticker) {
        return this.sectorMap[ticker.toUpperCase()] || 'Other';
    }

    // ========================================================================
    // COMPUTE SECTOR AGGREGATES
    // ========================================================================

    computeSectorData() {
        const dashboard = window.TraderXTrackerDashboard;
        if (!dashboard) return {};

        const sectors = {};

        for (const ticker of dashboard.tickers) {
            const data = dashboard.cardData[ticker];
            if (!data || data.status === 'LOADING') continue;

            const sector = this.getSector(ticker);

            if (!sectors[sector]) {
                sectors[sector] = {
                    tickers: [],
                    totalSentiment: 0,
                    totalWeight: 0,
                    bullishCount: 0,
                    bearishCount: 0,
                    neutralCount: 0,
                    sampleSize: 0
                };
            }

            const s = sectors[sector];
            s.tickers.push(ticker);
            s.totalSentiment += data.sentiment || 0;
            s.totalWeight += 1;
            s.bullishCount += data.bullishCount || 0;
            s.bearishCount += data.bearishCount || 0;
            s.neutralCount += data.neutralCount || 0;
            s.sampleSize += data.sampleSize || 0;
        }

        // Compute averages
        Object.values(sectors).forEach(s => {
            s.avgSentiment = s.totalWeight > 0 ? s.totalSentiment / s.totalWeight : 0;
            s.label = s.avgSentiment > 0.15 ? 'BULLISH' :
                s.avgSentiment < -0.15 ? 'BEARISH' : 'NEUTRAL';
        });

        return sectors;
    }

    // ========================================================================
    // UI — Heatmap Modal
    // ========================================================================

    show() {
        const existing = document.getElementById('traderx-heatmap-modal');
        if (existing) existing.remove();

        const sectors = this.computeSectorData();
        const sectorEntries = Object.entries(sectors).sort((a, b) => b[1].avgSentiment - a[1].avgSentiment);

        const modal = document.createElement('div');
        modal.id = 'traderx-heatmap-modal';
        modal.innerHTML = `
            <style>
                #traderx-heatmap-modal {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
                    z-index: 100000; display: flex; align-items: center; justify-content: center;
                    font-family: 'Inter', -apple-system, sans-serif; color: #F2F6F8;
                    animation: hmFadeIn 0.2s ease;
                }
                @keyframes hmFadeIn { from { opacity: 0; } to { opacity: 1; } }
                .hm-content {
                    background: #141820; border: 1px solid rgba(242,246,248,0.08);
                    border-radius: 16px; width: 90%; max-width: 700px; max-height: 85vh;
                    overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }
                .hm-header {
                    padding: 20px 24px; border-bottom: 1px solid rgba(242,246,248,0.06);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .hm-title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
                .hm-close {
                    background: transparent; border: none; color: #94A3B8;
                    font-size: 24px; cursor: pointer; padding: 4px 8px;
                    border-radius: 4px; transition: all 0.2s;
                }
                .hm-close:hover { background: #232830; color: #F2F6F8; }
                .hm-body {
                    padding: 20px 24px; overflow-y: auto; flex: 1;
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                }
                .hm-sector {
                    border-radius: 12px; padding: 16px;
                    border: 1px solid rgba(242,246,248,0.06);
                    transition: all 0.3s ease; cursor: pointer;
                    position: relative; overflow: hidden;
                }
                .hm-sector:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
                .hm-sector.bullish { background: linear-gradient(135deg, rgba(0,163,108,0.15), rgba(0,163,108,0.05)); border-color: rgba(0,163,108,0.3); }
                .hm-sector.bearish { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05)); border-color: rgba(239,68,68,0.3); }
                .hm-sector.neutral { background: linear-gradient(135deg, rgba(201,166,107,0.1), rgba(201,166,107,0.03)); border-color: rgba(201,166,107,0.2); }
                .hm-sector-name { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
                .hm-sector-sentiment { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
                .hm-sector-sentiment.bullish { color: #00A36C; }
                .hm-sector-sentiment.bearish { color: #EF4444; }
                .hm-sector-sentiment.neutral { color: #C9A66B; }
                .hm-sector-label { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
                .hm-sector-tickers { font-size: 11px; color: rgba(242,246,248,0.5); }
                .hm-sector-bar {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
                }
                .hm-sector-bar.bullish { background: linear-gradient(90deg, transparent, #00A36C); }
                .hm-sector-bar.bearish { background: linear-gradient(90deg, transparent, #EF4444); }
                .hm-sector-bar.neutral { background: linear-gradient(90deg, transparent, #C9A66B); }
                .hm-empty { text-align: center; padding: 40px; color: rgba(242,246,248,0.4); grid-column: 1/-1; }
            </style>

            <div class="hm-content">
                <div class="hm-header">
                    <div class="hm-title">🗺️ Sector Heatmap</div>
                    <button class="hm-close" id="hm-close">×</button>
                </div>
                <div class="hm-body">
                    ${sectorEntries.length === 0 ? `
                        <div class="hm-empty">No sector data yet. Start tracking tickers in Market Pulse.</div>
                    ` : sectorEntries.map(([name, data]) => {
            const sentClass = data.avgSentiment > 0.1 ? 'bullish' : data.avgSentiment < -0.1 ? 'bearish' : 'neutral';
            return `
                            <div class="hm-sector ${sentClass}">
                                <div class="hm-sector-name">${name}</div>
                                <div class="hm-sector-sentiment ${sentClass}">
                                    ${data.avgSentiment >= 0 ? '+' : ''}${(data.avgSentiment * 100).toFixed(1)}%
                                </div>
                                <div class="hm-sector-label">${data.label} · ${data.sampleSize} tweets</div>
                                <div class="hm-sector-tickers">${data.tickers.map(t => '$' + t).join(', ')}</div>
                                <div class="hm-sector-bar ${sentClass}"></div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('hm-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// Singleton
window.TraderXSectorHeatmap = window.TraderXSectorHeatmap || new SectorHeatmap();
console.log('[TraderX] Sector Heatmap v1.0 loaded');
