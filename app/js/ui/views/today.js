// Bereich HEUTE: Tagesauswahl, Training starten, Sätze erfassen, Timer, Abschluss
import { esc, fmtDur, fmtKg, fmtNum, parseNum, DAY_KEYS, DAY_SHORT, DAY_NAMES, dayKeyOf, fmtDate, fmtTime } from '../../core/util.js';
import { getExercise } from '../../core/exercises.js';
import {
  createSession, recommend, lastPerformance, toggleSet, acceptIncrease, finishSession, sessionCounts,
  sessionVolume, exVolume, exerciseComplete, sessionPRs, compareToLast
} from '../../core/training.js';
import { openSheet, confirmDialog, toast, unlockAudio } from '../dom.js';
import { openExerciseInfo, recCard, downloadJson, downloadPdf, startImport } from '../actions.js';

export function renderToday(app, root) {
  const st = app.state;
  if (st.active) return renderActive(app, root);
  if (st.meta.lastFinishedId && st.sessions.some((s) => s.id === st.meta.lastFinishedId)) return renderSummary(app, root);
  return renderPlanned(app, root);
}

/* ---------- Vor dem Training ---------- */

function renderPlanned(app, root) {
  const st = app.state;
  const today = dayKeyOf();
  const dk = app.ui.selectedDay || today;
  const day = st.plan.days[dk];
  const noHistory = st.sessions.length === 0;
  root.innerHTML = `
    <header class="view-head"><h1>Heute</h1><span class="muted">${DAY_NAMES[today]}, ${fmtDate(new Date().toISOString())}</span></header>
    <div class="chips" role="tablist">${DAY_KEYS.map((k) => `<button class="chip ${k === dk ? 'on' : ''} ${k === today ? 'today' : ''}" data-day="${k}">${DAY_SHORT[k]}</button>`).join('')}</div>
    <section class="card hero">
      <div class="hero-top"><div><span class="eyebrow">${DAY_NAMES[dk]}${dk === today ? ' · heute' : ''}</span><h2>${esc(day.name)}</h2></div>
      <span class="pill">${day.items.length} Übungen · ${st.settings.sessionMinutes} min</span></div>
      <ul class="plan-list">
        ${day.items.map((it) => {
          const ex = getExercise(it.exId, st);
          const r = recommend(st, it);
          const target = it.unit === 'min' ? `${it.repMin} min` : `${it.sets} × ${it.repMin}–${it.repMax}`;
          let hint = '';
          if (r.kind === 'increase') hint = `<span class="tag acc">↑ ${fmtKg(r.newWeight)} kg testen</span>`;
          else if (r.kind === 'hold') hint = `<span class="tag">${fmtKg(r.lastWeight)} kg halten</span>`;
          else if (r.kind === 'none') hint = '<span class="tag muted">neu</span>';
          return `<li><button class="pl-item" data-info="${it.exId}" data-iid="${it.iid}"><span class="pl-name">${esc(ex?.name || it.exId)}</span><span class="pl-meta">${target} ${hint}</span><span class="i-dot">i</span></button></li>`;
        }).join('')}
      </ul>
      <button class="btn primary big" data-act="start">Training starten</button>
    </section>
    <button class="btn ${noHistory ? 'outline' : 'ghost'} block" data-act="import">⇪ Letztes Trainingsprotokoll laden</button>
    ${noHistory ? '<p class="small muted center">Noch keine Trainingsdaten auf diesem Gerät. Lade die JSON-Datei deines letzten Trainings, um Gewichte und Empfehlungen zu übernehmen.</p>' : ''}
  `;
  root.onclick = async (e) => {
    const t = e.target;
    const dayBtn = t.closest('[data-day]');
    if (dayBtn) { app.ui.selectedDay = dayBtn.dataset.day; app.render(); return; }
    const info = t.closest('[data-info]');
    if (info) { openExerciseInfo(app, info.dataset.info, day.items.find((i) => i.iid === info.dataset.iid)); return; }
    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'start') {
      unlockAudio();
      st.active = createSession(st, dk);
      st.meta.lastFinishedId = null;
      app.save(); app.render();
      window.scrollTo(0, 0);
    }
    if (act === 'import') startImport(app);
  };
  root.oninput = root.onchange = null;
}

