// Einstieg: Navigation, Speichern, Timer, Service Worker
import { loadState, saveState, requestPersistence } from './core/store.js';
import { fmtDur } from './core/util.js';
import { renderToday, tickToday } from './ui/views/today.js';
import { renderExercises } from './ui/views/exercises.js';
import { renderProgress } from './ui/views/progress.js';
import { renderProtocols } from './ui/views/protocols.js';
import { beep, toast } from './ui/dom.js';

const VIEWS = { heute: renderToday, uebungen: renderExercises, fortschritt: renderProgress, protokolle: renderProtocols };

const app = {
  state: loadState(),
  tab: 'heute',
  ui: { selectedDay: null, range: 4, progEx: null },
  _saveT: null,

  save() {
    clearTimeout(this._saveT);
    if (!saveState(this.state)) toast('Speichern fehlgeschlagen – Speicher voll? Bitte Sicherung herunterladen.', 'warn');
  },
  saveSoon() { clearTimeout(this._saveT); this._saveT = setTimeout(() => this.save(), 300); },

  go(tab) {
    if (!VIEWS[tab]) tab = 'heute';
    if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
    this.tab = tab;
    this.render();
    window.scrollTo(0, 0);
  },

  render() {
    const root = document.getElementById('view');
    VIEWS[this.tab](this, root);
    document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
    document.querySelector('.nav [data-tab=heute]').classList.toggle('live', !!this.state.active);
    this.tick();
  },

  /* ---- Satzpause ---- */
  startRest(sec) {
    if (!this.state.active) return;
    const s = sec ?? this.state.settings.restSeconds;
    this.state.active.rest = { until: Date.now() + s * 1000, total: s };
    this.saveSoon();
    this.tick();
  },
  stopRest() {
    if (this.state.active) this.state.active.rest = null;
    document.getElementById('restbar').hidden = true;
  },

  tick() {
    tickToday(this);
    const bar = document.getElementById('restbar');
    const r = this.state.active?.rest;
    if (!r) { bar.hidden = true; return; }
    const left = Math.ceil((r.until - Date.now()) / 1000);
    if (left <= 0) {
      this.state.active.rest = null; this.save();
      bar.hidden = true;
      if (this.state.settings.sound) beep();
      if (this.state.settings.vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      toast('Pause vorbei – nächster Satz!', 'ok');
      return;
    }
    bar.hidden = false;
    document.getElementById('restTime').textContent = fmtDur(left);
    document.getElementById('restFill').style.width = `${(left / r.total) * 100}%`;
  }
};

document.querySelector('.nav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) app.go(b.dataset.tab);
});
document.getElementById('restbar').addEventListener('click', (e) => {
  const a = e.target.closest('[data-rest]')?.dataset.rest;
  const r = app.state.active?.rest;
  if (!a || !r) return;
  if (a === 'skip') { app.stopRest(); app.save(); return; }
  r.until += +a * 1000; r.total = Math.max(r.total + +a, 1);
  if (r.until <= Date.now()) app.stopRest();
  app.saveSoon(); app.tick();
});

window.addEventListener('hashchange', () => app.go(location.hash.slice(1)));
// Daten aus anderem Tab übernehmen (z. B. App parallel im iFrame geöffnet)
window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith('30mingym:state')) { app.state = loadState(); app.render(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') app.save(); else app.tick(); });

setInterval(() => app.tick(), 1000);
if (window.self !== window.top) document.documentElement.classList.add('in-frame');

app.go(location.hash.slice(1) || 'heute');
requestPersistence();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

window.__app = app; // für Tests/Debugging
