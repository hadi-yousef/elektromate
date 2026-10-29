# Neue Website ElektroMate Pro (Zweig `website-neu`)

Stand 29.10.2026. Gebaut von Claude Opus 5.5 nach `docs/plans/w1-website-20261029.md` (Wunsch Nr. 236).

**Nicht veröffentlicht.** Veröffentlichen heißt: `website-neu` nach `main` zusammenführen und `main` auf `origin` pushen. Das geht nur nach Kaisers OK. Bis dahin bleibt die alte Seite online.

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Start: Kopf, Hero mit Stromkreis, Lernpfad, Lektionen, Werkstatt, Laden, Datenschutz-Satz, Fuß |
| `android.html` | Android-Download, „in Vorbereitung“. Felder für Version, Datum, Größe, SHA-256. Anleitung „Unbekannte Apps erlauben“ |
| `datenschutz.html` | Wortlaut und Adresse unverändert (Stand 12.10.2026), nur neues Aussehen |
| `support.html` | Wortlaut und Adresse unverändert, nur neues Aussehen |
| `impressum.html` | Aufbau nach ECG und MedienG, Angaben fehlen (siehe unten) |
| `style.css` | gemeinsames Aussehen: hell = Richtung A, dunkel = Richtung B, folgt der Systemeinstellung |
| `bilder/` | echte App-Bildschirme aus `docs/design/bilder/`, verkleinert auf 280 und 440 px Breite |
| `favicon.png`, `apple-touch-icon.png` | aus dem echten App-Icon (`AppIcon.png` im iPhone-Repo) |
| `_config.yml` | hält `docs/`, `LIESMICH.md`, `AGENTS.md` und `INDEX.md` aus der öffentlichen Seite heraus |

## Alle Texte sind Entwürfe

Bis Kaiser sie freigibt, gelten alle Texte auf Startseite, Android-Seite und Impressum als Entwurf. Auf der Seite selbst steht das absichtlich nicht.

- Startseite: Texte aus dem Entwurf `docs/design/w1-start-entwuerfe.html` (Claude).
- Neu dazu (Opus):
  - der Abschnitt „So kommst du zur App“. Er ist das Ziel von „Laden“ und „iPhone · im Test“, damit jeder Knopf etwas öffnet.
  - die Kapitelliste mit den echten Namen und Themenzahlen aus `learning-catalog.json` (iPhone-Repo, Zweig `codex/app-completion`): 6 · 7 · 7 · 9 · 4 · 4 = 37 Themen.
  - alle Texte der Android-Seite.
- Datenschutz und Support: Inhalt per Skript Zeichen für Zeichen aus der veröffentlichten Fassung übernommen.

## Fehlt noch (Kaiser)

1. **Impressum:** Name, Anschrift und Unternehmensgegenstand. Falls zutreffend: Firmenbuch, UID-Nummer, Aufsichtsbehörde, Kammer und Berufsrecht. Nicht zutreffende Zeilen streichen. Sichtbar steht dort „Angabe folgt (Kaiser)“.
2. **APK** (Wunsch Nr. 235): Datei und Ort fehlen. Ort entscheidet Kaiser, zum Beispiel Ordner `apk/` im Repo oder ein GitHub-Release.
3. **Datenschutz und Support für Android:** Beide Texte sprechen nur vom iPhone. Bevor die APK online geht, braucht es eine Ergänzung für Android. Rechtstexte ändert nur Kaiser.
4. **iPhone-Link:** kommt, sobald die App im App Store ist.
5. **Veröffentlichen:** nur nach Kaisers OK.

## APK eintragen, wenn sie fertig ist

1. Prüfsumme und Größe bestimmen: `shasum -a 256 ElektroMatePro-<version>.apk` und `ls -l ElektroMatePro-<version>.apk`.
2. In `android.html` die vier Felder ausfüllen (Version, Datum, Größe, SHA-256).
3. Den Knopf freischalten: aus `<a class="knopf knopf-limette knopf-aus">` wird `<a class="knopf knopf-limette" href="<pfad-zur-apk>" download>`. „bald“ und den Satz „Noch gibt es keine Datei …“ entfernen. Den Status „In Vorbereitung“ ersetzen.
4. Auf der Startseite „bald“ am Android-Knopf und „Gerade in Vorbereitung“ in der Laden-Karte anpassen.

