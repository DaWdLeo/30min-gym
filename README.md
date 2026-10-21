# 30MIN GYM

Mobiloptimierte Web-App für tägliches 30-Minuten-Krafttraining – als offlinefähige PWA, **ohne Backend, ohne Konto, ohne Tracking**.

**Live:** https://dawdleo.github.io/30min-gym/

- Wochenplan (Pull/Push/Legs + Regeneration) als editierbare Vorlage
- Sätze mit Gewicht, Wiederholungen und RIR erfassen und abhaken, 30-Minuten-Timer, einstellbarer Pausentimer
- Nach dem Training: **JSON-Protokoll** (vollständiger, portabler Datenstand) und **PDF-Protokoll**, beide direkt im Browser erzeugt
- „Letztes Trainingsprotokoll laden“: Prüfung, Vorschau, Import ohne Duplikate, Gewichtsvorschläge und Steigerungsempfehlung (Bestätigung durch Nutzer)
- Übungsanleitungen mit selbst erzeugten SVG-Grafiken (Start-/Endposition, Bewegungspfeile, Muskelkarte, Animation)
- Statistiken über 4/8/12 Wochen: Gewichte, Wiederholungen, Volumen, Trainingshäufigkeit, Bestleistungen, Trend (verbessert/stagniert/verschlechtert)

## Ordnerstruktur

```
30min-gym/
├── app/                      ← die komplette Web-App (wird veröffentlicht)
│   ├── index.html
│   ├── manifest.webmanifest  ← PWA-Manifest (relative Pfade)
│   ├── sw.js                 ← Service Worker (Offline-Cache)
│   ├── .nojekyll
│   ├── css/app.css
│   ├── icons/                ← App-Icons (SVG + PNG)
│   └── js/
│       ├── main.js           ← Start, Navigation, Timer
│       ├── core/             ← Logik & Daten (ohne DOM)
│       │   ├── defaults.js   ← Standardplan & Einstellungen
│       │   ├── exercises.js  ← Übungsbibliothek, Texte, Posen
│       │   ├── training.js   ← Einheiten, Empfehlungen, Bestleistungen, Statistik
│       │   ├── protocol.js   ← JSON-Export/-Import, Validierung, Zusammenführung
│       │   ├── pdf.js        ← PDF-Erzeugung ohne Bibliothek
│       │   ├── store.js      ← lokale Speicherung (localStorage)
│       │   └── util.js
│       └── ui/               ← Oberfläche
│           ├── figures.js    ← SVG-Figuren (Kinematik) & Muskelkarte
│           ├── charts.js     ← SVG-Diagramme
│           ├── actions.js    ← Übungsinfo, Downloads, Import-Ablauf
│           ├── dom.js
│           └── views/        ← heute · uebungen · fortschritt · protokolle
├── .github/workflows/pages.yml  ← automatische Veröffentlichung auf GitHub Pages
├── docker/nginx.conf, Dockerfile, docker-compose.yml
├── tests/e2e.mjs             ← Ende-zu-Ende-Test (Playwright)
└── .gitignore                ← verhindert, dass Trainingsdaten ins Repo gelangen
```

Trennung: `core/` enthält Trainingslogik und Datenhaltung ohne Oberflächenbezug, `ui/` nur Darstellung.
Keine externen Skripte, Schriften, Bilder oder CDNs – alles liegt im Repository.

## Veröffentlichung über GitHub Pages

Einmalige Einrichtung:

1. Auf GitHub das Repository **`DaWdLeo/30min-gym`** anlegen (öffentlich).
2. Projekt hochladen:
   ```bash
   cd 30min-gym
   git init -b main
   git add .
   git commit -m "30MIN GYM 1.0.0"
   git remote add origin https://github.com/DaWdLeo/30min-gym.git
   git push -u origin main
   ```
3. Im Repository: **Settings → Pages → Build and deployment → Source: „GitHub Actions“** wählen.
4. Unter **Actions** läuft der Workflow „GitHub Pages“ (bei jedem Push auf `main`, oder manuell über „Run workflow“). Nach ca. 1 Minute ist die App erreichbar unter
   **https://dawdleo.github.io/30min-gym/**

Warum das funktioniert: Alle Pfade in `index.html`, `manifest.webmanifest` und `sw.js` sind relativ (`./…`). Die App läuft daher unverändert unter `/30min-gym/`, unter `/` oder in jedem anderen Unterordner. Der Workflow veröffentlicht nur den Ordner `app/`.

**Keine Trainingsdaten im Repository:** Trainingsdaten liegen ausschließlich im Browser des Smartphones und in den Dateien, die du selbst herunterlädst. `.gitignore` schließt `30MIN_GYM_*.json` und PDFs aus, und der Workflow bricht ab, falls im Ordner `app/` doch ein Protokoll liegt. Heruntergeladene Protokolle also nicht in den Projektordner legen.

**Updates:** Änderungen pushen → neue Version wird automatisch veröffentlicht. Bei größeren Änderungen `VERSION` in `app/sw.js` erhöhen, damit der Offline-Cache sicher erneuert wird.

## Auf dem Android-Smartphone installieren

