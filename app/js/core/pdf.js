// Minimaler PDF-Generator (ohne Bibliotheken) + Layout des Trainingsprotokolls.
// Nutzt die PDF-Standardschriften Helvetica/Helvetica-Bold mit WinAnsi-Kodierung (Umlaute, ×, –).
import { fmtDate, fmtTime, fmtDur, fmtKg, fmtNum } from './util.js';
import { sessionCounts, sessionVolume, exVolume, sessionPRs, compareToLast } from './training.js';

const WIN = { 0x20AC: 0x80, 0x201A: 0x82, 0x201E: 0x84, 0x2026: 0x85, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2122: 0x99 };

function enc(str) {
  let out = '';
  for (const ch of String(str)) {
    const c = ch.codePointAt(0);
    let b;
    if (c < 128 || (c >= 0xA0 && c <= 0xFF)) b = c;
    else if (WIN[c]) b = WIN[c];
    else if (c === 0x2192) { out += '->'; continue; }
    else if (c === 0x2713) { out += 'OK'; continue; }
    else b = 0x3F;
    const s = String.fromCharCode(b);
    out += s === '(' || s === ')' || s === '\\' ? '\\' + s : s;
  }
  return out;
}

// Helvetica-Breiten (1/1000 em) für ASCII 32–126
const HW = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,
  278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,
  667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,
  333,500,278,556,500,722,500,500,500,334,260,334,584];
const BASE = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U', 'ß': 'B', '×': '+', '–': 'n' };

export function textWidth(str, size, bold = false) {
  let w = 0;
  for (const ch of String(str)) {
    const c = (BASE[ch] || ch).charCodeAt(0);
    w += c >= 32 && c <= 126 ? HW[c - 32] : 556;
  }
  return (w / 1000) * size * (bold ? 1.06 : 1);
}

const rgb = (c) => c.map((v) => (v / 255).toFixed(3)).join(' ');

