// ============================================================================
// TRADERX PRO — Utility Helpers
// ============================================================================

// ============================================================================
// DEBOUNCE / THROTTLE
// ============================================================================

export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

export function normalizeText(text) {
  return (text || "").toLowerCase().trim();
}

export function extractText(el) {
  if (!el) return "";
  return el.innerText || el.textContent || "";
}

export function sanitizeText(text) {
  return (text || "").replace(/[<>]/g, "").trim();
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

export function toTitleCase(text) {
  return (text || "").replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function truncate(text, maxLen = 120) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export function generateId(prefix = "tx") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

// ============================================================================
// TICKER UTILITIES
// ============================================================================

/**
 * Normalize a ticker string — uppercase, strip leading $, strip non-alpha chars
 * e.g.  "$btc"  →  "BTC"
 *        "BRK.B" →  "BRK.B"   (keeps dot for BRK.A / BRK.B)
 */
export function normalizeTicker(ticker) {
  if (!ticker) return "";
  return ticker.toUpperCase().replace(/^\$/, "").trim();
}

/**
 * Returns true if a string looks like a valid ticker symbol.
 * Accepts 1–6 uppercase letters optionally followed by .A or .B etc.
 */
export function isValidTicker(ticker) {
  return /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(normalizeTicker(ticker));
}

/**
 * Format a price number based on its magnitude.
 * Matches the display rules used throughout the dashboard.
 */
export function formatPrice(price, type = "stock") {
  if (price === null || price === undefined || isNaN(price)) return "--";

  if (type === "crypto") {
    if (price >= 1_000)
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  }

  // Stocks / ETFs
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatChange(change) {
  if (change === null || change === undefined || isNaN(change)) return "--";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

export function getChangeColor(change) {
  if (change === null || change === undefined) return "#94A3B8";
  return change >= 0 ? "#10B981" : "#EF4444";
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parse a compact number string like "12.3K", "4.5M" into a raw number.
 */
export function parseCompactNumber(str) {
  if (!str) return 0;
  const s = String(str).trim().replace(/,/g, "");
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  const suffix = s.slice(-1).toUpperCase();
  if (suffix === "K") return num * 1_000;
  if (suffix === "M") return num * 1_000_000;
  if (suffix === "B") return num * 1_000_000_000;
  return num;
}

/**
 * Format a large number as compact string: 12300 → "12.3K"
 */
export function formatCompactNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

// ============================================================================
// DATE / TIME UTILITIES
// ============================================================================

/**
 * Return a human-friendly relative date string from any timestamp value.
 * Accepts: ISO string, unix seconds (< 1e12), unix ms (>= 1e12), or Date object.
 */
export function formatRelativeTime(input) {
  if (!input) return "Unknown";
  let date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "number") {
    // Distinguish unix seconds vs milliseconds
    date = new Date(input < 1e12 ? input * 1000 : input);
  } else {
    date = new Date(input);
  }

  if (isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 60) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get US market session status based on current Eastern Time.
 * Returns: 'preMarket' | 'open' | 'afterHours' | 'closed' | 'weekend'
 */
export function getMarketStatus() {
  const now = new Date();
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const day = et.getDay(); // 0 = Sunday, 6 = Saturday
  const time = et.getHours() + et.getMinutes() / 60;

  if (day === 0 || day === 6) return "weekend";
  if (time >= 4 && time < 9.5) return "preMarket";
  if (time >= 9.5 && time < 16) return "open";
  if (time >= 16 && time < 20) return "afterHours";
  return "closed";
}

export function isMarketOpen() {
  return getMarketStatus() === "open";
}

export function getMarketStatusLabel() {
  const labels = {
    preMarket: "🌅 Pre-Market",
    open: "📈 Market Open",
    afterHours: "🌙 After Hours",
    closed: "😴 Closed",
    weekend: "😴 Weekend",
  };
  return labels[getMarketStatus()] || "❓ Unknown";
}

// ============================================================================
// DOM UTILITIES
// ============================================================================

export function safeQuerySelector(parent, selector) {
  try {
    return (parent || document).querySelector(selector);
  } catch {
    return null;
  }
}

export function safeQuerySelectorAll(parent, selector) {
  try {
    return Array.from((parent || document).querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Wait for an element matching `selector` to appear in the DOM.
 * Resolves with the element or null on timeout.
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// ============================================================================
// SENTIMENT UTILITIES
// ============================================================================

/**
 * Convert a raw sentiment score (-1 to 1) into a human-readable status label.
 */
export function sentimentToStatus(score, sampleSize = 999) {
  if (sampleSize < 5) return "LOW DATA";

  if (score > 0.3) return "VERY BULLISH";
  if (score > 0.15) return "BULLISH";
  if (score < -0.3) return "VERY BEARISH";
  if (score < -0.15) return "BEARISH";
  return "NEUTRAL";
}

/**
 * Get a CSS color for a sentiment status string.
 */
export function sentimentStatusColor(status) {
  const upper = (status || "").toUpperCase();
  if (upper.includes("VERY BULL") || upper === "BULLISH") return "#00A36C";
  if (upper.includes("VERY BEAR") || upper === "BEARISH") return "#EF4444";
  if (upper === "VOLATILE") return "#F59E0B";
  if (upper === "NEUTRAL") return "#C9A66B";
  return "#6B7280"; // gray for LOW DATA / NO DATA
}

/**
 * Compute a simple bar chart string for Telegram messages.
 * e.g. formatSentimentBar(0.6) → "[████████░░] +60%"
 */
export function formatSentimentBar(sentiment, barLen = 10) {
  const val = clamp(sentiment, -1, 1);
  const pos = Math.round(((val + 1) / 2) * barLen);
  const bar = "█".repeat(pos) + "░".repeat(barLen - pos);
  const pct = (val * 100).toFixed(0);
  return `[${bar}] ${pct > 0 ? "+" : ""}${pct}%`;
}

// ============================================================================
// COPY / EXPORT UTILITIES
// ============================================================================

/**
 * Copy `text` to clipboard. Returns a promise that resolves to true on success.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / restricted contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

/**
 * Trigger a browser file download with `content` as the file body.
 */
export function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert an array of objects to a CSV string.
 * The first object's keys become the header row.
 */
export function arrayToCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s}"`
      : s;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

// ============================================================================
// JACCARD SIMILARITY (for tweet deduplication)
// ============================================================================

export function jaccardSimilarity(a, b) {
  if (!a || !b) return 0;
  const setA = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  const setB = new Set(
    b
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

// ============================================================================
// ENGAGEMENT SCORE
// ============================================================================

/**
 * Compute a single engagement score from likes / retweets / replies.
 * Retweets are weighted 3×, replies 2×, likes 1×.
 */
export function computeEngagementScore(likes = 0, retweets = 0, replies = 0) {
  return (likes || 0) + (retweets || 0) * 3 + (replies || 0) * 2;
}
