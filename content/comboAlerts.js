// ============================================================================
// TRADERX COMBO ALERTS v1.0 — Price + Sentiment Combined Alerts
// ============================================================================
// Monitors for compound conditions that are far more actionable than
// single-signal alerts:
//
// 1. Divergence Alert: Sentiment crosses BULLISH but price drops > N%
//    (someone knows something the market hasn't priced in)
//
// 2. Influencer Burst: N+ tweets from Tier 1/2 accounts within M minutes
//    (institutional attention spike)
//
// 3. Sentiment Flip: Ticker flips from BEARISH to BULLISH (or vice versa)
//    within a short window — momentum reversal signal
//
// 4. Volume + Sentiment: Volume spike AND sentiment is directional
//    (confirms move, not just noise)
// ============================================================================

class ComboAlertEngine {
    constructor() {
        this.alerts = []; // Active alert definitions
        this.firedAlerts = new Map(); // alertId -> lastFiredTimestamp (cooldown)
        this.cooldownMs = 15 * 60 * 1000; // 15 minute cooldown per alert
        this.previousStates = new Map(); // ticker -> last known state

        this.isEnabled = true;

        // Load saved alert rules
        this.loadAlertRules();
    }

    // ========================================================================
    // DEFAULT ALERT RULES
    // ========================================================================

    getDefaultRules() {
        return [
            {
                id: 'divergence_bullish',
                name: 'Bullish Divergence',
                description: 'Sentiment crosses BULLISH while price drops > 3%',
                enabled: true,
                conditions: {
                    sentimentMin: 0.15, // BULLISH threshold
                    priceChangeMax: -3, // Price dropped 3%+
                    minSampleSize: 10
                },
                type: 'divergence',
                priority: 'high'
            },
            {
                id: 'divergence_bearish',
                name: 'Bearish Divergence',
                description: 'Sentiment crosses BEARISH while price rises > 3%',
                enabled: true,
                conditions: {
                    sentimentMax: -0.15, // BEARISH threshold
                    priceChangeMin: 3,   // Price rose 3%+
                    minSampleSize: 10
                },
                type: 'divergence',
                priority: 'high'
            },
            {
                id: 'influencer_burst',
                name: 'Influencer Burst',
                description: '5+ tweets from Tier 1/2 accounts in 10 minutes',
                enabled: true,
                conditions: {
                    minInfluencerCount: 5,
                    windowMinutes: 10,
                    minTier: 2 // Tier 1 or 2
                },
                type: 'influencer_burst',
                priority: 'critical'
            },
            {
                id: 'sentiment_flip_bullish',
                name: 'Sentiment Flip → Bullish',
                description: 'Ticker flips from BEARISH to BULLISH',
                enabled: true,
                conditions: {
                    fromStatus: 'BEARISH',
                    toStatus: 'BULLISH'
                },
                type: 'sentiment_flip',
                priority: 'medium'
            },
            {
                id: 'sentiment_flip_bearish',
                name: 'Sentiment Flip → Bearish',
                description: 'Ticker flips from BULLISH to BEARISH',
                enabled: true,
                conditions: {
                    fromStatus: 'BULLISH',
                    toStatus: 'BEARISH'
                },
                type: 'sentiment_flip',
                priority: 'medium'
            },
            {
                id: 'volume_sentiment_combo',
                name: 'Volume Spike + Strong Sentiment',
                description: 'Volume spike detected AND sentiment is strongly directional',
                enabled: true,
                conditions: {
                    volumeSpike: true,
                    minAbsSentiment: 0.25, // Strong direction
                    minSampleSize: 15
                },
                type: 'volume_sentiment',
                priority: 'high'
            }
        ];
    }

    // ========================================================================
    // EVALUATE — Called after each ticker update
    // ========================================================================

    evaluate(ticker, analysisResult, priceData = null) {
        if (!this.isEnabled) return [];

        const triggered = [];

        for (const rule of this.alerts) {
            if (!rule.enabled) continue;

            // Check cooldown
            const cooldownKey = `${rule.id}_${ticker}`;
            const lastFired = this.firedAlerts.get(cooldownKey) || 0;
            if (Date.now() - lastFired < this.cooldownMs) continue;

            let fired = false;

            switch (rule.type) {
                case 'divergence':
                    fired = this.checkDivergence(ticker, analysisResult, priceData, rule);
                    break;
                case 'influencer_burst':
                    fired = this.checkInfluencerBurst(ticker, analysisResult, rule);
                    break;
                case 'sentiment_flip':
                    fired = this.checkSentimentFlip(ticker, analysisResult, rule);
                    break;
                case 'volume_sentiment':
                    fired = this.checkVolumeSentiment(ticker, analysisResult, rule);
                    break;
            }

            if (fired) {
                triggered.push({
                    rule,
                    ticker,
                    timestamp: Date.now(),
                    analysis: {
                        sentiment: analysisResult.sentiment,
                        status: analysisResult.status,
                        sampleSize: analysisResult.sampleSize,
                        volumeSpike: analysisResult.volumeSpike
                    },
                    price: priceData
                });

                // Set cooldown
                this.firedAlerts.set(cooldownKey, Date.now());
            }
        }

        // Update previous state for flip detection
        this.previousStates.set(ticker, {
            status: analysisResult.status,
            sentiment: analysisResult.sentiment,
            timestamp: Date.now()
        });

        // Fire alerts
        if (triggered.length > 0) {
            this.fireAlerts(triggered);
        }

        return triggered;
    }

