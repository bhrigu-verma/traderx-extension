// ============================================================================
// TRADERX SETTINGS - COMPLETE BUNDLED SCRIPT
// This file contains all dependencies (utils, suggested, settings) bundled
// together for reliable loading in Manifest V3 extension pages.
// ============================================================================

console.log('🔧 [BUNDLE] Script executing...');

// ============================================================================
// UTILS - Core configuration, helpers, and market utilities
// ============================================================================

const DEFAULT_CONFIG = {
    watchlist: ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL'],
    tiers: {
        tier1: ['federalreserve', 'secgov', 'treasury', 'sec_enforcement', 'whitehouse', 'potus', 'fdadev'],
        tier2: ['unusual_whales', 'DeItaone', 'FirstSquawk', 'financialjuice', 'Newsquawk', 'zerohedge', 'Fxhedgers', 'SquawkCNBC', 'charliebilello', 'sentimentrader', 'biabormarket', 'Tradytics', 'spotgamma', 'optionabormarket', 'traderstewie', 'WallStJesus', 'jimcramer'],
        tier3: ['wallstreetbets', 'optionsflow', 'tradingsetups', 'stocktwits', 'TrendSpider', 'OptionsPlay']
    },
    filters: {
        enableSpamFilter: true,
        enableWatchlistHighlight: true,
        enableTierColors: true,
        enableTimeSensitive: true,
        hideEngagementBait: true,
        hidePromo: true,
        hideLowEffort: true,
        hideCryptoScams: true,
        hideDisclaimers: true,
        hideLowFollowers: false,
        hideThreads: true,
        hideOldNews: true,
        minFollowers: 500
    },
    alerts: {
        enabled: true,
        sound: true,
        keywords: [
            { name: 'FDA', pattern: 'FDA approval|FDA approves|FDA reject', tickers: 'watchlist' },
            { name: 'Earnings', pattern: 'earnings beat|earnings miss|EPS', tickers: 'watchlist' },
            { name: 'Halts', pattern: 'trading halt|halted|circuit breaker', tickers: 'all' },
            { name: 'Mergers', pattern: 'merger|acquisition|buyout', tickers: 'watchlist' },
            { name: 'Short Report', pattern: 'short report|short seller|hindenburg|citron', tickers: 'all' }
        ]
    },
    ui: {
        showSidebar: true,
        priceRefreshSec: 30,
        sidebarPosition: 'right',
        compactMode: false
    },
    stats: {
        tweetsHidden: 0,
        alertsTriggered: 0,
        watchlistMentions: 0
    }
};

async function getConfig() {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            console.warn('[BUNDLE] Chrome storage not available, using defaults');
            resolve(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
            return;
        }
        chrome.storage.local.get(['config'], (result) => {
            const config = result.config || {};
            const merged = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), config);
            resolve(merged);
        });
    });
}

async function saveConfig(config) {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            resolve();
            return;
        }
        chrome.storage.local.set({ config }, resolve);
    });
}

function deepMerge(target, source) {
    if (!source) return target;
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    });
    return target;
}

console.log('✅ [BUNDLE] Utils loaded');

// ============================================================================
// SUGGESTED - Curated trading accounts
// ============================================================================

const SUGGESTED_HANDLES = {
    official: {
        title: "🏛️ Official & Government",
        handles: ["federalreserve", "secgov", "treasury", "whitehouse"]
    },
    news: {
        title: "📰 Breaking News & Headlines",
        handles: ["unusual_whales", "DeItaone", "FirstSquawk", "financialjuice", "Newsquawk", "zerohedge"]
    },
    macro: {
        title: "🌍 Macro & Economics",
        handles: ["charliebilello", "sentimentrader"]
    },
    options: {
        title: "📊 Options & Flow",
        handles: ["Tradytics", "spotgamma"]
    },
    traders: {
        title: "📈 Active Traders",
        handles: ["traderstewie", "WallStJesus"]
    }
};

function getAllSuggestedHandles() {
    const all = [];
    Object.values(SUGGESTED_HANDLES).forEach(category => {
        all.push(...category.handles);
    });
    return [...new Set(all)];
}

console.log('✅ [BUNDLE] Suggested loaded:', getAllSuggestedHandles().length, 'handles');

// ============================================================================
// SETTINGS - Main Settings Page Logic
// ============================================================================

let currentConfig = null;

// Navigation function - called by event listeners
function switchToTab(tabId) {
    console.log('🎯 [NAV] Switching to tab:', tabId);

    // Remove all active states
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Activate clicked nav item
    const clickedNav = document.querySelector('.nav-item[data-tab="' + tabId + '"]');
    if (clickedNav) {
        clickedNav.classList.add('active');
        console.log('✅ [NAV] Activated nav item:', tabId);
    }

    // Show target tab
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('✅ [NAV] Showed tab content:', tabId);
    } else {
        console.error('❌ [NAV] Tab content not found: tab-' + tabId);
    }
}

