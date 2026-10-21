// Bereich FORTSCHRITT: Statistiken, Trends, Bestleistungen, Historie
import { esc, fmtKg, fmtNum, fmtDate, fmtTime, fmtDur, fmtDateShort } from '../../core/util.js';
import {
  history, exerciseSeries, trend, weeklyCounts, trainedExercises, sessionVolume, sessionCounts, recordsBefore, exVolume
} from '../../core/training.js';
import { lineChart, barChart, bindCharts } from '../charts.js';
import { openSheet } from '../dom.js';
import { trendBadge, downloadJson, downloadPdf } from '../actions.js';

const RANGES = [[4, '4 W'], [8, '8 W'], [12, '12 W'], [0, 'Alle']];

export function renderProgress(app, root) {
  const st = app.state;
  const weeks = app.ui.range ?? 4;
  const since = weeks ? new Date(Date.now() - weeks * 7 * 864e5).toISOString() : null;
  const sess = history(st).filter((s) => !since || s.startedAt >= since);
  const completed = sess.filter((s) => s.status === 'completed').length;
  const vol = sess.reduce((a, s) => a + sessionVolume(s), 0);
  const wc = weeklyCounts(st, weeks || Math.max(4, Math.min(52, weeksSinceFirst(st))));
  const avg = wc.length ? wc.reduce((a, b) => a + b.count + b.partial, 0) / wc.length : 0;
  const trained = trainedExercises(st);
  if (!app.ui.progEx || !trained.some((t) => t.exId === app.ui.progEx)) app.ui.progEx = trained[0]?.exId;
  const exId = app.ui.progEx;
  const series = exId ? exerciseSeries(st, exId, since) : [];
  const tr = trend(series);

  root.innerHTML = `
    <header class="view-head"><h1>Fortschritt</h1></header>
    <div class="seg wide">${RANGES.map(([w, l]) => `<button class="${w === weeks ? 'on' : ''}" data-range="${w}">${l}</button>`).join('')}</div>
    <div class="tiles">
      <div class="tile"><b>${completed}</b><span>abgeschlossen</span></div>
      <div class="tile"><b>${sess.length - completed}</b><span>teilweise</span></div>
      <div class="tile"><b>${avg.toFixed(1).replace('.', ',')}</b><span>Ø pro Woche</span></div>
      <div class="tile"><b>${(vol / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}<small> t</small></b><span>Volumen</span></div>
    </div>
    <section class="card"><h3>Trainings pro Woche</h3>
      ${barChart({ labels: wc.map((w) => fmtDateShort(w.weekStart.toISOString())), values: wc.map((w) => w.count), stack: wc.map((w) => w.partial),
        tips: wc.map((w) => `Woche ab ${fmtDateShort(w.weekStart.toISOString())}: ${w.count} abgeschlossen, ${w.partial} teilweise`) })}
    </section>
    ${trained.length ? `
    <section class="card">
      <div class="row-between"><h3>Übung</h3>${trendBadge(tr)}</div>
      <select id="exSel" class="full">${trained.map((t) => `<option value="${t.exId}" ${t.exId === exId ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
      <h4>Gewicht</h4>
      ${lineChart({ labels: series.map((p) => fmtDateShort(p.date)), series: [
        { name: 'Höchstes Gewicht', color: '#ff7a1a', values: series.map((p) => p.topWeight), unit: 'kg' },
        { name: 'Geschätztes 1RM', color: '#8fb3ff', values: series.map((p) => p.e1rm), unit: 'kg' }] })}
      <h4>Wiederholungen</h4>
      ${lineChart({ labels: series.map((p) => fmtDateShort(p.date)), minZero: true, series: [
        { name: 'Summe', color: '#3ecf8e', values: series.map((p) => p.totalReps) },
        { name: 'Bester Satz', color: '#ffd166', values: series.map((p) => p.bestReps) }] })}
      <h4>Volumen</h4>
      ${lineChart({ labels: series.map((p) => fmtDateShort(p.date)), minZero: true, series: [
        { name: 'Volumen', color: '#ff7a1a', values: series.map((p) => p.volume), unit: 'kg' }] })}
    </section>
    <section class="card"><h3>Entwicklung je Übung</h3>
      <ul class="trend-list">${trained.map((t) => `<li><button class="link" data-ex="${t.exId}">${esc(t.name)}</button>${trendBadge(trend(exerciseSeries(st, t.exId, since)))}</li>`).join('')}</ul>
    </section>
    <section class="card"><h3>Persönliche Bestleistungen</h3>
      <table class="tbl"><thead><tr><th>Übung</th><th>Max. Gewicht</th><th>1RM*</th><th>Volumen</th></tr></thead><tbody>
      ${trained.map((t) => { const r = recordsBefore(st, t.exId, null); return `<tr><td>${esc(t.name)}</td><td>${fmtKg(r.maxW)} kg × ${r.maxWReps}</td><td>${fmtKg(Math.round(r.best1 * 10) / 10)}</td><td>${fmtNum(r.volume)}</td></tr>`; }).join('')}
      </tbody></table><p class="small muted">* geschätzt nach Epley: Gewicht × (1 + Wdh./30)</p>
    </section>` : '<section class="card"><p class="muted">Noch keine Trainingsdaten. Schließe ein Training ab oder lade ein Protokoll.</p></section>'}
    <section class="card"><h3>Trainingshistorie</h3>
      ${history(st).length ? `<ul class="hist">${history(st).slice().reverse().map((s) => {
        const c = sessionCounts(s);
        return `<li><button class="hist-row" data-sess="${s.id}"><span><b>${esc(s.name)}</b><small>${fmtDate(s.startedAt)} · ${fmtTime(s.startedAt)} · ${fmtDur(s.durationSec)}</small></span>
          <span class="right"><span class="tag ${s.status === 'completed' ? 'ok' : 'warn'}">${s.status === 'completed' ? '✓' : `${c.done}/${c.total}`}</span><small>${fmtNum(sessionVolume(s))} kg</small></span></button></li>`;
      }).join('')}</ul>` : '<p class="muted">Keine Einheiten.</p>'}
    </section>`;

  root.onclick = (e) => {
    const t = e.target;
    const r = t.closest('[data-range]');
    if (r) { app.ui.range = +r.dataset.range; app.render(); return; }
    const ex = t.closest('[data-ex]');
    if (ex) { app.ui.progEx = ex.dataset.ex; app.render(); root.querySelector('#exSel')?.scrollIntoView({ block: 'center' }); return; }
    const s = t.closest('[data-sess]');
    if (s) sessionDetail(app, s.dataset.sess);
  };
  root.onchange = (e) => { if (e.target.id === 'exSel') { app.ui.progEx = e.target.value; app.render(); } };
  root.oninput = null;
  bindCharts(root);
}

function weeksSinceFirst(st) {
  const h = history(st);
  if (!h.length) return 4;
  return Math.ceil((Date.now() - new Date(h[0].startedAt)) / (7 * 864e5)) + 1;
}

export function sessionDetail(app, id) {
  const s = app.state.sessions.find((x) => x.id === id);
  if (!s) return;
  const c = sessionCounts(s);
  openSheet({
    title: `${s.name} · ${fmtDate(s.startedAt)}`,
    body: `<div class="kvs">
      <div class="kv"><span>Status</span><b>${s.status === 'completed' ? 'Abgeschlossen' : 'Teilweise absolviert'}</b></div>
      <div class="kv"><span>Uhrzeit · Dauer</span><b>${fmtTime(s.startedAt)} · ${fmtDur(s.durationSec)}</b></div>
      <div class="kv"><span>Sätze</span><b>${c.done} / ${c.total}</b></div>
      <div class="kv"><span>Volumen</span><b>${fmtNum(sessionVolume(s))} kg</b></div></div>
      ${s.exercises.map((ex) => `<h4>${esc(ex.name)} ${ex.unit === 'min' ? '' : `<small class="muted">${fmtNum(exVolume(ex))} kg</small>`}</h4>
        <table class="tbl"><tbody>${ex.sets.map((x) => `<tr class="${x.done ? '' : 'miss'}"><td>${x.n}</td>
          <td>${ex.unit === 'min' ? `${x.reps ?? '–'} min` : `${fmtKg(x.weight)} kg × ${x.reps ?? '–'}`}</td><td>${x.rir != null ? 'RIR ' + x.rir : ''}</td>
          <td>${x.done ? '✓ ' + (x.ts ? fmtTime(x.ts) : '') : 'ausgelassen'}</td></tr>`).join('')}</tbody></table>`).join('')}
      ${s.notes ? `<h4>Notizen</h4><p>${esc(s.notes)}</p>` : ''}`,
    actions: [
      { label: 'PDF', cls: 'outline', onClick: () => downloadPdf(app, s.id) },
      { label: 'JSON', cls: 'primary', onClick: () => downloadJson(app, s.id) }
    ]
  });
}
