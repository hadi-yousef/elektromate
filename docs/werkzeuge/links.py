"""Prüft alle Verweise der Website: Dateien, Sprungziele, IDs. Dazu Wortlaut von Datenschutz und Support.
Aufruf: python3 -I docs/werkzeuge/links.py <ordner-der-website>"""
import html.parser, pathlib, re, subprocess, sys
from urllib.parse import urlsplit, unquote

ordner = pathlib.Path(sys.argv[1])
seiten = sorted(ordner.glob('*.html'))

class Leser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.verweise = []; self.ids = []; self.bezug = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        for name in ('href', 'src'):
            if name in a and a[name] is not None: self.verweise.append((tag, a[name]))
        if 'srcset' in a:
            for teil in a['srcset'].split(','):
                self.verweise.append((tag, teil.strip().split()[0]))
        for name in ('aria-labelledby', 'aria-describedby'):
            if name in a: self.bezug.extend(a[name].split())

ids = {}; daten = {}
for s in seiten:
    l = Leser(); l.feed(s.read_text(encoding='utf-8')); daten[s.name] = l; ids[s.name] = l.ids

fehler = []; extern = set(); geprueft = 0
for name, l in daten.items():
    doppelt = {i for i in l.ids if l.ids.count(i) > 1}
    if doppelt: fehler.append(f"{name}: doppelte IDs {doppelt}")
    for b in l.bezug:
        if b not in l.ids: fehler.append(f"{name}: aria-Bezug ohne Ziel: {b}")
    for tag, url in l.verweise:
        geprueft += 1
        teile = urlsplit(url)
        if teile.scheme in ('http', 'https'): extern.add(url); continue
        if teile.scheme == 'mailto':
            if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[a-z]{2,}", unquote(teile.path)): fehler.append(f"{name}: mailto kaputt {url}")
            continue
        ziel = name if teile.path == '' else teile.path
        datei = ordner / ziel
        if not datei.is_file(): fehler.append(f"{name}: Datei fehlt {url}"); continue
        if teile.fragment and teile.fragment not in ids.get(pathlib.Path(ziel).name, []):
            fehler.append(f"{name}: Sprungziel fehlt {url}")

print(f"{len(seiten)} Seiten, {geprueft} Verweise geprüft")
print("extern:", sorted(extern))
print("FEHLER:" if fehler else "keine kaputten Verweise", *fehler, sep="\n  ")

# Wortlaut: alter Inhalt muss unverändert im neuen Rahmen stehen
for name in ('datenschutz.html', 'support.html'):
    alt = subprocess.run(['git', '-C', str(ordner), 'show', f'origin/main:{name}'], capture_output=True, text=True, check=True).stdout
    inhalt = alt.split('</header>\n', 1)[1].split('<footer>', 1)[0]
    neu = (ordner / name).read_text(encoding='utf-8')
    print(f"{name}: Wortlaut wie veröffentlicht (origin/main) = {inhalt in neu}, {len(inhalt)} Zeichen")