export class PdfDoc {
  constructor() { this.W = 595.28; this.H = 841.89; this.pages = []; this.addPage(); }
  addPage() { this.cur = []; this.pages.push(this.cur); }
  text(x, y, s, { size = 10, bold = false, color = [30, 30, 30], align = 'left' } = {}) {
    if (align === 'right') x -= textWidth(s, size, bold);
    if (align === 'center') x -= textWidth(s, size, bold) / 2;
    this.cur.push(`BT /F${bold ? 2 : 1} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${(this.H - y).toFixed(2)} Td (${enc(s)}) Tj ET`);
  }
  rect(x, y, w, h, color) {
    this.cur.push(`${rgb(color)} rg ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }
  line(x1, y1, x2, y2, color = [200, 200, 200], w = 0.6) {
    this.cur.push(`${rgb(color)} RG ${w} w ${x1.toFixed(2)} ${(this.H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H - y2).toFixed(2)} l S`);
  }
  build() {
    const objs = [];
    const fontObj = (name) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
    const n = this.pages.length;
    // 1 Catalog, 2 Pages, 3/4 Fonts, dann je Seite: Page + Content
    const kids = this.pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ');
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
    objs.push(fontObj('Helvetica'));
    objs.push(fontObj('Helvetica-Bold'));
    this.pages.forEach((ops, i) => {
      const stream = ops.join('\n');
      objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
      objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];
    objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info << /Producer (30MIN GYM) /Title (Trainingsprotokoll) >> >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xFF;
    return bytes;
  }
}

const ORANGE = [255, 122, 26], DARK = [38, 41, 46], GREY = [110, 116, 124], LIGHT = [244, 245, 247], GREEN = [30, 150, 95], RED = [200, 60, 60];

/** Erzeugt das PDF-Trainingsprotokoll einer Einheit. */
export function sessionPdf(state, session) {
  const doc = new PdfDoc();
  const M = 40, R = doc.W - 40;
  let y = 0;
  const footer = () => {
    doc.line(M, 812, R, 812, [220, 220, 220]);
    doc.text(M, 826, '30MIN GYM · lokal erzeugt, keine Datenübertragung', { size: 7.5, color: GREY });
    doc.text(R, 826, `Seite ${doc.pages.length}`, { size: 7.5, color: GREY, align: 'right' });
  };
  const ensure = (h) => { if (y + h > 800) { footer(); doc.addPage(); y = 50; } };

  // Kopf
  doc.rect(0, 0, doc.W, 86, DARK);
  doc.rect(0, 86, doc.W, 4, ORANGE);
  doc.text(M, 38, '30MIN GYM', { size: 22, bold: true, color: ORANGE });
  doc.text(M, 60, 'Trainingsprotokoll', { size: 12, color: [235, 235, 235] });
  doc.text(R, 38, `${session.name}`, { size: 16, bold: true, color: [255, 255, 255], align: 'right' });
  doc.text(R, 60, `${fmtDate(session.startedAt)} · ${fmtTime(session.startedAt)} Uhr`, { size: 11, color: [235, 235, 235], align: 'right' });
  y = 112;

  // Kennzahlen
  const c = sessionCounts(session);
  const kpis = [
    ['Status', session.status === 'completed' ? 'Abgeschlossen' : 'Teilweise absolviert'],
    ['Dauer', fmtDur(session.durationSec)],
    ['Sätze', `${c.done} / ${c.total}`],
    ['Volumen', `${fmtNum(sessionVolume(session))} kg`]
  ];
  const kw = (R - M) / 4;
  kpis.forEach(([k, v], i) => {
    const x = M + i * kw;
    doc.rect(x + 2, y, kw - 4, 44, LIGHT);
    doc.text(x + 10, y + 16, k, { size: 8, color: GREY });
    doc.text(x + 10, y + 34, v, { size: 12, bold: true, color: i === 0 && session.status !== 'completed' ? RED : DARK });
  });
  y += 64;
  doc.text(M, y, `Zeitraum: ${fmtTime(session.startedAt)} – ${session.endedAt ? fmtTime(session.endedAt) : '–'} Uhr · Art: ${session.type === 'recovery' ? 'Regeneration' : 'Krafttraining'}`, { size: 9, color: GREY });
  y += 18;

  const cols = [M, M + 40, M + 112, M + 186, M + 250, M + 300, M + 400];
  for (const ex of session.exercises) {
    const prs = sessionPRs(state, session, ex);
    const cmp = compareToLast(state, session, ex);
    ensure(70 + ex.sets.length * 16);
    doc.rect(M, y, R - M, 22, [250, 238, 228]);
    doc.rect(M, y, 3, 22, ORANGE);
    doc.text(M + 10, y + 15, ex.name, { size: 11, bold: true, color: DARK });
    const exDone = ex.sets.filter((s) => s.done).length;
    doc.text(R - 8, y + 15, ex.unit === 'min' ? `${exDone}/${ex.sets.length} erledigt` :
      `Volumen ${fmtNum(exVolume(ex))} kg · ${exDone}/${ex.sets.length} Sätze`, { size: 9, color: GREY, align: 'right' });
    y += 36;
    const head = ex.unit === 'min' ? ['Satz', 'Soll', 'Dauer', '', '', 'Status', 'Uhrzeit'] : ['Satz', 'Soll', 'Gewicht', 'Wdh.', 'RIR', 'Status', 'Uhrzeit'];
    head.forEach((h, i) => doc.text(cols[i], y, h, { size: 8, bold: true, color: GREY }));
    y += 5; doc.line(M, y, R, y); y += 12;
    for (const s of ex.sets) {
      const soll = ex.unit === 'min' ? `${ex.repMin} min` : `${ex.repMin}–${ex.repMax}`;
      const vals = ex.unit === 'min'
        ? [String(s.n), soll, s.done ? `${s.reps ?? ex.repMin} min` : '–', '', '']
        : [String(s.n), soll, s.weight != null ? `${fmtKg(s.weight)} kg` : '–', s.reps != null ? String(s.reps) : '–', s.rir != null ? String(s.rir) : '–'];
      vals.forEach((v, i) => doc.text(cols[i], y, v, { size: 9.5, color: s.done ? DARK : GREY }));
      doc.text(cols[5], y, s.done ? 'erledigt' : 'ausgelassen', { size: 9.5, bold: true, color: s.done ? GREEN : RED });
      doc.text(cols[6], y, s.ts ? fmtTime(s.ts) : '–', { size: 9.5, color: GREY });
      y += 16;
    }
    if (ex.acceptedIncrease) {
      doc.text(M + 10, y, `Steigerung übernommen: ${fmtKg(ex.acceptedIncrease.from)} -> ${fmtKg(ex.acceptedIncrease.to)} kg`, { size: 8.5, color: ORANGE });
      y += 13;
    }
    if (cmp) {
      const sg = (n, u = '') => `${n > 0 ? '+' : ''}${typeof n === 'number' ? n.toLocaleString('de-DE') : n}${u}`;
      doc.text(M + 10, y, `Ggü. ${fmtDate(cmp.lastDate)}: Gewicht ${sg(cmp.weightDiff, ' kg')} · Wiederholungen ${sg(cmp.repsDiff)} · Volumen ${sg(cmp.volumeDiff, ' kg')}`, { size: 8.5, color: GREY });
      y += 13;
    }
    if (prs.length) {
      doc.text(M + 10, y, `Bestleistung: ${prs.join(' · ')}`, { size: 8.5, bold: true, color: GREEN });
      y += 13;
    }
    y += 10;
  }

  if (session.notes && session.notes.trim()) {
    ensure(60);
    doc.text(M, y, 'Notizen', { size: 11, bold: true, color: DARK }); y += 16;
    for (const line of wrap(session.notes, R - M, 10)) { ensure(14); doc.text(M, y, line, { size: 10, color: DARK }); y += 14; }
  }
  footer();
  return doc.build();
}

function wrap(text, width, size) {
  const out = [];
  for (const para of String(text).split(/\r?\n/)) {
    let line = '';
    for (const w of para.split(/\s+/)) {
      const t = line ? line + ' ' + w : w;
      if (textWidth(t, size) > width && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
