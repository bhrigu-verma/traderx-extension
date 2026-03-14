// ============================================================================
// TRADERX PORTFOLIO TRACKER v1.0 — Position Management + P&L
// ============================================================================
// Features:
// - Log positions: ticker, entry price, quantity, date
// - Auto-fetch current price and compute unrealized P&L
// - Sentiment alignment score (are you long a bearish ticker?)
// - Position-weighted market exposure
// - Persistent storage in chrome.storage.local
// ============================================================================

class PortfolioTracker {
    constructor() {
        this.positions = []; // {id, ticker, entryPrice, quantity, date, side, notes}
        this.isVisible = false;
        this.element = null;
        this.loaded = false;
    }

    async init() {
        await this.loadPositions();
        this.loaded = true;
        console.log(`[PortfolioTracker] Loaded ${this.positions.length} positions`);
    }

    // ========================================================================
    // POSITION MANAGEMENT
    // ========================================================================

    async addPosition(ticker, entryPrice, quantity, side = 'long', notes = '') {
        const position = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            ticker: ticker.toUpperCase().replace('$', ''),
            entryPrice: parseFloat(entryPrice),
            quantity: parseFloat(quantity),
            side, // 'long' or 'short'
            notes,
            date: new Date().toISOString(),
            closedAt: null,
            closePrice: null
        };

