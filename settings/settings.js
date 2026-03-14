// === TRADERX SETTINGS SCRIPT v1.3 ===

// Wait for dependencies to load
if (!window.TraderXUtils) {
  console.error('[Settings] TraderXUtils not loaded!');
}
if (!window.TraderXSuggested) {
  console.error('[Settings] TraderXSuggested not loaded!');
}

const { DEFAULT_CONFIG, getConfig, saveConfig } = window.TraderXUtils || {};
const { SUGGESTED_HANDLES, getAllSuggestedHandles } = window.TraderXSuggested || {};

let currentConfig = null;

// === INITIALIZATION ===
async function init() {
  console.log('[Settings] Initializing...');

  // Setup navigation first (must be done via external JS for CSP compliance)
  setupNavigation();

  // Check if we have chrome.storage
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.warn('[Settings] Chrome storage API not available - using defaults');
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
    console.log('[Settings] Initialized with defaults (no chrome.storage)');
    return;
  }

  // Load config
  if (!getConfig) {
    console.error('[Settings] getConfig function not available!');
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
    return;
  }

  try {
    currentConfig = await getConfig();
    console.log('[Settings] Config loaded:', currentConfig);

    loadAllSettings();
    setupEventListeners();

    console.log('[Settings] Initialized successfully');
  } catch (error) {
    console.error('[Settings] Initialization error:', error);
    currentConfig = DEFAULT_CONFIG;
    loadAllSettings();
    setupEventListeners();
  }
}

function loadAllSettings() {
  try {
    loadFilters();
    loadTiers();
    loadWatchlist();
    loadAlerts();
    loadSuggested();
    loadDisplay();
  } catch (error) {
    console.error('[Settings] Error loading settings:', error);
  }
}

// === NAVIGATION ===
function setupNavigation() {
  console.log('[Settings] Setting up navigation...');
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  console.log('[Settings] Found', navItems.length, 'navigation items');

  navItems.forEach((item, index) => {
    const tabId = item.dataset.tab;
    console.log(`[Settings] Nav item ${index}: tab="${tabId}"`);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Settings] Navigation clicked:', tabId);

      // Update nav
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Update content
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        console.log('[Settings] Switched to tab:', tabId);
      } else {
        console.error('[Settings] Tab not found:', `tab-${tabId}`);
      }
    });
  });

  console.log('[Settings] Navigation setup complete');
}


// === LOAD SETTINGS ===
function loadFilters() {
  const f = currentConfig.filters || {};

  safeSetChecked('filter-engagement', f.hideEngagementBait ?? true);
  safeSetChecked('filter-promo', f.hidePromo ?? true);
  safeSetChecked('filter-low-effort', f.hideLowEffort ?? true);
  safeSetChecked('filter-crypto', f.hideCryptoScams ?? true);
  safeSetChecked('filter-disclaimers', f.hideDisclaimers ?? true);
  safeSetChecked('filter-threads', f.hideThreads ?? true);
  safeSetChecked('filter-old-news', f.hideOldNews ?? true);
  safeSetChecked('filter-time-sensitive', f.enableTimeSensitive ?? true);
}

function loadTiers() {
  const t = currentConfig.tiers || {};

  safeSetValue('tier1-accounts', (t.tier1 || []).join('\n'));
  safeSetValue('tier2-accounts', (t.tier2 || []).join('\n'));
  safeSetValue('tier3-accounts', (t.tier3 || []).join('\n'));
}

function loadWatchlist() {
  renderWatchlist();
}

