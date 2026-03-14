// ============================================================================
// TRADERX PREMIUM SUBSCRIPTION SYSTEM v1.0
// ============================================================================
// Monetization infrastructure with tiered pricing:
// - FREE: Basic features (limited tickers, basic sentiment)
// - PRO ($49/mo): Full features, AI Copilot, unlimited tickers
// - ENTERPRISE ($199/mo): API access, webhooks, priority support, white-label
//
// Features:
// - Stripe integration for payment processing
// - License validation and activation
// - Feature gating based on subscription tier
// - Trial periods (7-day free trial for Pro)
// - Usage tracking and limits
// - Subscription management UI
// ============================================================================

class PremiumSubscriptionSystem {
  constructor() {
    this.tier = "free"; // free, pro, enterprise
    this.subscriptionId = null;
    this.customerId = null;
    this.expiresAt = null;
    this.trialActive = false;
    this.trialEndsAt = null;
    this.features = {};

    // Usage tracking
    this.usage = {
      tickersTracked: 0,
      searchesThisMonth: 0,
      alertsTriggered: 0,
      apiCallsThisMonth: 0,
    };

    // API configuration
    this.apiBaseUrl = "https://api.traderx.app"; // Replace with your backend
    this.stripePublishableKey = "pk_live_YOUR_KEY"; // Replace with Stripe key

    // Load subscription state
    this.loadSubscription();
  }

  // ========================================================================
  // TIER DEFINITIONS & LIMITS
  // ========================================================================

  getTierConfig(tier) {
    const configs = {
      free: {
        name: "Free",
        price: 0,
        priceMonthly: 0,
        limits: {
          maxTickers: 5,
          maxSearches: 10,
          maxAlerts: 3,
          portfolioTracking: false,
          aiCopilot: false,
          sectorHeatmap: false,
          comboAlerts: false,
          advancedSearch: true,
          exportData: false,
          apiAccess: false,
          webhooks: false,
          prioritySupport: false,
          whiteLabel: false,
          customDashboard: false,
          backtesting: false,
          socialTrading: false,
          whaleTracker: false,
          newsAggregator: false,
        },
        features: [
          "✅ Track up to 5 tickers",
          "✅ Basic sentiment analysis",
          "✅ 10 searches per month",
          "✅ Price tracking",
          "✅ Spam filtering",
          "❌ AI Trade Ideas",
          "❌ Portfolio tracking",
          "❌ Advanced analytics",
        ],
      },
      pro: {
        name: "Pro",
        price: 49,
        priceMonthly: 49,
        priceYearly: 490, // $40.83/mo when billed yearly
        limits: {
          maxTickers: 50,
          maxSearches: 1000,
          maxAlerts: 50,
          portfolioTracking: true,
          aiCopilot: true,
          sectorHeatmap: true,
          comboAlerts: true,
          advancedSearch: true,
          exportData: true,
          apiAccess: false,
          webhooks: false,
          prioritySupport: false,
          whiteLabel: false,
          customDashboard: true,
          backtesting: true,
          socialTrading: true,
          whaleTracker: true,
          newsAggregator: true,
        },
        features: [
          "✅ Track up to 50 tickers",
          "✅ AI Trade Copilot with entry/exit signals",
          "✅ Portfolio tracking & P&L",
          "✅ Unlimited searches",
          "✅ 50 custom alerts",
          "✅ Sector heatmap & rotation analysis",
          "✅ Whale tracker",
          "✅ Multi-source news aggregation",
          "✅ Backtesting engine",
          "✅ Social trading (copy trades)",
          "✅ Export data (CSV, JSON)",
          "✅ Priority email support",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: 199,
        priceMonthly: 199,
        priceYearly: 1990, // $165.83/mo when billed yearly
        limits: {
          maxTickers: 500,
          maxSearches: Infinity,
          maxAlerts: 500,
          portfolioTracking: true,
          aiCopilot: true,
          sectorHeatmap: true,
          comboAlerts: true,
          advancedSearch: true,
          exportData: true,
          apiAccess: true,
          webhooks: true,
          prioritySupport: true,
          whiteLabel: true,
          customDashboard: true,
          backtesting: true,
          socialTrading: true,
          whaleTracker: true,
          newsAggregator: true,
        },
        features: [
          "✅ Unlimited ticker tracking",
          "✅ Everything in Pro",
          "✅ REST API access (10,000 calls/month)",
          "✅ Webhook integrations",
          "✅ White-label dashboard",
          "✅ Custom branding",
          "✅ Team accounts (up to 10 users)",
          "✅ Priority 24/7 support",
          "✅ Dedicated account manager",
          "✅ Custom integrations",
          "✅ SLA guarantee",
        ],
      },
    };

    return configs[tier] || configs.free;
  }

  // ========================================================================
  // FEATURE GATING
  // ========================================================================

  canUseFeature(featureName) {
    const config = this.getTierConfig(this.tier);

    // If in trial, grant Pro features
    if (this.trialActive && new Date() < new Date(this.trialEndsAt)) {
      return this.getTierConfig("pro").limits[featureName] !== false;
    }

    return config.limits[featureName] !== false;
  }

  checkLimit(limitName, currentValue) {
    const config = this.getTierConfig(this.tier);
    const limit = config.limits[limitName];

    // If in trial, use Pro limits
    if (this.trialActive && new Date() < new Date(this.trialEndsAt)) {
      return currentValue < this.getTierConfig("pro").limits[limitName];
    }

    if (limit === Infinity) return true;
    return currentValue < limit;
  }

  getRemainingLimit(limitName, currentValue) {
    const config = this.getTierConfig(this.tier);
    const limit = config.limits[limitName];

    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentValue);
  }