// Setup navigation event listeners
function setupNavigation() {
    console.log('🚀 [NAV] Setting up navigation...');

    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    console.log('🚀 [NAV] Found', navItems.length, 'navigation items');

    if (navItems.length === 0) {
        console.error('❌ [NAV] No navigation items found!');
        return;
    }

    navItems.forEach((item, index) => {
        const tabId = item.dataset.tab;
        console.log('🚀 [NAV] Setting up item', index + ':', tabId);

        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👆 [CLICK] User clicked:', tabId);
            switchToTab(tabId);
        });
    });

    console.log('✅ [NAV] Navigation setup complete!');
}

// Initialize settings
async function initSettings() {
    console.log('⚙️ [SETTINGS] Initializing settings...');

    try {
        currentConfig = await getConfig();
        console.log('⚙️ [SETTINGS] Config loaded');

        loadAllSettings();
        setupEventListeners();

        console.log('✅ [SETTINGS] Settings initialized successfully');
    } catch (error) {
        console.error('❌ [SETTINGS] Initialization error:', error);
        currentConfig = DEFAULT_CONFIG;
        loadAllSettings();
        setupEventListeners();
    }
}

function loadAllSettings() {
    console.log('📋 [SETTINGS] Loading all settings...');
    try {
        loadFilters();
        loadTiers();
        loadWatchlist();
        loadAlerts();
        loadSuggested();
        loadDisplay();
        console.log('✅ [SETTINGS] All settings loaded');
    } catch (error) {
        console.error('❌ [SETTINGS] Error loading settings:', error);
    }
}

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

    container.innerHTML = watchlist.map(ticker =>
        '<div class="watchlist-tag" data-ticker="' + ticker + '">$' + ticker + '<span class="remove">×</span></div>'
    ).join('');

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

    container.innerHTML = alerts.map((rule, i) =>
        '<div class="alert-rule"><div class="alert-rule-info"><span class="alert-rule-name">' + rule.name + '</span><span class="alert-rule-pattern">' + rule.pattern + '</span></div><label class="toggle"><input type="checkbox" data-rule="' + i + '" checked><span class="toggle-slider"></span></label></div>'
    ).join('');
}

