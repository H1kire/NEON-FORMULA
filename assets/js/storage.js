// FORMULA ASCENT — guarded local persistence layer
(() => {
  const warned = new Set();
  function getStorage() { try { return window.localStorage; } catch (error) { return null; } }
  function warnOnce(action, key, error) {
    const id = action + ":" + key;
    if (warned.has(id)) return;
    warned.add(id);
    console.warn("[FAStorage] " + action + " failed for " + key, error);
  }
  function getJSON(key, fallback = null) {
    const store = getStorage();
    if (!store) return fallback;
    try { const raw = store.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (error) { warnOnce("read", key, error); return fallback; }
  }
  function setJSON(key, value) {
    const store = getStorage();
    if (!store) { warnOnce("write", key, new Error("localStorage is unavailable")); return false; }
    try { store.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { warnOnce("write", key, error); return false; }
  }
  function remove(key) {
    const store = getStorage();
    if (!store) return false;
    try { store.removeItem(key); return true; }
    catch (error) { warnOnce("remove", key, error); return false; }
  }
  function removeMany(keys) { let success = true; for (const key of keys) success = remove(key) && success; return success; }
  function has(key) {
    const store = getStorage();
    if (!store) return false;
    try { return store.getItem(key) !== null; }
    catch (error) { warnOnce("check", key, error); return false; }
  }
  window.FAStorage = Object.freeze({ getJSON, setJSON, remove, removeMany, has });
})();
