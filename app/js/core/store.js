// Datenspeicherung: lokal im Browser (localStorage). Keine Datenübertragung.
import { defaultState } from './defaults.js';
import { normalizeState } from './protocol.js';

const KEY = '30mingym:state:v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch (e) {
    console.error('Lokale Daten konnten nicht gelesen werden', e);
    // Defekte Daten sichern statt löschen
    try { localStorage.setItem(KEY + ':corrupt:' + Date.now(), localStorage.getItem(KEY)); } catch {}
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Speichern fehlgeschlagen', e);
    return false;
  }
}

export function clearState() {
  localStorage.removeItem(KEY);
}

export function storageInfo() {
  let bytes = 0;
  try { bytes = (localStorage.getItem(KEY) || '').length * 2; } catch {}
  return { bytes };
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen. */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch {}
  return false;
}