/* ---------- Laufendes Training ---------- */

function setRow(ex, s, i) {
  const isMin = ex.unit === 'min';
  const soll = isMin ? `${ex.repMin} min` : `${ex.repMin}–${ex.repMax}`;
  const dis = s.done ? 'disabled' : '';
  const rirOpts = ['', 0, 1, 2, 3, 4, 5].map((v) => `<option value="${v}" ${s.rir === (v === '' ? null : v) ? 'selected' : ''}>${v === '' ? '–' : v}</option>`).join('');
  return `<div class="set-row ${s.done ? 'is-done' : ''}" data-i="${i}">
    <span class="n">${s.n}</span>
    <span class="soll">${soll}</span>
    ${isMin ? '<span class="unit-cell">–</span>' : `<input class="num" data-f="weight" inputmode="decimal" enterkeyhint="next" aria-label="Gewicht Satz ${s.n} in kg" placeholder="kg" value="${s.weight ?? ''}" ${dis}>`}
    <input class="num" data-f="reps" inputmode="numeric" aria-label="${isMin ? 'Minuten' : 'Wiederholungen'} Satz ${s.n}" placeholder="${isMin ? 'min' : ex.repMin + '–' + ex.repMax}" value="${s.reps ?? ''}" ${dis}>
    ${isMin ? '<span class="unit-cell">–</span>' : `<select data-f="rir" aria-label="RIR Satz ${s.n}" ${dis}>${rirOpts}</select>`}
    <button class="chk" data-act="set" aria-pressed="${s.done}" aria-label="Satz ${s.n} abgeschlossen">${s.done ? '✓' : ''}</button>
  </div>`;
}

function exCard(app, ex) {
  const done = exerciseComplete(ex);
  const r = ex.recommendation;
  const showRec = r && (r.kind === 'increase' || r.kind === 'hold') && !done;
  const acc = ex.acceptedIncrease;
  const isMin = ex.unit === 'min';
  return `<section class="card ex ${done ? 'done' : ''}" data-key="${ex.key}">
    <header class="ex-head">
      <div><h3>${done ? '<span class="ok">✓</span> ' : ''}${esc(ex.name)}</h3>
      <span class="muted small">${isMin ? `${ex.repMin} min` : `${ex.targetSets} × ${ex.repMin}–${ex.repMax}`}${isMin ? '' : ` · Volumen <b data-vol>${fmtNum(exVolume(ex))}</b> kg`}</span></div>
      <button class="icon-btn info" data-act="info" aria-label="Anleitung ${esc(ex.name)}">i</button>
    </header>
    ${showRec && !acc ? recCard('Vorschlag', r, true, ex.key) : ''}
    ${acc ? `<div class="rec increase small">Steigerung übernommen: ${fmtKg(acc.from)} → <b class="acc">${fmtKg(acc.to)} kg</b></div>` : ''}
    <div class="sets">
      <div class="set-row head"><span>Satz</span><span>Soll</span><span>${isMin ? '' : 'kg'}</span><span>${isMin ? 'min' : 'Wdh.'}</span><span>${isMin ? '' : 'RIR'}</span><span>✓</span></div>
      ${ex.sets.map((s, i) => setRow(ex, s, i)).join('')}
    </div>
  </section>`;
}