  // ========================================================================
  // TRIAL MANAGEMENT
  // ========================================================================

  async startTrial() {
    if (this.trialActive) {
      return { success: false, error: "Trial already active" };
    }

    if (this.tier !== "free") {
      return { success: false, error: "Trial only available for free users" };
    }

    const trialDays = 7;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    this.trialActive = true;
    this.trialEndsAt = trialEndsAt.toISOString();

    this.saveSubscription();

    console.log("[Premium] Trial started, expires:", this.trialEndsAt);

    // Track trial start
    this.trackEvent("trial_started", { tier: "pro", duration: trialDays });

    return { success: true, expiresAt: this.trialEndsAt };
  }

  isTrialActive() {
    if (!this.trialActive) return false;
    if (!this.trialEndsAt) return false;

    const now = new Date();
    const expires = new Date(this.trialEndsAt);

    return now < expires;
  }

  getTrialDaysRemaining() {
    if (!this.isTrialActive()) return 0;

    const now = new Date();
    const expires = new Date(this.trialEndsAt);
    const diff = expires - now;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================================================

  async subscribe(tier, billingPeriod = "monthly") {
    if (!["pro", "enterprise"].includes(tier)) {
      return { success: false, error: "Invalid tier" };
    }

    const config = this.getTierConfig(tier);
    const price =
      billingPeriod === "yearly" ? config.priceYearly : config.priceMonthly;

    try {
      // Call backend to create Stripe checkout session
      const response = await this.apiCall("/subscriptions/create-checkout", {
        method: "POST",
        body: JSON.stringify({
          tier,
          billingPeriod,
          price,
          successUrl: chrome.runtime.getURL(
            "settings/settings.html?success=true",
          ),
          cancelUrl: chrome.runtime.getURL(
            "settings/settings.html?canceled=true",
          ),
        }),
      });

      if (response.checkoutUrl) {
        // Open Stripe checkout in new tab
        window.open(response.checkoutUrl, "_blank");
        return { success: true, checkoutUrl: response.checkoutUrl };
      }

      return { success: false, error: "Failed to create checkout session" };
    } catch (error) {
      console.error("[Premium] Subscribe error:", error);
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription() {
    if (!this.subscriptionId) {
      return { success: false, error: "No active subscription" };
    }

    try {
      const response = await this.apiCall("/subscriptions/cancel", {
        method: "POST",
        body: JSON.stringify({
          subscriptionId: this.subscriptionId,
        }),
      });

      if (response.success) {
        // Don't downgrade immediately - let them use until period ends
        console.log(
          "[Premium] Subscription canceled, active until:",
          this.expiresAt,
        );
        return { success: true, expiresAt: this.expiresAt };
      }

      return { success: false, error: "Failed to cancel subscription" };
    } catch (error) {
      console.error("[Premium] Cancel error:", error);
      return { success: false, error: error.message };
    }
  }

  async updatePaymentMethod() {
    try {
      const response = await this.apiCall("/subscriptions/update-payment", {
        method: "POST",
        body: JSON.stringify({
          customerId: this.customerId,
        }),
      });

      if (response.portalUrl) {
        window.open(response.portalUrl, "_blank");
        return { success: true };
      }

      return { success: false, error: "Failed to open billing portal" };
    } catch (error) {
      console.error("[Premium] Update payment error:", error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // LICENSE VALIDATION
  // ========================================================================

  async validateLicense() {
    try {
      const response = await this.apiCall("/subscriptions/validate", {
        method: "GET",
      });

      if (response.valid) {
        this.tier = response.tier;
        this.subscriptionId = response.subscriptionId;
        this.customerId = response.customerId;
        this.expiresAt = response.expiresAt;
        this.saveSubscription();

        console.log("[Premium] License validated:", this.tier);
        return { success: true, tier: this.tier };
      }

      // Invalid or expired
      this.tier = "free";
      this.subscriptionId = null;
      this.saveSubscription();

      return { success: false, error: "License invalid or expired" };
    } catch (error) {
      console.error("[Premium] Validation error:", error);
      return { success: false, error: error.message };
    }
  }

  async activateLicense(licenseKey) {
    try {
      const response = await this.apiCall("/subscriptions/activate", {
        method: "POST",
        body: JSON.stringify({
          licenseKey,
        }),
      });

      if (response.success) {
        this.tier = response.tier;
        this.subscriptionId = response.subscriptionId;
        this.customerId = response.customerId;
        this.expiresAt = response.expiresAt;
        this.saveSubscription();

        console.log("[Premium] License activated:", this.tier);
        this.trackEvent("license_activated", { tier: this.tier });

        return { success: true, tier: this.tier };
      }

      return { success: false, error: response.error || "Invalid license key" };
    } catch (error) {
      console.error("[Premium] Activation error:", error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // USAGE TRACKING
  // ========================================================================

  trackUsage(metric, increment = 1) {
    if (this.usage[metric] !== undefined) {
      this.usage[metric] += increment;
      this.saveSubscription();
    }
  }

  resetMonthlyUsage() {
    this.usage.searchesThisMonth = 0;
    this.usage.apiCallsThisMonth = 0;
    this.saveSubscription();
  }

  // ========================================================================
  // UI - SUBSCRIPTION MODAL
  // ========================================================================

  showSubscriptionModal() {
    const existing = document.getElementById("traderx-premium-modal");
    if (existing) {
      existing.remove();
      return;
    }

    const modal = document.createElement("div");
    modal.id = "traderx-premium-modal";
    modal.innerHTML = `
      <style>
        #traderx-premium-modal {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.95); backdrop-filter: blur(10px);
          z-index: 100002; display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif; color: #F2F6F8;
          animation: premiumFadeIn 0.3s ease;
        }
        @keyframes premiumFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .premium-container {
          background: linear-gradient(135deg, #0F1419 0%, #1A1F2A 100%);
          border: 1px solid rgba(242,246,248,0.12);
          border-radius: 24px; width: 95%; max-width: 1400px; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }

        .premium-header {
          padding: 32px 40px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          text-align: center;
        }

        .premium-title {
          font-size: 40px; font-weight: 900; margin-bottom: 12px;
          background: linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .premium-subtitle {
          font-size: 18px; opacity: 0.9; margin-bottom: 24px;
        }

        ${
          this.isTrialActive()
            ? `
          .trial-banner {
            background: linear-gradient(90deg, #10B981, #059669);
            padding: 12px 24px; text-align: center; font-weight: 700;
            font-size: 14px; letter-spacing: 0.05em;
          }
        `
            : ""
        }

        .premium-body {
          padding: 40px; overflow-y: auto; flex: 1;
        }

        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
          max-width: 1200px; margin: 0 auto;
        }

        .pricing-card {
          background: linear-gradient(135deg, #141820 0%, #1A1F2A 100%);
          border: 2px solid rgba(242,246,248,0.08);
          border-radius: 20px; padding: 32px; position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(99,102,241,0.3);
          border-color: #6366F1;
        }

        .pricing-card.popular {
          border-color: #6366F1;
          box-shadow: 0 12px 40px rgba(99,102,241,0.3);
        }

        .pricing-card.popular::before {
          content: '⭐ MOST POPULAR';
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          padding: 6px 20px; border-radius: 20px; font-size: 11px;
          font-weight: 800; letter-spacing: 0.1em;
        }

        .pricing-tier {
          font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #F2F6F8;
        }

        .pricing-price {
          font-size: 48px; font-weight: 900; margin-bottom: 8px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-period {
          font-size: 14px; color: rgba(242,246,248,0.6); margin-bottom: 24px;
        }

        .pricing-features {
          flex: 1; margin-bottom: 24px;
        }

        .pricing-feature {
          padding: 10px 0; font-size: 14px; line-height: 1.6;
          color: rgba(242,246,248,0.8); display: flex; align-items: flex-start; gap: 10px;
        }

        .pricing-cta {
          width: 100%; padding: 16px; border: none; border-radius: 12px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em;
        }

        .pricing-cta.primary {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          color: white;
        }

        .pricing-cta.primary:hover {
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
          transform: translateY(-2px);
        }

        .pricing-cta.secondary {
          background: rgba(242,246,248,0.05);
          border: 2px solid rgba(242,246,248,0.1);
          color: rgba(242,246,248,0.8);
        }

        .pricing-cta.secondary:hover {
          background: rgba(242,246,248,0.08);
          border-color: #6366F1;
        }

        .pricing-cta.current {
          background: rgba(16,185,129,0.2);
          color: #10B981;
          cursor: default;
        }

        .premium-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.1); border: none; color: white;
          width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
          font-size: 28px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; z-index: 1;
        }
        .premium-close:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

        .premium-footer {
          padding: 24px 40px; background: rgba(0,0,0,0.3);
          border-top: 1px solid rgba(242,246,248,0.06);
          text-align: center; font-size: 13px; color: rgba(242,246,248,0.6);
        }

        .premium-footer a {
          color: #6366F1; text-decoration: none; font-weight: 600;
        }

        @media (max-width: 1200px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
      </style>

      <div class="premium-container">
        <button class="premium-close" id="premium-close">×</button>

        <div class="premium-header">
          <div class="premium-title">Upgrade to Premium</div>
          <div class="premium-subtitle">Unlock AI-powered trading insights and advanced analytics</div>
        </div>

        ${
          this.isTrialActive()
            ? `
          <div class="trial-banner">
            🎉 TRIAL ACTIVE: ${this.getTrialDaysRemaining()} DAYS REMAINING
          </div>
        `
            : ""
        }

        <div class="premium-body">
          <div class="pricing-grid">
            ${this.renderPricingCard("free")}
            ${this.renderPricingCard("pro")}
            ${this.renderPricingCard("enterprise")}
          </div>
        </div>

        <div class="premium-footer">
          All plans include a 30-day money-back guarantee.
          <a href="https://traderx.app/terms" target="_blank">Terms</a> ·
          <a href="https://traderx.app/privacy" target="_blank">Privacy</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document
      .getElementById("premium-close")
      .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // CTA buttons
    document.querySelectorAll(".pricing-cta").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tier = e.target.dataset.tier;
        if (tier === "free") return;

        if (tier === this.tier) return;

        this.subscribe(tier, "monthly");
      });
    });

    // Trial button
    const trialBtn = document.getElementById("start-trial-btn");
    if (trialBtn) {
      trialBtn.addEventListener("click", async () => {
        const result = await this.startTrial();
        if (result.success) {
          modal.remove();
          this.showTrialStartedNotification();
        } else {
          alert(result.error);
        }
      });
    }
  }

  renderPricingCard(tier) {
    const config = this.getTierConfig(tier);
    const isCurrent = this.tier === tier;
    const isPopular = tier === "pro";

    let ctaText = "Get Started";
    let ctaClass = "secondary";
    let ctaDisabled = "";

    if (isCurrent) {
      ctaText = "Current Plan";
      ctaClass = "current";
      ctaDisabled = "disabled";
    } else if (tier === "free") {
      ctaText = "Free Forever";
      ctaClass = "secondary";
    } else if (tier === "pro" && this.tier === "free" && !this.trialActive) {
      ctaText = "Start 7-Day Free Trial";
      ctaClass = "primary";
    } else if (tier !== "free") {
      ctaText = `Upgrade to ${config.name}`;
      ctaClass = "primary";
    }

    return `
      <div class="pricing-card ${isPopular ? "popular" : ""}">
        <div class="pricing-tier">${config.name}</div>
        <div class="pricing-price">
          ${tier === "free" ? "Free" : `$${config.priceMonthly}`}
        </div>
        <div class="pricing-period">
          ${tier === "free" ? "Forever" : "per month"}
        </div>

        <div class="pricing-features">
          ${config.features
            .map(
              (f) => `
            <div class="pricing-feature">${f}</div>
          `,
            )
            .join("")}
        </div>

        <button class="pricing-cta ${ctaClass}"
                data-tier="${tier}"
                ${ctaDisabled}
                ${tier === "pro" && this.tier === "free" && !this.trialActive ? 'id="start-trial-btn"' : ""}>
          ${ctaText}
        </button>
      </div>
    `;
  }

  showTrialStartedNotification() {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 100003;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white; padding: 20px 24px; border-radius: 12px;
      box-shadow: 0 10px 40px rgba(16,185,129,0.4);
      font-family: 'Inter', sans-serif; font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 4px;">🎉 Trial Started!</div>
      <div style="font-size: 13px; opacity: 0.9;">Enjoy Pro features for 7 days</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  showUpgradePrompt(featureName) {
    const prompt = document.createElement("div");
    prompt.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 100003;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white; padding: 20px 24px; border-radius: 16px;
      box-shadow: 0 10px 40px rgba(99,102,241,0.5);
      font-family: 'Inter', sans-serif; max-width: 320px;
      animation: slideUp 0.3s ease;
    `;
    prompt.innerHTML = `
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">
        🚀 Upgrade Required
      </div>
      <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
        ${featureName} is a Pro feature. Upgrade to unlock AI-powered insights!
      </div>
      <button id="upgrade-prompt-btn" style="
        width: 100%; padding: 12px; border: none; border-radius: 8px;
        background: white; color: #6366F1; font-weight: 700;
        cursor: pointer; font-size: 14px; text-transform: uppercase;
      ">
        View Plans
      </button>
      <button id="close-prompt-btn" style="
        margin-top: 8px; width: 100%; padding: 8px; border: none;
        background: transparent; color: white; cursor: pointer;
        font-size: 12px; opacity: 0.7;
      ">
        Maybe Later
      </button>
    `;

    document.body.appendChild(prompt);

    document
      .getElementById("upgrade-prompt-btn")
      .addEventListener("click", () => {
        prompt.remove();
        this.showSubscriptionModal();
      });

    document
      .getElementById("close-prompt-btn")
      .addEventListener("click", () => {
        prompt.remove();
      });

    setTimeout(() => prompt.remove(), 15000);
  }

  // ========================================================================
  // API CALLS
  // ========================================================================

  async apiCall(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["authToken"], (result) => {
        resolve(result.authToken || null);
      });
    });
  }

  // ========================================================================
  // ANALYTICS
  // ========================================================================

  trackEvent(eventName, properties = {}) {
    try {
      // Send to analytics backend
      this.apiCall("/analytics/track", {
        method: "POST",
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...properties,
            tier: this.tier,
            timestamp: new Date().toISOString(),
          },
        }),
      }).catch(() => {}); // Fail silently
    } catch (e) {
      // Analytics shouldn't break the app
    }
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  saveSubscription() {
    try {
      const data = {
        tier: this.tier,
        subscriptionId: this.subscriptionId,
        customerId: this.customerId,
        expiresAt: this.expiresAt,
        trialActive: this.trialActive,
        trialEndsAt: this.trialEndsAt,
        usage: this.usage,
      };

      localStorage.setItem("traderx_subscription", JSON.stringify(data));
      chrome.storage.local.set({ subscription: data });
    } catch (e) {
      console.error("[Premium] Failed to save subscription:", e);
    }
  }

  loadSubscription() {
    try {
      const saved = localStorage.getItem("traderx_subscription");
      if (saved) {
        const data = JSON.parse(saved);
        this.tier = data.tier || "free";
        this.subscriptionId = data.subscriptionId || null;
        this.customerId = data.customerId || null;
        this.expiresAt = data.expiresAt || null;
        this.trialActive = data.trialActive || false;
        this.trialEndsAt = data.trialEndsAt || null;
        this.usage = data.usage || {
          tickersTracked: 0,
          searchesThisMonth: 0,
          alertsTriggered: 0,
          apiCallsThisMonth: 0,
        };
      }

      // Check if subscription expired
      if (this.expiresAt && new Date() > new Date(this.expiresAt)) {
        console.log("[Premium] Subscription expired, downgrading to free");
        this.tier = "free";
        this.subscriptionId = null;
        this.saveSubscription();
      }

      // Check if trial expired
      if (this.trialActive && !this.isTrialActive()) {
        console.log("[Premium] Trial expired");
        this.trialActive = false;
        this.saveSubscription();
      }
    } catch (e) {
      console.error("[Premium] Failed to load subscription:", e);
    }
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  getTier() {
    return this.tier;
  }

  isPro() {
    return (
      this.tier === "pro" || this.tier === "enterprise" || this.isTrialActive()
    );
  }

  isEnterprise() {
    return this.tier === "enterprise";
  }

  getUsage() {
    return { ...this.usage };
  }

  getCurrentConfig() {
    return this.getTierConfig(this.tier);
  }
}

// Singleton
window.TraderXPremium =
  window.TraderXPremium || new PremiumSubscriptionSystem();
console.log("[TraderX] Premium System v1.0 loaded");
