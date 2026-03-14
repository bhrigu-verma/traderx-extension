// ============================================================================
// TRADERX AI COPILOT v1.0 — Intelligent Trade Ideas & Risk Analysis
// ============================================================================
// Generates real-time trade recommendations by combining:
// - Sentiment analysis from Twitter
// - Price action and technical indicators
// - Volume analysis and whale activity
// - Risk/reward calculations
// - Position sizing based on account size
// ============================================================================

class AITradingCopilot {
  constructor() {
    this.tradeIdeas = [];
    this.activeIdeas = new Map(); // ticker -> idea
    this.historicalPerformance = [];
    this.isEnabled = true;
    this.accountSize = 10000; // Default $10k account
    this.riskPerTrade = 2; // 2% risk per trade
    this.minConfidence = 0.65; // 65% confidence threshold

    // Technical indicators cache
    this.indicators = new Map();

    // Load settings
    this.loadSettings();
  }

  // ========================================================================
  // CORE ANALYSIS ENGINE
  // ========================================================================

  async generateTradeIdea(ticker, analysis, priceData) {
    if (!this.isEnabled) return null;
    if (!analysis || !priceData) return null;

    // Skip if insufficient data
    if (analysis.insufficientData || analysis.sampleSize < 20) return null;

    // Calculate technical score
    const technicalScore = this.analyzeTechnicals(ticker, priceData);

    // Calculate sentiment score (already normalized -1 to 1)
    const sentimentScore = analysis.sentiment;

    // Volume analysis
    const volumeScore = this.analyzeVolume(analysis);

    // Combine signals
    const signals = {
      sentiment: sentimentScore,
      technical: technicalScore,
      volume: volumeScore,
      influencer: (analysis.influencerCount || 0) / 10, // Normalize
    };

    // Calculate overall confidence
    const confidence = this.calculateConfidence(signals);

    // Skip if confidence too low
    if (confidence < this.minConfidence) return null;

    // Determine direction
    const direction = this.determineDirection(signals, sentimentScore);
    if (!direction) return null;

    // Calculate entry, stop loss, and targets
    const levels = this.calculateLevels(ticker, priceData, direction, analysis);

    // Calculate position sizing
    const position = this.calculatePositionSize(
      priceData.price,
      levels.stopLoss,
      this.accountSize,
      this.riskPerTrade,
    );

    // Calculate risk/reward
    const riskReward = Math.abs(
      (levels.target1 - levels.entry) / (levels.entry - levels.stopLoss),
    );

    // Only suggest if R:R > 2:1
    if (riskReward < 2) return null;

    const idea = {
      id: `${ticker}_${Date.now()}`,
      ticker,
      direction,
      confidence: Math.round(confidence * 100),
      entry: levels.entry,
      stopLoss: levels.stopLoss,
      target1: levels.target1,
      target2: levels.target2,
      positionSize: position.shares,
      positionValue: position.value,
      riskAmount: position.riskAmount,
      riskReward: riskReward.toFixed(2),
      potentialProfit:
        position.shares * Math.abs(levels.target1 - levels.entry),
      timestamp: Date.now(),
      status: "active",
      reasoning: this.generateReasoning(signals, analysis, technicalScore),
      signals,
      priceAtGeneration: priceData.price,
      sentimentData: {
        bullish: analysis.bullishCount || 0,
        bearish: analysis.bearishCount || 0,
        neutral: analysis.neutralCount || 0,
        sampleSize: analysis.sampleSize,
      },
    };

    // Store and return
    this.activeIdeas.set(ticker, idea);
    this.tradeIdeas.unshift(idea);
    this.saveIdeas();

    console.log(
      `[AI Copilot] New ${direction} idea for $${ticker} @ $${levels.entry} (${idea.confidence}% confidence)`,
    );

    // Show notification
    this.showIdeaNotification(idea);

    return idea;
  }

  // ========================================================================
  // TECHNICAL ANALYSIS
  // ========================================================================

