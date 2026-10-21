// JSON-Protokoll: Export, Prüfung, Vorschau und Import (Zusammenführung ohne Überschreiben)
import { APP_VERSION, isoDay, deepClone } from './util.js';
import { defaultState, DEFAULT_SETTINGS } from './defaults.js';

export const FORMAT = '30MIN_GYM';
export const SCHEMA_VERSION = 1;

export const jsonFileName = (iso = new Date().toISOString()) => `30MIN_GYM_${isoDay(new Date(iso))}.json`;
export const pdfFileName = (iso = new Date().toISOString()) => `30MIN_GYM_${isoDay(new Date(iso))}.pdf`;

/** Vollständiger, portabler Datenstand inkl. Historie und Einstellungen. */
export function buildExport(state, currentSessionId = null) {
  const sessions = [...state.sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    app: `30MIN GYM ${APP_VERSION}`,
    exportedAt: new Date().toISOString(),
    currentSessionId,
    currentSession: currentSessionId ? sessions.find((s) => s.id === currentSessionId) || null : null,
    summary: { sessions: sessions.length },
    settings: deepClone(state.settings),
    plan: deepClone(state.plan),
    customExercises: deepClone(state.customExercises || []),
    sessions: deepClone(sessions)
  };
}

/* ---------- Validierung ---------- */

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNumOrNull = (v) => v === null || v === undefined || (typeof v === 'number' && Number.isFinite(v));
const isDate = (v) => isStr(v) && !Number.isNaN(Date.parse(v));

export function validateSession(s) {
  const errs = [];
  if (!s || typeof s !== 'object') return ['kein Objekt'];
  if (!isStr(s.id)) errs.push('ID fehlt');
  if (!isDate(s.startedAt)) errs.push('Startzeit ungültig');
  if (!Array.isArray(s.exercises)) errs.push('Übungsliste fehlt');
  else s.exercises.forEach((ex, i) => {
    if (!isStr(ex.exId)) errs.push(`Übung ${i + 1}: ID fehlt`);
    if (!Array.isArray(ex.sets)) errs.push(`Übung ${i + 1}: Sätze fehlen`);
    else ex.sets.forEach((st, j) => {
      if (!isNumOrNull(st.weight) || !isNumOrNull(st.reps) || !isNumOrNull(st.rir)) {
        errs.push(`Übung ${i + 1}, Satz ${j + 1}: ungültige Zahlenwerte`);
      }
    });
  });
  return errs;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object' || !plan.days || typeof plan.days !== 'object') return false;
  return Object.values(plan.days).every((d) => d && isStr(d.name) && Array.isArray(d.items) &&
    d.items.every((it) => isStr(it.exId) && Number.isInteger(it.sets) && it.sets > 0));
}

/**
 * Prüft eine importierte Datei.
 * @returns {{ok:boolean, error?:string, data?:object, invalid:Array}}
 */
export function validateImport(text) {
  let obj;
  try { obj = JSON.parse(text); }
  catch { return { ok: false, error: 'Die Datei ist keine gültige JSON-Datei oder beschädigt.' }; }
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'Die Datei enthält keine Trainingsdaten.' };
  if (obj.format !== FORMAT) {
    return { ok: false, error: 'Diese Datei ist kein 30MIN-GYM-Trainingsprotokoll (Kennung „format“ fehlt oder ist falsch).' };
  }
  if (typeof obj.schemaVersion !== 'number') return { ok: false, error: 'Versionsangabe der Datei fehlt.' };
  if (obj.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: `Die Datei stammt aus einer neueren App-Version (Schema ${obj.schemaVersion}). Bitte App aktualisieren.` };
  }
  if (!Array.isArray(obj.sessions)) return { ok: false, error: 'Die Datei enthält keine Trainingshistorie („sessions“).' };

  const valid = [], invalid = [];
  for (const s of obj.sessions) {
    const errs = validateSession(s);
    if (errs.length) invalid.push({ id: s?.id || '?', errors: errs });
    else valid.push(normalizeSession(s));
  }
  // Einzelne aktuelle Einheit ergänzen, falls nicht in der Historie enthalten
  if (obj.currentSession && !valid.some((s) => s.id === obj.currentSession.id)) {
    const errs = validateSession(obj.currentSession);
    if (!errs.length) valid.push(normalizeSession(obj.currentSession));
  }
  if (!valid.length && obj.sessions.length) {
    return { ok: false, error: 'Keine der enthaltenen Trainingseinheiten konnte gelesen werden.', invalid };
  }
  return {
    ok: true,
    invalid,
    data: {
      exportedAt: isDate(obj.exportedAt) ? obj.exportedAt : null,
      app: obj.app || '',
      currentSessionId: obj.currentSessionId || null,
      settings: obj.settings && typeof obj.settings === 'object' ? { ...DEFAULT_SETTINGS, ...obj.settings } : null,
      plan: validatePlan(obj.plan) ? obj.plan : null,
      customExercises: Array.isArray(obj.customExercises) ? obj.customExercises : [],
      sessions: valid
    }
  };
}

