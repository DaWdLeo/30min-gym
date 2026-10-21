// Bereich PROTOKOLLE: Import, Export, Datensicherung, Einstellungen
import { esc, fmtDate, fmtTime, fmtNum, APP_VERSION, parseNum } from '../../core/util.js';
import { history, sessionVolume, sessionCounts } from '../../core/training.js';
import { defaultState } from '../../core/defaults.js';
import { storageInfo, clearState } from '../../core/store.js';
import { confirmDialog, toast } from '../dom.js';
import { startImport, downloadJson, downloadPdf, showAnalysis } from '../actions.js';

export function renderProtocols(app, root) {
  const st = app.state;
  const h = history(st).slice().reverse();
  const inFrame = window.self !== window.top;
  const li = st.meta.lastImport;
  root.innerHTML = `
    <header class="view-head"><h1>Protokolle</h1></header>
    <section class="card hero">
      <button class="btn primary big block" data-act="import">⇪ Letztes Trainingsprotokoll laden</button>
      <p class="small muted">JSON-Datei des letzten Trainings wählen. Historie, Plan und Einstellungen werden geprüft und ohne Duplikate übernommen.</p>
      ${li ? `<p class="small">Letzter Import: ${fmtDate(li.at)} ${fmtTime(li.at)} · ${li.added} neue Einheit(en) · <button class="link" data-act="analysis">Auswertung anzeigen</button></p>` : ''}
    </section>
    <section class="card">
      <h3>Datensicherung</h3>
      <p class="small muted">Eine JSON-Datei enthält immer den vollständigen Datenstand (alle Einheiten, Plan, Einstellungen) und reicht für einen Geräte- oder Browserwechsel.</p>
      <button class="btn outline block" data-act="backup" ${st.sessions.length ? '' : 'disabled'}>⇩ Vollständige Sicherung (JSON)</button>
    </section>
    <section class="card">
      <h3>Gespeicherte Einheiten <small class="muted">(${h.length})</small></h3>
      ${h.length ? `<ul class="proto">${h.map((s) => {
        const c = sessionCounts(s);
        return `<li><div><b>${esc(s.name)}</b><small>${fmtDate(s.startedAt)} · ${fmtTime(s.startedAt)} · ${c.done}/${c.total} Sätze · ${fmtNum(sessionVolume(s))} kg ${s.status === 'completed' ? '' : '<span class="tag warn">teilweise</span>'}</small></div>
          <span class="dl"><button class="btn sm outline" data-pdf="${s.id}">PDF</button><button class="btn sm outline" data-json="${s.id}">JSON</button></span></li>`;
      }).join('')}</ul>` : '<p class="muted">Noch keine Einheiten gespeichert.</p>'}
    </section>
    <section class="card">
      <h3>Einstellungen</h3>
      <div class="settings">
        <label>Trainingsdauer (min)<input class="num" data-s="sessionMinutes" inputmode="numeric" value="${st.settings.sessionMinutes}"></label>
        <label>Satzpause (s)<input class="num" data-s="restSeconds" inputmode="numeric" value="${st.settings.restSeconds}"></label>
        <label>Gewichtssteigerung (kg)<input class="num" data-s="weightStep" inputmode="decimal" value="${String(st.settings.weightStep).replace('.', ',')}"></label>
      </div>
      <label class="check"><input type="checkbox" data-b="autoRest" ${st.settings.autoRest ? 'checked' : ''}> Pause nach jedem Satz automatisch starten</label>
      <label class="check"><input type="checkbox" data-b="sound" ${st.settings.sound ? 'checked' : ''}> Signalton am Ende der Pause</label>
      <label class="check"><input type="checkbox" data-b="vibrate" ${st.settings.vibrate ? 'checked' : ''}> Vibration am Ende der Pause</label>
    </section>
    <section class="card">
      <h3>Datenschutz & Speicher</h3>
      <p class="small">Alle Daten bleiben lokal in diesem Browser (${fmtNum(storageInfo().bytes / 1024)} KB). Kein Konto, kein Tracking, keine externen Dienste.</p>
      ${inFrame ? '<p class="small"><a class="link" href="./" target="_blank" rel="noopener">App in eigenem Tab öffnen</a> – empfohlen für Downloads und Installation (im iFrame speichert der Browser die Daten ggf. getrennt).</p>' : ''}
      <button class="btn ghost danger-text block" data-act="wipe">Alle lokalen Daten löschen</button>
      <p class="small muted center">30MIN GYM ${APP_VERSION} · Open Source (MIT)</p>
    </section>`;

  root.onclick = async (e) => {
    const t = e.target;
    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'import') startImport(app);
    if (act === 'analysis') showAnalysis(app, st.meta.lastImport?.added ?? 0);
    if (act === 'backup') downloadJson(app, null);
    if (act === 'wipe') {
      if (!(await confirmDialog('Alle Trainingsdaten, den Plan und die Einstellungen in diesem Browser löschen? Vorher eine Sicherung herunterladen!', { ok: 'Weiter', danger: true }))) return;
      if (!(await confirmDialog('Wirklich endgültig löschen? Dies kann nicht rückgängig gemacht werden.', { ok: 'Endgültig löschen', danger: true }))) return;
      clearState(); app.state = defaultState(); app.stopRest(); app.save(); app.render(); toast('Lokale Daten gelöscht');
    }
    const p = t.closest('[data-pdf]'); if (p) downloadPdf(app, p.dataset.pdf);
    const j = t.closest('[data-json]'); if (j) downloadJson(app, j.dataset.json);
  };
  root.onchange = (e) => {
    const s = e.target.dataset.s, b = e.target.dataset.b;
    if (s) {
      const v = parseNum(e.target.value);
      const lim = { sessionMinutes: [5, 180], restSeconds: [10, 600], weightStep: [0.25, 20] }[s];
      if (v == null || v < lim[0] || v > lim[1]) { toast(`Wert zwischen ${lim[0]} und ${lim[1]} eingeben`, 'warn'); e.target.value = st.settings[s]; return; }
      st.settings[s] = s === 'weightStep' ? v : Math.round(v);
      app.save(); toast('Gespeichert');
    }
    if (b) { st.settings[b] = e.target.checked; app.save(); }
  };
  root.oninput = null;
}