  analyzeTechnicals(ticker, priceData) {
    let score = 0;

    // Price momentum (24h change)
    const momentum = priceData.change24h || 0;
    if (momentum > 5) score += 0.3;
    else if (momentum > 2) score += 0.15;
    else if (momentum < -5) score -= 0.3;
    else if (momentum < -2) score -= 0.15;

    // Volume analysis
    if (priceData.volume24h) {
      // High volume = conviction
      score += 0.1;
    }

    // Price action patterns
    const price = priceData.price;
    const cached = this.indicators.get(ticker) || {};

    // Simple moving average proxy (using 24h change as trend indicator)
    if (Math.abs(momentum) > 3) {
      // Strong trend
      score += momentum > 0 ? 0.2 : -0.2;
    }

    // RSI estimation from price action
    if (momentum > 10) score -= 0.1; // Potentially overbought
    if (momentum < -10) score += 0.1; // Potentially oversold

    // Normalize to -1 to 1
    return Math.max(-1, Math.min(1, score));
  }

  analyzeVolume(analysis) {
    let score = 0;

    if (analysis.volumeSpike) {
      score += 0.5;

      // Higher intensity = stronger signal
      const intensity = analysis.spikeIntensity || 1;
      score += Math.min(0.3, intensity / 10);
    }

    // Sample size indicates conversation volume
    if (analysis.sampleSize > 50) score += 0.2;
    else if (analysis.sampleSize > 100) score += 0.3;

    return Math.min(1, score);
  }

  // ========================================================================
  // SIGNAL COMBINATION & CONFIDENCE
  // ========================================================================

  calculateConfidence(signals) {
    // Weighted average of signals
    const weights = {
      sentiment: 0.35,
      technical: 0.3,
      volume: 0.2,
      influencer: 0.15,
    };

    let confidence = 0;

    // Absolute values for confidence (direction doesn't matter, conviction does)
    confidence += Math.abs(signals.sentiment) * weights.sentiment;
    confidence += Math.abs(signals.technical) * weights.technical;
    confidence += signals.volume * weights.volume;
    confidence += Math.min(1, signals.influencer) * weights.influencer;

    // Bonus for alignment (all signals pointing same direction)
    const aligned = this.checkAlignment(signals);
    if (aligned) confidence *= 1.15;

    return Math.min(0.99, confidence);
  }

  determineDirection(signals, sentiment) {
    // Primary direction from sentiment
    const sentimentDir =
      sentiment > 0.15 ? "long" : sentiment < -0.15 ? "short" : null;

    // Confirm with technical
    const technicalDir =
      signals.technical > 0.1
        ? "long"
        : signals.technical < -0.1
          ? "short"
          : null;

    // Both must agree
    if (sentimentDir === technicalDir && sentimentDir !== null) {
      return sentimentDir;
    }

    // Strong sentiment can override weak technical
    if (Math.abs(sentiment) > 0.4 && signals.volume > 0.4) {
      return sentimentDir;
    }

    return null;
  }

  checkAlignment(signals) {
    const values = [signals.sentiment, signals.technical];

    // Check if all non-zero signals point same direction
    const positive = values.filter((v) => v > 0.1).length;
    const negative = values.filter((v) => v < -0.1).length;

    return (
      (positive >= 2 && negative === 0) || (negative >= 2 && positive === 0)
    );
  }

  // ========================================================================
  // LEVEL CALCULATIONS
  // ========================================================================