1. https://dawdleo.github.io/30min-gym/ in Chrome öffnen.
2. Menü ⋮ → **„App installieren“** bzw. „Zum Startbildschirm hinzufügen“.
3. Die App startet danach im Vollbild und funktioniert auch ohne Internet.

## Datensicherung & Gerätewechsel

- Daten werden automatisch lokal im Browser gespeichert (auch laufende Trainings – nach Neustart einfach fortsetzen).
- Nach jedem Training **JSON-Protokoll herunterladen**. Diese Datei enthält die **gesamte** Historie, den Plan und die Einstellungen.
- Neues Gerät / anderer Browser / gelöschte Browserdaten: **Protokolle → „Letztes Trainingsprotokoll laden“** → neueste JSON-Datei wählen. Vor dem Import wird eine Vorschau angezeigt; vorhandene Einheiten werden nie überschrieben, Duplikate anhand eindeutiger IDs erkannt.

Hinweis: Wird die Website-Datenspeicherung im Browser gelöscht, sind die lokalen Daten weg – die JSON-Datei ist die Sicherung.

## Self-Hosting mit Docker (Ubuntu)

```bash
cd 30min-gym
docker compose up -d --build
```
Danach erreichbar unter `http://<server-ip>:8080/30min-gym/`.

Ohne Compose: `docker build -t 30min-gym . && docker run -d -p 8080:80 --restart unless-stopped 30min-gym`

Hinweis: Service Worker und App-Installation erfordern HTTPS (Ausnahme: `localhost`). Im Heimnetz daher hinter einen Reverse-Proxy mit Zertifikat stellen (z. B. Nginx Proxy Manager, Traefik, Caddy) – oder einfach die GitHub-Pages-Adresse verwenden, die bereits HTTPS hat.

## Einbindung in Homarr (iFrame)

1. In Homarr ein **iFrame-Widget** hinzufügen.
2. URL: `https://dawdleo.github.io/30min-gym/` (oder die eigene Docker-Adresse).

Die App setzt keine `X-Frame-Options` und passt sich der Widgetgröße an. Zu beachten:
- Browser speichern Daten in einem iFrame meist **getrennt** von der direkt geöffneten App (Speicherpartitionierung). Im iFrame erscheint unter „Protokolle“ deshalb der Link „App in eigenem Tab öffnen“.
- Downloads können je nach Browser/Widget-Einstellungen im iFrame blockiert sein – dann die App im eigenen Tab öffnen.

## Trainingslogik

- **Vorschlag:** Das zuletzt verwendete Arbeitsgewicht jeder Übung wird automatisch vorbelegt.
- **Steigerung (Double Progression):** Wurden in allen vorgesehenen Sätzen die obere Wiederholungsgrenze erreicht → Empfehlung „+2,5 kg testen“ (Steigerung pro Übung im Plan einstellbar). Erst nach Bestätigung werden die Gewichte geändert.
- Obere Grenze nicht erreicht, Sätze ausgelassen oder untere Grenze unterschritten → „Gewicht beibehalten“ mit Begründung.
- **Bestleistungen:** höchstes Gewicht, geschätztes 1RM (Epley), höchstes Volumen je Übung.
- **Trend:** lineare Regression des geschätzten 1RM im Zeitraum; > +2 % verbessert, < −2 % verschlechtert, sonst stagniert.

## JSON-Format (Schema 1)

```json
{
  "format": "30MIN_GYM",
  "schemaVersion": 1,
  "exportedAt": "2026-10-21T17:40:00.000Z",
  "currentSessionId": "…",
  "currentSession": { … },
  "settings": { "sessionMinutes": 30, "restSeconds": 90, "weightStep": 2.5, … },
  "plan": { "days": { "mo": { "name": "Pull A", "items": [ { "exId": "latziehen", "sets": 3, "repMin": 8, "repMax": 12 } ] } } },
  "sessions": [
    { "id": "…", "name": "Pull A", "startedAt": "…", "endedAt": "…", "durationSec": 1712, "status": "completed",
      "notes": "", "exercises": [ { "exId": "latziehen", "name": "Latziehen", "repMin": 8, "repMax": 12,
        "sets": [ { "n": 1, "weight": 40, "reps": 12, "rir": 2, "done": true, "ts": "…" } ] } ] }
  ]
}
```

## Lokal entwickeln & testen

```bash
python3 -m http.server 8080          # im Projektordner, dann http://localhost:8080/app/ öffnen
npm install && npx playwright install chromium
npm run test:e2e                     # testet den kompletten Ablauf (Training → Export → leerer Browser → Import → Vorschläge)
```

Der Test prüft u. a.: Sätze erfassen/abhaken, Pausentimer, Abschluss, JSON- und PDF-Download, Fehlermeldung bei beschädigter Datei, vollständige Wiederherstellung in einem leeren Browserprofil, Duplikaterkennung, Gewichtsvorschlag 40 kg → 42,5 kg mit Bestätigung, Fortsetzen nach Neuladen, teilweise Einheiten, Planbearbeitung, Diagramme und Offlinebetrieb.

## Lizenz

MIT – siehe `LICENSE`.
