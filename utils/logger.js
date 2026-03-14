// ============================================================================
// TRADERX PRO — Logger
// Lightweight debug logger for the Chrome extension.
// All logs are gated behind the debugMode config flag to keep the console
// clean for regular users while giving developers full visibility.
// ============================================================================

const PREFIX = "[TraderX]";

// ============================================================================
// MODULE-LEVEL STATE
// debugEnabled is loaded once on first call and cached.
// Call resetDebugCache() after changing the config to re-read it.
// ============================================================================

let _debugEnabled = null; // null = not yet loaded

/**
 * Asynchronously read the debugMode flag from chrome.storage.local.
 * Result is cached so subsequent calls are synchronous.
 */
async function isDebugEnabled() {
  if (_debugEnabled !== null) return _debugEnabled;

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(["traderx_config"], (result) => {
        _debugEnabled = !!result?.traderx_config?.debugMode;
        resolve(_debugEnabled);
      });
    } catch {
      // chrome.storage not available (e.g. in a plain Node test)
      _debugEnabled = false;
      resolve(false);
    }
  });
}

/**
 * Force-invalidate the cached debug flag.
 * Call this whenever the user changes Settings → Debug Mode.
 */
export function resetDebugCache() {
  _debugEnabled = null;
}

// ============================================================================
// PUBLIC LOGGING API
// ============================================================================

/**
 * Debug-gated info log.
 * Only prints when debugMode === true in the extension config.
 */
export async function log(...args) {
  if (await isDebugEnabled()) {
    console.log(PREFIX, ...args);
  }
}

/**
 * Debug-gated warning log.
 * Only prints when debugMode === true in the extension config.
 */
export async function warn(...args) {
  if (await isDebugEnabled()) {
    console.warn(PREFIX, ...args);
  }
}

/**
 * Always-on error log.
 * Errors are always printed regardless of the debugMode flag because
 * silent failures are worse than noisy ones.
 */
export function error(...args) {
  console.error(PREFIX, ...args);
}

/**
 * Synchronous log that fires unconditionally.
 * Use sparingly — prefer `log()` for routine messages.
 */
export function forceLog(...args) {
  console.log(PREFIX, ...args);
}

// ============================================================================
// STRUCTURED EVENT LOGGER
// Emits a single formatted line: "[TraderX] [Module] message  {key: val, ...}"
// ============================================================================

/**
 * @param {string} module   - Short module name, e.g. "PriceFetcher"
 * @param {string} message  - Human-readable message
 * @param {object} [data]   - Optional key/value context (printed as JSON)
 */
export async function logEvent(module, message, data) {
  if (!(await isDebugEnabled())) return;

  const moduleTag = `[${module}]`;
  if (data && typeof data === "object") {
    console.log(`${PREFIX} ${moduleTag} ${message}`, data);
  } else {
    console.log(`${PREFIX} ${moduleTag} ${message}`);
  }
}

/**
 * Same as logEvent but always prints (errors, critical warnings).
 */
export function logEventAlways(module, message, data) {
  const moduleTag = `[${module}]`;
  if (data && typeof data === "object") {
    console.error(`${PREFIX} ${moduleTag} ${message}`, data);
  } else {
    console.error(`${PREFIX} ${moduleTag} ${message}`);
  }
}

// ============================================================================
// PERFORMANCE TIMER
// ============================================================================

/**
 * Start a named timer. Returns a `stop()` function that logs elapsed ms.
 *
 * @example
 *   const stop = startTimer('AnalysisEngine', 'analyzeTicker BTC');
 *   await doWork();
 *   stop(); // logs "[TraderX] [AnalysisEngine] analyzeTicker BTC took 342ms"
 */
export async function startTimer(module, label) {
  const debug = await isDebugEnabled();
  const t0 = performance.now();

  return function stop() {
    if (!debug) return;
    const elapsed = (performance.now() - t0).toFixed(1);
    console.log(`${PREFIX} [${module}] ${label} took ${elapsed}ms`);
  };
}

// ============================================================================
// AUTO-SUBSCRIBE TO CONFIG CHANGES
// If the user toggles Debug Mode in Settings, reset our cache so the
// next log call picks up the new value without requiring a page reload.
// ============================================================================

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["traderx_config"]) {
      resetDebugCache();
    }
  });
} catch {
  // Not in an extension context — ignore (e.g. unit tests)
}
