// SVG-Übungsgrafiken: parametrische Figur (Vorwärts-/Inverse Kinematik) + Geräte + Muskelkarte.
// Alle Grafiken werden lokal aus den Posen in exercises.js erzeugt – keine externen Bilder.

const L = { torso: 56, neck: 7, headR: 10, ua: 29, fa: 27, th: 42, sh: 41, ft: 14, shW: 15, hipW: 9 };
const W = { torso: 17, ua: 9, fa: 7.5, th: 12, sh: 9.5, ft: 5.5 };
const C = {
  body: '#9aa2ad', far: '#646b75', hi: '#ff7a1a', hiFar: '#b8571c', ghost: '#ffffff',
  equip: '#3b4048', equipLine: '#6f7782', cable: '#c9ced6', plate: '#2f343b', arrow: '#ffc08a', floor: '#4a5059'
};

const rad = (a) => (a * Math.PI) / 180;
const pt = (p, a, len) => [p[0] + len * Math.cos(rad(a)), p[1] + len * Math.sin(rad(a))];
const angOf = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (v, k) => [v[0] * k, v[1] * k];
const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f1 = (n) => Math.round(n * 10) / 10;

/** Zwei-Segment-IK: liefert [Gelenk, Endpunkt]. */
function ik(root, target, a, b, bend = 1) {
  const d = Math.min(Math.max(dist(root, target), Math.abs(a - b) + 0.01), a + b - 0.01);
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const alpha = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  const j = pt(root, angOf(root, target) + bend * alpha, a);
  return [j, pt(j, angOf(j, target), b)];
}

/** Interpoliert zwei Posen (Zahlen, Arrays, Objekte rekursiv). */
export function lerpPose(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => (b[i] === undefined ? v : lerpPose(v, b[i], t)));
  if (a && b && typeof a === 'object') {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      o[k] = a[k] === undefined ? b[k] : b[k] === undefined ? a[k] : lerpPose(a[k], b[k], t);
    }
    return o;
  }
  return a;
}

/** Berechnet alle Gelenkpositionen aus einer Pose. */
export function solve(pose, view) {
  const side = view === 'side';
  const dv = [Math.cos(rad(pose.torso)), Math.sin(rad(pose.torso))];
  const front = [-dv[1], dv[0]];           // Bauchseite (Seitenansicht, Blick nach rechts)
  const lat = [-dv[1], dv[0]];             // seitliche Achse (Front-/Rückansicht)
  const hip = pose.hip;
  const shoulder = pt(hip, pose.torso, L.torso);
  const neckA = pose.neck ?? pose.torso;
  const neckTop = pt(shoulder, neckA, L.neck);
  const head = pt(neckTop, neckA, L.headR);
  const J = { hip, shoulder, neckTop, head, dv, front, view, curl: pose.curl || 0 };
  J.traps = add(add(shoulder, mul(front, -8)), mul(dv, -3));

  const offs = side ? [0, 0] : [-1, 1];
  J.shoulders = offs.map((s) => add(shoulder, mul(lat, s * L.shW)));
  J.hips = offs.map((s) => add(hip, mul(lat, s * L.hipW)));

  const arms = pose.arms || [];
  J.arms = [0, 1].map((i) => {
    const spec = arms[i] || arms[0] || { ua: 90, fa: 90 };
    const sh = J.shoulders[i];
    if (spec.ua !== undefined) {
      const el = pt(sh, spec.ua, L.ua);
      return { sh, el, hand: pt(el, spec.fa, L.fa) };
    }
    let target = spec.to;
    if (spec.rel) {
      const base = spec.rel === 'head' ? head : spec.rel === 'traps' ? J.traps : spec.rel === 'hip' ? hip : shoulder;
      target = add(add(base, mul(front, spec.f || 0)), mul(dv, spec.u || 0));
    }
    if (spec.straight) {
      const k = Math.min(1, (L.ua + L.fa) / Math.max(1, dist(sh, target)));
      const hand = lerpP(sh, target, k);
      return { sh, el: lerpP(sh, hand, L.ua / (L.ua + L.fa)), hand };
    }
    const [el, hand] = ik(sh, target, L.ua, L.fa, spec.bend || 1);
    return { sh, el, hand };
  });

  const legs = pose.legs || [];
  J.legs = [0, 1].map((i) => {
    const spec = legs[i] || legs[0] || { th: 90, sh: 90, ft: 0 };
    const hp = J.hips[i];
    let kn, an;
    if (spec.th !== undefined) {
      kn = pt(hp, spec.th, L.th); an = pt(kn, spec.sh, L.sh);
    } else {
      let target = spec.ankle;
      if (spec.crank) target = pt(spec.crank, spec.a, spec.r);
      if (spec.ball) target = pt(spec.ball, (spec.ft || 0) + 180, L.ft);
      if (!side) target = spec.ankle;
      [kn, an] = ik(hp, target, L.th, L.sh, spec.bend || -1);
    }
    const toe = side ? pt(an, spec.ft ?? 0, L.ft) : [an[0] + (i ? 4 : -4), an[1] + 3];
    return { hip: hp, knee: kn, ankle: an, toe };
  });

  J.hand0 = J.arms[0].hand; J.hand1 = J.arms[1].hand;
  J.ankle0 = J.legs[0].ankle; J.ankle1 = J.legs[1].ankle;
  return J;
}