## Bilder neu erzeugen

```sh
# aus dem Hauptordner der Arbeitskopie, Beispiel für ein Bild
sips -z 956 440 -s format jpeg -s formatOptions 74 docs/design/bilder/app-editor.jpg --out bilder/werkstatt-dunkel-440.jpg
sips -z 609 280 -s format jpeg -s formatOptions 74 docs/design/bilder/app-editor.jpg --out bilder/werkstatt-dunkel-280.jpg
```

Hell zeigt helle Bildschirme (Start, Lernpfad), dunkel zeigt dunkle (Kapitel 1, Lektion). Die Bildbeschreibung (Alt-Text) wechselt mit.

## Lokal ansehen und prüfen

```sh
python3 -m http.server 8765 --bind 127.0.0.1   # im Hauptordner der Arbeitskopie
# dann http://127.0.0.1:8765/ öffnen
```

Prüffälle: Handy 390 px und Desktop 1280 px, jeweils hell und dunkel; 320 px; Zoom 200 % (entspricht 640 px Breite); Text 200 %; „Bewegung reduzieren“; Tastatur und Fokus; Links; Größe der Startseite; Layout-Sprünge. Prüfbilder liegen in `docs/pruefbilder/`.

## Prüfung vom 29.10.2026 (Stand der Seiten: Commit „W1: neue Website …“)

| Prüfung | Ergebnis |
|---|---|
| Chrome 156 ohne Oberfläche: 390 und 1280 px, hell und dunkel, 320 px, Zoom 200 %, Text 200 %, alle 5 Seiten | keine Überbreite, keine Layout-Sprünge (CLS 0) |
| WebKit (Safari-Engine, macOS): Start 320, 390, 1280 px hell und dunkel, Android, Impressum | keine Überbreite, Bildbeschreibungen wechseln mit hell und dunkel |
| Tastatur: Reihenfolge, sichtbarer Fokus, „Zum Inhalt“ | alles erreichbar, jeder Fokus sichtbar, Sprungmarke führt zum Inhalt |
| Bewegung | läuft nur im sichtbaren Bereich; bei „Bewegung reduzieren“ steht alles still |
| Links und Sprungziele (75 Verweise) | keine kaputten Links; einziger externer Link `dsb.gv.at` erreichbar |
| Wortlaut Datenschutz und Support | Zeichen für Zeichen wie die veröffentlichte Fassung |
| Größe der Startseite | 113 KB (dunkel) bis 152 KB (hell) am Handy, höchstens 260 KB mit großen Bildern; alle Dateien zusammen 480 KB |

Nicht geprüft: Safari auf einem echten iPhone und im iOS-Simulator (die Simulatoren waren für die App-Tests belegt), Android-Geräte, Firefox.

Prüfbilder: `docs/pruefbilder/1-…` bis `8-…` (Handy mit WebKit, Desktop, Zoom 200 %, Fokus, Android und Impressum mit Chrome).

Prüfwerkzeuge in `docs/werkzeuge/` (ohne Downloads, nutzen das installierte Chrome und WebKit am Mac):
- `pruefen.mjs`: alle Prüffälle in Chrome ohne Oberfläche, mit Bildern und `befund.json`. Aufruf: `node docs/werkzeuge/pruefen.mjs http://127.0.0.1:8765/ /tmp/pruefung`
- `webkit.swift`: eine Seite mit WebKit als Bild. Aufruf: `swift docs/werkzeuge/webkit.swift <url> <breite> <hell|dunkel> <bild.png>`
- `links.py`: Links, Sprungziele, IDs und Wortlaut von Datenschutz und Support. Aufruf: `python3 -I docs/werkzeuge/links.py .`
