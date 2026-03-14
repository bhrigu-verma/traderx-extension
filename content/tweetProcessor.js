// ============================================================================
// TRADERX TWEET PROCESSOR - Trusted Mode & Filtering
// ============================================================================
// Implements strict filtering logic based on accounts.json
// Handles Trusted Mode toggling and badge injection
// ============================================================================

class TweetProcessor {
    constructor() {
        this.trustedHandles = new Set();
        this.isTrustedMode = localStorage.getItem('traderx_trusted_mode') === 'true';
        this.processedTweets = new WeakSet();
        this.observer = null;
        this.accountsLoaded = false;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async init() {
        console.log('[TweetProcessor] Initializing...');
        await this.loadTrustedAccounts();
        this.setupObserver();

        // Listen for toggle events
        window.addEventListener('traderx-toggle-trusted', (e) => {
            this.setTrustedMode(e.detail.enabled);
        });

        // Initial process
        this.processTimeline();

        // Re-apply on periodic interval to catch edge cases
        setInterval(() => this.processTimeline(), 2000);
    }

    async loadTrustedAccounts() {
        try {
            const url = chrome.runtime.getURL('accounts.json');
            const response = await fetch(url);
            const data = await response.json();

            // Flatten all categories into a single Set
            Object.values(data.accounts).forEach(categoryList => {
                categoryList.forEach(handle => {
                    // Store normalized handle (lowercase, no @)
                    this.trustedHandles.add(handle.toLowerCase().replace('@', ''));
                });
            });

            this.accountsLoaded = true;
            console.log(`[TweetProcessor] Loaded ${this.trustedHandles.size} trusted accounts`);

            // If mode is already on, apply it now
            if (this.isTrustedMode) {
                this.applyFilter();
            }

        } catch (error) {
            console.error('[TweetProcessor] Failed to load accounts.json:', error);
        }
    }

    // ========================================================================
    // FILTERING LOGIC
    // ========================================================================

    setTrustedMode(enabled) {
        this.isTrustedMode = enabled;
        localStorage.setItem('traderx_trusted_mode', enabled);
        console.log(`[TweetProcessor] Trusted Mode: ${enabled ? 'ON' : 'OFF'}`);

        if (enabled) {
            this.applyFilter();
        } else {
            this.resetFilter();
        }
    }

    processTimeline() {
        if (!this.accountsLoaded) return;

        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => {
            if (!this.processedTweets.has(tweet)) {
                this.processTweet(tweet);
                this.processedTweets.add(tweet);
            }

            // Always re-check visibility if strict mode is on
            if (this.isTrustedMode) {
                this.checkForStrictFiltering(tweet);
            }
        });
    }

    processTweet(tweet) {
        const handle = this.extractHandle(tweet);
        if (!handle) return;

        const isTrusted = this.trustedHandles.has(handle.toLowerCase());

        // Inject badges if trusted
        if (isTrusted) {
            this.injectBadge(tweet, 'Trusted');
            tweet.setAttribute('data-traderx-trusted', 'true');
        }
    }

    checkForStrictFiltering(tweet) {
        // IMPORTANT: Don't hide tweets on search pages (breaks Advanced Search)
        if (window.location.pathname.startsWith('/search')) {
            return; // Skip filtering on search results
        }

        const isTrusted = tweet.getAttribute('data-traderx-trusted') === 'true';
        if (!isTrusted) {
            tweet.style.display = 'none';
        } else {
            tweet.style.display = ''; // Reset to default
        }
    }

    applyFilter() {
        // Don't apply filter on search pages
        if (window.location.pathname.startsWith('/search')) {
            console.log('[TweetProcessor] Skipping filter on search page');
            return;
        }

        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => this.checkForStrictFiltering(tweet));
    }

    resetFilter() {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => {
            tweet.style.display = '';
        });
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    extractHandle(tweet) {
        try {
            const userLink = tweet.querySelector('div[data-testid="User-Name"] a[href^="/"]');
            if (userLink) {
                const href = userLink.getAttribute('href');
                return href ? href.substring(1) : null;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    injectBadge(tweet, type) {
        const metaContainer = tweet.querySelector('div[data-testid="User-Name"]');
        if (!metaContainer || tweet.querySelector('.traderx-badge')) return;

        // Find a good place to insert (after the name/verified badge)
        const targetInfo = metaContainer.querySelector('div.css-175oi2r.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs');

        if (targetInfo) {
            const badge = document.createElement('div');
            badge.className = 'traderx-badge';
            badge.innerHTML = `
        <span style="
          display: inline-flex;
          align-items: center;
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 11px;
          font-weight: 600;
          padding: 0 6px;
          height: 18px;
          border-radius: 9px;
          margin-left: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Trusted
        </span>
      `;

            targetInfo.appendChild(badge);
        }
    }

    setupObserver() {
        this.observer = new MutationObserver(() => {
            this.processTimeline();
        });

        const timeline = document.querySelector('div[data-testid="primaryColumn"]') || document.body;
        this.observer.observe(timeline, {
            childList: true,
            subtree: true
        });
    }
}

// Singleton
window.TraderXTweetProcessor = window.TraderXTweetProcessor || new TweetProcessor();

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.TraderXTweetProcessor.init());
} else {
    // Small delay for stability
    setTimeout(() => window.TraderXTweetProcessor.init(), 1000);
}

// Expose toggle API globally for Sidebar to call
window.traderXToggleTrustedMode = (enabled) => {
    if (window.TraderXTweetProcessor) {
        window.TraderXTweetProcessor.setTrustedMode(enabled);
    } else {
        // Dispatch event if instance not ready/accessible directly
        const event = new CustomEvent('traderx-toggle-trusted', { detail: { enabled } });
        window.dispatchEvent(event);
    }
};