const getPt = (J, ref) => (Array.isArray(ref) ? ref : J[ref]);

/* ---------- Zeichnen ---------- */

const seg = (a, b, w, col, extra = '') =>
  `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;

/** Hervorgehobener Muskelstreifen auf einer Gliedmaße (vorn = +1, hinten = -1). */
function stripe(a, b, w, side) {
  const d = [(b[0] - a[0]), (b[1] - a[1])];
  const len = Math.hypot(d[0], d[1]) || 1;
  const u = [d[0] / len, d[1] / len];
  const n = mul([u[1], -u[0]], side * w * 0.2);
  const p1 = add(lerpP(a, b, 0.14), n), p2 = add(lerpP(a, b, 0.86), n);
  return seg(p1, p2, w * 0.62, 'HI');
}

function hiSet(list) {
  const m = new Map();
  for (const k of list || []) {
    const mm = /^([a-z]+)(\d)?$/.exec(k);
    if (!mm) continue;
    const key = mm[1], idx = mm[2];
    if (!m.has(key)) m.set(key, new Set());
    if (idx === undefined) { m.get(key).add(0); m.get(key).add(1); } else m.get(key).add(+idx);
  }
  return { has: (k, i = 0) => m.has(k) && m.get(k).has(i), any: (k) => m.has(k) };
}

function torsoPath(J) {
  const { hip, shoulder, front } = J;
  if (!J.curl) return seg(hip, shoulder, W.torso, 'BODY');
  const c = add(lerpP(hip, shoulder, 0.5), mul(front, -J.curl));
  return `<path d="M${f1(hip[0])} ${f1(hip[1])} Q${f1(c[0])} ${f1(c[1])} ${f1(shoulder[0])} ${f1(shoulder[1])}" fill="none" stroke="BODY" stroke-width="${W.torso}" stroke-linecap="round"/>`;
}

function torsoRegion(J, t, n, rx, ry) {
  const c = add(add(J.hip, mul(J.dv, t * L.torso)), mul(J.front, n * W.torso * 0.5 - (J.curl ? J.curl * 0.5 * Math.sin(Math.PI * t) : 0)));
  const a = angOf(J.hip, J.shoulder);
  return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${rx}" ry="${ry}" transform="rotate(${f1(a)} ${f1(c[0])} ${f1(c[1])})" fill="HI"/>`;
}

