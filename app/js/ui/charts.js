// Kompakte, interaktive SVG-Diagramme (Antippen zeigt Werte)
import { esc, fmtDateShort } from '../core/util.js';

const niceMax = (v) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v) || v;
};

/**
 * Liniendiagramm.
 * @param {{labels:string[], series:Array<{name,color,values:number[],unit?:string}>, height?:number, minZero?:boolean}} o
 */
export function lineChart(o) {
  const W = 340, H = o.height || 160, pl = 34, pr = 10, pt = 12, pb = 24;
  const all = o.series.flatMap((s) => s.values).filter((v) => v != null);
  if (!all.length) return '<p class="muted small">Keine Daten im Zeitraum.</p>';
  let min = o.minZero ? 0 : Math.min(...all), max = Math.max(...all);
  if (!o.minZero) { const pad = (max - min) * 0.15 || max * 0.1 || 1; min = Math.max(0, min - pad); max = max + pad; }
  else max = niceMax(max);
  const n = o.labels.length;
  const x = (i) => pl + (n === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (n - 1));
  const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min || 1));
  let g = '';
  for (let k = 0; k <= 3; k++) {
    const v = min + ((max - min) * k) / 3, yy = y(v);
    g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 4}" y="${yy + 3}" text-anchor="end" class="ax">${Math.round(v)}</text>`;
  }
  const step = Math.max(1, Math.ceil(n / 6));
  o.labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="ax">${esc(l)}</text>`; });
  for (const s of o.series) {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
    if (pts.length > 1) g += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s.values.forEach((v, i) => {
      if (v == null) return;
      g += `<circle cx="${x(i)}" cy="${y(v)}" r="9" fill="transparent" data-tip="${esc(`${o.labels[i]} · ${s.name}: ${v.toLocaleString('de-DE')}${s.unit ? ' ' + s.unit : ''}`)}"/>`
        + `<circle cx="${x(i)}" cy="${y(v)}" r="3.4" fill="${s.color}" pointer-events="none"/>`;
    });
  }
  const legend = o.series.length > 1 ? `<div class="legend">${o.series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" class="chart-svg">${g}</svg><div class="chart-tip">Punkt antippen für Werte</div></div>`;
}

/** Säulendiagramm (z. B. Trainings pro Woche). */
export function barChart(o) {
  const W = 340, H = o.height || 130, pl = 24, pr = 6, pt = 10, pb = 22;
  const n = o.labels.length;
  const max = niceMax(Math.max(1, ...o.values.map((v, i) => v + (o.stack?.[i] || 0))));
  const bw = (W - pl - pr) / n;
  let g = '';
  for (let k = 0; k <= max; k += Math.max(1, Math.ceil(max / 4))) {
    const yy = pt + (H - pt - pb) * (1 - k / max);
    g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 4}" y="${yy + 3}" text-anchor="end" class="ax">${k}</text>`;
  }
  o.values.forEach((v, i) => {
    const s = o.stack?.[i] || 0;
    const hv = ((H - pt - pb) * v) / max, hs = ((H - pt - pb) * s) / max;
    const xx = pl + i * bw + bw * 0.18, w = bw * 0.64, base = H - pb;
    g += `<rect x="${xx}" y="${base - hv}" width="${w}" height="${hv}" rx="2" fill="#ff7a1a"/>`;
    if (s) g += `<rect x="${xx}" y="${base - hv - hs}" width="${w}" height="${hs}" rx="2" fill="#9a5a2c"/>`;
    g += `<rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent" data-tip="${esc(o.tips[i])}"/>`;
    if (i % Math.max(1, Math.ceil(n / 7)) === 0 || i === n - 1) g += `<text x="${xx + w / 2}" y="${H - 7}" text-anchor="middle" class="ax">${esc(o.labels[i])}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" class="chart-svg">${g}</svg><div class="chart-tip">Säule antippen für Werte</div></div>`;
}

export const dateLabel = (iso) => fmtDateShort(iso);

/** Aktiviert Tooltips für alle Diagramme innerhalb von root. */
export function bindCharts(root) {
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tip]');
    if (!t) return;
    const chart = t.closest('.chart');
    chart.querySelector('.chart-tip').textContent = t.dataset.tip;
    chart.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
    t.classList.add('sel');
  });
}