function renderActive(app, root) {
  const st = app.state, a = st.active;
  const c = sessionCounts(a);
  root.innerHTML = `
    <div class="session-bar" id="sessBar">
      <div class="sb-row">
        <div><span class="eyebrow">${DAY_NAMES[a.planDay] || ''} · Start ${fmtTime(a.startedAt)}</span><h2>${esc(a.name)}</h2></div>
        <div class="timer"><span class="t-label" id="tLabel">verbleibend</span><span class="t-big" id="tRemain">--:--</span></div>
      </div>
      <div class="progress"><i id="progFill" style="width:${(c.done / c.total) * 100}%"></i></div>
      <div class="sb-row small"><span id="progTxt">${c.done} / ${c.total} Sätze</span><span>Pause: <button class="link" data-act="rest-cfg">${st.settings.restSeconds} s</button> · <button class="link" data-act="rest-now">Pause starten</button></span></div>
    </div>
    ${a.exercises.map((ex) => exCard(app, ex)).join('')}
    <section class="card">
      <label class="lbl" for="notes">Notizen (optional)</label>
      <textarea id="notes" rows="2" placeholder="z. B. Schlaf, Tagesform, Technik …">${esc(a.notes || '')}</textarea>
    </section>
    <button class="btn primary big block" data-act="finish">Training abschließen</button>
    <button class="btn ghost block danger-text" data-act="discard">Training verwerfen</button>
  `;

  const findEx = (el) => a.exercises.find((x) => x.key === el.closest('[data-key]')?.dataset.key);

  root.onclick = async (e) => {
    const t = e.target;
    const act = t.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const ex = findEx(t);
    if (act === 'info' && ex) {
      const plan = st.plan.days[a.planDay]?.items.find((i) => i.exId === ex.exId);
      openExerciseInfo(app, ex.exId, plan || { sets: ex.targetSets, repMin: ex.repMin, repMax: ex.repMax, unit: ex.unit });
    }
    if (act === 'accept' && ex) {
      const ok = await confirmDialog(`Gewicht für <b>${esc(ex.name)}</b> von ${fmtKg(ex.recommendation.lastWeight)} kg auf <b>${fmtKg(ex.recommendation.newWeight)} kg</b> erhöhen?`, { ok: 'Steigerung übernehmen' });
      if (ok) { acceptIncrease(ex); app.save(); app.render(); toast('Steigerung übernommen'); }
    }
    if (act === 'set' && ex) {
      const row = t.closest('.set-row');
      const s = ex.sets[+row.dataset.i];
      if (!s.done) {
        readRow(row, s, ex);
        if (ex.unit !== 'min' && s.weight == null) { toast('Bitte Gewicht eintragen (0 = Körpergewicht)', 'warn'); row.querySelector('[data-f=weight]').focus(); return; }
        if (s.reps == null) { toast(ex.unit === 'min' ? 'Bitte Dauer in Minuten eintragen' : 'Bitte Wiederholungen eintragen', 'warn'); row.querySelector('[data-f=reps]').focus(); return; }
        toggleSet(s, true);
        const wasLast = sessionCounts(a).done === sessionCounts(a).total;
        if (st.settings.autoRest && ex.unit !== 'min' && !wasLast) app.startRest();
        if (wasLast) { app.stopRest(); toast('Alle Sätze erledigt – Training abschließen!', 'ok'); }
        else if (exerciseComplete(ex)) toast(`${ex.name} erledigt ✓`, 'ok');
      } else {
        toggleSet(s, false);
      }
      app.save();
      const y = window.scrollY;
      app.render();
      window.scrollTo(0, y);
    }
    if (act === 'rest-now') app.startRest();
    if (act === 'rest-cfg') restConfig(app);
    if (act === 'finish') finishDialog(app);
    if (act === 'discard') {
      if (await confirmDialog('Laufendes Training ohne Speichern verwerfen? Erfasste Sätze gehen verloren.', { ok: 'Verwerfen', danger: true })) {
        st.active = null; app.stopRest(); app.save(); app.render();
      }
    }
  };

  // Eingaben direkt speichern (ohne Neuaufbau, damit der Fokus bleibt)
  root.oninput = (e) => {
    if (e.target.id === 'notes') { a.notes = e.target.value; app.saveSoon(); return; }
    const row = e.target.closest('.set-row'); if (!row || row.classList.contains('head')) return;
    const ex = findEx(row), s = ex.sets[+row.dataset.i];
    const f = e.target.dataset.f;
    if (f === 'weight') {
      const old = s.weight, nw = parseNum(e.target.value);
      s.weight = nw;
      // Folgesätze mit gleichem (altem) Gewicht mitziehen
      ex.sets.forEach((o, j) => {
        if (j > +row.dataset.i && !o.done && (o.weight === old || o.weight == null)) {
          o.weight = nw;
          const inp = root.querySelector(`[data-key="${ex.key}"] .set-row[data-i="${j}"] [data-f=weight]`);
          if (inp) inp.value = nw ?? '';
        }
      });
    } else if (f === 'reps') s.reps = parseNum(e.target.value) == null ? null : Math.round(parseNum(e.target.value));
    else if (f === 'rir') s.rir = e.target.value === '' ? null : +e.target.value;
    app.saveSoon();
  };
  root.onchange = root.oninput;
  app.tick();
}

