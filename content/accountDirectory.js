// ============================================================================
// TRADERX ACCOUNT DIRECTORY - SIGNAL REGISTRY
// ============================================================================
// UI to browse and follow accounts from accounts.json
// "FinTech" aesthetic matching the rest of the app
// ============================================================================

class AccountDirectory {
    constructor() {
        this.isVisible = false;
        this.accounts = null;
        this.categories = [];
        this.activeCategory = null;
        this.element = null;
    }

    async init() {
        if (this.accounts) return; // Already loaded

        try {
            const url = chrome.runtime.getURL('accounts.json');
            const response = await fetch(url);
            const data = await response.json();
            this.accounts = data.accounts;
            this.categories = Object.keys(this.accounts);
            this.activeCategory = this.categories[0];
            console.log(`[Directory] Loaded ${data.metadata.total_count} accounts across ${this.categories.length} categories`);
        } catch (e) {
            console.error('[Directory] Failed to load accounts:', e);
        }
    }

    show() {
        if (!this.accounts) {
            this.init().then(() => this.render());
        } else {
            this.render();
        }
    }

    render() {
        if (this.element) {
            this.element.classList.remove('hidden');
            return;
        }

        const container = document.createElement('div');
        container.id = 'tx-directory-overlay';
        container.innerHTML = `
      <style>
        #tx-directory-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(11, 17, 32, 0.8); /* Slate 950 / 80% */
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Inter", -apple-system, sans-serif;
          color: #F8FAFC;
        }
        
        #tx-directory-overlay.hidden {
          display: none;
        }
        
        .tx-dir-modal {
          width: 900px;
          height: 80vh;
          background: #0F172A; /* Slate 900 */
          border: 1px solid #334155; /* Slate 700 */
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          display: flex;
          overflow: hidden;
        }
        
        /* Sidebar */
        .tx-dir-sidebar {
          width: 240px;
          background: #0B1120; /* Slate 950 */
          border-right: 1px solid #1E293B;
          display: flex;
          flex-direction: column;
        }
        
        .tx-dir-header {
          padding: 24px;
          border-bottom: 1px solid #1E293B;
        }
        
        .tx-dir-title {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #F8FAFC;
        }
        
        .tx-dir-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }
        
        .tx-dir-btn {
          width: 100%;
          text-align: left;
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .tx-dir-btn:hover {
          color: #E2E8F0;
          background: rgba(30, 41, 59, 0.5);
        }
        
        .tx-dir-btn.active {
          color: #3B82F6;
          background: rgba(59, 130, 246, 0.1);
          border-right: 2px solid #3B82F6;
        }
        
        .tx-dir-badge {
          font-size: 10px;
          background: #1E293B;
          padding: 2px 6px;
          border-radius: 99px;
          color: #64748B;
        }
        
        /* Main Content */
        .tx-dir-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0F172A;
        }
        
        .tx-dir-topbar {
          padding: 24px;
          border-bottom: 1px solid #1E293B;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .tx-cat-title {
          font-size: 20px;
          font-weight: 700;
          color: #F8FAFC;
        }
        
        .tx-cat-desc {
          font-size: 13px;
          color: #64748B;
          margin-top: 4px;
        }
        
        .tx-dir-actions {
          display: flex;
          gap: 12px;
        }
        
        .tx-action-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .tx-btn-outline {
          background: transparent;
          border: 1px solid #334155;
          color: #94A3B8;
        }
        
        .tx-btn-outline:hover {
          border-color: #94A3B8;
          color: #F8FAFC;
        }
        
        .tx-btn-solid {
          background: #3B82F6;
          border: 1px solid #2563EB;
          color: white;
        }
        
        .tx-btn-solid:hover {
          background: #2563EB;
        }
        
        /* Grid */
        .tx-dir-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        
        .tx-account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        
        .tx-acct-card {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }
        
        .tx-acct-card:hover {
          border-color: #475569;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .tx-acct-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #64748B;
          font-size: 14px;
        }
        
        .tx-acct-info {
          flex: 1;
          min-width: 0;
        }
        
        .tx-acct-handle {
          font-weight: 600;
          color: #F8FAFC;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tx-acct-sub {
          color: #64748B;
          font-size: 12px;
        }
        
        .tx-acct-follow {
          padding: 6px 12px;
          border-radius: 99px;
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        
        .tx-acct-follow:hover {
          background: #3B82F6;
          color: white;
        }
        
        .tx-close-modal {
          position: absolute;
          top: 24px;
          right: 24px;
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
        }
        
        .tx-close-modal:hover {
          color: #F8FAFC;
        }
      </style>
      
      <div class="tx-dir-modal">
        <div class="tx-dir-sidebar">
          <div class="tx-dir-header">
            <div class="tx-dir-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Signal Directory
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
              ${this.accounts ? Object.values(this.accounts).flat().length : 0} Verified Accounts
            </div>
          </div>
          
          <div class="tx-dir-nav" id="tx-dir-nav">
            <!-- Categories injected here -->
          </div>
        </div>
        
        <div class="tx-dir-main">
          <div class="tx-dir-topbar">
            <div>
              <div class="tx-cat-title" id="tx-current-cat">Category</div>
              <div class="tx-cat-desc" id="tx-cat-desc">Trusted sources for this sector</div>
            </div>
            <div class="tx-dir-actions">
              <button class="tx-action-btn tx-btn-outline" id="tx-close-dir">
                Close
              </button>
              <button class="tx-action-btn tx-btn-solid" id="tx-follow-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Follow Top 10
              </button>
            </div>
          </div>
          
          <div class="tx-dir-content">
            <div class="tx-account-grid" id="tx-grid">
              <!-- Cards injected here -->
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(container);
        this.element = container;

        this.renderNav();
        this.renderCategory(this.activeCategory);
        this.setupListeners();
    }

    renderNav() {
        const nav = document.getElementById('tx-dir-nav');
        nav.innerHTML = this.categories.map(cat => `
      <button class="tx-dir-btn ${cat === this.activeCategory ? 'active' : ''}" data-cat="${cat}">
        <span>${cat.replace(/_/g, ' ')}</span>
        <span class="tx-dir-badge">${this.accounts[cat].length}</span>
      </button>
    `).join('');

        // Add click listeners
        nav.querySelectorAll('.tx-dir-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeCategory = btn.dataset.cat;
                this.renderNav(); // Re-render to update active state
                this.renderCategory(this.activeCategory);
            });
        });
    }

    renderCategory(category) {
        document.getElementById('tx-current-cat').textContent = category.replace(/_/g, ' ');
        document.getElementById('tx-cat-desc').textContent = `${this.accounts[category].length} curated sources`;

        const grid = document.getElementById('tx-grid');
        const handles = this.accounts[category];

        grid.innerHTML = handles.map(handle => {
            const cleanHandle = handle.replace('@', '');
            return `
        <div class="tx-acct-card">
          <div class="tx-acct-avatar">${cleanHandle.substring(0, 2).toUpperCase()}</div>
          <div class="tx-acct-info">
            <div class="tx-acct-handle">${handle}</div>
            <div class="tx-acct-sub">Trusted Source</div>
          </div>
          <a href="https://x.com/intent/follow?screen_name=${cleanHandle}" target="_blank" class="tx-acct-follow">
            Follow
          </a>
        </div>
      `;
        }).join('');
    }

    setupListeners() {
        document.getElementById('tx-close-dir').addEventListener('click', () => this.hide());

        // Close on overlay click
        this.element.addEventListener('click', (e) => {
            if (e.target.id === 'tx-directory-overlay') this.hide();
        });

        // Follow All (Top 10 to avoid spam/bans)
        document.getElementById('tx-follow-all').addEventListener('click', () => {
            if (confirm(`Open follow steps for top 10 accounts in ${this.activeCategory}?`)) {
                const handles = this.accounts[this.activeCategory].slice(0, 10);
                handles.forEach((handle, index) => {
                    setTimeout(() => {
                        const cleanHandle = handle.replace('@', '');
                        window.open(`https://x.com/intent/follow?screen_name=${cleanHandle}`, '_blank', 'width=550,height=420');
                    }, index * 800);
                });
            }
        });
    }

    hide() {
        if (this.element) {
            this.element.classList.add('hidden');
        }
    }
}

// Singleton
window.TraderXDirectory = window.TraderXDirectory || new AccountDirectory();
