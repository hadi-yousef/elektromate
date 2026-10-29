// Prüft die Website im installierten Chrome (headless) über das DevTools-Protokoll.
// Aufruf: node pruefen.mjs <basis-url> <ausgabe-ordner> [fall-filter]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [basis, ausgabe, filter] = process.argv.slice(2);
const PORT = 9333;
const PROFIL = '/tmp/emp-pruef/chrome-profil';
mkdirSync(ausgabe, { recursive: true });
rmSync(PROFIL, { recursive: true, force: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFIL}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions',
  '--disable-background-networking', '--disable-component-update', '--disable-sync',
  '--disable-default-apps', '--mute-audio', 'about:blank',
], { stdio: 'ignore' });

const schlafen = (ms) => new Promise((r) => setTimeout(r, ms));

async function bereit() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {}
    await schlafen(100);
  }
  throw new Error('Chrome startet nicht');
}

class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.offen = new Map(); this.hoerer = []; }
  verbinden() {
    return new Promise((res, rej) => {
      this.ws.onopen = res; this.ws.onerror = rej;
      this.ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && this.offen.has(d.id)) {
          const { res, rej } = this.offen.get(d.id); this.offen.delete(d.id);
          d.error ? rej(new Error(d.error.message)) : res(d.result);
        } else if (d.method) for (const h of [...this.hoerer]) h(d);
      };
    });
  }
  senden(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.offen.set(id, { res, rej }));
  }
  warten(method, ms = 20000) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('Zeit um: ' + method)), ms);
      const h = (d) => { if (d.method === method) { clearTimeout(t); this.hoerer = this.hoerer.filter((x) => x !== h); res(d.params); } };
      this.hoerer.push(h);
    });
  }
}

async function ausw(cdp, ausdruck) {
  const r = await cdp.senden('Runtime.evaluate', { expression: ausdruck, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
}

const BILDER_FERTIG = `Promise.race([Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 4000))])`;

const BEFUND = `(() => {
  const w = innerWidth;
  const ueber = [...document.querySelectorAll('body *')].filter(e => {
    if (e.closest('.held-bild')) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && (r.right > w + 0.5 || r.left < -0.5) && !e.closest('.unsichtbar') && !e.classList.contains('unsichtbar') && !e.classList.contains('springen');
  }).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').join('.') : '') + ' r=' + Math.round(e.getBoundingClientRect().right));
  const res = performance.getEntriesByType('resource').map(e => ({ n: e.name.split('/').pop(), b: e.encodedBodySize, t: e.transferSize }));
  const nav = performance.getEntriesByType('navigation')[0];
  const punkte = document.querySelector('.punkte');
  const cs = punkte && getComputedStyle(punkte);
  return {
    breite: w, scrollBreite: document.documentElement.scrollWidth, hoehe: document.documentElement.scrollHeight,
    ueberstand: ueber.slice(0, 12),
    cls: Math.round((window.__cls || 0) * 10000) / 10000,
    bilder: [...document.images].map(i => ({ datei: (i.currentSrc || i.src).split('/').pop(), breite: i.naturalWidth, alt: i.alt })),
    bytes: { dokument: nav ? nav.encodedBodySize : null, summe: (nav ? nav.encodedBodySize : 0) + res.reduce((s, e) => s + e.b, 0), dateien: res },
    bewegung: punkte ? { name: cs.animationName, zustand: cs.animationPlayState, laeuft: document.querySelector('[data-bewegung]').classList.contains('laeuft') } : null,
  };
})()`;

async function fall(cdp, f) {
  const { name, pfad, breite, hoehe = 900, dsf = 2, schema = 'light', bewegung = 'no-preference', mobil = false, schrift = null, bild = true } = f;
  await cdp.senden('Emulation.setDeviceMetricsOverride', { width: breite, height: hoehe, deviceScaleFactor: dsf, mobile: mobil });
  await cdp.senden('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-color-scheme', value: schema }, { name: 'prefers-reduced-motion', value: bewegung }] });
  const geladen = cdp.warten('Page.loadEventFired');
  await cdp.senden('Page.navigate', { url: basis + pfad });
  await geladen;
  if (schrift) await ausw(cdp, `document.documentElement.style.fontSize = '${schrift}'`);
  await ausw(cdp, BILDER_FERTIG);
  await schlafen(600);
  const befund = await ausw(cdp, BEFUND);
  if (bild) {
    const h = await ausw(cdp, 'document.documentElement.scrollHeight');
    await cdp.senden('Emulation.setDeviceMetricsOverride', { width: breite, height: h, deviceScaleFactor: dsf, mobile: mobil });
    await ausw(cdp, BILDER_FERTIG);
    await schlafen(500);
    const shot = await cdp.senden('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${ausgabe}/${name}.png`, Buffer.from(shot.data, 'base64'));
    befund.bytesGanzeSeite = await ausw(cdp, `(() => { const n = performance.getEntriesByType('navigation')[0]; return n.encodedBodySize + performance.getEntriesByType('resource').reduce((s, e) => s + e.encodedBodySize, 0); })()`);
  }
  return befund;
}

