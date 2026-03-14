// ============================================================================
// TRADERX ANALYSIS ENGINE v4.0 — Major Algorithm Upgrades
// ============================================================================
// Changes from v3.0:
// - Time decay (exponential, ~4.6h half-life) on sentiment
// - Engagement-weighted sentiment scoring
// - EMA-based volume spike detection with z-score intensity
// - Negation detection (flips keyword polarity)
// - INSUFFICIENT_DATA awareness from fetcher
// - O(1) trusted-account Set lookup alongside tier Map
// ============================================================================

class EnhancedAnalysisEngine {
    constructor() {
        this.isModelLoaded = false;
        this.modelLoadAttempted = false;
        this.pipeline = null;
        this.workerReady = false;
        this.workerCallbacks = new Map();
        this.workerCallbackId = 0;

        // Influencer tiers from accounts.json
        this.tierWeights = {
            tier1: 3.0,  // Critical sources (central banks, official)
            tier2: 2.0,  // Trusted analysts
            tier3: 1.5,  // Signals
            default: 1.0
        };

        this.trustedAccounts = new Map();  // handle -> tier
        this.trustedAccountSet = new Set(); // O(1) lookup for "is trusted?"
        this.accountsLoaded = false;

        // Volume tracking — now with EMA
        this.volumeHistory = new Map(); // ticker -> array of {count, timestamp}
        this.volumeWindowHours = 24;

        // Time decay: half-life ~4.6 hours (decay constant 0.15)
        this.DECAY_CONSTANT = 0.15;

        // Sentiment thresholds
        this.BULLISH_THRESHOLD = 0.15;
        this.BEARISH_THRESHOLD = -0.15;
        this.HIGH_VOL_THRESHOLD = 0.35;

        // Negation words (detected within 3-word window before keyword)
        this.NEGATION_WORDS = new Set([
            'not', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't",
            'never', 'no', 'without', 'barely', 'hardly', "isn't", "aren't",
            "wasn't", "weren't", "hasn't", "haven't", "hadn't", "shouldn't"
        ]);
        this.NEGATION_WINDOW = 3; // words before keyword

        // Enhanced keyword weights (fallback)
        this.bullishKeywords = {
            'moon': 0.8, 'mooning': 0.9, 'breakout': 0.7, 'bullish': 0.6,
            'pump': 0.5, 'rally': 0.6, 'surge': 0.6, 'soar': 0.7,
            'ath': 0.8, 'all time high': 0.8, 'new high': 0.7,
            'bullrun': 0.8, 'bull run': 0.8, 'parabolic': 0.9,
            'explosion': 0.7, 'exploding': 0.7, 'skyrocket': 0.8,
            'buy': 0.3, 'buying': 0.3, 'long': 0.4, 'longing': 0.4,
            'accumulate': 0.4, 'accumulation': 0.4, 'load up': 0.5,
            'undervalued': 0.5, 'oversold': 0.4, 'dip': 0.2,
            'support': 0.3, 'holding': 0.2, 'hodl': 0.4,
            'green': 0.2, 'gains': 0.3, 'profit': 0.3, 'up': 0.1,
            'bullish divergence': 0.6, 'golden cross': 0.7,
            'higher low': 0.4, 'higher high': 0.4
        };

        this.bearishKeywords = {
            'crash': 0.8, 'crashed': 0.8, 'crashing': 0.9, 'dump': 0.7,
            'dumping': 0.7, 'plunge': 0.8, 'plummeting': 0.8, 'collapse': 0.9,
            'bearish': 0.6, 'selloff': 0.7, 'sell-off': 0.7,
            'capitulation': 0.8, 'liquidation': 0.7, 'liquidated': 0.7,
            'rekt': 0.6, 'wrecked': 0.6, 'destroyed': 0.5,
            'sell': 0.3, 'selling': 0.3, 'short': 0.4, 'shorting': 0.4,
            'overbought': 0.4, 'overvalued': 0.5, 'resistance': 0.2,
            'breakdown': 0.5, 'break down': 0.5, 'breaking down': 0.6,
            'red': 0.2, 'loss': 0.3, 'losses': 0.3, 'down': 0.1,
            'bearish divergence': 0.6, 'death cross': 0.7,
            'lower high': 0.4, 'lower low': 0.4, 'rejection': 0.3
        };

        this.volatilityKeywords = [
            'volatile', 'volatility', 'choppy', 'whipsaw', 'wild',
            'uncertain', 'unstable', 'swinging', 'unpredictable',
            'squeeze', 'gamma squeeze', 'short squeeze'
        ];

        // Sentiment history for sparklines (per ticker)
        this.sentimentHistory = new Map(); // ticker -> [{sentiment, timestamp, sampleSize}]
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async init() {
        console.log('[AnalysisEngine] Initializing v4.0...');

        await this.loadTrustedAccounts();
        this.loadVolumeHistory();
        this.loadSentimentHistory();
        await this.loadModel();

        console.log('[AnalysisEngine] Initialization complete');
    }

    async loadTrustedAccounts() {
        try {
            const url = chrome.runtime.getURL('accounts.json');
            const response = await fetch(url);
            const data = await response.json();

            const categories = data.accounts || {};

            const tier1Categories = ['Macro_CentralBanks', 'Regulatory_Government'];
            const tier2Categories = ['Institutional_AssetMgmt', 'Media_News', 'Wealth_ValueInvesting'];
            const tier3Categories = ['Trading_TechnicalAnalysis', 'Crypto_DeFi', 'Forex', 'Commodities'];

            Object.entries(categories).forEach(([category, handles]) => {
                let tier = 'tier3';
                if (tier1Categories.includes(category)) tier = 'tier1';
                else if (tier2Categories.includes(category)) tier = 'tier2';

                handles.forEach(handle => {
                    const normalized = handle.toLowerCase().replace('@', '');
                    this.trustedAccounts.set(normalized, tier);
                    this.trustedAccountSet.add(normalized); // O(1) lookup
                });
            });

            this.accountsLoaded = true;
            console.log(`[AnalysisEngine] Loaded ${this.trustedAccounts.size} trusted accounts`);
        } catch (e) {
            console.error('[AnalysisEngine] Failed to load accounts:', e);
        }
    }

    isTrustedAccount(author) {
        const normalized = (author || '').toLowerCase().replace('@', '');
        return this.trustedAccountSet.has(normalized);
    }

    async loadModel() {
        if (this.modelLoadAttempted) return;
        this.modelLoadAttempted = true;

        try {
            // Try loading FinBERT via Web Worker first
            if (typeof Worker !== 'undefined') {
                try {
                    const workerUrl = chrome.runtime.getURL('content/finbert-worker.js');
                    this.worker = new Worker(workerUrl);

                    this.worker.onmessage = (e) => {
                        const { id, result, error, type } = e.data;

                        if (type === 'ready') {
                            this.workerReady = true;
                            this.isModelLoaded = true;
                            console.log('[AnalysisEngine] FinBERT Web Worker ready!');
                            return;
                        }

                        if (type === 'error') {
                            console.warn('[AnalysisEngine] Worker error:', error);
                            this.workerReady = false;
                            return;
                        }

                        const callback = this.workerCallbacks.get(id);
                        if (callback) {
                            this.workerCallbacks.delete(id);
                            if (error) callback.reject(new Error(error));
                            else callback.resolve(result);
                        }
                    };

                    this.worker.onerror = (e) => {
                        console.warn('[AnalysisEngine] Worker failed to load, using keyword fallback');
                        this.workerReady = false;
                    };

                    // Give the worker 10 seconds to initialize
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    if (this.workerReady) {
                        console.log('[AnalysisEngine] Using FinBERT Web Worker for inference');
                        return;
                    }
                } catch (workerErr) {
                    console.warn('[AnalysisEngine] Worker init failed:', workerErr.message);
                }
            }

            // Fallback: try Transformers.js on main thread
            if (typeof window.transformers !== 'undefined' || typeof window.pipeline !== 'undefined') {
                console.log('[AnalysisEngine] Loading FinBERT on main thread...');
                const { pipeline } = window.transformers || window;
                this.pipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
                    quantized: true
                });
                this.isModelLoaded = true;
                console.log('[AnalysisEngine] FinBERT model loaded successfully!');
            } else {
                console.log('[AnalysisEngine] No ML runtime found, using keyword analysis');
            }
        } catch (e) {
            console.warn('[AnalysisEngine] Model load failed, using fallback:', e.message);
            this.isModelLoaded = false;
        }
    }

    // ========================================================================
    // MAIN ANALYSIS
    // ========================================================================

    async analyzeTicker(fetchResult, ticker = null) {
        // Handle both old array format and new result object format
        let tweets, confidence, insufficientData;

        if (Array.isArray(fetchResult)) {
            // Legacy: raw tweet array
            tweets = fetchResult;
            confidence = tweets.length >= 25 ? 'high' : tweets.length >= 10 ? 'medium' : 'low';
            insufficientData = tweets.length < 5;
        } else {
            // New format from TwitterFetcher v4
            tweets = fetchResult.tweets || [];
            confidence = fetchResult.confidence || 'low';
            insufficientData = fetchResult.insufficientData || false;
        }

        if (!tweets || tweets.length === 0) {
            return {
                sentiment: 0,
                status: 'NO DATA',
                confidence: 'low',
                insufficientData: true,
                sampleSize: 0,
                breakdown: { bullish: 0, bearish: 0, neutral: 0 },
                volumeSpike: false,
                spikeIntensity: 0
            };
        }

        // Track volume
        if (ticker) {
            this.recordVolume(ticker, tweets.length);
        }

        // Analyze each tweet with time decay + engagement weighting
        const analyses = await Promise.all(tweets.map(async tweet => {
            const text = typeof tweet === 'string' ? tweet : (tweet.text || tweet.content || '');
            const author = typeof tweet === 'object' ? (tweet.author || tweet.username || '').toLowerCase().replace('@', '') : '';
            const tweetTimestamp = typeof tweet === 'object' ? tweet.timestamp : null;

            // Get sentiment score (with negation detection)
            let score;
            if (this.workerReady) {
                score = await this.analyzeWithWorker(text);
            } else if (this.isModelLoaded && this.pipeline) {
                score = await this.analyzeWithModel(text);
            } else {
                score = this.analyzeText(text);
            }

            // Apply influencer tier weighting
            const tier = this.trustedAccounts.get(author);
            const tierWeight = tier ? this.tierWeights[tier] : this.tierWeights.default;

            // Apply time decay
            const decayFactor = this.computeTimeDecay(tweetTimestamp);

            // Apply engagement weighting
            const engagementMultiplier = this.computeEngagementWeight(tweet);

            // Final effective weight = tier × decay × engagement
            const effectiveWeight = tierWeight * decayFactor * engagementMultiplier;

            return {
                score,
                weight: effectiveWeight,
                tierWeight,
                decayFactor,
                engagementMultiplier,
                author,
                tier,
                text: text.substring(0, 100)
            };
        }));

        // Calculate weighted average
        let totalWeight = 0;
        let weightedSum = 0;
        let bullishCount = 0;
        let bearishCount = 0;
        let neutralCount = 0;

        analyses.forEach(a => {
            weightedSum += a.score * a.weight;
            totalWeight += a.weight;

            if (a.score > 0.2) bullishCount++;
            else if (a.score < -0.2) bearishCount++;
            else neutralCount++;
        });

        const avgSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;

        // Calculate volatility (standard deviation)
        const scores = analyses.map(a => a.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        // Volume spike detection (EMA + z-score)
        const volumeSpikeResult = ticker ? this.checkVolumeSpike(ticker, tweets.length) : { isSpike: false, intensity: 0 };

        // Determine status
        let status;
        if (insufficientData) {
            status = 'LOW DATA';
        } else if (stdDev > this.HIGH_VOL_THRESHOLD || volumeSpikeResult.isSpike) {
            status = 'VOLATILE';
        } else if (avgSentiment > 0.3) {
            status = 'VERY BULLISH';
        } else if (avgSentiment > this.BULLISH_THRESHOLD) {
            status = 'BULLISH';
        } else if (avgSentiment < -0.3) {
            status = 'VERY BEARISH';
        } else if (avgSentiment < this.BEARISH_THRESHOLD) {
            status = 'BEARISH';
        } else {
            status = 'NEUTRAL';
        }

        const result = {
            sentiment: avgSentiment,
            status,
            confidence,
            insufficientData,
            sampleSize: tweets.length,
            breakdown: {
                bullish: bullishCount,
                bearish: bearishCount,
                neutral: neutralCount
            },
            stdDev,
            volumeSpike: volumeSpikeResult.isSpike,
            spikeIntensity: volumeSpikeResult.intensity,
            influencerCount: analyses.filter(a => a.tier).length,
            topAnalyses: analyses
                .filter(a => a.tier)
                .sort((a, b) => Math.abs(b.score * b.weight) - Math.abs(a.score * a.weight))
                .slice(0, 5)
        };

        // Record sentiment history for sparklines
        if (ticker) {
            this.recordSentiment(ticker, avgSentiment, tweets.length, confidence);
        }

        return result;
    }

    // ========================================================================
    // TIME DECAY (Exponential, ~4.6h half-life)
    // ========================================================================

    computeTimeDecay(timestamp) {
        if (!timestamp) return 0.7; // Unknown age: penalize slightly

        let tweetDate;
        if (typeof timestamp === 'string') {
            tweetDate = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
            tweetDate = new Date(timestamp);
        } else {
            return 0.7;
        }

        if (isNaN(tweetDate.getTime())) return 0.7;

        const ageHours = (Date.now() - tweetDate.getTime()) / 3_600_000;
        if (ageHours < 0) return 1.0; // Future timestamp — treat as fresh

        // Exponential decay: e^(-0.15 * hours)
        // Half-life ≈ ln(2) / 0.15 ≈ 4.62 hours
        const decayFactor = Math.exp(-this.DECAY_CONSTANT * ageHours);

        // Floor at 0.1 — very old tweets still count a tiny bit
        return Math.max(0.1, decayFactor);
    }

    // ========================================================================
    // ENGAGEMENT WEIGHTING
    // ========================================================================

    computeEngagementWeight(tweet) {
        if (typeof tweet !== 'object') return 1.0;

        const likes = tweet.likes || 0;
        const retweets = tweet.retweets || 0;
        const replies = tweet.replies || 0;

        // Weighted engagement score: retweets most valuable, then likes, then replies
        const engagementScore = likes + (retweets * 3) + (replies * 2);

        // Log scale so viral tweets don't dominate completely
        // log10(1) = 0, log10(11) = 1.04, log10(101) = 2.0, log10(1001) = 3.0
        const multiplier = Math.log10(1 + engagementScore);

        // Floor at 1.0 (tweets with 0 engagement still count normally)
        return Math.max(1.0, multiplier);
    }

    // ========================================================================
    // MODEL-BASED ANALYSIS (FinBERT via Web Worker)
    // ========================================================================

    async analyzeWithWorker(text) {
        if (!this.workerReady || !text) return this.analyzeText(text);

        try {
            const id = ++this.workerCallbackId;

            const result = await Promise.race([
                new Promise((resolve, reject) => {
                    this.workerCallbacks.set(id, { resolve, reject });
                    this.worker.postMessage({ id, text: text.substring(0, 512) });
                }),
                // 5 second timeout — fall back to keywords
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            return result;
        } catch (e) {
            console.warn('[AnalysisEngine] Worker inference timeout, falling back to keywords');
            return this.analyzeText(text);
        }
    }

    async analyzeWithModel(text) {
        if (!this.pipeline || !text) return 0;

        try {
            const truncated = text.substring(0, 512);
            const result = await this.pipeline(truncated);

            const label = result[0].label.toLowerCase();
            const score = result[0].score;

            if (label.includes('positive')) return score;
            if (label.includes('negative')) return -score;
            return 0;
        } catch (e) {
            console.warn('[AnalysisEngine] Model inference failed:', e.message);
            return this.analyzeText(text);
        }
    }

    // ========================================================================
    // KEYWORD-BASED ANALYSIS with NEGATION DETECTION
    // ========================================================================

    analyzeText(text) {
        if (!text) return 0;

        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\s+/);
        let bullishScore = 0;
        let bearishScore = 0;
        let totalWeight = 0;

        // Check multi-word keywords first
        for (const [keyword, weight] of Object.entries(this.bullishKeywords)) {
            if (keyword.includes(' ')) {
                // Multi-word: check phrase in text
                if (lowerText.includes(keyword)) {
                    const negated = this.isNegated(lowerText, keyword);
                    if (negated) {
                        bearishScore += weight * 0.7; // Flip to bearish at reduced intensity
                    } else {
                        bullishScore += weight;
                    }
                    totalWeight += weight;
                }
            }
        }

        for (const [keyword, weight] of Object.entries(this.bearishKeywords)) {
            if (keyword.includes(' ')) {
                if (lowerText.includes(keyword)) {
                    const negated = this.isNegated(lowerText, keyword);
                    if (negated) {
                        bullishScore += weight * 0.7;
                    } else {
                        bearishScore += weight;
                    }
                    totalWeight += weight;
                }
            }
        }

        // Check single-word keywords with word-boundary matching
        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^a-z]/g, '');
            if (!word) continue;

            // Check bullish
            if (this.bullishKeywords[word] !== undefined) {
                const weight = this.bullishKeywords[word];
                const negated = this.isNegatedAtIndex(words, i);
                if (negated) {
                    bearishScore += weight * 0.7;
                } else {
                    bullishScore += weight;
                }
                totalWeight += weight;
            }

            // Check bearish
            if (this.bearishKeywords[word] !== undefined) {
                const weight = this.bearishKeywords[word];
                const negated = this.isNegatedAtIndex(words, i);
                if (negated) {
                    bullishScore += weight * 0.7;
                } else {
                    bearishScore += weight;
                }
                totalWeight += weight;
            }
        }

        if (totalWeight === 0) return 0;

        const rawScore = (bullishScore - bearishScore) / totalWeight;
        return Math.max(-1, Math.min(1, rawScore));
    }

    // ========================================================================
    // NEGATION DETECTION
    // ========================================================================

    isNegated(text, keyword) {
        const keywordIndex = text.indexOf(keyword);
        if (keywordIndex < 0) return false;

        // Get words before the keyword
        const before = text.substring(Math.max(0, keywordIndex - 40), keywordIndex).trim();
        const wordsBefore = before.split(/\s+/);

        // Check last N words before keyword for negation
        const windowWords = wordsBefore.slice(-this.NEGATION_WINDOW);
        return windowWords.some(w => this.NEGATION_WORDS.has(w.replace(/[^a-z']/g, '')));
    }

    isNegatedAtIndex(words, index) {
        // Check the N words before this index for negation words
        const start = Math.max(0, index - this.NEGATION_WINDOW);
        for (let i = start; i < index; i++) {
            const word = words[i].replace(/[^a-z']/g, '');
            if (this.NEGATION_WORDS.has(word)) return true;
        }
        return false;
    }

    // ========================================================================
    // VOLUME TRACKING with EMA + Z-SCORE SPIKE DETECTION
    // ========================================================================

    recordVolume(ticker, count) {
        if (!this.volumeHistory.has(ticker)) {
            this.volumeHistory.set(ticker, []);
        }

        const history = this.volumeHistory.get(ticker);
        history.push({
            count,
            timestamp: Date.now()
        });

        // Keep only last 24 hours
        const cutoff = Date.now() - (this.volumeWindowHours * 60 * 60 * 1000);
        const filtered = history.filter(h => h.timestamp > cutoff);
        this.volumeHistory.set(ticker, filtered);

        this.saveVolumeHistory();
    }

    checkVolumeSpike(ticker, currentCount) {
        const history = this.volumeHistory.get(ticker);
        if (!history || history.length < 5) return { isSpike: false, intensity: 0 };

        // Compute EMA for different windows
        const now = Date.now();
        const oneHourAgo = now - 3_600_000;
        const fourHoursAgo = now - 4 * 3_600_000;

        const recent1h = history.filter(h => h.timestamp > oneHourAgo);
        const recent4h = history.filter(h => h.timestamp > fourHoursAgo);
        const all24h = history;

        // EMA of 24h data
        const ema24h = this.computeEMA(all24h.map(h => h.count));

        // Standard deviation of 24h data
        const counts24h = all24h.map(h => h.count);
        const mean24h = counts24h.reduce((a, b) => a + b, 0) / counts24h.length;
        const variance24h = counts24h.reduce((sum, c) => sum + Math.pow(c - mean24h, 2), 0) / counts24h.length;
        const stdDev24h = Math.sqrt(variance24h);

        // Z-score: how many standard deviations above the EMA
        const zScore = stdDev24h > 0 ? (currentCount - ema24h) / stdDev24h : 0;

        // Spike thresholds
        // z > 2.0 = notable spike
        // z > 3.0 = extreme spike
        const isSpike = zScore > 2.0;

        return {
            isSpike,
            intensity: Math.max(0, zScore),  // z-score as intensity
            ema24h,
            stdDev24h,
            zScore,
            label: zScore > 3.0 ? 'EXTREME' : zScore > 2.0 ? 'NOTABLE' : 'NORMAL'
        };
    }

    computeEMA(values, smoothing = 0.2) {
        if (values.length === 0) return 0;
        if (values.length === 1) return values[0];

        let ema = values[0];
        for (let i = 1; i < values.length; i++) {
            ema = (values[i] * smoothing) + (ema * (1 - smoothing));
        }
        return ema;
    }

    // ========================================================================
    // SENTIMENT HISTORY (for sparklines)
    // ========================================================================

    recordSentiment(ticker, sentiment, sampleSize, confidence) {
        if (!this.sentimentHistory.has(ticker)) {
            this.sentimentHistory.set(ticker, []);
        }

        const history = this.sentimentHistory.get(ticker);
        history.push({
            sentiment,
            sampleSize,
            confidence,
            timestamp: Date.now()
        });

        // Keep last 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const filtered = history.filter(h => h.timestamp > cutoff);
        this.sentimentHistory.set(ticker, filtered);

        this.saveSentimentHistory();
    }

    getSentimentHistory(ticker) {
        return this.sentimentHistory.get(ticker) || [];
    }

    saveSentimentHistory() {
        try {
            const data = {};
            this.sentimentHistory.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('traderx_sentiment_history', JSON.stringify(data));
        } catch (e) { }
    }

    loadSentimentHistory() {
        try {
            const saved = localStorage.getItem('traderx_sentiment_history');
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data).forEach(([key, value]) => {
                    this.sentimentHistory.set(key, value);
                });
            }
        } catch (e) { }
    }

    // ========================================================================
    // VOLUME PERSISTENCE
    // ========================================================================

    saveVolumeHistory() {
        try {
            const data = {};
            this.volumeHistory.forEach((value, key) => {
                data[key] = value;
            });
            localStorage.setItem('traderx_volume_history', JSON.stringify(data));
        } catch (e) { }
    }

    loadVolumeHistory() {
        try {
            const saved = localStorage.getItem('traderx_volume_history');
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data).forEach(([key, value]) => {
                    this.volumeHistory.set(key, value);
                });
            }
        } catch (e) { }
    }

    // ========================================================================
    // UTILITY
    // ========================================================================

    getInfluencerInfo(author) {
        const normalized = author.toLowerCase().replace('@', '');
        const tier = this.trustedAccounts.get(normalized);
        return tier ? {
            tier,
            weight: this.tierWeights[tier],
            label: tier === 'tier1' ? 'Critical' : tier === 'tier2' ? 'Trusted' : 'Signal'
        } : null;
    }
}

// Initialize
const engine = new EnhancedAnalysisEngine();
window.TraderXAnalysisEngine = engine;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => engine.init());
} else {
    engine.init();
}

console.log('[TraderX] Enhanced Analysis Engine v4.0 loaded');
