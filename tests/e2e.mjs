// Ende-zu-Ende-Test des Ablaufs aus Abschnitt 12 (Playwright, Chromium, Android-Viewport).
// Aufruf: node tests/e2e.mjs [BASE_URL]  (Standard: http://localhost:8080/30min-gym/)
// Voraussetzung: npm i -D playwright && npx playwright install chromium
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:8080/30min-gym/';
const OUT = process.env.OUT_DIR || path.resolve('test-output');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, cond, info = '') => {
  results.push({ name, ok: !!cond, info });
  console.log(`${cond ? '✔' : '✘'} ${name}${info ? ' – ' + info : ''}`);
};
const device = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true };

const browser = await chromium.launch();
const errors = [];

async function newPage(ctx) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return p;
}
const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });

/* ---------- 1–5: Training durchführen und exportieren ---------- */
const ctxA = await browser.newContext(device);
const a = await newPage(ctxA);
await a.goto(BASE + '#heute');
await a.click('.chip[data-day=mo]');
await shot(a, '01-heute');
await a.click('[data-act=start]');                                               // 1. Training starten
check('Training gestartet', await a.locator('#sessBar').isVisible());

const plan = {
  latziehen: [[40, 12], [40, 12], [40, 12]],
  kabelrudern: [[50, 10], [50, 9], [50, 8]],
  reverseflys: [[7.5, 15], [7.5, 14]],
  bizepscurls: [[12, 12], [12, 10]]
};
const cards = a.locator('section.ex');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  const card = cards.nth(i);
  const name = await card.locator('h3').innerText();
  const key = Object.keys(plan).find((k) => name.toLowerCase().replace(/[^a-z]/g, '').startsWith(k.slice(0, 6)));
  const sets = plan[key];
  for (let j = 0; j < sets.length; j++) {
    const row = a.locator('section.ex').nth(i).locator(`.set-row[data-i="${j}"]`);
    await row.locator('[data-f=weight]').fill(String(sets[j][0]));             // 2. Gewicht
    await row.locator('[data-f=reps]').fill(String(sets[j][1]));               //    Wiederholungen
    if (j === 0) await row.locator('[data-f=rir]').selectOption('2');
    await row.locator('[data-act=set]').click();                              // 3. Satz abhaken
    if (i === 0 && j === 0) check('Pausentimer startet nach Satz', await a.locator('#restbar').isVisible());
  }
}
await a.evaluate(() => window.scrollTo(0, 0));
await shot(a, '02-training');
const prog = await a.locator('#progTxt').innerText();
check('Alle Sätze abgehakt', prog.startsWith('10 / 10'), prog);
check('Pausenleiste nach letztem Satz beendet', await a.locator('#restbar').isHidden());
await a.fill('#notes', 'Testlauf – gute Tagesform');
await a.click('[data-act=finish]');                                             // 4. abschließen
await shot(a, '03-abschluss');
await a.click('#finGo');
check('Zusammenfassung angezeigt', await a.locator('text=Geschafft').isVisible());
await shot(a, '04-zusammenfassung');

const [dlJson] = await Promise.all([a.waitForEvent('download'), a.click('[data-act=json]')]);   // 5. JSON
const jsonPath = path.join(OUT, dlJson.suggestedFilename());
await dlJson.saveAs(jsonPath);
check('JSON-Dateiname', /^30MIN_GYM_\d{4}-\d{2}-\d{2}\.json$/.test(dlJson.suggestedFilename()), dlJson.suggestedFilename());
const [dlPdf] = await Promise.all([a.waitForEvent('download'), a.click('[data-act=pdf]')]);
const pdfPath = path.join(OUT, dlPdf.suggestedFilename());
await dlPdf.saveAs(pdfPath);
const pdfBytes = fs.readFileSync(pdfPath);
check('PDF erzeugt', pdfBytes.slice(0, 5).toString() === '%PDF-' && pdfBytes.length > 2000, `${pdfBytes.length} Bytes`);

const exported = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const original = exported.sessions[0];
check('JSON enthält Historie, Plan, Einstellungen', exported.sessions.length === 1 && exported.plan && exported.settings && exported.currentSession?.id === original.id);

/* ---------- 6–8: Getrennte, leere Umgebung → Import ---------- */
const ctxB = await browser.newContext(device);                                  // 6. Browserdaten leer
const b = await newPage(ctxB);
await b.goto(BASE + '#protokolle');
check('Neue Umgebung ist leer', (await b.evaluate(() => window.__app.state.sessions.length)) === 0);

async function importFile(page, file) {
  await page.click('[data-act=import]');
  await page.setInputFiles('#fileImport', file);
}
await importFile(b, { name: 'kaputt.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"30MIN_GYM", kaputt') });
check('Beschädigte Datei wird gemeldet', await b.locator('text=Import nicht möglich').isVisible());
await shot(b, '05-importfehler');
await b.click('.sheet-actions .btn');
await b.waitForTimeout(250);

await importFile(b, jsonPath);                                                  // 7. erneut hochladen
await b.locator('text=Import-Vorschau').waitFor();
await shot(b, '06-importvorschau');
check('Vorschau zeigt 1 neue Einheit', await b.locator('.kv:has-text("Neu") b').innerText() === '1');
await b.click('#impGo');
await b.locator('text=Auswertung').first().waitFor();
await shot(b, '07-auswertung');

