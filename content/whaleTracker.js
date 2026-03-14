// ============================================================================
// TRADERX WHALE TRACKER v1.0 — Large Wallet & Institutional Flow Monitor
// ============================================================================
// Tracks significant on-chain movements:
// - Large wallet transactions (>$100k)
// - Exchange inflows/outflows
// - Smart money movements
// - Institutional wallet tracking
// - Whale alert notifications
//
// Supported networks:
// - Bitcoin (BTC)
// - Ethereum (ETH) + ERC-20 tokens
// - Solana (SOL)
// - Binance Smart Chain
// ============================================================================

class WhaleTracker {
  constructor() {
    this.whaleThreshold = 100000; // $100k minimum transaction
    this.transactions = [];
    this.watchedWallets = new Map(); // address -> metadata
    this.exchangeWallets = new Map(); // address -> exchange name
    this.whaleAlerts = [];
    this.isTracking = false;
    this.updateInterval = 60000; // 1 minute
    this.intervalId = null;

    // API keys (user should configure these)
    this.apiKeys = {
      etherscan: "", // Etherscan API key
      bscscan: "", // BSCScan API key
      solscan: "", // Solscan API key
      blockchain: "", // Blockchain.com API key
    };

    // Known exchange wallets
    this.initExchangeWallets();

    // Load saved data
    this.loadData();
  }

  // ========================================================================
  // EXCHANGE WALLET DATABASE
  // ========================================================================

  initExchangeWallets() {
    // Ethereum/ERC-20 exchange wallets
    const ethExchanges = {
      // Binance
      "0x28c6c06298d514db089934071355e5743bf21d60": "Binance 1",
      "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance 2",
      "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance 3",
      "0x564286362092d8e7936f0549571a803b203aaced": "Binance 4",
      "0x0681d8db095565fe8a346fa0277bffde9c0edbbf": "Binance 5",

      // Coinbase
      "0x503828976d22510aad0201ac7ec88293211d23da": "Coinbase 1",
      "0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740": "Coinbase 2",
      "0x3cd751e6b0078be393132286c442345e5dc49699": "Coinbase 3",
      "0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511": "Coinbase 4",

      // Kraken
      "0x2910543af39aba0cd09dbb2d50200b3e800a63d2": "Kraken 1",
      "0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13": "Kraken 2",
      "0xe853c56864a2ebe4576a807d26fdc4a0ada51919": "Kraken 3",

      // Bitfinex
      "0x876eabf441b2ee5b5b0554fd502a8e0600950cfa": "Bitfinex 1",
      "0x742d35cc6634c0532925a3b844bc9e7595f0beb": "Bitfinex 2",

      // Huobi
      "0xab5c66752a9e8167967685f1450532fb96d5d24f": "Huobi 1",
      "0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b": "Huobi 2",

      // Gemini
      "0x5f65f7b609678448494de4c87521cdf6cef1e932": "Gemini 1",
      "0xd24400ae8bfebb18ca49be86258a3c749cf46853": "Gemini 2",

      // FTX (historical)
      "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2": "FTX (Defunct)",

      // OKX
      "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": "OKX 1",
      "0x236f9f97e0e62388479bf9e5ba4889e46b0273c3": "OKX 2",

      // Bittrex
      "0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98": "Bittrex 1",
    };

    Object.entries(ethExchanges).forEach(([address, name]) => {
      this.exchangeWallets.set(address.toLowerCase(), {
        name,
        network: "ethereum",
        type: "exchange",
      });
    });

    console.log(
      "[Whale Tracker] Loaded",
      this.exchangeWallets.size,
      "exchange wallets",
    );
  }

  // ========================================================================
  // TRANSACTION MONITORING
  // ========================================================================

  async startTracking(tickers = []) {
    if (this.isTracking) {
      console.log("[Whale Tracker] Already tracking");
      return;
    }

    this.isTracking = true;
    this.watchedTickers = tickers;

    console.log("[Whale Tracker] Started tracking:", tickers.join(", "));

    // Initial fetch
    await this.fetchWhaleTransactions();

    // Poll for updates
    this.intervalId = setInterval(() => {
      this.fetchWhaleTransactions();
    }, this.updateInterval);
  }

