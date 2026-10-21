// Bereich ÜBUNGEN: Wochenplan bearbeiten, Übungsbibliothek mit Grafiken
import { esc, DAY_KEYS, DAY_NAMES, DAY_SHORT, uid, deepClone, parseNum } from '../../core/util.js';
import { allExercises, getExercise } from '../../core/exercises.js';
import { defaultPlan, makePlanItem } from '../../core/defaults.js';
import { renderFigure } from '../figures.js';
import { openSheet, confirmDialog, toast } from '../dom.js';
import { openExerciseInfo } from '../actions.js';

export function renderExercises(app, root) {
  const st = app.state;
  root.innerHTML = `
    <header class="view-head"><h1>Übungen</h1><span class="muted">Plan & Anleitungen</span></header>
    <section class="card">
      <h3>Wochenplan</h3>
      <ul class="week">${DAY_KEYS.map((k) => {
        const d = st.plan.days[k];
        return `<li><button class="week-row" data-edit="${k}"><span class="wd">${DAY_SHORT[k]}</span><span class="wn"><b>${esc(d.name)}</b>
          <small>${d.items.map((i) => esc(getExercise(i.exId, st)?.name || i.exId)).join(' · ')}</small></span><span class="chev">›</span></button></li>`;
      }).join('')}</ul>
      <button class="btn ghost sm" data-act="reset-plan">Standardplan wiederherstellen</button>
    </section>
    <section>
      <h3 class="sec-title">Übungsbibliothek</h3>
      <div class="lib">${allExercises(st).map((ex) => `
        <button class="lib-item" data-info="${ex.id}">
          ${ex.figure ? renderFigure(ex.figure, 1, { ghost: true, arrows: true, small: true }) : '<div class="nofig">eigene Übung</div>'}
          <span>${esc(ex.name)}</span></button>`).join('')}</div>
    </section>`;
  root.onclick = async (e) => {
    const t = e.target;
    const info = t.closest('[data-info]');
    if (info) { openExerciseInfo(app, info.dataset.info, findPlanItem(st, info.dataset.info)); return; }
    const ed = t.closest('[data-edit]');
    if (ed) { editDay(app, ed.dataset.edit); return; }
    if (t.closest('[data-act=reset-plan]')) {
      if (await confirmDialog('Trainingsplan auf die Standardvorlage zurücksetzen? Trainingshistorie bleibt erhalten.', { ok: 'Zurücksetzen', danger: true })) {
        st.plan = defaultPlan(); app.save(); app.render(); toast('Standardplan wiederhergestellt');
      }
    }
  };
  root.oninput = root.onchange = null;
}

function findPlanItem(st, exId) {
  for (const k of DAY_KEYS) { const it = st.plan.days[k].items.find((i) => i.exId === exId); if (it) return it; }
  return null;
}

/* ---------- Tageseditor ---------- */

function editDay(app, dk) {
  const st = app.state;
  const draft = deepClone(st.plan.days[dk]);
  const lib = allExercises(st);

  const itemsHtml = () => draft.items.map((it, i) => {
    const ex = getExercise(it.exId, st);
    return `<div class="ed-item" data-i="${i}">
      <div class="ed-top"><b>${esc(ex?.name || it.exId)}</b>
        <span class="ed-btns"><button class="icon-btn" data-mv="-1" aria-label="nach oben" ${i === 0 ? 'disabled' : ''}>▲</button><button class="icon-btn" data-mv="1" aria-label="nach unten" ${i === draft.items.length - 1 ? 'disabled' : ''}>▼</button><button class="icon-btn danger-text" data-rm aria-label="entfernen">✕</button></span></div>
      <div class="ed-fields">
        <label>Sätze<input class="num" data-f="sets" inputmode="numeric" value="${it.sets}"></label>
        <label>${it.unit === 'min' ? 'Minuten' : 'Wdh. min'}<input class="num" data-f="repMin" inputmode="numeric" value="${it.repMin}"></label>
        ${it.unit === 'min' ? '' : `<label>Wdh. max<input class="num" data-f="repMax" inputmode="numeric" value="${it.repMax}"></label>
        <label>+kg<input class="num" data-f="step" inputmode="decimal" placeholder="${st.settings.weightStep}" value="${it.step ?? ''}"></label>`}
      </div></div>`;
  }).join('') || '<p class="muted">Keine Übungen – unten hinzufügen.</p>';

  const sheet = openSheet({
    title: `${DAY_NAMES[dk]} bearbeiten`,
    body: `<label class="lbl">Name der Einheit<input id="dName" value="${esc(draft.name)}"></label>
      <div id="edItems">${itemsHtml()}</div>
      <h4>Übung hinzufügen</h4>
      <div class="add-row"><select id="addEx">${lib.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select>
      <button class="btn outline sm" data-add>Hinzufügen</button></div>
      <div class="add-row"><input id="customName" placeholder="Eigene Übung (Name)"><button class="btn outline sm" data-addc>Anlegen</button></div>`,
    actions: [
      { label: 'Abbrechen', cls: 'ghost' },
      { label: 'Speichern', cls: 'primary', onClick: (close, w) => {
        draft.name = w.querySelector('#dName').value.trim() || draft.name;
        for (const it of draft.items) {
          it.sets = Math.max(1, Math.min(10, it.sets | 0 || 1));
          it.repMin = Math.max(1, it.repMin | 0 || 1);
          it.repMax = it.unit === 'min' ? it.repMin : Math.max(it.repMin, it.repMax | 0 || it.repMin);
        }
        st.plan.days[dk] = draft; app.save(); close(); app.render(); toast('Plan gespeichert');
      } }
    ]
  });
  const w = sheet.el;
  const redraw = () => { w.querySelector('#edItems').innerHTML = itemsHtml(); };
  w.addEventListener('click', (e) => {
    const t = e.target;
    const item = t.closest('.ed-item');
    if (item && t.closest('[data-mv]')) {
      const i = +item.dataset.i, j = i + +t.closest('[data-mv]').dataset.mv;
      [draft.items[i], draft.items[j]] = [draft.items[j], draft.items[i]]; redraw();
    } else if (item && t.closest('[data-rm]')) {
      draft.items.splice(+item.dataset.i, 1); redraw();
    } else if (t.closest('[data-add]')) {
      const id = w.querySelector('#addEx').value;
      const base = findPlanItem(st, id);
      draft.items.push(base ? { ...deepClone(base), iid: uid() } : makePlanItem(id, 3, 8, 12)); redraw();
    } else if (t.closest('[data-addc]')) {
      const name = w.querySelector('#customName').value.trim();
      if (!name) { toast('Bitte einen Namen eingeben', 'warn'); return; }
      const id = 'custom-' + uid().slice(0, 8);
      st.customExercises.push({ id, name, equipment: '', primary: [] });
      app.save();
      draft.items.push(makePlanItem(id, 3, 8, 12)); redraw();
      w.querySelector('#customName').value = '';
    }
  });
  w.addEventListener('input', (e) => {
    const item = e.target.closest('.ed-item'); if (!item) return;
    const it = draft.items[+item.dataset.i], f = e.target.dataset.f;
    if (f === 'step') it.step = parseNum(e.target.value);
    else it[f] = parseInt(e.target.value, 10) || 0;
  });
}