/** Zeichnet den Körper; mode: 'full' | 'ghost'. */
function drawBody(J, hl, mode, armsBehind) {
  const ghost = mode === 'ghost';
  const H = hiSet(ghost ? [] : hl);
  const out = [];
  const side = J.view === 'side';
  const col = (i) => (ghost ? C.ghost : side && i === 1 ? C.far : C.body);
  const hcol = (i) => (side && i === 1 ? C.hiFar : C.hi);
  const paint = (s, i) => s.replace(/BODY/g, col(i)).replace(/HI/g, hcol(i));

  const limbArm = (i) => {
    const a = J.arms[i];
    let s = seg(a.sh, a.el, W.ua, 'BODY') + seg(a.el, a.hand, W.fa, 'BODY');
    if (H.has('ua', i)) s += seg(a.sh, a.el, W.ua * 0.8, 'HI');
    if (H.has('biceps', i)) s += stripe(a.sh, a.el, W.ua, side ? 1 : 1);
    if (H.has('triceps', i)) s += stripe(a.sh, a.el, W.ua, -1);
    if (H.has('forearm', i)) s += seg(lerpP(a.el, a.hand, 0.15), lerpP(a.el, a.hand, 0.75), W.fa * 0.6, 'HI');
    s += `<circle cx="${f1(a.hand[0])}" cy="${f1(a.hand[1])}" r="4" fill="BODY"/>`;
    if (H.has('delt', i)) s += `<circle cx="${f1(a.sh[0])}" cy="${f1(a.sh[1])}" r="${side ? 6.5 : 6}" fill="HI"/>`;
    return paint(s, i);
  };
  const limbLeg = (i) => {
    const l = J.legs[i];
    let s = seg(l.hip, l.knee, W.th, 'BODY') + seg(l.knee, l.ankle, W.sh, 'BODY') + seg(l.ankle, l.toe, W.ft, 'BODY');
    if (H.has('th', i)) s += seg(l.hip, l.knee, W.th * 0.8, 'HI');
    if (H.has('quads', i)) s += stripe(l.hip, l.knee, W.th, side ? 1 : 0.0001);
    if (H.has('hams', i)) s += stripe(l.hip, l.knee, W.th, -1);
    if (H.has('calves', i)) s += stripe(l.knee, l.ankle, W.sh, -1);
    return paint(s, i);
  };

  if (side) {
    out.push(limbLeg(1), limbArm(1));
    out.push(paint(torsoPath(J), 0));
    let r = '';
    if (H.any('chest')) r += torsoRegion(J, 0.8, 0.5, 9, 4.5);
    if (H.any('abs')) r += torsoRegion(J, 0.4, 0.5, 12, 4.2);
    if (H.any('lats')) r += torsoRegion(J, 0.6, -0.5, 13, 4.6);
    if (H.any('upperback')) r += torsoRegion(J, 0.9, -0.45, 7, 4.5);
    if (H.any('lowerback')) r += torsoRegion(J, 0.25, -0.5, 9, 4.2);
    if (H.any('glutes')) r += torsoRegion(J, 0.0, -0.55, 7.5, 6);
    out.push(paint(r, 0));
    out.push(paint(`<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="${L.headR}" fill="BODY"/>`
      + seg(J.shoulder, J.neckTop, 7, 'BODY'), 0));
    out.push(limbLeg(0), limbArm(0));
  } else {
    // Front-/Rückansicht
    const [sl, sr] = J.shoulders, [hl2, hr] = J.hips;
    const torso = `<path d="M${f1(sl[0] - 3)} ${f1(sl[1] - 2)} L${f1(sr[0] + 3)} ${f1(sr[1] - 2)} L${f1(hr[0] + 3)} ${f1(hr[1] + 4)} L${f1(hl2[0] - 3)} ${f1(hl2[1] + 4)} Z" fill="BODY" stroke="BODY" stroke-width="6" stroke-linejoin="round"/>`;
    let r = '';
    const sc = J.shoulder;
    if (H.any('chest')) r += [-1, 1].map((s) => `<ellipse cx="${f1(sc[0] + s * 7)}" cy="${f1(sc[1] + 11)}" rx="7" ry="5.5" fill="HI"/>`).join('');
    if (H.any('abs')) r += `<rect x="${f1(sc[0] - 5.5)}" y="${f1(sc[1] + 20)}" width="11" height="28" rx="4" fill="HI"/>`;
    if (H.any('upperback')) r += [-1, 1].map((s) => `<ellipse cx="${f1(sc[0] + s * 6)}" cy="${f1(sc[1] + 12)}" rx="4.5" ry="9" fill="HI"/>`).join('');
    if (H.any('traps')) r += `<path d="M${f1(sc[0])} ${f1(sc[1] - 6)} L${f1(sc[0] - 12)} ${f1(sc[1] + 1)} L${f1(sc[0])} ${f1(sc[1] + 24)} L${f1(sc[0] + 12)} ${f1(sc[1] + 1)} Z" fill="HI" opacity=".85"/>`;
    if (H.any('lats')) r += [-1, 1].map((s) => `<path d="M${f1(sc[0] + s * 4)} ${f1(sc[1] + 18)} L${f1(sc[0] + s * 14)} ${f1(sc[1] + 6)} L${f1(sc[0] + s * 9)} ${f1(sc[1] + 38)} Z" fill="HI"/>`).join('');
    if (H.any('glutes')) r += [-1, 1].map((s) => `<ellipse cx="${f1(J.hip[0] + s * 6)}" cy="${f1(J.hip[1] + 3)}" rx="6" ry="6" fill="HI"/>`).join('');
    const headSvg = `<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="${L.headR}" fill="BODY"/>` + seg(J.shoulder, J.neckTop, 8, 'BODY');
    out.push(limbLeg(0), limbLeg(1));
    if (armsBehind) out.push(limbArm(0), limbArm(1));
    out.push(paint(torso + headSvg, 0), paint(r, 0));
    if (!armsBehind) out.push(limbArm(0), limbArm(1));
  }
  const g = out.join('');
  return ghost ? `<g opacity=".12">${g}</g>` : `<g>${g}</g>`;
}