    // ========================================================================
    // CONDITION CHECKS
    // ========================================================================

    checkDivergence(ticker, analysis, priceData, rule) {
        if (!priceData || priceData.change24h === null) return false;
        if (analysis.sampleSize < (rule.conditions.minSampleSize || 10)) return false;

        const c = rule.conditions;

        // Bullish divergence: sentiment bullish + price dropping
        if (c.sentimentMin !== undefined && c.priceChangeMax !== undefined) {
            return analysis.sentiment >= c.sentimentMin && priceData.change24h <= c.priceChangeMax;
        }

        // Bearish divergence: sentiment bearish + price rising
        if (c.sentimentMax !== undefined && c.priceChangeMin !== undefined) {
            return analysis.sentiment <= c.sentimentMax && priceData.change24h >= c.priceChangeMin;
        }

        return false;
    }

    checkInfluencerBurst(ticker, analysis, rule) {
        const c = rule.conditions;
        const minCount = c.minInfluencerCount || 5;

        return (analysis.influencerCount || 0) >= minCount;
    }

    checkSentimentFlip(ticker, analysis, rule) {
        const previous = this.previousStates.get(ticker);
        if (!previous) return false;

        const c = rule.conditions;
        const prevStatus = (previous.status || '').toUpperCase();
        const currStatus = (analysis.status || '').toUpperCase();

        return prevStatus.includes(c.fromStatus) && currStatus.includes(c.toStatus);
    }

    checkVolumeSentiment(ticker, analysis, rule) {
        const c = rule.conditions;

        if (!analysis.volumeSpike) return false;
        if (analysis.sampleSize < (c.minSampleSize || 15)) return false;

        return Math.abs(analysis.sentiment) >= (c.minAbsSentiment || 0.25);
    }

    // ========================================================================
    // FIRE ALERTS
    // ========================================================================

    fireAlerts(triggered) {
        triggered.forEach(alert => {
            const priorityEmoji = {
                critical: '🚨',
                high: '⚡',
                medium: '📊',
                low: 'ℹ️'
            }[alert.rule.priority] || '📊';

            const message = `${priorityEmoji} ${alert.rule.name}: $${alert.ticker} — ${alert.rule.description}`;

            console.log(`[ComboAlerts] ${message}`);

            // Send to background for browser notification
            try {
                chrome.runtime.sendMessage({
                    action: 'triggerAlert',
                    alert: {
                        name: `Combo: ${alert.rule.name}`,
                        text: `$${alert.ticker}: ${alert.rule.description} (Sentiment: ${alert.analysis.sentiment.toFixed(2)}, Status: ${alert.analysis.status})`,
                        author: 'TraderX ComboAlerts',
                        tickers: [alert.ticker],
                        timestamp: Date.now(),
                        priority: alert.rule.priority
                    }
                });
            } catch (e) {
                console.warn('[ComboAlerts] Failed to send notification:', e);
            }
        });
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    loadAlertRules() {
        try {
            const saved = localStorage.getItem('traderx_combo_alerts');
            if (saved) {
                this.alerts = JSON.parse(saved);
            } else {
                this.alerts = this.getDefaultRules();
                this.saveAlertRules();
            }
        } catch (e) {
            this.alerts = this.getDefaultRules();
        }
    }

    saveAlertRules() {
        try {
            localStorage.setItem('traderx_combo_alerts', JSON.stringify(this.alerts));
        } catch (e) { }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    addRule(rule) {
        this.alerts.push(rule);
        this.saveAlertRules();
    }

    removeRule(ruleId) {
        this.alerts = this.alerts.filter(r => r.id !== ruleId);
        this.saveAlertRules();
    }

    toggleRule(ruleId, enabled) {
        const rule = this.alerts.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            this.saveAlertRules();
        }
    }

    getRules() {
        return [...this.alerts];
    }

    toggle(enabled) {
        this.isEnabled = enabled;
    }
}

// Singleton
window.TraderXComboAlerts = window.TraderXComboAlerts || new ComboAlertEngine();
console.log('[TraderX] Combo Alerts v1.0 loaded');