async function tastatur(cdp, pfad, breite, schema) {
  await cdp.senden('Emulation.setDeviceMetricsOverride', { width: breite, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.senden('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: schema }] });
  const geladen = cdp.warten('Page.loadEventFired');
  await cdp.senden('Page.navigate', { url: basis + pfad });
  await geladen;
  await schlafen(300);
  const schritte = [];
  for (let i = 0; i < 16; i++) {
    for (const type of ['keyDown', 'keyUp']) await cdp.senden('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await schlafen(120);
    schritte.push(await ausw(cdp, `(() => {
      const a = document.activeElement; if (!a || a === document.body) return { tag: 'body' };
      const cs = getComputedStyle(a); const k = a.closest('.laden-karte, .hinweis-karte'); const ks = k && getComputedStyle(k);
      const r = a.getBoundingClientRect();
      return { tag: a.tagName.toLowerCase(), text: (a.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 48), href: a.getAttribute('href'),
        rahmen: cs.outlineStyle === 'none' ? 'kein' : cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
        kartenRahmen: ks ? (ks.outlineStyle === 'none' ? 'kein' : ks.outlineStyle + ' ' + ks.outlineWidth) : null,
        imBild: r.bottom > 0 && r.top < innerHeight && r.width > 0 };
    })()`));
  }
  return schritte;
}

async function sprungmarke(cdp, pfad) {
  const geladen = cdp.warten('Page.loadEventFired');
  await cdp.senden('Page.navigate', { url: basis + pfad });
  await geladen;
  for (const type of ['keyDown', 'keyUp']) await cdp.senden('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await schlafen(100);
  const vorher = await ausw(cdp, `(() => { const r = document.activeElement.getBoundingClientRect(); return document.activeElement.className + ' sichtbar=' + (r.top >= 0 && r.bottom <= innerHeight); })()`);
  for (const type of ['keyDown', 'keyUp']) await cdp.senden('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: type === 'keyDown' ? '\r' : undefined });
  await schlafen(300);
  const nachher = await ausw(cdp, `document.activeElement.tagName.toLowerCase() + '#' + document.activeElement.id`);
  return { vorher, nachher };
}

async function fokusBild(cdp, pfad, breite, hoehe, schema, tabs, name) {
  await cdp.senden('Emulation.setDeviceMetricsOverride', { width: breite, height: hoehe, deviceScaleFactor: 2, mobile: false });
  await cdp.senden('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: schema }] });
  const geladen = cdp.warten('Page.loadEventFired');
  await cdp.senden('Page.navigate', { url: basis + pfad });
  await geladen;
  await schlafen(300);
  for (let i = 0; i < tabs; i++) {
    for (const type of ['keyDown', 'keyUp']) await cdp.senden('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await schlafen(80);
  }
  await schlafen(1200);
  const info = await ausw(cdp, `document.activeElement.textContent.replace(/\\s+/g, ' ').trim()`);
  const shot = await cdp.senden('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${ausgabe}/${name}.png`, Buffer.from(shot.data, 'base64'));
  return info;
}

await bereit();
const ziel = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const cdp = new CDP(ziel.webSocketDebuggerUrl);
await cdp.verbinden();
await cdp.senden('Page.enable');
await cdp.senden('Runtime.enable');
await cdp.senden('Network.enable');
await cdp.senden('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.senden('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cls = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}` });

const FAELLE = [
  { name: 'start-handy-hell', pfad: 'index.html', breite: 390, hoehe: 844, dsf: 2, mobil: true },
  { name: 'start-handy-dunkel', pfad: 'index.html', breite: 390, hoehe: 844, dsf: 2, mobil: true, schema: 'dark' },
  { name: 'start-desktop-hell', pfad: 'index.html', breite: 1280, hoehe: 800, dsf: 1 },
  { name: 'start-desktop-dunkel', pfad: 'index.html', breite: 1280, hoehe: 800, dsf: 1, schema: 'dark' },
  { name: 'start-zoom200-dunkel', pfad: 'index.html', breite: 640, hoehe: 400, dsf: 2, schema: 'dark' },
  { name: 'start-zoom200-hell', pfad: 'index.html', breite: 640, hoehe: 400, dsf: 2 },
  { name: 'start-320-hell', pfad: 'index.html', breite: 320, hoehe: 640, dsf: 2, mobil: true },
  { name: 'start-text200-hell', pfad: 'index.html', breite: 390, hoehe: 844, dsf: 2, mobil: true, schrift: '200%' },
  { name: 'start-ruhe-dunkel', pfad: 'index.html', breite: 390, hoehe: 844, dsf: 1, mobil: true, schema: 'dark', bewegung: 'reduce', bild: false },
  { name: 'android-handy-dunkel', pfad: 'android.html', breite: 390, hoehe: 844, dsf: 2, mobil: true, schema: 'dark' },
  { name: 'android-desktop-hell', pfad: 'android.html', breite: 1280, hoehe: 800, dsf: 1 },
  { name: 'impressum-handy-hell', pfad: 'impressum.html', breite: 390, hoehe: 844, dsf: 2, mobil: true },
  { name: 'impressum-desktop-dunkel', pfad: 'impressum.html', breite: 1280, hoehe: 800, dsf: 1, schema: 'dark' },
  { name: 'datenschutz-handy-dunkel', pfad: 'datenschutz.html', breite: 390, hoehe: 844, dsf: 2, mobil: true, schema: 'dark' },
  { name: 'datenschutz-desktop-hell', pfad: 'datenschutz.html', breite: 1280, hoehe: 800, dsf: 1 },
  { name: 'support-handy-hell', pfad: 'support.html', breite: 390, hoehe: 844, dsf: 2, mobil: true },
  { name: 'support-desktop-dunkel', pfad: 'support.html', breite: 1280, hoehe: 800, dsf: 1, schema: 'dark' },
  { name: 'android-zoom200-hell', pfad: 'android.html', breite: 640, hoehe: 400, dsf: 2, bild: false },
  { name: 'impressum-320-dunkel', pfad: 'impressum.html', breite: 320, hoehe: 640, dsf: 2, mobil: true, schema: 'dark', bild: false },
];

const ergebnis = {};
try {
  for (const f of FAELLE) {
    if (filter && !f.name.includes(filter)) continue;
    ergebnis[f.name] = await fall(cdp, f);
  }
  if (!filter || filter === 'tastatur') {
    ergebnis.tastatur_start = await tastatur(cdp, 'index.html', 1280, 'light');
    ergebnis.tastatur_android = await tastatur(cdp, 'android.html', 390, 'dark');
    ergebnis.sprungmarke = await sprungmarke(cdp, 'datenschutz.html');
    ergebnis.fokus_bild = await fokusBild(cdp, 'index.html', 1280, 800, 'light', 6, 'fokus-desktop-hell');
  }
} finally {
  writeFileSync(`${ausgabe}/befund.json`, JSON.stringify(ergebnis, null, 1));
  cdp.ws.close();
  chrome.kill();
}
console.log('fertig:', Object.keys(ergebnis).length, 'Fälle');
