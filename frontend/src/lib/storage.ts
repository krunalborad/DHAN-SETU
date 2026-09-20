/**
 * STORAGE LAYER
 * -------------------------------------------------------------------------
 * Persists portfolio data to localStorage so the app works fully offline
 * with no backend required. The shape mirrors what the /backend Express +
 * MongoDB API expects, so swapping this for real `fetch` calls to your own
 * REST API is a drop-in replacement — see src/lib/api.ts for the same
 * function signatures wired to HTTP instead.
 * -------------------------------------------------------------------------
 */

const PREFIX = "ledger:";

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveState<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded scenarios;
    // failing silently keeps the app usable rather than crashing the UI.
  }
}

export function clearAllState() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