  stopTracking() {
    this.isTracking = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[Whale Tracker] Stopped tracking");
  }

  async fetchWhaleTransactions() {
    const tickers = this.watchedTickers || ["BTC", "ETH", "SOL"];

    for (const ticker of tickers) {
      try {
        if (ticker === "BTC") {
          await this.fetchBitcoinWhales();
        } else if (ticker === "ETH") {
          await this.fetchEthereumWhales();
        } else if (ticker === "SOL") {
          await this.fetchSolanaWhales();
        } else {
          // Try as ERC-20 token
          await this.fetchERC20Whales(ticker);
        }
      } catch (error) {
        console.error(`[Whale Tracker] Error fetching ${ticker}:`, error);
      }
    }
  }

  // ========================================================================
  // BITCOIN WHALE TRACKING
  // ========================================================================

  async fetchBitcoinWhales() {
    try {
      // Use blockchain.com API or similar
      const response = await fetch(
        "https://blockchain.info/unconfirmed-transactions?format=json",
      );
      const data = await response.json();

      if (data.txs) {
        data.txs.forEach((tx) => {
          const value =
            tx.out.reduce((sum, output) => sum + output.value, 0) / 100000000; // Convert satoshis
          const valueUSD = value * this.getBTCPrice(); // Need current BTC price

          if (valueUSD >= this.whaleThreshold) {
            this.addTransaction({
              hash: tx.hash,
              network: "bitcoin",
              ticker: "BTC",
              from: tx.inputs[0]?.prev_out?.addr || "Unknown",
              to: tx.out[0]?.addr || "Unknown",
              amount: value,
              amountUSD: valueUSD,
              timestamp: tx.time * 1000,
              type: this.classifyTransaction(
                tx.inputs[0]?.prev_out?.addr,
                tx.out[0]?.addr,
                "bitcoin",
              ),
            });
          }
        });
      }
    } catch (error) {
      console.error("[Whale Tracker] BTC fetch error:", error);
    }
  }

  // ========================================================================
  // ETHEREUM WHALE TRACKING
  // ========================================================================

