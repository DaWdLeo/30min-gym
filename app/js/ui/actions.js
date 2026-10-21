// Bereichsübergreifende Aktionen: Übungsinfo, Downloads, Import-Ablauf
import { esc, download, fmtDate, fmtKg, dayKeyOf, DAY_NAMES } from '../core/util.js';
import { getExercise, MUSCLES } from '../core/exercises.js';
import { renderFigure, renderMuscleMap } from './figures.js';
import { openSheet, toast } from './dom.js';
import { buildExport, jsonFileName, pdfFileName, validateImport, previewImport, applyImport } from '../core/protocol.js';
import { sessionPdf } from '../core/pdf.js';
import { recommend, createSession, exerciseSeries, trend, trainedExercises } from '../core/training.js';

/* ---------- Übungsinformation mit Grafik ---------- */

export function exerciseInfoHtml(ex, planItem) {
  const reps = planItem
    ? (planItem.unit === 'min' ? `${planItem.repMin} Minuten` : `${planItem.sets} Sätze × ${planItem.repMin}–${planItem.repMax} Wiederholungen`)
    : 'siehe Trainingsplan';
  const list = (a) => (a?.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">–</p>');
  const figure = ex.figure
    ? `<div class="fig-box" data-fig>${renderFigure(ex.figure, 0)}</div>
       <div class="seg" role="tablist">
         <button class="on" data-fm="0">Start</button><button data-fm="1">Ende</button><button data-fm="anim">▶ Bewegung</button>
       </div>
       <p class="small muted center">Hell = aktuelle Position · blass = Gegenposition · Pfeil = Bewegungsrichtung · Orange = Zielmuskulatur</p>`
    : '<p class="muted">Eigene Übung – keine Bewegungsgrafik hinterlegt.</p>';
  return `
    ${figure}
    <div class="info-grid">
      <div>${renderMuscleMap(ex.primary, ex.secondary)}</div>
      <div>
        <h4>Primär</h4><p>${ex.primary.map((m) => esc(MUSCLES[m] || m)).join(', ') || '–'}</p>
        ${ex.secondary?.length ? `<h4>Unterstützend</h4><p>${ex.secondary.map((m) => esc(MUSCLES[m] || m)).join(', ')}</p>` : ''}
        <h4>Gerät</h4><p>${esc(ex.equipment || '–')}</p>
        <h4>Empfohlen</h4><p>${esc(reps)}</p>
      </div>
    </div>
    <h4>Ausgangsposition</h4><p>${esc(ex.start || '–')}</p>
    <h4>Ausführung</h4>${ex.steps?.length ? `<ol>${ex.steps.slice(0, 3).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '<p class="muted">–</p>'}
    <h4>Häufige Fehler</h4>${list(ex.mistakes)}
    <h4>Sicherheit</h4>${list(ex.safety)}`;
}

export function openExerciseInfo(app, exId, planItem = null) {
  const ex = getExercise(exId, app.state);
  if (!ex) return;
  let raf = null;
  const sheet = openSheet({
    title: ex.name,
    body: exerciseInfoHtml(ex, planItem),
    onClose: () => cancelAnimationFrame(raf)
  });
  if (!ex.figure) return;
  const box = sheet.el.querySelector('[data-fig]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  sheet.el.querySelector('.seg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    sheet.el.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b));
    cancelAnimationFrame(raf);
    if (b.dataset.fm === 'anim' && !reduce) {
      const t0 = performance.now();
      const loop = (now) => {
        const ph = ((now - t0) / 2600) % 1;               // 2,6 s pro Wiederholung
        const t = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);  // weich hin und zurück
        box.innerHTML = renderFigure(ex.figure, t, { ghost: false });
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      box.innerHTML = renderFigure(ex.figure, b.dataset.fm === 'anim' ? 1 : +b.dataset.fm);
    }
  });
}

/* ---------- Downloads ---------- */

export function downloadJson(app, sessionId = null) {
  const s = sessionId ? app.state.sessions.find((x) => x.id === sessionId) : null;
  const data = buildExport(app.state, sessionId);
  const name = jsonFileName(s ? s.startedAt : undefined);
  download(name, JSON.stringify(data, null, 2), 'application/json');
  toast(`${name} gespeichert`);
}

export function downloadPdf(app, sessionId) {
  const s = app.state.sessions.find((x) => x.id === sessionId);
  if (!s) return;
  const bytes = sessionPdf(app.state, s);
  const name = pdfFileName(s.startedAt);
  download(name, new Blob([bytes], { type: 'application/pdf' }));
  toast(`${name} gespeichert`);
}

/* ---------- Import ---------- */

export function startImport(app) {
  const input = document.getElementById('fileImport');
  input.value = '';
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    if (!/\.json$/i.test(f.name) && f.type && !f.type.includes('json')) {
      showImportError(`„${esc(f.name)}“ ist keine JSON-Datei. Bitte die JSON-Datei des Trainingsprotokolls wählen (nicht das PDF).`);
      return;
    }
    let text;
    try { text = await f.text(); } catch { showImportError('Die Datei konnte nicht gelesen werden.'); return; }
    const res = validateImport(text);
    if (!res.ok) { showImportError(esc(res.error)); return; }
    showPreview(app, f.name, res);
  };
  input.click();
}

function showImportError(msg) {
  openSheet({ title: 'Import nicht möglich', body: `<div class="alert err">${msg}</div><p class="muted small">Es wurden keine Daten verändert.</p>`,
    actions: [{ label: 'Schließen', cls: 'primary' }] });
}

function showPreview(app, fileName, res) {
  const p = previewImport(app.state, res.data);
  const row = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  const body = `
    <p class="small muted">Datei: ${esc(fileName)}${res.data.exportedAt ? ` · erstellt ${fmtDate(res.data.exportedAt)}` : ''}</p>
    <div class="kvs">
      ${row('Einheiten in der Datei', p.total)}
      ${row('Neu (werden übernommen)', p.fresh.length)}
      ${row('Bereits vorhanden (übersprungen)', p.duplicates.length)}
      ${p.conflicts.length ? row('Abweichend vorhanden (lokale Version bleibt)', p.conflicts.length) : ''}
      ${res.invalid.length ? row('Beschädigt / nicht lesbar', res.invalid.length) : ''}
      ${p.firstDate ? row('Zeitraum', `${fmtDate(p.firstDate)} – ${fmtDate(p.lastDate)}`) : ''}
    </div>
    ${p.fresh.length ? `<h4>Neue Einheiten</h4><ul class="compact">${p.fresh.slice(-8).map((s) =>
      `<li>${fmtDate(s.startedAt)} · ${esc(s.name)} ${s.status === 'completed' ? '' : '<span class="tag warn">teilweise</span>'}</li>`).join('')}${p.fresh.length > 8 ? `<li class="muted">… und ${p.fresh.length - 8} weitere</li>` : ''}</ul>` : ''}
    ${p.hasPlan ? `<label class="check"><input type="checkbox" id="impPlan" ${p.localEmpty ? 'checked' : ''}> Trainingsplan aus der Datei übernehmen <span class="muted small">(ersetzt den aktuellen Plan)</span></label>` : ''}
    ${p.hasSettings ? `<label class="check"><input type="checkbox" id="impSet" ${p.localEmpty ? 'checked' : ''}> Einstellungen aus der Datei übernehmen</label>` : ''}
    <p class="small muted">Vorhandene Trainingseinheiten werden nie überschrieben.</p>`;
  openSheet({
    title: 'Import-Vorschau', body,
    actions: [
      { label: 'Abbrechen', cls: 'ghost' },
      { label: p.fresh.length ? `${p.fresh.length} Einheit(en) importieren` : 'Übernehmen', cls: 'primary', id: 'impGo',
        onClick: (close, wrap) => {
          const takePlan = !!wrap.querySelector('#impPlan')?.checked;
          const takeSettings = !!wrap.querySelector('#impSet')?.checked;
          const added = applyImport(app.state, res.data, { takePlan, takeSettings });
          // Laufendes, noch unberührtes Training mit neuen Vorschlägen auffrischen
          const a = app.state.active;
          if (a && !a.exercises.some((e) => e.sets.some((s) => s.done)) && app.state.plan.days[a.planDay]) {
            const fresh = createSession(app.state, a.planDay);
            fresh.id = a.id; fresh.startedAt = a.startedAt;
            app.state.active = fresh;
          }
          app.save();
          close();
          app.render();
          showAnalysis(app, added);
        } }
    ]
  });
}

/** Auswertung nach dem Import: Vorschläge für das nächste Training + Trend je Übung. */
export function showAnalysis(app, added) {
  const st = app.state;
  const dk = st.active?.planDay || dayKeyOf();
  const day = st.plan.days[dk];
  const recs = day.items.map((it) => ({ it, r: recommend(st, it), name: getExercise(it.exId, st)?.name || it.exId }));
  const since = new Date(Date.now() - 12 * 7 * 864e5).toISOString();
  const trends = trainedExercises(st).map((e) => ({ ...e, t: trend(exerciseSeries(st, e.exId, since)) }));
  const body = `
    <div class="alert ok">${added} neue Einheit(en) importiert. Gesamt: ${st.sessions.length} Einheiten.</div>
    <h4>Nächstes Training: ${esc(DAY_NAMES[dk])} – ${esc(day.name)}</h4>
    ${recs.map(({ r, name }) => recCard(name, r)).join('')}
    ${trends.length ? `<h4>Entwicklung (12 Wochen)</h4><ul class="trend-list">${trends.map((e) =>
      `<li><span>${esc(e.name)}</span>${trendBadge(e.t)}</li>`).join('')}</ul>` : ''}`;
  openSheet({ title: 'Auswertung', body, actions: [{ label: 'Zum Training', cls: 'primary', onClick: (c) => { c(); app.go('heute'); } }] });
}

export function trendBadge(t) {
  const icon = { up: '▲', down: '▼', flat: '▶', na: '·' }[t.kind];
  const pct = t.kind === 'na' ? '' : ` ${t.pct > 0 ? '+' : ''}${t.pct.toFixed(1).replace('.', ',')} %`;
  return `<span class="trend ${t.kind}">${icon} ${t.label}${pct}</span>`;
}

export function recCard(name, r, withAccept = false, exKey = '') {
  if (r.kind === 'time') return '';
  if (r.kind === 'none') return `<div class="rec none"><b>${esc(name)}</b><span>${esc(r.reason)}</span></div>`;
  const last = r.lastSets.map((s) => `${fmtKg(s.weight)} kg × ${s.reps ?? '–'}`).join(' · ');
  return `<div class="rec ${r.kind}">
    <b>${esc(name)}</b>
    <span class="small">Letztes Training (${fmtDate(r.lastDate)}): ${last}</span>
    <span>Letztes Trainingsgewicht: <b>${fmtKg(r.lastWeight)} kg</b>${r.kind === 'increase' ? ` · Empfehlung: <b class="acc">${fmtKg(r.newWeight)} kg testen</b>` : ' · Empfehlung: <b>Gewicht halten</b>'}</span>
    <span class="small muted">Begründung: ${esc(r.reason)}</span>
    ${withAccept && r.kind === 'increase' ? `<button class="btn sm primary" data-act="accept" data-key="${exKey}">${fmtKg(r.newWeight)} kg übernehmen</button>` : ''}
  </div>`;
}
