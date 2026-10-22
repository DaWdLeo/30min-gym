// UI-Hilfen: Toasts, Bottom-Sheets, Bestätigungsdialoge
import { esc } from '../core/util.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg, kind = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
}

/**
 * Öffnet ein Bottom-Sheet.
 * @param {{title:string, body:string, actions?:Array<{label,cls,id,onClick}>, onClose?:Function, wide?:boolean}} o
 */
export function openSheet(o) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
    <div class="sheet-head"><h2>${esc(o.title)}</h2><button class="icon-btn close" aria-label="Schließen">✕</button></div>
    <div class="sheet-body">${o.body}</div>
    ${o.actions?.length ? `<div class="sheet-actions">${o.actions.map((a, i) =>
      `<button class="btn ${a.cls || ''}" data-i="${i}" ${a.id ? `id="${a.id}"` : ''}>${esc(a.label)}</button>`).join('')}</div>` : ''}
  </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('no-scroll');

  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    wrap.classList.remove('open');
    document.body.classList.remove('no-scroll');
    const wantsHistoryBack = history.state && history.state.sheetOpen;
    if (wantsHistoryBack) history.back();
    setTimeout(() => wrap.remove(), 200);
    o.onClose && o.onClose();
  };

  history.pushState({ sheetOpen: true }, '', location.href);
  const onPopState = () => { if (!closed) close(); };
  window.addEventListener('popstate', onPopState, { once: true });

  requestAnimationFrame(() => wrap.classList.add('open'));

  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('.close')) close();
    const b = e.target.closest('.sheet-actions .btn');
    if (b) { const a = o.actions[+b.dataset.i]; a.onClick ? a.onClick(close, wrap) : close(); }
  });
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  return { el: wrap, close };
}

export function confirmDialog(message, { ok = 'OK', cancel = 'Abbrechen', danger = false, title = 'Bitte bestätigen' } = {}) {
  return new Promise((resolve) => {
    let result = false;
    openSheet({
      title, body: `<p>${message}</p>`,
      actions: [
        { label: cancel, cls: 'ghost', onClick: (c) => { result = false; c(); } },
        { label: ok, cls: danger ? 'danger' : 'primary', onClick: (c) => { result = true; c(); } }
      ],
      onClose: () => resolve(result)
    });
  });
}

/** Kurzer Signalton am Ende der Satzpause (WebAudio, offline). */
let actx;
export function beep() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime;
    [0, 0.22].forEach((d) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.3, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
      o.connect(g).connect(actx.destination); o.start(t + d); o.stop(t + d + 0.2);
    });
  } catch {}
}
export function unlockAudio() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch {}
}