/* ---------- Geräte ---------- */

function drawEquip(items, J, layer) {
  const out = [];
  const F = 188;
  for (const e of items) {
    const P = (ref) => getPt(J, ref);
    switch (e.type) {
      case 'tower':
        if (layer === 'back') out.push(`<rect x="${e.x - 6}" y="10" width="12" height="${F - 10}" rx="2" fill="${C.equip}" stroke="${C.equipLine}"/>`);
        break;
      case 'stack':
        if (layer === 'back') out.push(`<rect x="${e.x - 6}" y="10" width="12" height="${F - 10}" rx="2" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<rect x="${e.x - 10}" y="122" width="20" height="40" rx="2" fill="${C.plate}" stroke="${C.equipLine}"/>`
          + [0, 1, 2, 3].map((k) => `<line x1="${e.x - 10}" x2="${e.x + 10}" y1="${130 + k * 8}" y2="${130 + k * 8}" stroke="${C.equipLine}"/>`).join(''));
        break;
      case 'pulley':
        if (layer === 'front') out.push(`<circle cx="${e.at[0]}" cy="${e.at[1]}" r="4.5" fill="${C.plate}" stroke="${C.cable}" stroke-width="1.5"/>`);
        break;
      case 'cable': {
        if (layer !== 'back') break;
        const pts = [...e.path, ...(e.to ? [P(e.to)] : [])];
        out.push(`<polyline points="${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ')}" fill="none" stroke="${C.cable}" stroke-width="1.4"/>`);
        break;
      }
      case 'rail':
        if (layer === 'back') out.push(`<line x1="${e.x}" x2="${e.x}" y1="8" y2="${F}" stroke="${C.equipLine}" stroke-width="3" opacity=".55"/>`
          + `<line x1="${e.x - 10}" x2="${e.x + 10}" y1="8" y2="8" stroke="${C.equipLine}" stroke-width="3" opacity=".55"/>`);
        break;
      case 'bench':
        if (layer === 'back') out.push(`<rect x="${e.x1}" y="${e.y}" width="${e.x2 - e.x1}" height="8" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<line x1="${e.x1 + 8}" x2="${e.x1 + 8}" y1="${e.y + 8}" y2="${F}" stroke="${C.equipLine}" stroke-width="4"/>`
          + `<line x1="${e.x2 - 8}" x2="${e.x2 - 8}" y1="${e.y + 8}" y2="${F}" stroke="${C.equipLine}" stroke-width="4"/>`);
        break;
      case 'seat':
        if (layer === 'back') out.push(`<rect x="${e.x1}" y="${e.y}" width="${e.x2 - e.x1}" height="8" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<line x1="${(e.x1 + e.x2) / 2}" x2="${(e.x1 + e.x2) / 2}" y1="${e.y + 8}" y2="${F}" stroke="${C.equipLine}" stroke-width="5"/>`);
        break;
      case 'chair':
        if (layer === 'back') out.push(`<rect x="${e.x1}" y="${e.y}" width="${e.x2 - e.x1}" height="8" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<rect x="${e.backX - 8}" y="${e.backTop}" width="8" height="${e.y - e.backTop + 8}" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<line x1="${(e.x1 + e.x2) / 2}" x2="${(e.x1 + e.x2) / 2}" y1="${e.y + 8}" y2="${F}" stroke="${C.equipLine}" stroke-width="5"/>`);
        break;
      case 'incline': {
        if (layer !== 'back') break;
        const [x1, x2, y] = e.seat;
        out.push(`<line x1="${e.a[0]}" y1="${e.a[1]}" x2="${e.b[0]}" y2="${e.b[1]}" stroke="${C.equip}" stroke-width="9" stroke-linecap="round"/>`
          + `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="8" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<line x1="${x1 + 6}" x2="${x1 + 6}" y1="${y + 8}" y2="${F}" stroke="${C.equipLine}" stroke-width="4"/>`
          + `<line x1="${e.b[0] + 14}" y1="${e.b[1] + 14}" x2="${e.b[0] + 14}" y2="${F}" stroke="${C.equipLine}" stroke-width="4"/>`);
        break;
      }
      case 'pad':
        if (layer === 'front') out.push(`<circle cx="${e.at[0]}" cy="${e.at[1]}" r="${e.r}" fill="${C.equip}" stroke="${C.equipLine}"/>`
          + `<line x1="${e.at[0] + 8}" x2="${e.at[0] + 30}" y1="${e.at[1]}" y2="${e.at[1]}" stroke="${C.equipLine}" stroke-width="3"/>`);
        break;
      case 'plate':
        if (layer === 'back') out.push(`<rect x="${e.x}" y="${e.y1}" width="5" height="${e.y2 - e.y1}" fill="${C.equip}" stroke="${C.equipLine}"/>`);
        break;
      case 'box':
        if (layer === 'back') out.push(`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="2" fill="${C.equip}" stroke="${C.equipLine}"/>`);
        break;
      case 'wedge':
        if (layer === 'back') out.push(`<path d="M${e.x} ${e.y} L${e.x} ${e.y - e.h} L${e.x + e.w} ${e.y} Z" fill="${C.equip}" stroke="${C.equipLine}"/>`);
        break;
      case 'mat':
        if (layer === 'back') out.push(`<rect x="${e.x1}" y="${F - 4}" width="${e.x2 - e.x1}" height="4" rx="2" fill="#30353c"/>`);
        break;
      case 'pullbar':
        if (layer === 'back') out.push(`<line x1="${e.at[0]}" y1="${e.at[1]}" x2="${e.to}" y2="${e.at[1]}" stroke="${C.equipLine}" stroke-width="4"/>`
          + `<line x1="${e.to}" y1="${e.at[1]}" x2="${e.to}" y2="${F}" stroke="${C.equipLine}" stroke-width="6"/>`);
        if (layer === 'front') out.push(`<circle cx="${e.at[0]}" cy="${e.at[1]}" r="4" fill="#d0d5db"/>`);
        break;
      case 'barbell': {
        const p = P(e.at);
        if (layer === 'back') out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${e.r || 14}" fill="${C.plate}" stroke="${C.equipLine}" stroke-width="2"/>`);
        else out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.5" fill="#d0d5db"/>`);
        break;
      }
      case 'lbar': {
        const p = P(e.at);
        if (layer === 'front') out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.5" fill="#d0d5db"/>`);
        break;
      }
      case 'dumbbell': {
        if (layer !== 'front') break;
        const p = P(e.at);
        if (e.mode === 'end') {
          out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="7" fill="${C.plate}" stroke="#d0d5db" stroke-width="1.5"/><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2" fill="#d0d5db"/>`);
        } else {
          const arm = J.arms[0];
          const rot = e.rot !== undefined ? e.rot : angOf(arm.el, arm.hand) + 90;
          out.push(`<g transform="translate(${f1(p[0])} ${f1(p[1])}) rotate(${f1(rot)})"><line x1="-9" x2="9" y1="0" y2="0" stroke="#d0d5db" stroke-width="3"/>`
            + `<rect x="-14" y="-6" width="6" height="12" rx="1.5" fill="${C.plate}" stroke="#d0d5db"/><rect x="8" y="-6" width="6" height="12" rx="1.5" fill="${C.plate}" stroke="#d0d5db"/></g>`);
        }
        break;
      }
      case 'handle': {
        const p = P(e.at);
        if (layer === 'front') out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="5" fill="none" stroke="#d0d5db" stroke-width="2"/>`);
        break;
      }
      case 'rope': {
        const p = P(e.at);
        if (layer === 'front') out.push(`<path d="M${f1(p[0] - 3)} ${f1(p[1] - 3)} q4 5 1 11 M${f1(p[0] + 3)} ${f1(p[1] - 3)} q4 5 1 11" stroke="#e6c79c" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
        break;
      }
      case 'strap': {
        const p = P(e.at);
        if (layer === 'front') out.push(`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="5.5" fill="none" stroke="#d0d5db" stroke-width="2.5"/>`);
        break;
      }
      case 'bike': {
        if (layer === 'back') {
          const { saddle: s, crank: c, bar: b } = e;
          out.push(`<circle cx="${c[0] + 34}" cy="${c[1] + 4}" r="20" fill="none" stroke="${C.equipLine}" stroke-width="4"/>`
            + `<path d="M${s[0]} ${s[1] + 4} L${c[0]} ${c[1]} L${c[0] + 34} ${c[1] + 4} L${b[0] - 2} ${b[1] + 6} M${s[0] + 2} ${s[1] + 4} L${b[0] - 6} ${b[1] + 12}" stroke="${C.equipLine}" stroke-width="4" fill="none" stroke-linecap="round"/>`
            + `<line x1="${c[0] - 30}" x2="${c[0] + 64}" y1="${F - 2}" y2="${F - 2}" stroke="${C.equipLine}" stroke-width="5" stroke-linecap="round"/>`
            + `<line x1="${c[0]}" y1="${c[1]}" x2="${c[0] - 8}" y2="${F - 2}" stroke="${C.equipLine}" stroke-width="4"/>`
            + `<rect x="${s[0] - 12}" y="${s[1] - 1}" width="22" height="6" rx="3" fill="${C.equip}" stroke="${C.equipLine}"/>`
            + `<line x1="${b[0] - 4}" y1="${b[1]}" x2="${b[0] + 6}" y2="${b[1]}" stroke="#d0d5db" stroke-width="4" stroke-linecap="round"/>`
            + `<circle cx="${c[0]}" cy="${c[1]}" r="16" fill="none" stroke="${C.equipLine}" stroke-dasharray="3 3"/>`);
        }
        break;
      }
    }
  }
  return out.join('');
}