  calculateLevels(ticker, priceData, direction, analysis) {
    const price = priceData.price;
    const volatility = Math.abs(priceData.change24h || 2) / 100;

    let entry, stopLoss, target1, target2;

    if (direction === "long") {
      // Long setup
      entry = price * 0.998; // Slight discount for limit order
      stopLoss = entry * (1 - Math.max(0.02, volatility * 1.5)); // 2% minimum or 1.5x volatility
      target1 = entry * (1 + Math.max(0.05, volatility * 2.5)); // 5% minimum or 2.5x volatility
      target2 = entry * (1 + Math.max(0.1, volatility * 4)); // 10% minimum
    } else {
      // Short setup
      entry = price * 1.002; // Slight premium for short entry
      stopLoss = entry * (1 + Math.max(0.02, volatility * 1.5));
      target1 = entry * (1 - Math.max(0.05, volatility * 2.5));
      target2 = entry * (1 - Math.max(0.1, volatility * 4));
    }

    return {
      entry: parseFloat(entry.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      target1: parseFloat(target1.toFixed(2)),
      target2: parseFloat(target2.toFixed(2)),
    };
  }

  // ========================================================================
  // POSITION SIZING (Kelly Criterion inspired)
  // ========================================================================

  calculatePositionSize(entryPrice, stopLoss, accountSize, riskPercent) {
    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLoss);

    // Total risk amount
    const riskAmount = accountSize * (riskPercent / 100);

    // Shares to buy
    const shares = Math.floor(riskAmount / riskPerShare);

    // Position value
    const value = shares * entryPrice;

    return {
      shares,
      value: parseFloat(value.toFixed(2)),
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      riskPerShare: parseFloat(riskPerShare.toFixed(2)),
    };
  }

  // ========================================================================
  // REASONING GENERATION
  // ========================================================================

  generateReasoning(signals, analysis, technicalScore) {
    const reasons = [];

    // Sentiment
    if (Math.abs(signals.sentiment) > 0.25) {
      const direction = signals.sentiment > 0 ? "bullish" : "bearish";
      reasons.push(
        `Strong ${direction} sentiment (${(signals.sentiment * 100).toFixed(0)}%)`,
      );
    }

    // Volume
    if (analysis.volumeSpike) {
      reasons.push(
        `Volume spike detected (${analysis.spikeIntensity || "high"} intensity)`,
      );
    }

    // Influencers
    if (analysis.influencerCount > 3) {
      reasons.push(`${analysis.influencerCount} influencers discussing`);
    }

    // Technical
    if (Math.abs(technicalScore) > 0.3) {
      const trend = technicalScore > 0 ? "uptrend" : "downtrend";
      reasons.push(`Technical indicators show ${trend}`);
    }

    // Sample size
    if (analysis.sampleSize > 50) {
      reasons.push(`High conviction: ${analysis.sampleSize} tweets analyzed`);
    }

    return reasons;
  }

  // ========================================================================
  // IDEA TRACKING & PERFORMANCE
  // ========================================================================

  updateIdeaStatus(ticker, currentPrice) {
    const idea = this.activeIdeas.get(ticker);
    if (!idea || idea.status !== "active") return;

    const entry = idea.entry;
    const stop = idea.stopLoss;
    const target1 = idea.target1;

    if (idea.direction === "long") {
      if (currentPrice <= stop) {
        idea.status = "stopped";
        idea.exitPrice = currentPrice;
        idea.pnl = (currentPrice - entry) * idea.positionSize;
        this.historicalPerformance.push(idea);
      } else if (currentPrice >= target1) {
        idea.status = "target1_hit";
        idea.exitPrice = currentPrice;
        idea.pnl = (currentPrice - entry) * idea.positionSize;
        this.historicalPerformance.push(idea);
      }
    } else {
      if (currentPrice >= stop) {
        idea.status = "stopped";
        idea.exitPrice = currentPrice;
        idea.pnl = (entry - currentPrice) * idea.positionSize;
        this.historicalPerformance.push(idea);
      } else if (currentPrice <= target1) {
        idea.status = "target1_hit";
        idea.exitPrice = currentPrice;
        idea.pnl = (entry - currentPrice) * idea.positionSize;
        this.historicalPerformance.push(idea);
      }
    }

    if (idea.status !== "active") {
      this.saveIdeas();
      console.log(
        `[AI Copilot] Idea ${idea.id} closed: ${idea.status}, P&L: $${idea.pnl.toFixed(2)}`,
      );
    }
  }