function renderWatchlist() {
  const container = document.getElementById('watchlist-display');
  if (!container) return;

  const watchlist = currentConfig.watchlist || [];

  if (watchlist.length === 0) {
    container.innerHTML = '<p class="text-muted">No tickers in watchlist</p>';
    return;
  }

  container.innerHTML = watchlist.map(ticker => `
    <div class="watchlist-tag" data-ticker="${ticker}">
      $${ticker}
      <span class="remove">×</span>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.watchlist-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const ticker = tag.dataset.ticker;
      currentConfig.watchlist = currentConfig.watchlist.filter(t => t !== ticker);
      renderWatchlist();
    });
  });
}

function loadAlerts() {
  const container = document.getElementById('alert-rules');
  if (!container) return;

  const alerts = currentConfig.alerts?.keywords || [];

  safeSetChecked('alerts-enabled', currentConfig.alerts?.enabled ?? true);

  container.innerHTML = alerts.map((rule, i) => `
    <div class="alert-rule">
      <div class="alert-rule-info">
        <span class="alert-rule-name">${rule.name}</span>
        <span class="alert-rule-pattern">${rule.pattern}</span>
      </div>
      <label class="toggle">
        <input type="checkbox" data-rule="${i}" checked>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');
}

async function loadSuggested() {
  const container = document.getElementById('suggested-categories');
  if (!container) return;

  try {
    // Load accounts.json
    const url = chrome.runtime.getURL('accounts.json');
    const response = await fetch(url);
    const data = await response.json();

    const categoryIcons = {
      'Macro_CentralBanks': '🏦',
      'Institutional_AssetMgmt': '🏛️',
      'Regulatory_Government': '⚖️',
      'Media_News': '📰',
      'Wealth_ValueInvesting': '💎',
      'Trading_TechnicalAnalysis': '📈',
      'RealEstate_Housing': '🏠',
      'Geopolitics_OSINT': '🌍',
      'Crypto_DeFi': '₿',
      'Forex': '💱',
      'Commodities': '🛢️',
      'Corporate_IR': '🏢',
      'VentureCapital': '🚀'
    };

    const categoryNames = {
      'Macro_CentralBanks': 'Central Banks & Macro',
      'Institutional_AssetMgmt': 'Institutional Asset Management',
      'Regulatory_Government': 'Regulatory & Government',
      'Media_News': 'Financial News & Media',
      'Wealth_ValueInvesting': 'Value Investing & Wealth',
      'Trading_TechnicalAnalysis': 'Technical Analysis & Trading',
      'RealEstate_Housing': 'Real Estate & Housing',
      'Geopolitics_OSINT': 'Geopolitics & OSINT',
      'Crypto_DeFi': 'Crypto & DeFi',
      'Forex': 'Forex & Currencies',
      'Commodities': 'Commodities & Resources',
      'Corporate_IR': 'Corporate & Investor Relations',
      'VentureCapital': 'Venture Capital & Startups'
    };

    // Add custom CSS for the new design
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .signal-directory-header {
        background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        color: white;
      }
      
      .signal-directory-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .signal-directory-subtitle {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .category-card {
        background: var(--bg-surface);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        transition: all 0.3s ease;
      }
      
      .category-card:hover {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
      }
      
      .category-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(139, 92, 246, 0.1);
      }
      
      .category-icon {
        font-size: 28px;
      }
      
      .category-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
      }
      
      .category-count {
        font-size: 12px;
        color: var(--text-muted);
        background: rgba(139, 92, 246, 0.1);
        padding: 4px 12px;
        border-radius: 12px;
      }
      
      .accounts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .account-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(139, 92, 246, 0.05);
        border: 1px solid rgba(139, 92, 246, 0.1);
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }
      
      .account-card:hover {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(139, 92, 246, 0.2);
      }
      
      .account-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
        overflow: hidden;
      }
      
      .account-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .account-info {
        flex: 1;
        min-width: 0;
      }
      
      .account-handle {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .account-meta {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 2px;
      }
    `;
    document.head.appendChild(styleEl);

    let html = `
      <div class="signal-directory-header">
        <div class="signal-directory-title">📡 Signal Directory</div>
        <div class="signal-directory-subtitle">
          ${Object.keys(data.accounts).length} categories • ${Object.values(data.accounts).flat().length} verified accounts
        </div>
      </div>
    `;

    Object.entries(data.accounts).forEach(([key, handles]) => {
      const icon = categoryIcons[key] || '📊';
      const name = categoryNames[key] || key.replace(/_/g, ' ');

      html += `
        <div class="category-card">
          <div class="category-header">
            <span class="category-icon">${icon}</span>
            <span class="category-name">${name}</span>
            <span class="category-count">${handles.length} accounts</span>
          </div>
          <div class="accounts-grid">
            ${handles.map(handle => {
        const cleanHandle = handle.replace('@', '');
        const initials = cleanHandle.substring(0, 2).toUpperCase();

        return `
                <a href="https://x.com/${cleanHandle}" target="_blank" class="account-card" data-handle="${cleanHandle}">
                  <div class="account-avatar" data-handle="${cleanHandle}">
                    <img src="https://unavatar.io/twitter/${cleanHandle}" 
                         onerror="this.style.display='none'; this.parentElement.textContent='${initials}'"
                         alt="${cleanHandle}">
                  </div>
                  <div class="account-info">
                    <div class="account-handle">@${cleanHandle}</div>
                  </div>
                </a>
              `;
      }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('[Settings] Failed to load suggested accounts:', error);
    container.innerHTML = '<p class="text-muted">Failed to load suggested accounts.</p>';
  }
}

function loadDisplay() {
  const ui = currentConfig.ui || {};

  safeSetChecked('ui-sidebar', ui.showSidebar ?? true);
  safeSetChecked('ui-ticker-tags', ui.showTickerTags ?? true);
  safeSetChecked('ui-tier-badges', ui.showTierBadges ?? true);
  safeSetValue('ui-refresh', ui.priceRefreshSec || 30);
}

// === SAVE SETTINGS ===
async function saveSettings() {
  console.log('[Settings] Saving settings...');

  // Filters
  currentConfig.filters = currentConfig.filters || {};
  currentConfig.filters.hideEngagementBait = safeGetChecked('filter-engagement');
  currentConfig.filters.hidePromo = safeGetChecked('filter-promo');
  currentConfig.filters.hideLowEffort = safeGetChecked('filter-low-effort');
  currentConfig.filters.hideCryptoScams = safeGetChecked('filter-crypto');
  currentConfig.filters.hideDisclaimers = safeGetChecked('filter-disclaimers');
  currentConfig.filters.hideThreads = safeGetChecked('filter-threads');
  currentConfig.filters.hideOldNews = safeGetChecked('filter-old-news');
  currentConfig.filters.enableTimeSensitive = safeGetChecked('filter-time-sensitive');
  currentConfig.filters.enableSpamFilter = true;
  currentConfig.filters.enableWatchlistHighlight = true;
  currentConfig.filters.enableTierColors = true;

  // Tiers
  currentConfig.tiers = {
    tier1: parseTextarea('tier1-accounts'),
    tier2: parseTextarea('tier2-accounts'),
    tier3: parseTextarea('tier3-accounts')
  };

  // UI
  currentConfig.ui = currentConfig.ui || {};
  currentConfig.ui.showSidebar = safeGetChecked('ui-sidebar');
  currentConfig.ui.showTickerTags = safeGetChecked('ui-ticker-tags');
  currentConfig.ui.showTierBadges = safeGetChecked('ui-tier-badges');
  currentConfig.ui.priceRefreshSec = parseInt(safeGetValue('ui-refresh')) || 30;

  // Alerts
  currentConfig.alerts = currentConfig.alerts || {};
  currentConfig.alerts.enabled = safeGetChecked('alerts-enabled');

  if (saveConfig) {
    await saveConfig(currentConfig);
    console.log('[Settings] Settings saved');
  }

  showToast('Settings saved!');
}

function parseTextarea(id) {
  const text = safeGetValue(id);
  return text
    .split('\n')
    .map(s => s.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

// === HELPER FUNCTIONS ===
function safeSetChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

function safeGetChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function safeGetValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function addToTier2(handle) {
  currentConfig.tiers = currentConfig.tiers || {};
  currentConfig.tiers.tier2 = currentConfig.tiers.tier2 || [];

  const normalized = handle.toLowerCase().replace(/^@/, '');
  if (!currentConfig.tiers.tier2.includes(normalized)) {
    currentConfig.tiers.tier2.push(normalized);
    safeSetValue('tier2-accounts', currentConfig.tiers.tier2.join('\n'));
  }
}

function addTicker(ticker) {
  currentConfig.watchlist = currentConfig.watchlist || [];
  const normalized = ticker.toUpperCase().replace(/^\$/, '');

  if (!/^[A-Z]{1,10}$/.test(normalized)) return false;

  if (!currentConfig.watchlist.includes(normalized)) {
    currentConfig.watchlist.push(normalized);
    renderWatchlist();
    return true;
  }
  return false;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');
  if (!toast || !messageEl) return;

  messageEl.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// === EVENT LISTENERS ===
function setupEventListeners() {
  console.log('[Settings] Setting up event listeners...');

  // Save all
  const saveBtn = document.getElementById('save-all');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // Add ticker
  const addTickerBtn = document.getElementById('add-ticker-btn');
  if (addTickerBtn) {
    addTickerBtn.addEventListener('click', () => {
      const input = document.getElementById('add-ticker-input');
      if (input && addTicker(input.value)) {
        showToast(`Added $${input.value.toUpperCase()}`);
        input.value = '';
      }
    });
  }

  const addTickerInput = document.getElementById('add-ticker-input');
  if (addTickerInput) {
    addTickerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = document.getElementById('add-ticker-btn');
        if (btn) btn.click();
      }
    });
  }

  // Quick tickers
  document.querySelectorAll('.quick-ticker').forEach(btn => {
    btn.addEventListener('click', () => {
      const ticker = btn.dataset.ticker;
      if (addTicker(ticker)) {
        showToast(`Added $${ticker}`);
      }
    });
  });

  // Follow all
  const followAllBtn = document.getElementById('follow-all-btn');
  if (followAllBtn && getAllSuggestedHandles) {
    followAllBtn.addEventListener('click', () => {
      const handles = getAllSuggestedHandles();
      alert(`This will open ${handles.length} tabs to follow accounts.\n\nClick OK to proceed.`);

      handles.slice(0, 10).forEach((handle, i) => {
        setTimeout(() => {
          window.open(`https://x.com/${handle}`, '_blank');
        }, i * 500);
      });

      showToast('Opening first 10 accounts...');
    });
  }

  // Add all to Tier 2
  const addAllTier2Btn = document.getElementById('add-all-tier2-btn');
  if (addAllTier2Btn && getAllSuggestedHandles) {
    addAllTier2Btn.addEventListener('click', () => {
      const handles = getAllSuggestedHandles();
      handles.forEach(handle => addToTier2(handle));
      showToast(`Added ${handles.length} accounts to Tier 2`);
    });
  }

  // Export
  const exportBtn = document.getElementById('export-settings');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'traderx-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported!');
    });
  }

  // Import
  const importBtn = document.getElementById('import-settings');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        currentConfig = imported;
        if (saveConfig) await saveConfig(currentConfig);
        location.reload();
      } catch (err) {
        alert('Invalid settings file');
      }
    });
  }

  // Reset
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset ALL settings? This cannot be undone.')) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.clear();
        }
        location.reload();
      }
    });
  }

  console.log('[Settings] Event listeners setup complete');
}

// Initialize
console.log('[Settings] Script loaded, waiting for DOM...');

function safeInit() {
  try {
    console.log('[Settings] safeInit running...');
    init();
    console.log('[Settings] safeInit completed successfully');
  } catch (error) {
    console.error('[Settings] Init failed with error:', error);
    // Still try to setup navigation even if other things fail
    try {
      setupNavigation();
      console.log('[Settings] Navigation setup completed (fallback)');
    } catch (navError) {
      console.error('[Settings] Navigation setup also failed:', navError);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
  console.log('[Settings] Waiting for DOMContentLoaded...');
} else {
  // DOM already loaded
  console.log('[Settings] DOM already ready, calling safeInit...');
  safeInit();
}
