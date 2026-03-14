// ============================================================================
// TRADERX PRO — Chrome Storage Helpers
// Single source of truth for all extension persistence.
// Always use chrome.storage.local (NOT localStorage) so data survives
// incognito, profile switches, and extension updates correctly.
// ============================================================================

import { STORAGE_KEYS, DEFAULT_CONFIG } from "./constants.js";

// ============================================================================
// CONFIG (main extension settings)
// ============================================================================

/**
 * Load the full TraderX config from chrome.storage.local.
 * Merges deeply with DEFAULT_CONFIG so new keys are always present.
 */
export async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.config], (result) => {
      const saved = result[STORAGE_KEYS.config] || {};
      const merged = deepMerge(DEFAULT_CONFIG, saved);
      resolve(merged);
    });
  });
}

/**
 * Persist the full config object to chrome.storage.local.
 */
export async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.config]: config }, resolve);
  });
}

/**
 * Update only specific top-level or nested keys in the config.
 * Performs a shallow merge at the top level; pass nested objects explicitly.
 *
 * @example
 *   await updateConfig({ filters: { enableSpamFilter: false } });
 */
export async function updateConfig(partial) {
  const current = await getConfig();
  const updated = deepMerge(current, partial);
  await saveConfig(updated);
  return updated;
}

/**
 * Reset the config back to factory defaults.
 */
export async function resetConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEYS.config, () => {
      resolve(DEFAULT_CONFIG);
    });
  });
}

// ============================================================================
// WATCHLIST
// ============================================================================

export async function getWatchlist() {
  const config = await getConfig();
  return Array.isArray(config.watchlist) ? config.watchlist : [];
}

export async function addToWatchlist(ticker) {
  const config = await getConfig();
  const normalized = ticker.toUpperCase().replace(/^\$/, "").trim();
  if (!normalized || config.watchlist.includes(normalized))
    return config.watchlist;
  config.watchlist = [...config.watchlist, normalized];
  await saveConfig(config);
  return config.watchlist;
}

export async function removeFromWatchlist(ticker) {
  const config = await getConfig();
  const normalized = ticker.toUpperCase().replace(/^\$/, "").trim();
  config.watchlist = config.watchlist.filter((t) => t !== normalized);
  await saveConfig(config);
  return config.watchlist;
}

// ============================================================================
// API KEY (for backend sync — never hardcoded in source)
// ============================================================================

export async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.apiKey], (result) => {
      resolve(result[STORAGE_KEYS.apiKey] || null);
    });
  });
}

export async function saveApiKey(key) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.apiKey]: key }, resolve);
  });
}

// ============================================================================
// BACKEND URL
// ============================================================================

export async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.backendUrl], (result) => {
      resolve(result[STORAGE_KEYS.backendUrl] || "http://localhost:3001");
    });
  });
}

export async function saveBackendUrl(url) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.backendUrl]: url }, resolve);
  });
}

// ============================================================================
// ALERT HISTORY
// ============================================================================

const MAX_ALERT_HISTORY = 500;

export async function getAlertHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.alertHistory], (result) => {
      resolve(result[STORAGE_KEYS.alertHistory] || []);
    });
  });
}

export async function pushAlert(alert) {
  const history = await getAlertHistory();
  const updated = [
    { ...alert, id: Date.now(), savedAt: new Date().toISOString() },
    ...history,
  ].slice(0, MAX_ALERT_HISTORY);

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.alertHistory]: updated }, () => {
      resolve(updated);
    });
  });
}

export async function clearAlertHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.alertHistory]: [] }, resolve);
  });
}

// ============================================================================
// PORTFOLIO POSITIONS
// ============================================================================

export async function getPositions() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.portfolio], (result) => {
      resolve(result[STORAGE_KEYS.portfolio] || []);
    });
  });
}

export async function savePositions(positions) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.portfolio]: positions }, resolve);
  });
}

export async function addPosition(position) {
  const positions = await getPositions();
  const newPosition = {
    ...position,
    id: generatePositionId(),
    openedAt: new Date().toISOString(),
    closedAt: null,
    closePrice: null,
  };
  const updated = [...positions, newPosition];
  await savePositions(updated);
  return newPosition;
}

export async function closePosition(positionId, closePrice) {
  const positions = await getPositions();
  const updated = positions.map((p) =>
    p.id === positionId
      ? { ...p, closedAt: new Date().toISOString(), closePrice }
      : p,
  );
  await savePositions(updated);
  return updated.find((p) => p.id === positionId);
}

