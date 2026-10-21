// Trainingslogik: Einheiten, Sätze, Empfehlungen, Bestleistungen, Statistiken.
// Reine Funktionen auf dem State – keine DOM-Zugriffe.
import { uid, round, weekStart } from './util.js';
import { getExercise } from './exercises.js';

/* ---------- Hilfen ---------- */

export const exerciseName = (state, exId) => getExercise(exId, state)?.name || exId;

export const isDone = (set) => !!set.done;

export const setVolume = (s) => (s.done && s.unit !== 'min' ? (s.weight || 0) * (s.reps || 0) : 0);

export function exVolume(ex) {
  if (ex.unit === 'min') return 0;
  return ex.sets.reduce((a, s) => a + (s.done ? (s.weight || 0) * (s.reps || 0) : 0), 0);
}

export const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0); // Epley-Formel

export function sessionVolume(session) {
  return session.exercises.reduce((a, ex) => a + exVolume(ex), 0);
}

export function sessionCounts(session) {
  let total = 0, done = 0;
  for (const ex of session.exercises) for (const s of ex.sets) { total++; if (s.done) done++; }
  return { total, done };
}

export const exerciseComplete = (ex) => ex.sets.length > 0 && ex.sets.every((s) => s.done);

/** Abgeschlossene + teilweise Einheiten, chronologisch aufsteigend. */
export function history(state) {
  return [...state.sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Letzte Ausführung einer Übung vor einem Zeitpunkt (mit mind. 1 erledigtem Satz). */
export function lastPerformance(state, exId, beforeIso = null) {
  const hist = history(state);
  for (let i = hist.length - 1; i >= 0; i--) {
    const s = hist[i];
    if (beforeIso && s.startedAt >= beforeIso) continue;
    const ex = s.exercises.find((e) => e.exId === exId && e.sets.some((x) => x.done));
    if (ex) return { session: s, exercise: ex };
  }
  return null;
}

/** Arbeitsgewicht: häufigstes Gewicht der erledigten Sätze (bei Gleichstand das höhere). */
export function workingWeight(ex) {
  const counts = new Map();
  for (const s of ex.sets) if (s.done && s.weight != null) counts.set(s.weight, (counts.get(s.weight) || 0) + 1);
  let best = null, bestC = 0;
  for (const [w, c] of counts) if (c > bestC || (c === bestC && w > best)) { best = w; bestC = c; }
  return best;
}

/* ---------- Progressionsempfehlung (Double Progression) ---------- */

/**
 * Liefert eine Empfehlung für das nächste Training einer Übung.
 * kind: 'none' | 'increase' | 'hold' | 'time'
 */
export function recommend(state, planItem, beforeIso = null) {
  if (planItem.unit === 'min') return { kind: 'time', reason: 'Zeitbasierte Einheit – locker und gleichmäßig.' };
  const last = lastPerformance(state, planItem.exId, beforeIso);
  if (!last) {
    return { kind: 'none', reason: 'Noch keine Daten – Startgewicht so wählen, dass ' +
      `${planItem.repMin}–${planItem.repMax} saubere Wiederholungen möglich sind.` };
  }
  const ex = last.exercise;
  const done = ex.sets.filter((s) => s.done);
  const ww = workingWeight(ex);
  const atWW = done.filter((s) => s.weight === ww);
  const step = planItem.step || state.settings.weightStep || 2.5;
  const target = planItem.sets;
  const base = {
    lastDate: last.session.startedAt,
    lastSessionId: last.session.id,
    lastWeight: ww,
    lastSets: done.map((s) => ({ weight: s.weight, reps: s.reps, rir: s.rir }))
  };
  const allTop = atWW.length >= target && atWW.every((s) => (s.reps || 0) >= planItem.repMax);
  if (allTop) {
    return {
      ...base, kind: 'increase', newWeight: round(ww + step),
      reason: `Obere Wiederholungsgrenze (${planItem.repMax}) in allen ${atWW.length} Sätzen erreicht`
    };
  }
  if (done.length < target) {
    return { ...base, kind: 'hold', newWeight: ww,
      reason: `Nur ${done.length} von ${target} Sätzen absolviert – Gewicht beibehalten` };
  }
  const belowMin = atWW.filter((s) => (s.reps || 0) < planItem.repMin).length;
  if (belowMin > 0) {
    return { ...base, kind: 'hold', newWeight: ww,
      reason: `Wiederholungsziel (mind. ${planItem.repMin}) in ${belowMin} Satz/Sätzen nicht erreicht – Gewicht beibehalten` };
  }
  return { ...base, kind: 'hold', newWeight: ww,
    reason: `Gewicht beibehalten und Wiederholungen bis ${planItem.repMax} pro Satz steigern` };
}

/* ---------- Einheit starten / bearbeiten / abschließen ---------- */

export function createSession(state, dayKey) {
  const day = state.plan.days[dayKey];
  const startedAt = new Date().toISOString();
  return {
    id: uid(),
    planDay: dayKey,
    name: day.name,
    type: day.type,
    startedAt,
    endedAt: null,
    durationSec: 0,
    status: 'active',
    notes: '',
    exercises: day.items.map((it) => {
      const rec = recommend(state, it);
      const last = lastPerformance(state, it.exId);
      const unit = it.unit || 'kg';
      return {
        key: uid(),
        exId: it.exId,
        name: exerciseName(state, it.exId),
        unit,
        repMin: it.repMin,
        repMax: it.repMax,
        targetSets: it.sets,
        step: it.step || state.settings.weightStep,
        recommendation: rec,
        acceptedIncrease: null,
        sets: Array.from({ length: it.sets }, (_, i) => {
          const prev = last?.exercise.sets.filter((s) => s.done)[i];
          return {
            n: i + 1,
            weight: unit === 'min' ? null : (rec.lastWeight ?? null),
            reps: unit === 'min' ? it.repMin : (prev && prev.weight === rec.lastWeight ? prev.reps : null),
            rir: null,
            done: false,
            ts: null
          };
        })
      };
    })
  };
}

/** Übernimmt eine empfohlene Steigerung (nur nach Bestätigung durch den Nutzer). */
export function acceptIncrease(ex) {
  const w = ex.recommendation?.newWeight;
  if (w == null) return;
  ex.acceptedIncrease = { from: ex.recommendation.lastWeight, to: w, at: new Date().toISOString() };
  for (const s of ex.sets) if (!s.done) { s.weight = w; s.reps = null; }
}

export function toggleSet(set, done) {
  set.done = done;
  set.ts = done ? new Date().toISOString() : null;
}

export function finishSession(state, notes = '') {
  const s = state.active;
  if (!s) return null;
  const end = new Date();
  s.endedAt = end.toISOString();
  s.durationSec = Math.round((end - new Date(s.startedAt)) / 1000);
  s.notes = notes;
  delete s.rest; // Pausentimer gehört nicht ins Protokoll
  const { total, done } = sessionCounts(s);
  s.status = done === total ? 'completed' : 'partial';
  // Unvollständig erfasste, nicht abgehakte Werte bleiben als Plan erkennbar
  state.sessions.push(s);
  state.active = null;
  state.meta.lastFinishedId = s.id;
  return s;
}

/* ---------- Bestleistungen & Vergleich ---------- */

function exStats(ex) {
  let maxW = 0, maxWReps = 0, best1 = 0, maxReps = 0;
  for (const s of ex.sets) {
    if (!s.done) continue;
    const w = s.weight || 0, r = s.reps || 0;
    if (w > maxW || (w === maxW && r > maxWReps)) { maxW = w; maxWReps = r; }
    best1 = Math.max(best1, e1rm(w, r));
    maxReps = Math.max(maxReps, r);
  }
  return { maxW, maxWReps, best1, maxReps, volume: exVolume(ex) };
}

/** Rekorde einer Übung aus allen Einheiten vor einem Zeitpunkt. */
export function recordsBefore(state, exId, beforeIso) {
  let rec = null;
  for (const s of history(state)) {
    if (beforeIso && s.startedAt >= beforeIso) continue;
    for (const ex of s.exercises) {
      if (ex.exId !== exId || ex.unit === 'min' || !ex.sets.some((x) => x.done)) continue;
      const st = exStats(ex);
      if (!rec) rec = { ...st, date: s.startedAt };
      else {
        if (st.maxW > rec.maxW) { rec.maxW = st.maxW; rec.maxWReps = st.maxWReps; }
        rec.best1 = Math.max(rec.best1, st.best1);
        rec.volume = Math.max(rec.volume, st.volume);
        rec.maxReps = Math.max(rec.maxReps, st.maxReps);
      }
    }
  }
  return rec;
}

/** Persönliche Bestleistungen einer Einheit gegenüber allen früheren Einheiten. */
export function sessionPRs(state, session, ex) {
  if (ex.unit === 'min' || !ex.sets.some((s) => s.done)) return [];
  const prev = recordsBefore(state, ex.exId, session.startedAt);
  const st = exStats(ex);
  if (!prev) return ['Erste Erfassung'];
  const out = [];
  if (st.maxW > prev.maxW) out.push(`Höchstes Gewicht (${st.maxW} kg)`);
  if (st.best1 > prev.best1 + 0.01) out.push(`Bestes geschätztes 1RM (${round(st.best1, 1)} kg)`);
  if (st.volume > prev.volume) out.push(`Höchstes Volumen (${Math.round(st.volume)} kg)`);
  return out;
}

/** Veränderung gegenüber der letzten Ausführung derselben Übung. */
export function compareToLast(state, session, ex) {
  const last = lastPerformance(state, ex.exId, session.startedAt);
  if (!last || ex.unit === 'min') return null;
  const cur = exStats(ex), prev = exStats(last.exercise);
  const curReps = ex.sets.reduce((a, s) => a + (s.done ? s.reps || 0 : 0), 0);
  const prevReps = last.exercise.sets.reduce((a, s) => a + (s.done ? s.reps || 0 : 0), 0);
  return {
    lastDate: last.session.startedAt,
    weightDiff: round((workingWeight(ex) ?? 0) - (workingWeight(last.exercise) ?? 0)),
    volumeDiff: Math.round(cur.volume - prev.volume),
    repsDiff: curReps - prevReps,
    e1rmDiff: round(cur.best1 - prev.best1, 1)
  };
}

/* ---------- Statistiken ---------- */

export function exerciseSeries(state, exId, sinceIso = null) {
  const out = [];
  for (const s of history(state)) {
    if (sinceIso && s.startedAt < sinceIso) continue;
    for (const ex of s.exercises) {
      if (ex.exId !== exId || ex.unit === 'min' || !ex.sets.some((x) => x.done)) continue;
      const st = exStats(ex);
      out.push({
        date: s.startedAt, sessionId: s.id,
        topWeight: st.maxW, e1rm: round(st.best1, 1), volume: Math.round(st.volume),
        bestReps: st.maxReps,
        totalReps: ex.sets.reduce((a, x) => a + (x.done ? x.reps || 0 : 0), 0)
      });
    }
  }
  return out;
}

/** Trend über lineare Regression der e1RM-Werte. */
export function trend(series) {
  if (series.length < 2) return { kind: 'na', label: 'Zu wenig Daten', pct: 0 };
  const ys = series.map((p) => p.e1rm || p.topWeight);
  const n = ys.length, xs = ys.map((_, i) => i);
  const mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  const start = my - slope * mx, end = my + slope * (n - 1 - mx);
  const pct = start > 0 ? ((end - start) / start) * 100 : 0;
  if (pct > 2) return { kind: 'up', label: 'Verbessert', pct };
  if (pct < -2) return { kind: 'down', label: 'Verschlechtert', pct };
  return { kind: 'flat', label: 'Stagniert', pct };
}

export function weeklyCounts(state, weeks) {
  const now = weekStart(new Date());
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(now); ws.setDate(ws.getDate() - i * 7);
    buckets.push({ weekStart: ws, count: 0, partial: 0 });
  }
  for (const s of state.sessions) {
    const ws = weekStart(new Date(s.startedAt)).getTime();
    const b = buckets.find((x) => x.weekStart.getTime() === ws);
    if (b) { if (s.status === 'completed') b.count++; else b.partial++; }
  }
  return buckets;
}

/** Alle Übungen, für die Trainingsdaten vorliegen. */
export function trainedExercises(state) {
  const map = new Map();
  for (const s of history(state)) for (const ex of s.exercises) {
    if (ex.unit === 'min' || !ex.sets.some((x) => x.done)) continue;
    map.set(ex.exId, ex.name);
  }
  return [...map].map(([exId, name]) => ({ exId, name }));
}