function normalizeSession(s) {
  const c = deepClone(s);
  c.status = c.status === 'completed' ? 'completed' : 'partial';
  c.notes = c.notes || '';
  c.durationSec = c.durationSec || 0;
  c.exercises = c.exercises.map((ex) => ({
    key: ex.key || ex.exId,
    unit: ex.unit || 'kg',
    name: ex.name || ex.exId,
    repMin: ex.repMin ?? null,
    repMax: ex.repMax ?? null,
    targetSets: ex.targetSets ?? ex.sets.length,
    ...ex,
    sets: ex.sets.map((st, i) => ({
      n: st.n ?? i + 1, weight: st.weight ?? null, reps: st.reps ?? null, rir: st.rir ?? null,
      done: !!st.done, ts: st.ts || null
    }))
  }));
  return c;
}

/** Vorschau: was würde beim Import passieren? Nichts wird verändert. */
export function previewImport(state, data) {
  const local = new Map(state.sessions.map((s) => [s.id, s]));
  const fresh = [], duplicates = [], conflicts = [];
  for (const s of data.sessions) {
    const l = local.get(s.id);
    if (!l) fresh.push(s);
    else if (JSON.stringify(stripVolatile(l)) === JSON.stringify(stripVolatile(s))) duplicates.push(s);
    else conflicts.push(s);
  }
  const dates = data.sessions.map((s) => s.startedAt).sort();
  return {
    total: data.sessions.length,
    fresh, duplicates, conflicts,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
    hasPlan: !!data.plan,
    hasSettings: !!data.settings,
    localEmpty: state.sessions.length === 0,
    activeRunning: !!state.active
  };
}

function stripVolatile(s) {
  const c = deepClone(s);
  c.exercises.forEach((e) => { delete e.recommendation; delete e.key; });
  return c;
}

/**
 * Import ausführen. Vorhandene Einheiten werden nie überschrieben (Historie unveränderlich).
 */
export function applyImport(state, data, { takePlan = false, takeSettings = false } = {}) {
  const ids = new Set(state.sessions.map((s) => s.id));
  let added = 0;
  for (const s of data.sessions) {
    if (!ids.has(s.id)) { state.sessions.push(s); ids.add(s.id); added++; }
  }
  state.sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  if (takePlan && data.plan) state.plan = deepClone(data.plan);
  if (takeSettings && data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  if (data.customExercises?.length) {
    const known = new Set(state.customExercises.map((c) => c.id));
    for (const c of data.customExercises) if (c && c.id && !known.has(c.id)) state.customExercises.push(c);
  }
  state.meta.lastImport = { at: new Date().toISOString(), added, fileDate: data.exportedAt };
  return added;
}

/** Ergänzt fehlende Felder im gespeicherten State (Vorwärtskompatibilität). */
export function normalizeState(raw) {
  const def = defaultState();
  if (!raw || raw.format !== FORMAT) return def;
  return {
    ...def,
    ...raw,
    settings: { ...def.settings, ...(raw.settings || {}) },
    plan: validatePlan(raw.plan) ? raw.plan : def.plan,
    customExercises: Array.isArray(raw.customExercises) ? raw.customExercises : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    meta: { ...def.meta, ...(raw.meta || {}) }
  };
}
