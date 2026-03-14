// === TRADERX PRO v4.0 — POPUP CONTROLLER ===

// ── Market Status ──────────────────────────────────────────────────────
function getMarketStatus() {
    const now = new Date();
    const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hour = et.getHours();
    const minute = et.getMinutes();
    const time = hour + minute / 60;
    const day = et.getDay();

    if (day === 0 || day === 6) return { text: 'Closed', open: false };
    if (time >= 4 && time < 9.5) return { text: 'Pre-Market', open: true };
    if (time >= 9.5 && time < 16) return { text: 'Market Open', open: true };
    if (time >= 16 && time < 20) return { text: 'After Hours', open: true };
    return { text: 'Closed', open: false };
}

// ── Config ─────────────────────────────────────────────────────────────
async function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['config'], (result) => {
            resolve(result.config || {
                watchlist: [],
                filters: {
                    enableSpamFilter: true,
                    enableWatchlistHighlight: true,
                    enableTierColors: true,
                    enableTimeSensitive: true
                },
                ui: { showSidebar: true }
            });
        });
    });
}

async function saveConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ config }, resolve);
    });
}

// ── Animate Value ──────────────────────────────────────────────────────
function animateValue(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.round(current + (target - current) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// ── Initialize ─────────────────────────────────────────────────────────
async function init() {
    const config = await getConfig();

    // Market status
    const market = getMarketStatus();
    document.getElementById('market-status').textContent = market.text;
    const dot = document.getElementById('market-dot');
    if (!market.open) dot.classList.add('closed');

    // Load toggles
    document.getElementById('toggle-spam').checked = config.filters?.enableSpamFilter ?? true;
    document.getElementById('toggle-watchlist').checked = config.filters?.enableWatchlistHighlight ?? true;
    document.getElementById('toggle-tiers').checked = config.filters?.enableTierColors ?? true;
    document.getElementById('toggle-time').checked = config.filters?.enableTimeSensitive ?? true;
    document.getElementById('toggle-sidebar').checked = config.ui?.showSidebar ?? true;

    renderWatchlist(config.watchlist || []);
    loadStats();
    setupEventListeners();
}

// ── Render Watchlist ───────────────────────────────────────────────────
function renderWatchlist(watchlist) {
    const container = document.getElementById('watchlist-container');

    if (!watchlist || watchlist.length === 0) {
        container.innerHTML = '<div class="empty-state">No tickers yet — add one above</div>';
        return;
    }

    container.innerHTML = '';
    watchlist.forEach((ticker, i) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.style.animationDelay = `${i * 30}ms`;
        tag.innerHTML = `$${ticker} <span class="tag-remove">×</span>`;
        tag.onclick = () => removeTicker(ticker);
        container.appendChild(tag);
    });
}

// ── Load Stats ─────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && (tab.url?.includes('x.com') || tab.url?.includes('twitter.com'))) {
            chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
                if (response) {
                    animateValue(document.getElementById('stat-hidden'), response.hiddenCount || 0);
                    animateValue(document.getElementById('stat-alerts'), response.alertCount || 0);
                    animateValue(document.getElementById('stat-watchlist'), response.watchlistMentions || 0);
                }
            });
        }
    } catch (e) {
        console.log('Could not load stats:', e);
    }
}

// ── Event Listeners ────────────────────────────────────────────────────
function setupEventListeners() {
    // Toggle handlers
    const toggles = [
        { id: 'toggle-spam', key: 'enableSpamFilter' },
        { id: 'toggle-watchlist', key: 'enableWatchlistHighlight' },
        { id: 'toggle-tiers', key: 'enableTierColors' },
        { id: 'toggle-time', key: 'enableTimeSensitive' }
    ];

    toggles.forEach(({ id, key }) => {
        document.getElementById(id).addEventListener('change', async (e) => {
            const config = await getConfig();
            config.filters = config.filters || {};
            config.filters[key] = e.target.checked;
            await saveConfig(config);
        });
    });

    document.getElementById('toggle-sidebar').addEventListener('change', async (e) => {
        const config = await getConfig();
        config.ui = config.ui || {};
        config.ui.showSidebar = e.target.checked;
        await saveConfig(config);
    });

    // Add ticker
    document.getElementById('add-ticker').addEventListener('click', addTicker);
    document.getElementById('ticker-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addTicker();
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', searchTicker);
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchTicker();
    });

    // Buttons
    document.getElementById('open-settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.getElementById('refresh-feed').addEventListener('click', async () => {
        const btn = document.getElementById('refresh-feed');
        const icon = btn.querySelector('.action-icon');
        icon.style.transition = 'transform 0.6s ease';
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => { icon.style.transform = ''; }, 700);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.tabs.reload(tab.id);
    });

    document.getElementById('view-alerts').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'alerts.html' });
    });

    document.getElementById('open-dashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000' });
    });
}

// ── Add Ticker ─────────────────────────────────────────────────────────
async function addTicker() {
    const input = document.getElementById('ticker-input');
    const successMsg = document.getElementById('add-success');
    const ticker = input.value.trim().toUpperCase().replace(/^\$/, '');

    if (!ticker || !/^[A-Z]{1,10}$/.test(ticker)) {
        input.style.borderColor = '#EF4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }, 1200);
        return;
    }

    const config = await getConfig();
    config.watchlist = config.watchlist || [];

    if (!config.watchlist.includes(ticker)) {
        config.watchlist.push(ticker);
        await saveConfig(config);
        renderWatchlist(config.watchlist);

        successMsg.textContent = `✓ $${ticker} added to watchlist!`;
        successMsg.style.display = 'block';
        successMsg.style.background = '';
        successMsg.style.color = '';
        setTimeout(() => { successMsg.style.display = 'none'; }, 2500);
    } else {
        successMsg.textContent = `$${ticker} is already in watchlist`;
        successMsg.style.background = 'rgba(245, 158, 11, 0.12)';
        successMsg.style.color = '#F59E0B';
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
            successMsg.style.background = '';
            successMsg.style.color = '';
        }, 2500);
    }

    input.value = '';
}

// ── Remove Ticker ──────────────────────────────────────────────────────
async function removeTicker(ticker) {
    const config = await getConfig();
    config.watchlist = (config.watchlist || []).filter(t => t !== ticker);
    await saveConfig(config);
    renderWatchlist(config.watchlist);
}

// ── Search Ticker ──────────────────────────────────────────────────────
async function searchTicker() {
    const input = document.getElementById('search-input');
    const status = document.getElementById('search-status');
    const ticker = input.value.trim().toUpperCase().replace(/^\$/, '');

    if (!ticker) {
        status.textContent = '';
        return;
    }

    if (!/^[A-Z]{1,10}$/.test(ticker)) {
        status.textContent = '❌ Invalid ticker format';
        status.className = 'search-status';
        return;
    }

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && (tab.url?.includes('x.com') || tab.url?.includes('twitter.com'))) {
            chrome.tabs.sendMessage(tab.id, { action: 'searchTicker', ticker }, (response) => {
                if (response?.success) {
                    status.textContent = `🔍 Filtering posts for $${ticker}`;
                    status.className = 'search-status active';
                }
            });
        } else {
            status.textContent = '⚠️ Open x.com first';
            status.className = 'search-status';
        }
    } catch (e) {
        status.textContent = '⚠️ Could not search';
    }
}

document.addEventListener('DOMContentLoaded', init);