  async fetchEthereumWhales() {
    if (!this.apiKeys.etherscan) {
      console.warn("[Whale Tracker] Etherscan API key not configured");
      return;
    }

    try {
      // Fetch recent large ETH transfers
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=0x0000000000000000000000000000000000000000&sort=desc&apikey=${this.apiKeys.etherscan}`;

      // Note: This is a placeholder. In production, you'd monitor specific large wallets
      // or use Etherscan's paid API for whale alerts

      // Alternative: Use free whale alert services
      const whaleAlertUrl = "https://api.whale-alert.io/v1/transactions";
      // Requires whale-alert.io API key
    } catch (error) {
      console.error("[Whale Tracker] ETH fetch error:", error);
    }
  }

  async fetchERC20Whales(ticker) {
    // Similar to ETH but for specific token contracts
    // Would need token contract addresses mapped to tickers
  }

  // ========================================================================
  // SOLANA WHALE TRACKING
  // ========================================================================

  async fetchSolanaWhales() {
    try {
      // Use Solscan API or Solana RPC
      // This is a simplified example
      console.log("[Whale Tracker] Solana tracking (placeholder)");
    } catch (error) {
      console.error("[Whale Tracker] SOL fetch error:", error);
    }
  }

  // ========================================================================
  // TRANSACTION CLASSIFICATION
  // ========================================================================

  classifyTransaction(from, to, network) {
    const fromLower = from?.toLowerCase() || "";
    const toLower = to?.toLowerCase() || "";

    const fromExchange = this.exchangeWallets.get(fromLower);
    const toExchange = this.exchangeWallets.get(toLower);

    if (fromExchange && toExchange) {
      return "exchange_to_exchange";
    } else if (fromExchange) {
      return "exchange_outflow"; // Potentially bullish - coins leaving exchange
    } else if (toExchange) {
      return "exchange_inflow"; // Potentially bearish - coins going to exchange
    } else {
      return "whale_transfer"; // Large wallet to wallet
    }
  }

  addTransaction(tx) {
    // Check if we already have this transaction
    if (this.transactions.find((t) => t.hash === tx.hash)) {
      return;
    }

    // Add to transactions
    this.transactions.unshift(tx);

    // Limit to last 500 transactions
    if (this.transactions.length > 500) {
      this.transactions = this.transactions.slice(0, 500);
    }

    // Create alert if significant
    if (tx.amountUSD >= 1000000) {
      // $1M+
      this.createAlert(tx);
    }

    this.saveData();
  }

  // ========================================================================
  // ALERTS
  // ========================================================================

  createAlert(tx) {
    const alert = {
      id: `whale_${Date.now()}`,
      timestamp: Date.now(),
      transaction: tx,
      message: this.generateAlertMessage(tx),
      priority: tx.amountUSD >= 10000000 ? "critical" : "high",
    };

    this.whaleAlerts.unshift(alert);

    // Limit alerts
    if (this.whaleAlerts.length > 100) {
      this.whaleAlerts = this.whaleAlerts.slice(0, 100);
    }

    // Send notification
    this.sendNotification(alert);

    this.saveData();
  }

  generateAlertMessage(tx) {
    const amount = `$${this.formatNumber(tx.amountUSD)}`;
    const ticker = tx.ticker;

    let message = "";

    switch (tx.type) {
      case "exchange_inflow":
        message = `🐋 ${amount} in ${ticker} moved TO exchange - Potential sell pressure`;
        break;
      case "exchange_outflow":
        message = `🐋 ${amount} in ${ticker} moved FROM exchange - Potential accumulation`;
        break;
      case "whale_transfer":
        message = `🐋 ${amount} in ${ticker} moved between whales`;
        break;
      case "exchange_to_exchange":
        message = `🐋 ${amount} in ${ticker} moved between exchanges`;
        break;
      default:
        message = `🐋 Large ${ticker} transaction: ${amount}`;
    }

    return message;
  }

  sendNotification(alert) {
    try {
      chrome.runtime.sendMessage({
        action: "triggerAlert",
        alert: {
          name: "Whale Alert",
          text: alert.message,
          author: "Whale Tracker",
          tickers: [alert.transaction.ticker],
          timestamp: alert.timestamp,
          priority: alert.priority,
        },
      });
    } catch (e) {
      console.warn("[Whale Tracker] Failed to send notification:", e);
    }
  }

  // ========================================================================
  // WALLET MANAGEMENT
  // ========================================================================

  addWatchedWallet(address, metadata = {}) {
    this.watchedWallets.set(address.toLowerCase(), {
      address: address.toLowerCase(),
      label: metadata.label || "Unlabeled Wallet",
      network: metadata.network || "ethereum",
      type: metadata.type || "whale",
      addedAt: Date.now(),
      ...metadata,
    });

    this.saveData();
  }

  removeWatchedWallet(address) {
    this.watchedWallets.delete(address.toLowerCase());
    this.saveData();
  }

  getWatchedWallets() {
    return Array.from(this.watchedWallets.values());
  }

  // ========================================================================
  // ANALYTICS
  // ========================================================================

  getFlowAnalysis(ticker, timeframe = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeframe;
    const relevant = this.transactions.filter(
      (tx) => tx.ticker === ticker && tx.timestamp >= cutoff,
    );

    let exchangeInflow = 0;
    let exchangeOutflow = 0;
    let whaleTransfers = 0;

    relevant.forEach((tx) => {
      if (tx.type === "exchange_inflow") {
        exchangeInflow += tx.amountUSD;
      } else if (tx.type === "exchange_outflow") {
        exchangeOutflow += tx.amountUSD;
      } else if (tx.type === "whale_transfer") {
        whaleTransfers += tx.amountUSD;
      }
    });

    const netFlow = exchangeOutflow - exchangeInflow;
    const sentiment =
      netFlow > 0 ? "bullish" : netFlow < 0 ? "bearish" : "neutral";

    return {
      ticker,
      timeframe,
      transactionCount: relevant.length,
      exchangeInflow,
      exchangeOutflow,
      netFlow,
      whaleTransfers,
      sentiment,
      signal: this.interpretFlow(netFlow, exchangeInflow, exchangeOutflow),
    };
  }

  interpretFlow(netFlow, inflow, outflow) {
    if (Math.abs(netFlow) < 1000000) {
      return "No significant flow";
    }

    if (netFlow > 10000000) {
      return "Strong accumulation - Large outflow from exchanges (BULLISH)";
    } else if (netFlow > 5000000) {
      return "Accumulation - Coins leaving exchanges (BULLISH)";
    } else if (netFlow < -10000000) {
      return "Heavy distribution - Large inflow to exchanges (BEARISH)";
    } else if (netFlow < -5000000) {
      return "Distribution - Coins moving to exchanges (BEARISH)";
    }

    return "Mixed signals";
  }

  // ========================================================================
  // UI - WHALE TRACKER DASHBOARD
  // ========================================================================

  show() {
    const existing = document.getElementById("traderx-whale-modal");
    if (existing) {
      existing.remove();
      return;
    }

    const recentTxs = this.transactions.slice(0, 50);
    const recentAlerts = this.whaleAlerts.slice(0, 20);

    const modal = document.createElement("div");
    modal.id = "traderx-whale-modal";
    modal.innerHTML = `
      <style>
        #traderx-whale-modal {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
          z-index: 100001; display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif; color: #F2F6F8;
          animation: whaleFadeIn 0.2s ease;
        }
        @keyframes whaleFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .whale-container {
          background: linear-gradient(135deg, #0F1419 0%, #1A1F2A 100%);
          border: 1px solid rgba(242,246,248,0.12); border-radius: 20px;
          width: 95%; max-width: 1400px; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 30px 80px rgba(0,0,0,0.7);
        }

        .whale-header {
          padding: 24px 32px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          display: flex; justify-content: space-between; align-items: center;
        }

        .whale-title {
          font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px;
        }

        .whale-status {
          background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 700; text-transform: uppercase;
        }

        .whale-close {
          background: rgba(255,255,255,0.2); border: none; color: white;
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          font-size: 24px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .whale-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }

        .whale-body {
          padding: 24px 32px; overflow-y: auto; flex: 1;
          display: grid; grid-template-columns: 1fr 350px; gap: 24px;
        }

        .whale-main { display: flex; flex-direction: column; gap: 20px; }
        .whale-sidebar { display: flex; flex-direction: column; gap: 20px; }

        .whale-section {
          background: rgba(242,246,248,0.02); border: 1px solid rgba(242,246,248,0.06);
          border-radius: 16px; padding: 20px;
        }

        .whale-section-title {
          font-size: 16px; font-weight: 700; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .whale-tx-list { display: flex; flex-direction: column; gap: 12px; }

        .whale-tx {
          background: rgba(242,246,248,0.03); border: 1px solid rgba(242,246,248,0.06);
          border-radius: 12px; padding: 16px; transition: all 0.2s; cursor: pointer;
        }
        .whale-tx:hover { background: rgba(242,246,248,0.05); border-color: #3B82F6; }

        .whale-tx-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 12px;
        }

        .whale-tx-amount {
          font-size: 20px; font-weight: 800; color: #3B82F6;
        }

        .whale-tx-ticker {
          background: rgba(59,130,246,0.2); color: #60A5FA;
          padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
        }

        .whale-tx-type {
          font-size: 13px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
        }

        .whale-tx-type-badge {
          padding: 3px 8px; border-radius: 6px; font-size: 10px;
          font-weight: 700; text-transform: uppercase;
        }

        .whale-tx-type-badge.inflow {
          background: rgba(239,68,68,0.2); color: #EF4444;
        }

        .whale-tx-type-badge.outflow {
          background: rgba(16,185,129,0.2); color: #10B981;
        }

        .whale-tx-type-badge.transfer {
          background: rgba(251,191,36,0.2); color: #FBBF24;
        }

        .whale-tx-addresses {
          font-size: 11px; color: rgba(242,246,248,0.5);
          display: flex; flex-direction: column; gap: 4px;
        }

        .whale-tx-time {
          font-size: 11px; color: rgba(242,246,248,0.4); margin-top: 8px;
        }

        .whale-alert-item {
          background: rgba(59,130,246,0.1); border-left: 3px solid #3B82F6;
          padding: 12px 16px; border-radius: 8px; margin-bottom: 12px;
        }

        .whale-alert-message {
          font-size: 13px; font-weight: 600; margin-bottom: 4px;
        }

        .whale-alert-time {
          font-size: 11px; color: rgba(242,246,248,0.5);
        }

        .whale-empty {
          text-align: center; padding: 40px 20px; color: rgba(242,246,248,0.4);
        }

        .whale-stats-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }

        .whale-stat {
          background: rgba(242,246,248,0.03); padding: 12px; border-radius: 8px;
          text-align: center;
        }

        .whale-stat-value {
          font-size: 20px; font-weight: 800; color: #3B82F6;
        }

        .whale-stat-label {
          font-size: 11px; color: rgba(242,246,248,0.5); margin-top: 4px;
        }
      </style>

      <div class="whale-container">
        <div class="whale-header">
          <div class="whale-title">
            <span>🐋</span>
            Whale Tracker
            <span class="whale-status">${this.isTracking ? "Live" : "Paused"}</span>
          </div>
          <button class="whale-close" id="whale-close">×</button>
        </div>

        <div class="whale-body">
          <div class="whale-main">
            <div class="whale-section">
              <div class="whale-section-title">
                Recent Whale Transactions
                <span style="font-size: 12px; font-weight: 600; color: rgba(242,246,248,0.5);">
                  ${recentTxs.length} total
                </span>
              </div>
              <div class="whale-tx-list">
                ${
                  recentTxs.length === 0
                    ? `
                  <div class="whale-empty">
                    <div style="font-size: 48px; margin-bottom: 12px;">🐋</div>
                    <div style="font-size: 16px; margin-bottom: 8px;">No whale activity yet</div>
                    <div style="font-size: 13px;">Tracking will begin automatically</div>
                  </div>
                `
                    : recentTxs.map((tx) => this.renderTransaction(tx)).join("")
                }
              </div>
            </div>
          </div>

          <div class="whale-sidebar">
            <div class="whale-section">
              <div class="whale-section-title">Flow Analysis</div>
              <div class="whale-stats-grid">
                <div class="whale-stat">
                  <div class="whale-stat-value">${this.transactions.length}</div>
                  <div class="whale-stat-label">Total Tracked</div>
                </div>
                <div class="whale-stat">
                  <div class="whale-stat-value">${this.whaleAlerts.length}</div>
                  <div class="whale-stat-label">Alerts</div>
                </div>
                <div class="whale-stat">
                  <div class="whale-stat-value">${this.getInflowCount()}</div>
                  <div class="whale-stat-label">Exchange Inflows</div>
                </div>
                <div class="whale-stat">
                  <div class="whale-stat-value">${this.getOutflowCount()}</div>
                  <div class="whale-stat-label">Exchange Outflows</div>
                </div>
              </div>
            </div>

            <div class="whale-section">
              <div class="whale-section-title">Recent Alerts</div>
              ${
                recentAlerts.length === 0
                  ? `
                <div class="whale-empty" style="padding: 20px;">
                  No alerts yet
                </div>
              `
                  : recentAlerts
                      .map(
                        (alert) => `
                <div class="whale-alert-item">
                  <div class="whale-alert-message">${alert.message}</div>
                  <div class="whale-alert-time">${this.timeAgo(alert.timestamp)}</div>
                </div>
              `,
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document
      .getElementById("whale-close")
      .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  renderTransaction(tx) {
    const typeClass = tx.type.replace("_", "-");
    let typeBadge = "";
    let typeLabel = "";

    switch (tx.type) {
      case "exchange_inflow":
        typeBadge = "inflow";
        typeLabel = "→ Exchange";
        break;
      case "exchange_outflow":
        typeBadge = "outflow";
        typeLabel = "← Exchange";
        break;
      case "whale_transfer":
        typeBadge = "transfer";
        typeLabel = "Whale → Whale";
        break;
      default:
        typeBadge = "transfer";
        typeLabel = tx.type;
    }

    return `
      <div class="whale-tx">
        <div class="whale-tx-header">
          <div class="whale-tx-amount">$${this.formatNumber(tx.amountUSD)}</div>
          <div class="whale-tx-ticker">${tx.ticker}</div>
        </div>
        <div class="whale-tx-type">
          <span class="whale-tx-type-badge ${typeBadge}">${typeLabel}</span>
          <span>${tx.amount.toFixed(4)} ${tx.ticker}</span>
        </div>
        <div class="whale-tx-addresses">
          <div>From: ${this.shortenAddress(tx.from)}</div>
          <div>To: ${this.shortenAddress(tx.to)}</div>
        </div>
        <div class="whale-tx-time">${this.timeAgo(tx.timestamp)}</div>
      </div>
    `;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  getBTCPrice() {
    // Would fetch from price API - placeholder
    return 45000;
  }

  getInflowCount() {
    return this.transactions.filter((tx) => tx.type === "exchange_inflow")
      .length;
  }

  getOutflowCount() {
    return this.transactions.filter((tx) => tx.type === "exchange_outflow")
      .length;
  }

  formatNumber(num) {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + "B";
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toFixed(2);
  }

  shortenAddress(address) {
    if (!address || address === "Unknown") return address;
    if (address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  saveData() {
    try {
      const data = {
        transactions: this.transactions,
        whaleAlerts: this.whaleAlerts,
        watchedWallets: Array.from(this.watchedWallets.entries()),
        apiKeys: this.apiKeys,
        whaleThreshold: this.whaleThreshold,
        lastSaved: Date.now(),
      };

      localStorage.setItem("traderx_whale_data", JSON.stringify(data));
    } catch (e) {
      console.error("[Whale Tracker] Failed to save data:", e);
    }
  }

  loadData() {
    try {
      const saved = localStorage.getItem("traderx_whale_data");
      if (saved) {
        const data = JSON.parse(saved);
        this.transactions = data.transactions || [];
        this.whaleAlerts = data.whaleAlerts || [];
        this.apiKeys = { ...this.apiKeys, ...data.apiKeys };
        this.whaleThreshold = data.whaleThreshold || 100000;

        // Reconstruct Map from array
        if (data.watchedWallets) {
          this.watchedWallets = new Map(data.watchedWallets);
        }

        console.log(
          "[Whale Tracker] Loaded",
          this.transactions.length,
          "transactions",
        );
      }
    } catch (e) {
      console.error("[Whale Tracker] Failed to load data:", e);
    }
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  setAPIKey(provider, key) {
    this.apiKeys[provider] = key;
    this.saveData();
  }

  getRecentTransactions(limit = 50) {
    return this.transactions.slice(0, limit);
  }

  getTransactionsByTicker(ticker, limit = 50) {
    return this.transactions
      .filter((tx) => tx.ticker === ticker)
      .slice(0, limit);
  }

  clearHistory() {
    this.transactions = [];
    this.whaleAlerts = [];
    this.saveData();
  }

  exportData() {
    const data = {
      transactions: this.transactions,
      alerts: this.whaleAlerts,
      watchedWallets: Array.from(this.watchedWallets.values()),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whale-tracker-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Singleton
window.TraderXWhaleTracker = window.TraderXWhaleTracker || new WhaleTracker();
console.log("[TraderX] Whale Tracker v1.0 loaded");