async function loadSuggested() {
    const container = document.getElementById('suggested-categories');
    if (!container) return;

    try {
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

        // Add dynamic styles for suggested accounts
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .signal-directory-header {
                background: linear-gradient(135deg, #00A36C 0%, #008f5d 100%);
                padding: 32px;
                border-radius: 16px;
                margin-bottom: 32px;
                color: white;
                box-shadow: 0 8px 24px rgba(0, 163, 108, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .signal-directory-title {
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 8px;
                letter-spacing: -0.02em;
            }
            .signal-directory-subtitle {
                font-size: 15px;
                opacity: 0.9;
                font-weight: 500;
            }
            .category-card {
                background: var(--color-graphite);
                border: 1px solid var(--color-soft-gray);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 32px;
                transition: all 0.3s ease;
            }
            .category-card:hover {
                border-color: rgba(0, 163, 108, 0.4);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
                transform: translateY(-2px);
            }
            .category-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--color-soft-gray);
            }
            .category-icon { font-size: 32px; }
            .category-name {
                font-size: 20px;
                font-weight: 700;
                color: var(--color-text);
                flex: 1;
            }
            .category-count {
                font-size: 13px;
                color: var(--accent-primary);
                background: rgba(0, 163, 108, 0.1);
                padding: 6px 14px;
                border-radius: 20px;
                font-weight: 600;
                border: 1px solid rgba(0, 163, 108, 0.2);
            }
            .accounts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 16px;
            }
            .account-card {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 14px;
                background: var(--color-charcoal);
                border: 1px solid var(--color-soft-gray);
                border-radius: 12px;
                text-decoration: none;
                color: var(--color-text);
                transition: all 0.2s ease;
            }
            .account-card:hover {
                background: var(--color-soft-gray);
                border-color: var(--accent-primary);
                transform: scale(1.02);
            }
            .account-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--color-graphite);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--accent-primary);
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
                overflow: hidden;
                border: 1px solid var(--color-soft-gray);
            }
            .account-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .account-handle {
                font-size: 14px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        document.head.appendChild(styleEl);

        let html = '<div class="signal-directory-header"><div class="signal-directory-title">📡 Signal Directory</div><div class="signal-directory-subtitle">' + Object.keys(data.accounts).length + ' categories • ' + Object.values(data.accounts).flat().length + ' curated accounts</div></div>';

        Object.entries(data.accounts).forEach(([key, handles]) => {
            const icon = categoryIcons[key] || '📊';
            const name = categoryNames[key] || key.replace(/_/g, ' ');

            html += `<div class="category-card"><div class="category-header"><span class="category-icon">${icon}</span><span class="category-name">${name}</span><span class="category-count">${handles.length} accounts</span></div><div class="accounts-grid">`;

            handles.forEach(handle => {
                const cleanHandle = handle.replace('@', '');
                const initials = cleanHandle.substring(0, 2).toUpperCase();
                // Using unavatar.io with a fallback to initials
                // Note: Twitter images are often rate-limited by free services.
                // Added a smooth fallback so it looks good even if images fail to load.
                const avatarUrl = `https://unavatar.io/twitter/${cleanHandle}?ttl=1h`;

                html += `
                    <a href="https://x.com/${cleanHandle}" target="_blank" class="account-card" data-handle="${cleanHandle}">
                        <div class="account-avatar" style="position: relative; background: var(--color-soft-gray); border: 1px solid var(--border-color);">
                            <span style="position: absolute; color: var(--accent-primary); font-weight: 700;">${initials}</span>
                            <img src="${avatarUrl}" 
                                 onload="this.style.opacity='1'; this.previousElementSibling.style.display='none'"
                                 onerror="this.style.display='none'" 
                                 alt="${cleanHandle}"
                                 style="opacity: 0; transition: opacity 0.3s ease; width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; border-radius: 50%;">
                        </div>
                        <div class="account-info">
                            <div class="account-handle">@${cleanHandle}</div>
                        </div>
                    </a>`;
            });

            html += '</div></div>';
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('[SETTINGS] Failed to load suggested accounts:', error);
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

async function saveSettings() {
    console.log('💾 [SAVE] Saving settings...');

    currentConfig.filters = currentConfig.filters || {};
    currentConfig.filters.hideEngagementBait = safeGetChecked('filter-engagement');
    currentConfig.filters.hidePromo = safeGetChecked('filter-promo');
    currentConfig.filters.hideLowEffort = safeGetChecked('filter-low-effort');
    currentConfig.filters.hideCryptoScams = safeGetChecked('filter-crypto');
    currentConfig.filters.hideDisclaimers = safeGetChecked('filter-disclaimers');
    currentConfig.filters.hideThreads = safeGetChecked('filter-threads');
    currentConfig.filters.hideOldNews = safeGetChecked('filter-old-news');
    currentConfig.filters.enableTimeSensitive = safeGetChecked('filter-time-sensitive');

    currentConfig.tiers = {
        tier1: parseTextarea('tier1-accounts'),
        tier2: parseTextarea('tier2-accounts'),
        tier3: parseTextarea('tier3-accounts')
    };

    currentConfig.ui = currentConfig.ui || {};
    currentConfig.ui.showSidebar = safeGetChecked('ui-sidebar');
    currentConfig.ui.showTickerTags = safeGetChecked('ui-ticker-tags');
    currentConfig.ui.showTierBadges = safeGetChecked('ui-tier-badges');
    currentConfig.ui.priceRefreshSec = parseInt(safeGetValue('ui-refresh')) || 30;

    currentConfig.alerts = currentConfig.alerts || {};
    currentConfig.alerts.enabled = safeGetChecked('alerts-enabled');

    await saveConfig(currentConfig);
    console.log('✅ [SAVE] Settings saved');
    showToast('Settings saved!');
}

function parseTextarea(id) {
    const text = safeGetValue(id);
    return text.split('\n').map(s => s.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
}

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

function setupEventListeners() {
    console.log('🎛️ [EVENTS] Setting up event listeners...');

    const saveBtn = document.getElementById('save-all');
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);

    const addTickerBtn = document.getElementById('add-ticker-btn');
    if (addTickerBtn) {
        addTickerBtn.addEventListener('click', () => {
            const input = document.getElementById('add-ticker-input');
            if (input && addTicker(input.value)) {
                showToast('Added $' + input.value.toUpperCase());
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

    document.querySelectorAll('.quick-ticker').forEach(btn => {
        btn.addEventListener('click', () => {
            const ticker = btn.dataset.ticker;
            if (addTicker(ticker)) showToast('Added $' + ticker);
        });
    });

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

    const importBtn = document.getElementById('import-settings');
    const importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            try {
                const imported = JSON.parse(text);
                currentConfig = imported;
                await saveConfig(currentConfig);
                location.reload();
            } catch (err) {
                alert('Invalid settings file');
            }
        });
    }

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

    console.log('✅ [EVENTS] Event listeners setup complete');
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

function main() {
    console.log('🚀 [MAIN] Starting initialization...');

    // Setup navigation first (critical for tab switching)
    setupNavigation();

    // Initialize settings
    initSettings();

    console.log('✅ [MAIN] Initialization complete!');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    console.log('⏳ [MAIN] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', main);
} else {
    console.log('✅ [MAIN] DOM already ready, starting now');
    main();
}

console.log('✅ [BUNDLE] Script fully loaded');
