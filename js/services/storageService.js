'use strict';

/* Единая граница хранения; позже реализацию можно заменить сетевым адаптером. */
const StorageService = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch (error) {
      return { ...fallback };
    }
  },
  save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  },
  clear(key) {
    try { localStorage.removeItem(key); return true; }
    catch (error) { return false; }
  }
};
