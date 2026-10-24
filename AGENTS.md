# elektromate-pages: Anleitung für Agenten

- Zuerst `INDEX.md` lesen.
- Nach jedem Commit `git push nas main` und `git push origin main`. Achtung: `origin` ist die veröffentlichte Website, Änderungen sind sofort öffentlich. Vorher Kaiser fragen.
- Nie endgültig löschen: alles in `~/Papierkorb`.

## Bibliothek und Urheberrecht (Kaiser, 24.10.2026)

- **Bibliothek:** `python3 ~/.config/zentrale/zentrale_client.py bibliothek "Frage" [--regal meisterkurs|fachbuecher|normen]` liefert Fundstellen (Buch, Seite, Kapitel, kurzer Auszug). Bücher, Normen (TAEV, OVE E 8101), Skripte und Kaisers Mitschriften. Antworten schreibt der Agent selbst und nennt dabei die Fundstelle.
- **[intern] = geschützte Quelle** (Bücher, Normen, Skripte, Aufbereitungen mit Buchauszügen): Die Quellen dürfen **nur intern dokumentiert** werden, zum Beispiel in eigenen Notizen, Entwicklungsdokumenten und Prüflisten („laut TAEV 2026, II.A/39“).
- **Nie in Veröffentlichtes:** Text, Tabellen, Bilder und Seiten aus [intern]-Quellen kommen nicht in Videos, Apps, Websites, Posts oder Downloads, auch nicht leicht umformuliert, und werden dort auch nicht als Quelle genannt. Veröffentlichte Inhalte sind eigenständig formuliert und selbst erklärt.
- **[eigen]** sind Kaisers eigene Mitschriften und Texte. Die dürfen überall verwendet werden.
- **Quelle der Wahrheit (Kaiser 24.10.):** Die Bibliothek ist das Herzstück von Kaisers Wissen. Bei Fachfragen zuerst `bibliothek "…"` fragen und mit Fundstelle antworten. Widerspricht etwas (eigenes Wissen, Internet) der Bibliothek, gilt die Bibliothek, bei Normen die neueste Ausgabe. Fehlt etwas, Kaiser sagen, welches Buch fehlt.
- **Neues hinzufügen:** in der Zentrale (Bibliothek → Hinzufügen), im Telegram-Boten (PDF oder Fotos mit Bildunterschrift „Bibliothek <Regal>“) oder in `Austausch/Bibliothek/Eingang/<Regal>/` ablegen. Der Mac holt alle 10 Minuten ab.