function readRow(row, s, ex) {
  const w = row.querySelector('[data-f=weight]'), r = row.querySelector('[data-f=reps]'), rir = row.querySelector('[data-f=rir]');
  if (w) s.weight = parseNum(w.value);
  if (r) s.reps = parseNum(r.value) == null ? null : Math.round(parseNum(r.value));
  if (rir) s.rir = rir.value === '' ? null : +rir.value;
  if (ex.unit === 'min' && s.reps == null) s.reps = ex.repMin;
}

function restConfig(app) {
  const st = app.state;
  const opts = [45, 60, 75, 90, 120, 150, 180];
  openSheet({
    title: 'Satzpause',
    body: `<div class="grid-btns">${opts.map((o) => `<button class="btn ${o === st.settings.restSeconds ? 'primary' : 'outline'}" data-rest="${o}">${o} s</button>`).join('')}</div>
      <label class="check"><input type="checkbox" id="autoRest" ${st.settings.autoRest ? 'checked' : ''}> Pause nach jedem Satz automatisch starten</label>`,
    actions: [{ label: 'Fertig', cls: 'primary', onClick: (c, w) => { st.settings.autoRest = w.querySelector('#autoRest').checked; app.save(); c(); app.render(); } }]
  }).el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rest]'); if (!b) return;
    st.settings.restSeconds = +b.dataset.rest; app.save();
    b.parentElement.querySelectorAll('.btn').forEach((x) => x.className = 'btn ' + (x === b ? 'primary' : 'outline'));
  });
}

function finishDialog(app) {
  const st = app.state, a = st.active;
  const c = sessionCounts(a);
  const open = c.total - c.done;
  openSheet({
    title: 'Training abschließen',
    body: `<div class="kvs">
        <div class="kv"><span>Sätze erledigt</span><b>${c.done} / ${c.total}</b></div>
        <div class="kv"><span>Dauer</span><b>${fmtDur((Date.now() - new Date(a.startedAt)) / 1000)}</b></div>
        <div class="kv"><span>Volumen</span><b>${fmtNum(sessionVolume(a))} kg</b></div></div>
      ${open ? `<div class="alert warn">${open} Satz/Sätze nicht abgehakt. Die Einheit wird als <b>teilweise absolviert</b> gespeichert; offene Sätze bleiben im Protokoll als „ausgelassen“ erkennbar.</div>`
             : '<div class="alert ok">Alle Sätze erledigt – die Einheit wird als <b>abgeschlossen</b> gespeichert.</div>'}
      <label class="lbl" for="finNotes">Notizen</label><textarea id="finNotes" rows="3">${esc(a.notes || '')}</textarea>`,
    actions: [
      { label: 'Weiter trainieren', cls: 'ghost' },
      { label: open ? 'Teilweise speichern' : 'Abschließen & speichern', cls: 'primary', id: 'finGo', onClick: (close, w) => {
        const s = finishSession(st, w.querySelector('#finNotes').value);
        app.stopRest();
        app.save(); close(); app.render(); window.scrollTo(0, 0);
        toast(s.status === 'completed' ? 'Training abgeschlossen ✓' : 'Teilweise Einheit gespeichert', 'ok');
      } }
    ]
  });
}

