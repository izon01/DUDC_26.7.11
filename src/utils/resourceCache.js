// In-memory, per-tab cache for API list data (work manuals, culture posts,
// community posts). Lives for the lifetime of the SPA session — cleared on
// a hard reload, kept across client-side route navigation — so revisiting a
// menu item that was already loaded once renders instantly instead of
// re-hitting the serverless function + DB on every mount.
const store = new Map();

export function getCache(key) {
  return store.get(key);
}

export function setCache(key, data) {
  store.set(key, data);
}

export function clearCache(key) {
  store.delete(key);
}