const restored = await b.evaluate(() => window.__app.state);                   // 8. Vollständigkeit prüfen
const strip = (s) => JSON.stringify(s.exercises.map((e) => ({ exId: e.exId, sets: e.sets.map((x) => [x.weight, x.reps, x.rir, x.done, x.ts]) })));
check('Einheit vollständig wiederhergestellt', restored.sessions.length === 1 && strip(restored.sessions[0]) === strip(original));
check('Notizen/Status/Dauer erhalten', restored.sessions[0].notes === original.notes && restored.sessions[0].status === 'completed' && restored.sessions[0].durationSec === original.durationSec);
check('Plan übernommen', JSON.stringify(restored.plan) === JSON.stringify(exported.plan));

// Doppelter Import erzeugt keine Duplikate
await b.click('.sheet-actions .btn'); await b.waitForTimeout(250);
await b.click('.nav [data-tab=protokolle]');
await importFile(b, jsonPath);
await b.locator('text=Import-Vorschau').waitFor();
check('Duplikat erkannt', await b.locator('.kv:has-text("Bereits vorhanden") b').innerText() === '1');
await b.click('#impGo'); await b.waitForTimeout(250);
check('Keine Duplikate nach erneutem Import', (await b.evaluate(() => window.__app.state.sessions.length)) === 1);
await b.click('.sheet-actions .btn'); await b.waitForTimeout(250);

/* ---------- 9–10: Nächstes Training mit Vorschlägen ---------- */
await b.click('.nav [data-tab=heute]');
await b.click('.chip[data-day=mo]');
await shot(b, '08-heute-mit-vorschlag');
await b.click('[data-act=start]');                                              // 9. nächstes Training
const lat = b.locator('section.ex').first();
const recTxt = await lat.locator('.rec').innerText();
check('Vorschlag Latziehen 42,5 kg', recTxt.includes('42,5 kg testen') && recTxt.includes('Obere Wiederholungsgrenze'), recTxt.replace(/\n/g, ' | '));
check('Letztes Gewicht vorbelegt (40 kg)', await lat.locator('.set-row[data-i="0"] [data-f=weight]').inputValue() === '40');
const rowRec = await b.locator('section.ex').nth(1).locator('.rec').innerText();
check('Kabelrudern: Gewicht halten', rowRec.includes('Gewicht halten'), rowRec.replace(/\n/g, ' | '));
await shot(b, '09-vorschlag');
await lat.locator('[data-act=accept]').click();                                 // Steigerung bestätigen
await b.locator('.sheet-actions .btn.primary').click();
await b.waitForTimeout(200);
check('Steigerung nach Bestätigung übernommen', await b.locator('section.ex').first().locator('.set-row[data-i="0"] [data-f=weight]').inputValue() === '42.5');

// Unterbrechung: Neuladen setzt Training fort
await b.locator('section.ex').first().locator('.set-row[data-i="0"] [data-f=reps]').fill('9');
await b.locator('section.ex').first().locator('.set-row[data-i="0"] [data-act=set]').click();
await b.reload();
check('Unterbrochenes Training wird fortgesetzt', await b.locator('#sessBar').isVisible() && (await b.locator('#progTxt').innerText()).startsWith('1 /'));

// Teilweise Einheit speichern
await b.click('[data-act=finish]');
check('Hinweis auf offene Sätze', await b.locator('text=teilweise absolviert').first().isVisible());
await b.click('#finGo');
const st2 = await b.evaluate(() => window.__app.state);
check('Teilweise Einheit gespeichert', st2.sessions.length === 2 && st2.sessions[1].status === 'partial');
await b.click('[data-act=close]');

// Weitere Ansichten rendern ohne Fehler
for (const tab of ['uebungen', 'fortschritt', 'protokolle']) {
  await b.click(`.nav [data-tab=${tab}]`);
  await b.waitForTimeout(200);
  await shot(b, `10-${tab}`);
}
await b.click('.nav [data-tab=uebungen]');
await b.click('[data-info=kniebeugen]');
await b.waitForTimeout(250);
await shot(b, '11-uebungsinfo');
await b.click('.seg [data-fm=anim]'); await b.waitForTimeout(900);
check('Bewegungsanimation läuft', await b.locator('[data-fig] svg').count() === 1);
await b.click('.sheet .close'); await b.waitForTimeout(250);
await b.click('[data-edit=mo]'); await b.waitForTimeout(250);
await b.click('.ed-item[data-i="1"] [data-mv="-1"]');
await b.click('.sheet-actions .btn.primary'); await b.waitForTimeout(200);
check('Reihenfolge im Plan bearbeitbar', (await b.evaluate(() => window.__app.state.plan.days.mo.items[0].exId)) === 'kabelrudern');

await b.click('.nav [data-tab=fortschritt]');
await b.locator('.chart-svg circle[data-tip]').first().click();
check('Diagramm interaktiv', !(await b.locator('.chart-tip').nth(1).innerText()).includes('antippen'));

// Offline (Service Worker)
await b.goto(BASE + '#heute'); await b.waitForTimeout(800);
await ctxB.setOffline(true);
await b.reload();
check('Offline lauffähig (PWA)', await b.locator('.nav').isVisible());
await ctxB.setOffline(false);

check('Keine JavaScript-Fehler', errors.length === 0, errors.join(' | '));
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden`);
process.exit(failed.length ? 1 : 0);