export async function removePosition(positionId) {
  const positions = await getPositions();
  const updated = positions.filter((p) => p.id !== positionId);
  await savePositions(updated);
  return updated;
}

// ============================================================================
// SENTIMENT HISTORY (per-ticker, used for sparklines)
// ============================================================================

const MAX_HISTORY_POINTS = 200;

export async function getSentimentHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.sentimentHistory], (result) => {
      resolve(result[STORAGE_KEYS.sentimentHistory] || {});
    });
  });
}

export async function recordSentiment(ticker, sentiment, status) {
  const history = await getSentimentHistory();
  const key = ticker.toUpperCase();

  if (!history[key]) history[key] = [];

  history[key].push({
    sentiment,
    status,
    timestamp: Date.now(),
  });

  // Keep only last MAX_HISTORY_POINTS entries per ticker
  if (history[key].length > MAX_HISTORY_POINTS) {
    history[key] = history[key].slice(-MAX_HISTORY_POINTS);
  }

  // Prune entries older than 72h
  const cutoff = Date.now() - 72 * 60 * 60 * 1000;
  history[key] = history[key].filter((e) => e.timestamp > cutoff);

  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [STORAGE_KEYS.sentimentHistory]: history },
      () => {
        resolve(history[key]);
      },
    );
  });
}

export async function getTickerSentimentHistory(ticker) {
  const history = await getSentimentHistory();
  return history[ticker.toUpperCase()] || [];
}

// ============================================================================
// VOLUME HISTORY (per-ticker, used for spike detection)
// ============================================================================

export async function getVolumeHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.volumeHistory], (result) => {
      resolve(result[STORAGE_KEYS.volumeHistory] || {});
    });
  });
}

export async function recordVolume(ticker, count) {
  const history = await getVolumeHistory();
  const key = ticker.toUpperCase();

  if (!history[key]) history[key] = [];

  history[key].push({ count, timestamp: Date.now() });

  // Keep 24h window
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  history[key] = history[key].filter((e) => e.timestamp > cutoff);

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.volumeHistory]: history }, () => {
      resolve(history[key]);
    });
  });
}

// ============================================================================
// COMBO ALERT RULES
// ============================================================================

export async function getComboAlertRules() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.comboAlerts], (result) => {
      resolve(result[STORAGE_KEYS.comboAlerts] || null);
    });
  });
}

export async function saveComboAlertRules(rules) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.comboAlerts]: rules }, resolve);
  });
}

// ============================================================================
// STATS HELPERS
// ============================================================================

export async function incrementStat(statKey, amount = 1) {
  const config = await getConfig();
  const stats = config.stats || {};
  stats[statKey] = (stats[statKey] || 0) + amount;

  // Reset daily counters if it's a new day
  const today = new Date().toDateString();
  if (stats.lastResetDate !== today) {
    stats.watchlistMentions = 0;
    stats.alertsFired = 0;
    stats.lastResetDate = today;
  }

  await updateConfig({ stats });
  return stats;
}

// ============================================================================
// FULL EXPORT / IMPORT (for settings backup)
// ============================================================================

export async function exportAllSettings() {
  const config = await getConfig();
  return JSON.stringify(config, null, 2);
}

export async function importAllSettings(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    await saveConfig(parsed);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CHROME.STORAGE.ONCHANGED LISTENER HELPER
// Register a callback that fires whenever the TraderX config changes.
// Useful for live-syncing config across tabs without a reload.
// ============================================================================

/**
 * @param {function(newConfig: object): void} callback
 * @returns {function} unsubscribe — call this to remove the listener
 */
export function onConfigChange(callback) {
  function listener(changes, area) {
    if (area !== "local") return;
    if (changes[STORAGE_KEYS.config]) {
      const newConfig = deepMerge(
        DEFAULT_CONFIG,
        changes[STORAGE_KEYS.config].newValue || {},
      );
      callback(newConfig);
    }
  }
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Deep-merge two plain objects. Arrays are replaced (not concatenated).
 * `override` values win over `base` values at every level.
 */
function deepMerge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return override !== undefined ? override : base;
  }

  const result = Object.assign({}, base);

  for (const key of Object.keys(override)) {
    const baseVal = base ? base[key] : undefined;
    const overVal = override[key];

    if (
      overVal !== null &&
      typeof overVal === "object" &&
      !Array.isArray(overVal) &&
      typeof baseVal === "object" &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal, overVal);
    } else {
      result[key] = overVal;
    }
  }

  return result;
}

function generatePositionId() {
  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