        this.positions.push(position);
        await this.savePositions();
        return position;
    }

    async closePosition(positionId, closePrice) {
        const pos = this.positions.find(p => p.id === positionId);
        if (pos) {
            pos.closedAt = new Date().toISOString();
            pos.closePrice = parseFloat(closePrice);
            await this.savePositions();
        }
        return pos;
    }

    async removePosition(positionId) {
        this.positions = this.positions.filter(p => p.id !== positionId);
        await this.savePositions();
    }

    getOpenPositions() {
        return this.positions.filter(p => !p.closedAt);
    }

    getClosedPositions() {
        return this.positions.filter(p => p.closedAt);
    }

    // ========================================================================
    // P&L CALCULATIONS
    // ========================================================================

    async computePortfolio() {
        const open = this.getOpenPositions();
        const priceFetcher = window.TraderXPriceFetcher;
        const analysisEngine = window.TraderXAnalysisEngine;

        const results = [];
        let totalPnL = 0;
        let totalCost = 0;
        let totalValue = 0;

        for (const pos of open) {
            let currentPrice = null;
            let priceData = null;

            // Fetch current price
            if (priceFetcher) {
                try {
                    priceData = await priceFetcher.getPrice(pos.ticker);
                    currentPrice = priceData.price;
                } catch (e) {
                    console.warn(`[Portfolio] Price fetch failed for ${pos.ticker}`);
                }
            }

            // Calculate P&L
            const cost = pos.entryPrice * pos.quantity;
            const value = currentPrice ? currentPrice * pos.quantity : cost;
            let pnl = 0;
            let pnlPercent = 0;

            if (currentPrice) {
                if (pos.side === 'long') {
                    pnl = (currentPrice - pos.entryPrice) * pos.quantity;
                    pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
                } else {
                    pnl = (pos.entryPrice - currentPrice) * pos.quantity;
                    pnlPercent = ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100;
                }
            }

            totalPnL += pnl;
            totalCost += cost;
            totalValue += value;

            // Sentiment alignment
            let sentimentAlignment = null;
            if (analysisEngine) {
                const sentimentHistory = analysisEngine.getSentimentHistory(pos.ticker);
                if (sentimentHistory.length > 0) {
                    const latest = sentimentHistory[sentimentHistory.length - 1];
                    const sentiment = latest.sentiment;

                    // Alignment: +1 = sentiment agrees with position, -1 = disagrees
                    if (pos.side === 'long') {
                        sentimentAlignment = sentiment; // Positive sentiment = aligned with long
                    } else {
                        sentimentAlignment = -sentiment; // Negative sentiment = aligned with short
                    }
                }
            }

            results.push({
                ...pos,
                currentPrice,
                cost,
                value,
                pnl,
                pnlPercent,
                sentimentAlignment,
                priceChange24h: priceData?.change24h || null
            });
        }

        return {
            positions: results,
            summary: {
                totalPositions: open.length,
                totalCost,
                totalValue,
                totalPnL,
                totalPnLPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
                longExposure: results.filter(p => p.side === 'long').reduce((s, p) => s + p.value, 0),
                shortExposure: results.filter(p => p.side === 'short').reduce((s, p) => s + p.value, 0),
                alignedPositions: results.filter(p => p.sentimentAlignment !== null && p.sentimentAlignment > 0.1).length,
                misalignedPositions: results.filter(p => p.sentimentAlignment !== null && p.sentimentAlignment < -0.1).length
            }
        };
    }

    // ========================================================================
    // UI — Portfolio Modal
    // ========================================================================

    async show() {
        if (!this.loaded) await this.init();

        const existing = document.getElementById('traderx-portfolio-modal');
        if (existing) existing.remove();

        const portfolio = await this.computePortfolio();

        const modal = document.createElement('div');
        modal.id = 'traderx-portfolio-modal';
        modal.innerHTML = `
            <style>
                #traderx-portfolio-modal {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
                    z-index: 100000; display: flex; align-items: center; justify-content: center;
                    font-family: 'Inter', -apple-system, sans-serif; color: #F2F6F8;
                    animation: pfFadeIn 0.2s ease;
                }
                @keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } }
                .pf-content {
                    background: #141820; border: 1px solid rgba(242,246,248,0.08);
                    border-radius: 16px; width: 90%; max-width: 800px; max-height: 85vh;
                    overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }
                .pf-header {
                    padding: 20px 24px; border-bottom: 1px solid rgba(242,246,248,0.06);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .pf-title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
                .pf-close {
                    background: transparent; border: none; color: #94A3B8;
                    font-size: 24px; cursor: pointer; padding: 4px 8px;
                    border-radius: 4px; transition: all 0.2s;
                }
                .pf-close:hover { background: #232830; color: #F2F6F8; }
                .pf-summary {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
                    padding: 16px 24px; border-bottom: 1px solid rgba(242,246,248,0.06);
                }
                .pf-stat {
                    background: #232830; border-radius: 10px; padding: 12px;
                    text-align: center;
                }
                .pf-stat-label { font-size: 10px; color: rgba(242,246,248,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                .pf-stat-value { font-size: 18px; font-weight: 700; }
                .pf-stat-value.positive { color: #00A36C; }
                .pf-stat-value.negative { color: #EF4444; }
                .pf-body { padding: 16px 24px; overflow-y: auto; flex: 1; }
                .pf-add-btn {
                    background: linear-gradient(135deg, #00A36C, #008C5A); border: none;
                    color: white; padding: 10px 20px; border-radius: 8px;
                    font-weight: 600; cursor: pointer; font-size: 13px;
                    transition: all 0.2s; margin-bottom: 16px;
                }
                .pf-add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,163,108,0.3); }
                .pf-position {
                    background: #232830; border: 1px solid rgba(242,246,248,0.06);
                    border-radius: 10px; padding: 14px; margin-bottom: 10px;
                    display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto;
                    gap: 12px; align-items: center; transition: all 0.2s;
                }
                .pf-position:hover { border-color: #00A36C; }
                .pf-pos-ticker { font-size: 16px; font-weight: 700; }
                .pf-pos-side { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
                .pf-pos-side.long { background: rgba(0,163,108,0.15); color: #00A36C; }
                .pf-pos-side.short { background: rgba(239,68,68,0.15); color: #EF4444; }
                .pf-pos-detail { font-size: 12px; color: rgba(242,246,248,0.6); }
                .pf-pos-pnl { font-size: 14px; font-weight: 700; }
                .pf-pos-pnl.positive { color: #00A36C; }
                .pf-pos-pnl.negative { color: #EF4444; }
                .pf-alignment {
                    font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
                }
                .pf-alignment.aligned { background: rgba(0,163,108,0.15); color: #00A36C; }
                .pf-alignment.misaligned { background: rgba(239,68,68,0.15); color: #EF4444; }
                .pf-alignment.neutral { background: rgba(201,166,107,0.15); color: #C9A66B; }
                .pf-remove-btn {
                    background: transparent; border: 1px solid rgba(239,68,68,0.3);
                    color: #EF4444; padding: 4px 8px; border-radius: 4px;
                    cursor: pointer; font-size: 11px; transition: all 0.2s;
                }
                .pf-remove-btn:hover { background: rgba(239,68,68,0.1); }
                .pf-empty {
                    text-align: center; padding: 40px; color: rgba(242,246,248,0.4);
                    font-size: 14px;
                }
            </style>

            <div class="pf-content">
                <div class="pf-header">
                    <div class="pf-title">💼 Portfolio Tracker</div>
                    <button class="pf-close" id="pf-close">×</button>
                </div>

                <div class="pf-summary">
                    <div class="pf-stat">
                        <div class="pf-stat-label">Total Value</div>
                        <div class="pf-stat-value">$${this.formatNumber(portfolio.summary.totalValue)}</div>
                    </div>
                    <div class="pf-stat">
                        <div class="pf-stat-label">Unrealized P&L</div>
                        <div class="pf-stat-value ${portfolio.summary.totalPnL >= 0 ? 'positive' : 'negative'}">
                            ${portfolio.summary.totalPnL >= 0 ? '+' : ''}$${this.formatNumber(portfolio.summary.totalPnL)}
                        </div>
                    </div>
                    <div class="pf-stat">
                        <div class="pf-stat-label">Return</div>
                        <div class="pf-stat-value ${portfolio.summary.totalPnLPercent >= 0 ? 'positive' : 'negative'}">
                            ${portfolio.summary.totalPnLPercent >= 0 ? '+' : ''}${portfolio.summary.totalPnLPercent.toFixed(2)}%
                        </div>
                    </div>
                    <div class="pf-stat">
                        <div class="pf-stat-label">Sentiment Aligned</div>
                        <div class="pf-stat-value">
                            ${portfolio.summary.alignedPositions}/${portfolio.summary.totalPositions}
                        </div>
                    </div>
                </div>

                <div class="pf-body">
                    <button class="pf-add-btn" id="pf-add-position">+ Add Position</button>

                    ${portfolio.positions.length === 0 ? `
                        <div class="pf-empty">
                            No positions yet. Click "Add Position" to track your first trade.
                        </div>
                    ` : portfolio.positions.map(pos => `
                        <div class="pf-position">
                            <div>
                                <span class="pf-pos-ticker">$${pos.ticker}</span>
                                <span class="pf-pos-side ${pos.side}">${pos.side.toUpperCase()}</span>
                                ${pos.sentimentAlignment !== null ? `
                                    <span class="pf-alignment ${pos.sentimentAlignment > 0.1 ? 'aligned' : pos.sentimentAlignment < -0.1 ? 'misaligned' : 'neutral'}">
                                        ${pos.sentimentAlignment > 0.1 ? '✓ Aligned' : pos.sentimentAlignment < -0.1 ? '⚠ Misaligned' : '— Neutral'}
                                    </span>
                                ` : ''}
                            </div>
                            <div>
                                <div class="pf-pos-detail">Entry: $${pos.entryPrice.toFixed(2)}</div>
                                <div class="pf-pos-detail">Current: ${pos.currentPrice ? '$' + pos.currentPrice.toFixed(2) : '--'}</div>
                            </div>
                            <div>
                                <div class="pf-pos-detail">Qty: ${pos.quantity}</div>
                                <div class="pf-pos-detail">Cost: $${this.formatNumber(pos.cost)}</div>
                            </div>
                            <div>
                                <div class="pf-pos-pnl ${pos.pnl >= 0 ? 'positive' : 'negative'}">
                                    ${pos.pnl >= 0 ? '+' : ''}$${this.formatNumber(pos.pnl)}
                                </div>
                                <div class="pf-pos-detail" style="color: ${pos.pnlPercent >= 0 ? '#00A36C' : '#EF4444'}">
                                    ${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}%
                                </div>
                            </div>
                            <button class="pf-remove-btn" data-id="${pos.id}">✕</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('pf-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.getElementById('pf-add-position').addEventListener('click', () => {
            this.showAddPositionDialog(modal);
        });

        // Remove buttons
        modal.querySelectorAll('.pf-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('Remove this position?')) {
                    await this.removePosition(id);
                    modal.remove();
                    this.show(); // Refresh
                }
            });
        });
    }

    showAddPositionDialog(parentModal) {
        const ticker = prompt('Ticker (e.g. BTC, TSLA):');
        if (!ticker) return;

        const entryPrice = prompt('Entry Price ($):');
        if (!entryPrice || isNaN(parseFloat(entryPrice))) return;

        const quantity = prompt('Quantity:');
        if (!quantity || isNaN(parseFloat(quantity))) return;

        const side = (prompt('Side (long/short):', 'long') || 'long').toLowerCase();

        this.addPosition(ticker, entryPrice, quantity, side).then(() => {
            parentModal.remove();
            this.show(); // Refresh
        });
    }

    formatNumber(num) {
        if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    async savePositions() {
        try {
            chrome.storage.local.set({ traderx_portfolio: this.positions });
        } catch (e) {
            localStorage.setItem('traderx_portfolio', JSON.stringify(this.positions));
        }
    }

    async loadPositions() {
        try {
            return new Promise(resolve => {
                chrome.storage.local.get(['traderx_portfolio'], (result) => {
                    this.positions = result.traderx_portfolio || [];
                    resolve();
                });
            });
        } catch (e) {
            try {
                const saved = localStorage.getItem('traderx_portfolio');
                this.positions = saved ? JSON.parse(saved) : [];
            } catch (e2) {
                this.positions = [];
            }
        }
    }
}

// Singleton
window.TraderXPortfolio = window.TraderXPortfolio || new PortfolioTracker();
console.log('[TraderX] Portfolio Tracker v1.0 loaded');