/* ---------- Pfeile ---------- */

function drawArrows(fig, JA, JB, id) {
  return (fig.arrows || []).map((a) => {
    let p1 = add(getPt(JA, a.from), a.off || [0, 0]);
    let p2 = add(getPt(JB, a.from), a.off || [0, 0]);
    if (a.reverse) [p1, p2] = [p2, p1];
    const d = dist(p1, p2) || 1;
    const u = [(p2[0] - p1[0]) / d, (p2[1] - p1[1]) / d];
    const n = [-u[1], u[0]];
    const s = add(p1, mul(u, 3)), e = add(p2, mul(u, -5));
    const c = add(lerpP(s, e, 0.5), mul(n, a.bend || 0));
    const path = `M${f1(s[0])} ${f1(s[1])} Q${f1(c[0])} ${f1(c[1])} ${f1(e[0])} ${f1(e[1])}`;
    const dbl = a.reverse ? '' : '';
    return `<path d="${path}" stroke="#1f2226" stroke-width="6" fill="none" stroke-linecap="round"/>`
      + `<path d="${path}" stroke="${C.arrow}" stroke-width="2.6" fill="none" stroke-linecap="round" marker-end="url(#ah-${id})"${dbl}/>`;
  }).join('');
}

let figCounter = 0;

/**
 * Rendert die Übungsgrafik.
 * @param {object} fig  Figur-Spezifikation
 * @param {number} t    0 = Ausgangsposition, 1 = Endposition (Zwischenwerte für Animation)
 * @param {object} opts {ghost:boolean, arrows:boolean, mirrorPose?:number}
 */
