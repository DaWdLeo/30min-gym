// Standardvorlage für Trainingsplan und Einstellungen
import { uid, deepClone } from './util.js';

export const DEFAULT_SETTINGS = {
  sessionMinutes: 30,     // Ziel-Trainingsdauer
  restSeconds: 90,        // Standard-Satzpause
  weightStep: 2.5,        // Standard-Gewichtssteigerung in kg
  autoRest: true,         // Pausentimer nach jedem Satz automatisch starten
  sound: true,
  vibrate: true
};

// [exId, Sätze, Wdh. min, Wdh. max, Einheit]
const RAW_PLAN = {
  mo: ['Pull A', 'strength', [
    ['latziehen', 3, 8, 12], ['kabelrudern', 3, 8, 12], ['reverseflys', 2, 12, 15], ['bizepscurls', 2, 10, 15]]],
  di: ['Push A', 'strength', [
    ['bankdruecken', 3, 6, 10], ['schraegbank', 3, 8, 12], ['seitheben', 2, 12, 20], ['trizepsdruecken', 2, 10, 15]]],
  mi: ['Legs A', 'strength', [
    ['kniebeugen', 3, 8, 12], ['rdl', 3, 8, 12], ['wadenheben', 2, 12, 20], ['kabelcrunch', 2, 12, 20]]],
  do: ['Pull B', 'strength', [
    ['klimmzuege', 3, 6, 12], ['einarmrudern', 3, 8, 12], ['facepulls', 2, 12, 20], ['hammercurls', 2, 10, 15]]],
  fr: ['Push B', 'strength', [
    ['schulterdruecken', 3, 6, 10], ['cableflys', 3, 10, 15], ['seitheben', 2, 12, 20], ['trizepsstrecken', 2, 10, 15]]],
  sa: ['Legs B', 'strength', [
    ['bulgarian', 3, 8, 12], ['beinbeugen', 3, 10, 15], ['fersenkniebeugen', 2, 10, 15], ['wadenheben', 2, 12, 20]]],
  so: ['Regeneration', 'recovery', [
    ['ausdauer', 1, 20, 20, 'min'], ['mobilitaet', 1, 10, 10, 'min']]]
};

export function makePlanItem(exId, sets, repMin, repMax, unit = 'kg', step = null) {
  return { iid: uid(), exId, sets, repMin, repMax, unit, step };
}

export function defaultPlan() {
  const days = {};
  for (const [key, [name, type, items]] of Object.entries(RAW_PLAN)) {
    days[key] = {
      name, type,
      items: items.map(([exId, s, a, b, unit]) => makePlanItem(exId, s, a, b, unit || 'kg'))
    };
  }
  return { days };
}

export function defaultState() {
  return {
    format: '30MIN_GYM',
    schemaVersion: 1,
    settings: deepClone(DEFAULT_SETTINGS),
    plan: defaultPlan(),
    customExercises: [],   // [{id, name, equipment, muscles}]
    sessions: [],          // abgeschlossene / teilweise absolvierte Einheiten (unveränderlich)
    active: null,          // laufende Einheit
    meta: { createdAt: new Date().toISOString(), lastFinishedId: null, lastImport: null }
  };
}
