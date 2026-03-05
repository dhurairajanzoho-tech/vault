/**
 * Lightweight in-memory cache with TTL support.
 * Keeps Notion API responses for up to `ttl` ms before refetching.
 *
 * Usage:
 *   cache.get(key)           → value or null
 *   cache.set(key, value)    → stores with default 60s TTL
 *   cache.invalidate(key)    → deletes one key
 *   cache.invalidatePrefix(prefix) → deletes all keys starting with prefix
 */

const DEFAULT_TTL_MS = 60_000; // 60 seconds

const store = new Map(); // key → { value, expiresAt }

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const invalidate = (key) => {
  store.delete(key);
};

const invalidatePrefix = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
};

const clear = () => store.clear();

const size = () => store.size;

module.exports = { get, set, invalidate, invalidatePrefix, clear, size };