export function renderFigure(fig, t = 0, opts = {}) {
  const { ghost = true, arrows = true, small = false } = opts;
  const id = 'f' + (++figCounter);
  const pose = lerpPose(fig.startPose, fig.endPose, t);
  const J = solve(pose, fig.view);
  const JA = solve(fig.startPose, fig.view);
  const JB = solve(fig.endPose, fig.view);
  const ghostPose = t < 0.5 ? JB : JA;
  const armsBehind = fig.armsBehind === 'start' ? t < 0.5 : !!fig.armsBehind;
  const eq = fig.equipment || [];
  return `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" class="fig" role="img">
<defs><marker id="ah-${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="${small ? 3 : 4}" markerHeight="${small ? 3 : 4}" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.arrow}"/></marker></defs>
<line x1="4" x2="236" y1="188" y2="188" stroke="${C.floor}" stroke-width="2"/>
${drawEquip(eq, J, 'back')}
${ghost ? drawBody(ghostPose, fig.highlight, 'ghost', fig.armsBehind === 'start' ? t >= 0.5 : !!fig.armsBehind) : ''}
${drawBody(J, fig.highlight, 'full', armsBehind)}
${drawEquip(eq, J, 'front')}
${arrows ? drawArrows(fig, JA, JB, id) : ''}
</svg>`;
}