  getPerformanceMetrics() {
    const completed = this.historicalPerformance;
    if (completed.length === 0) return null;

    const wins = completed.filter((i) => i.pnl > 0);
    const losses = completed.filter((i) => i.pnl < 0);

    const winRate = (wins.length / completed.length) * 100;
    const avgWin = wins.reduce((sum, i) => sum + i.pnl, 0) / (wins.length || 1);
    const avgLoss =
      losses.reduce((sum, i) => sum + Math.abs(i.pnl), 0) /
      (losses.length || 1);
    const totalPnL = completed.reduce((sum, i) => sum + i.pnl, 0);
    const profitFactor =
      wins.reduce((sum, i) => sum + i.pnl, 0) /
      (losses.reduce((sum, i) => sum + Math.abs(i.pnl), 0) || 1);

    return {
      totalTrades: completed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
    };
  }

  // ========================================================================
  // UI - COPILOT DASHBOARD
  // ========================================================================

  show() {
    const existing = document.getElementById("traderx-copilot-modal");
    if (existing) {
      existing.remove();
      return;
    }

    const activeIdeas = Array.from(this.activeIdeas.values()).filter(
      (i) => i.status === "active",
    );
    const recentIdeas = this.tradeIdeas.slice(0, 20);
    const metrics = this.getPerformanceMetrics();

    const modal = document.createElement("div");
    modal.id = "traderx-copilot-modal";
    modal.innerHTML = `
            <style>
                #traderx-copilot-modal {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
                    z-index: 100001; display: flex; align-items: center; justify-content: center;
                    font-family: 'Inter', -apple-system, sans-serif; color: #F2F6F8;
                    animation: copilotFadeIn 0.2s ease;
                }
                @keyframes copilotFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .copilot-container {
                    background: #0F1419; border: 1px solid rgba(242,246,248,0.12);
                    border-radius: 20px; width: 95%; max-width: 1200px; max-height: 90vh;
                    overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                }

                .copilot-header {
                    padding: 24px 32px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
                    display: flex; justify-content: space-between; align-items: center;
                }

                .copilot-title {
                    font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px;
                }

                .copilot-badge {
                    background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px;
                    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
                }

                .copilot-close {
                    background: rgba(255,255,255,0.2); border: none; color: white;
                    width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
                    font-size: 24px; display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .copilot-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }

                .copilot-body {
                    padding: 0; overflow-y: auto; flex: 1; display: flex; gap: 24px; padding: 24px 32px;
                }

                .copilot-main { flex: 1; display: flex; flex-direction: column; gap: 20px; }
                .copilot-sidebar { width: 320px; display: flex; flex-direction: column; gap: 20px; }

                /* Performance Card */
                .perf-card {
                    background: linear-gradient(135deg, #141820 0%, #1A1F2A 100%);
                    border: 1px solid rgba(242,246,248,0.08); border-radius: 16px; padding: 20px;
                }

                .perf-title { font-size: 14px; font-weight: 700; color: rgba(242,246,248,0.6);
                              text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }

                .perf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

                .perf-item { background: rgba(242,246,248,0.03); padding: 12px; border-radius: 8px; }
                .perf-label { font-size: 11px; color: rgba(242,246,248,0.5); margin-bottom: 4px; }
                .perf-value { font-size: 20px; font-weight: 800; }
                .perf-value.positive { color: #10B981; }
                .perf-value.negative { color: #EF4444; }

                /* Settings Card */
                .settings-card {
                    background: linear-gradient(135deg, #141820 0%, #1A1F2A 100%);
                    border: 1px solid rgba(242,246,248,0.08); border-radius: 16px; padding: 20px;
                }

                .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .setting-label { font-size: 13px; color: rgba(242,246,248,0.8); }
                .setting-input {
                    background: rgba(242,246,248,0.05); border: 1px solid rgba(242,246,248,0.1);
                    color: #F2F6F8; padding: 6px 10px; border-radius: 6px; width: 100px;
                    text-align: right; font-size: 13px; font-weight: 600;
                }

                /* Ideas List */
                .ideas-section { flex: 1; }
                .ideas-header {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
                }
                .ideas-title { font-size: 18px; font-weight: 700; }
                .ideas-count {
                    background: rgba(99,102,241,0.2); color: #818CF8; padding: 4px 12px;
                    border-radius: 12px; font-size: 12px; font-weight: 700;
                }

                .ideas-list { display: flex; flex-direction: column; gap: 12px; }

                /* Idea Card */
                .idea-card {
                    background: linear-gradient(135deg, #141820 0%, #1A1F2A 100%);
                    border: 1px solid rgba(242,246,248,0.08); border-radius: 16px; padding: 20px;
                    transition: all 0.2s; cursor: pointer;
                }
                .idea-card:hover { border-color: #6366F1; box-shadow: 0 8px 24px rgba(99,102,241,0.2); }
                .idea-card.long { border-left: 3px solid #10B981; }
                .idea-card.short { border-left: 3px solid #EF4444; }

                .idea-header {
                    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
                }

                .idea-ticker-section { display: flex; align-items: center; gap: 12px; }
                .idea-ticker {
                    font-size: 24px; font-weight: 800; color: #F2F6F8;
                }
                .idea-direction {
                    padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700;
                    text-transform: uppercase;
                }
                .idea-direction.long { background: rgba(16,185,129,0.2); color: #10B981; }
                .idea-direction.short { background: rgba(239,68,68,0.2); color: #EF4444; }

                .idea-confidence {
                    text-align: right;
                }
                .idea-confidence-value {
                    font-size: 32px; font-weight: 800; color: #6366F1;
                }
                .idea-confidence-label {
                    font-size: 10px; color: rgba(242,246,248,0.5); text-transform: uppercase;
                }

                .idea-levels {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
                }

                .idea-level {
                    background: rgba(242,246,248,0.03); padding: 10px; border-radius: 8px; text-align: center;
                }
                .idea-level-label { font-size: 10px; color: rgba(242,246,248,0.5); margin-bottom: 4px; }
                .idea-level-value { font-size: 16px; font-weight: 700; }

                .idea-meta {
                    display: flex; justify-content: space-between; align-items: center;
                    padding-top: 12px; border-top: 1px solid rgba(242,246,248,0.06);
                }

                .idea-reasoning { flex: 1; }
                .reasoning-item {
                    font-size: 12px; color: rgba(242,246,248,0.7); margin-bottom: 4px;
                    display: flex; align-items: center; gap: 6px;
                }
                .reasoning-item::before { content: '•'; color: #6366F1; font-weight: 900; }

                .idea-stats { text-align: right; }
                .idea-stat {
                    font-size: 11px; color: rgba(242,246,248,0.5); margin-bottom: 2px;
                }
                .idea-stat strong { color: #F2F6F8; font-weight: 700; }

                .copilot-empty {
                    text-align: center; padding: 60px 20px; color: rgba(242,246,248,0.4);
                }
                .copilot-empty h3 { font-size: 20px; margin-bottom: 8px; color: rgba(242,246,248,0.6); }
            </style>

            <div class="copilot-container">
                <div class="copilot-header">
                    <div class="copilot-title">
                        <span>🤖</span>
                        AI Trading Copilot
                        <span class="copilot-badge">Beta</span>
                    </div>
                    <button class="copilot-close" id="copilot-close">×</button>
                </div>

                <div class="copilot-body">
                    <div class="copilot-main">
                        <div class="ideas-section">
                            <div class="ideas-header">
                                <div class="ideas-title">Active Trade Ideas</div>
                                <div class="ideas-count">${activeIdeas.length} Active</div>
                            </div>
                            <div class="ideas-list">
                                ${
                                  activeIdeas.length === 0
                                    ? `
                                    <div class="copilot-empty">
                                        <h3>No active ideas yet</h3>
                                        <p>The AI Copilot will generate trade ideas automatically based on sentiment and price action.</p>
                                    </div>
                                `
                                    : activeIdeas
                                        .map((idea) =>
                                          this.renderIdeaCard(idea),
                                        )
                                        .join("")
                                }
                            </div>
                        </div>

                        ${
                          recentIdeas.length > activeIdeas.length
                            ? `
                            <div class="ideas-section">
                                <div class="ideas-header">
                                    <div class="ideas-title">Recent Ideas</div>
                                </div>
                                <div class="ideas-list">
                                    ${recentIdeas
                                      .slice(activeIdeas.length, 10)
                                      .map((idea) => this.renderIdeaCard(idea))
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <div class="copilot-sidebar">
                        ${
                          metrics
                            ? `
                            <div class="perf-card">
                                <div class="perf-title">📊 Performance</div>
                                <div class="perf-grid">
                                    <div class="perf-item">
                                        <div class="perf-label">Win Rate</div>
                                        <div class="perf-value">${metrics.winRate}%</div>
                                    </div>
                                    <div class="perf-item">
                                        <div class="perf-label">Total P&L</div>
                                        <div class="perf-value ${parseFloat(metrics.totalPnL) >= 0 ? "positive" : "negative"}">
                                            ${parseFloat(metrics.totalPnL) >= 0 ? "+" : ""}$${metrics.totalPnL}
                                        </div>
                                    </div>
                                    <div class="perf-item">
                                        <div class="perf-label">Avg Win</div>
                                        <div class="perf-value positive">+$${metrics.avgWin}</div>
                                    </div>
                                    <div class="perf-item">
                                        <div class="perf-label">Avg Loss</div>
                                        <div class="perf-value negative">-$${metrics.avgLoss}</div>
                                    </div>
                                    <div class="perf-item">
                                        <div class="perf-label">Profit Factor</div>
                                        <div class="perf-value">${metrics.profitFactor}</div>
                                    </div>
                                    <div class="perf-item">
                                        <div class="perf-label">Total Trades</div>
                                        <div class="perf-value">${metrics.totalTrades}</div>
                                    </div>
                                </div>
                            </div>
                        `
                            : ""
                        }

                        <div class="settings-card">
                            <div class="perf-title">⚙️ Settings</div>
                            <div class="setting-row">
                                <div class="setting-label">Account Size</div>
                                <input type="number" class="setting-input" id="copilot-account-size" value="${this.accountSize}">
                            </div>
                            <div class="setting-row">
                                <div class="setting-label">Risk Per Trade (%)</div>
                                <input type="number" class="setting-input" id="copilot-risk-percent" value="${this.riskPerTrade}" step="0.5">
                            </div>
                            <div class="setting-row">
                                <div class="setting-label">Min Confidence (%)</div>
                                <input type="number" class="setting-input" id="copilot-min-confidence" value="${this.minConfidence * 100}" step="5">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Event listeners
    document
      .getElementById("copilot-close")
      .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Settings listeners
    document
      .getElementById("copilot-account-size")
      .addEventListener("change", (e) => {
        this.accountSize = parseFloat(e.target.value) || 10000;
        this.saveSettings();
      });

    document
      .getElementById("copilot-risk-percent")
      .addEventListener("change", (e) => {
        this.riskPerTrade = parseFloat(e.target.value) || 2;
        this.saveSettings();
      });

    document
      .getElementById("copilot-min-confidence")
      .addEventListener("change", (e) => {
        this.minConfidence = (parseFloat(e.target.value) || 65) / 100;
        this.saveSettings();
      });
  }

  renderIdeaCard(idea) {
    const age = Math.floor((Date.now() - idea.timestamp) / 60000); // minutes
    const statusBadge =
      idea.status === "active"
        ? ""
        : `<span style="background: rgba(251,191,36,0.2); color: #FBBF24; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-left: 8px;">${idea.status.toUpperCase().replace("_", " ")}</span>`;

    return `
            <div class="idea-card ${idea.direction}">
                <div class="idea-header">
                    <div class="idea-ticker-section">
                        <div class="idea-ticker">$${idea.ticker}</div>
                        <div class="idea-direction ${idea.direction}">${idea.direction}</div>
                        ${statusBadge}
                    </div>
                    <div class="idea-confidence">
                        <div class="idea-confidence-value">${idea.confidence}%</div>
                        <div class="idea-confidence-label">Confidence</div>
                    </div>
                </div>

                <div class="idea-levels">
                    <div class="idea-level">
                        <div class="idea-level-label">Entry</div>
                        <div class="idea-level-value">$${idea.entry}</div>
                    </div>
                    <div class="idea-level">
                        <div class="idea-level-label">Stop Loss</div>
                        <div class="idea-level-value">$${idea.stopLoss}</div>
                    </div>
                    <div class="idea-level">
                        <div class="idea-level-label">Target 1</div>
                        <div class="idea-level-value">$${idea.target1}</div>
                    </div>
                    <div class="idea-level">
                        <div class="idea-level-label">R:R</div>
                        <div class="idea-level-value" style="color: #10B981;">${idea.riskReward}:1</div>
                    </div>
                </div>

                <div class="idea-meta">
                    <div class="idea-reasoning">
                        ${idea.reasoning
                          .slice(0, 3)
                          .map(
                            (r) => `
                            <div class="reasoning-item">${r}</div>
                        `,
                          )
                          .join("")}
                    </div>
                    <div class="idea-stats">
                        <div class="idea-stat"><strong>${idea.positionSize}</strong> shares</div>
                        <div class="idea-stat">Risk: <strong>$${idea.riskAmount.toFixed(0)}</strong></div>
                        <div class="idea-stat">Potential: <strong>$${idea.potentialProfit.toFixed(0)}</strong></div>
                        <div class="idea-stat">${age}m ago</div>
                    </div>
                </div>
            </div>
        `;
  }

  showIdeaNotification(idea) {
    try {
      chrome.runtime.sendMessage({
        action: "triggerAlert",
        alert: {
          name: `AI Trade Idea: ${idea.direction.toUpperCase()}`,
          text: `$${idea.ticker} @ $${idea.entry} | Target: $${idea.target1} (${idea.riskReward}:1 R:R) | Confidence: ${idea.confidence}%`,
          author: "AI Copilot",
          tickers: [idea.ticker],
          timestamp: Date.now(),
          priority: "high",
        },
      });
    } catch (e) {
      console.warn("[AI Copilot] Failed to send notification:", e);
    }
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  saveSettings() {
    try {
      localStorage.setItem(
        "traderx_copilot_settings",
        JSON.stringify({
          accountSize: this.accountSize,
          riskPerTrade: this.riskPerTrade,
          minConfidence: this.minConfidence,
          isEnabled: this.isEnabled,
        }),
      );
    } catch (e) {
      console.error("[AI Copilot] Failed to save settings:", e);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem("traderx_copilot_settings");
      if (saved) {
        const settings = JSON.parse(saved);
        this.accountSize = settings.accountSize || 10000;
        this.riskPerTrade = settings.riskPerTrade || 2;
        this.minConfidence = settings.minConfidence || 0.65;
        this.isEnabled = settings.isEnabled !== false;
      }

      // Load ideas
      const savedIdeas = localStorage.getItem("traderx_copilot_ideas");
      if (savedIdeas) {
        this.tradeIdeas = JSON.parse(savedIdeas);
        // Reconstruct activeIdeas map
        this.tradeIdeas.forEach((idea) => {
          if (idea.status === "active") {
            this.activeIdeas.set(idea.ticker, idea);
          }
        });
      }

      // Load performance
      const savedPerf = localStorage.getItem("traderx_copilot_performance");
      if (savedPerf) {
        this.historicalPerformance = JSON.parse(savedPerf);
      }
    } catch (e) {
      console.error("[AI Copilot] Failed to load settings:", e);
    }
  }

  saveIdeas() {
    try {
      localStorage.setItem(
        "traderx_copilot_ideas",
        JSON.stringify(this.tradeIdeas),
      );
      localStorage.setItem(
        "traderx_copilot_performance",
        JSON.stringify(this.historicalPerformance),
      );
    } catch (e) {
      console.error("[AI Copilot] Failed to save ideas:", e);
    }
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  toggle(enabled) {
    this.isEnabled = enabled;
    this.saveSettings();
  }

  getActiveIdeas() {
    return Array.from(this.activeIdeas.values());
  }

  clearHistory() {
    this.historicalPerformance = [];
    this.saveIdeas();
  }
}

// Singleton
window.TraderXAICopilot = window.TraderXAICopilot || new AITradingCopilot();
console.log("[TraderX] AI Copilot v1.0 loaded");