/* ---------- Nach dem Training ---------- */

function renderSummary(app, root) {
  const st = app.state;
  const s = st.sessions.find((x) => x.id === st.meta.lastFinishedId);
  const c = sessionCounts(s);
  root.innerHTML = `
    <header class="view-head"><h1>Geschafft</h1><span class="muted">${fmtDate(s.startedAt)} · ${fmtTime(s.startedAt)}</span></header>
    <section class="card hero">
      <span class="eyebrow">${s.status === 'completed' ? 'Abgeschlossen' : 'Teilweise absolviert'}</span>
      <h2>${esc(s.name)}</h2>
      <div class="stats3"><div><b>${fmtDur(s.durationSec)}</b><span>Dauer</span></div><div><b>${c.done}/${c.total}</b><span>Sätze</span></div><div><b>${fmtNum(sessionVolume(s))}</b><span>kg Volumen</span></div></div>
      <p class="small">Protokoll jetzt speichern – die JSON-Datei beim nächsten Training wieder laden:</p>
      <button class="btn primary big block" data-act="json">⇩ JSON-Protokoll herunterladen</button>
      <button class="btn outline block" data-act="pdf">⇩ PDF-Protokoll herunterladen</button>
    </section>
    <section class="card">
      <h3>Übersicht</h3>
      <ul class="sum-list">${s.exercises.map((ex) => {
        const prs = sessionPRs(st, s, ex), cmp = compareToLast(st, s, ex);
        const sets = ex.sets.map((x) => x.done ? (ex.unit === 'min' ? `${x.reps} min` : `${fmtKg(x.weight)}×${x.reps}`) : '<span class="miss">–</span>').join(' · ');
        return `<li><div class="sum-top"><b>${esc(ex.name)}</b>${ex.unit === 'min' ? '' : `<span class="muted small">${fmtNum(exVolume(ex))} kg</span>`}</div>
          <div class="small">${sets}</div>
          ${cmp ? `<div class="small muted">ggü. letztem Mal: ${cmp.weightDiff >= 0 ? '+' : ''}${fmtKg(cmp.weightDiff)} kg · ${cmp.repsDiff >= 0 ? '+' : ''}${cmp.repsDiff} Wdh. · ${cmp.volumeDiff >= 0 ? '+' : ''}${fmtNum(cmp.volumeDiff)} kg Volumen</div>` : ''}
          ${prs.length ? `<div class="small pr">★ ${prs.map(esc).join(' · ')}</div>` : ''}</li>`;
      }).join('')}</ul>
    </section>
    <button class="btn ghost block" data-act="close">Zur Tagesübersicht</button>`;
  root.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'json') downloadJson(app, s.id);
    if (act === 'pdf') downloadPdf(app, s.id);
    if (act === 'close') { st.meta.lastFinishedId = null; app.save(); app.render(); }
  };
  root.oninput = root.onchange = null;
}

/** Aktualisiert Timer-Anzeigen (wird sekündlich aufgerufen). */
export function tickToday(app) {
  const a = app.state.active;
  if (!a) return;
  const el = document.getElementById('tRemain');
  if (!el) return;
  const elapsed = (Date.now() - new Date(a.startedAt)) / 1000;
  const rem = app.state.settings.sessionMinutes * 60 - elapsed;
  el.textContent = rem >= 0 ? fmtDur(rem) : '+' + fmtDur(-rem);
  el.classList.toggle('over', rem < 0);
  document.getElementById('tLabel').textContent = rem >= 0 ? `verbleibend · ${fmtDur(elapsed)} vergangen` : 'überzogen';
}