/* ---------- Muskelkarte (Vorder- und Rückansicht) ---------- */

const REG = {
  front: {
    head: '<circle cx="40" cy="12" r="8"/>',
    neck: '<rect x="36" y="18" width="8" height="6" rx="2"/>',
    hands: '<circle cx="14" cy="80" r="3.2"/><circle cx="66" cy="80" r="3.2"/>',
    knees: '<ellipse cx="33" cy="118" rx="4.5" ry="4"/><ellipse cx="47" cy="118" rx="4.5" ry="4"/>',
    shins: '<path d="M29 123 L36 123 L35 150 L31 150 Z"/><path d="M51 123 L44 123 L45 150 L49 150 Z"/>',
    feet: '<ellipse cx="32" cy="155" rx="4" ry="3"/><ellipse cx="48" cy="155" rx="4" ry="3"/>',
    traps: '<path d="M30 25 L36 22 L36 28 Z"/><path d="M50 25 L44 22 L44 28 Z"/>',
    frontDelt: '<ellipse cx="25" cy="31" rx="5" ry="6"/><ellipse cx="55" cy="31" rx="5" ry="6"/>',
    sideDelt: '<ellipse cx="20.5" cy="33" rx="3" ry="6"/><ellipse cx="59.5" cy="33" rx="3" ry="6"/>',
    chest: '<path d="M39 28 Q30 27 28 33 Q29 42 39 41 Z"/><path d="M41 28 Q50 27 52 33 Q51 42 41 41 Z"/>',
    biceps: '<ellipse cx="20" cy="47" rx="4" ry="8" transform="rotate(10 20 47)"/><ellipse cx="60" cy="47" rx="4" ry="8" transform="rotate(-10 60 47)"/>',
    forearms: '<ellipse cx="16" cy="66" rx="3.5" ry="9" transform="rotate(12 16 66)"/><ellipse cx="64" cy="66" rx="3.5" ry="9" transform="rotate(-12 64 66)"/>',
    abs: '<rect x="34.5" y="44" width="11" height="30" rx="4"/>',
    obliques: '<path d="M29 44 L33.5 45 L33.5 72 L30 74 Q28 60 29 44 Z"/><path d="M51 44 L46.5 45 L46.5 72 L50 74 Q52 60 51 44 Z"/>',
    hipflex: '<ellipse cx="34" cy="80" rx="3" ry="5" transform="rotate(-25 34 80)"/><ellipse cx="46" cy="80" rx="3" ry="5" transform="rotate(25 46 80)"/>',
    quads: '<ellipse cx="32" cy="98" rx="6" ry="16"/><ellipse cx="48" cy="98" rx="6" ry="16"/>',
    adductors: '<path d="M37.5 85 L39.5 86 L38.5 108 L36.5 104 Z"/><path d="M42.5 85 L40.5 86 L41.5 108 L43.5 104 Z"/>',
    calves: '<ellipse cx="29" cy="134" rx="2.6" ry="10"/><ellipse cx="51" cy="134" rx="2.6" ry="10"/>'
  },
  back: {
    head: '<circle cx="40" cy="12" r="8"/>',
    neck: '<rect x="36" y="18" width="8" height="6" rx="2"/>',
    hands: '<circle cx="14" cy="80" r="3.2"/><circle cx="66" cy="80" r="3.2"/>',
    knees: '<ellipse cx="33" cy="118" rx="4.5" ry="4"/><ellipse cx="47" cy="118" rx="4.5" ry="4"/>',
    feet: '<ellipse cx="32" cy="155" rx="4" ry="3"/><ellipse cx="48" cy="155" rx="4" ry="3"/>',
    traps: '<path d="M40 21 L28 28 L40 50 L52 28 Z"/>',
    rearDelt: '<ellipse cx="24" cy="31" rx="5.5" ry="6"/><ellipse cx="56" cy="31" rx="5.5" ry="6"/>',
    triceps: '<ellipse cx="20" cy="47" rx="4" ry="8" transform="rotate(10 20 47)"/><ellipse cx="60" cy="47" rx="4" ry="8" transform="rotate(-10 60 47)"/>',
    forearms: '<ellipse cx="16" cy="66" rx="3.5" ry="9" transform="rotate(12 16 66)"/><ellipse cx="64" cy="66" rx="3.5" ry="9" transform="rotate(-12 64 66)"/>',
    upperBack: '<ellipse cx="34" cy="37" rx="3.5" ry="7"/><ellipse cx="46" cy="37" rx="3.5" ry="7"/>',
    lats: '<path d="M30 33 L26 38 Q28 56 36 66 L38 52 Z"/><path d="M50 33 L54 38 Q52 56 44 66 L42 52 Z"/>',
    lowerBack: '<rect x="35" y="56" width="10" height="16" rx="3"/>',
    glutes: '<ellipse cx="33.5" cy="82" rx="7" ry="8"/><ellipse cx="46.5" cy="82" rx="7" ry="8"/>',
    hamstrings: '<ellipse cx="33" cy="101" rx="5.5" ry="13"/><ellipse cx="47" cy="101" rx="5.5" ry="13"/>',
    calves: '<ellipse cx="31.5" cy="132" rx="4.5" ry="11"/><ellipse cx="48.5" cy="132" rx="4.5" ry="11"/>',
    shins: '<rect x="30" y="143" width="4" height="9" rx="2"/><rect x="46" y="143" width="4" height="9" rx="2"/>'
  }
};
const NEUTRAL = ['head', 'neck', 'hands', 'knees', 'shins', 'feet'];

export function renderMuscleMap(primary = [], secondary = []) {
  const view = (name, dx) => {
    const parts = Object.entries(REG[name]).map(([k, svg]) => {
      let fill = '#4a5059';
      if (NEUTRAL.includes(k)) fill = '#3a3f46';
      if (secondary.includes(k)) fill = '#9a5a2c';
      if (primary.includes(k)) fill = '#ff7a1a';
      return `<g fill="${fill}">${svg}</g>`;
    }).join('');
    return `<g transform="translate(${dx} 4)">${parts}<text x="40" y="170" text-anchor="middle" font-size="9" fill="#9aa3ad">${name === 'front' ? 'vorn' : 'hinten'}</text></g>`;
  };
  return `<svg viewBox="0 0 180 178" xmlns="http://www.w3.org/2000/svg" class="mmap" role="img" aria-label="Muskelkarte">${view('front', 6)}${view('back', 94)}</svg>`;
}
