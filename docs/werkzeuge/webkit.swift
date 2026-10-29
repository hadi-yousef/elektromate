// Rendert eine Seite mit WebKit (Safari-Engine) in einem unsichtbaren Fenster und speichert ein Bild der ganzen Seite.
// Aufruf: swift webkit.swift <url> <breite> <hell|dunkel> <ausgabe.png>
import AppKit
import WebKit

let args = CommandLine.arguments
let url = URL(string: args[1])!
let breite = CGFloat(Double(args[2])!)
let dunkel = args[3] == "dunkel"
let ziel = args[4]

final class Lader: NSObject, WKNavigationDelegate {
    let fenster: NSWindow
    let web: WKWebView
    init(breite: CGFloat) {
        let rahmen = NSRect(x: 0, y: 0, width: breite, height: 900)
        fenster = NSWindow(contentRect: rahmen, styleMask: [.borderless], backing: .buffered, defer: false)
        web = WKWebView(frame: rahmen, configuration: WKWebViewConfiguration())
        super.init()
        web.navigationDelegate = self
        web.appearance = NSAppearance(named: dunkel ? .darkAqua : .aqua)
        fenster.contentView = web
        fenster.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        fenster.orderFrontRegardless()
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { self.messen() }
    }
    func messen() {
        let js = """
        JSON.stringify({ breite: innerWidth, scroll: document.documentElement.scrollWidth, hoehe: document.documentElement.scrollHeight,
          schema: matchMedia('(prefers-color-scheme: dark)').matches ? 'dunkel' : 'hell',
          bilder: [...document.images].map(i => (i.currentSrc || i.src).split('/').pop() + ':' + i.naturalWidth + ':' + i.alt.slice(0, 30)),
          bewegung: document.querySelector('.punkte') ? getComputedStyle(document.querySelector('.punkte')).animationName + '/' + getComputedStyle(document.querySelector('.punkte')).animationPlayState : null,
          ueber: [...document.querySelectorAll('body *')].filter(e => !e.closest('.held-bild') && !e.closest('.unsichtbar') && !e.classList.contains('springen') && e.getBoundingClientRect().right > innerWidth + 0.5).map(e => e.tagName + '.' + e.className).slice(0, 8) })
        """
        web.evaluateJavaScript(js) { ergebnis, fehler in
            print(ergebnis as? String ?? "Fehler: \(String(describing: fehler))")
            let daten = (ergebnis as? String)?.data(using: .utf8)
            let hoehe = (daten.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }?["hoehe"] as? Double) ?? 900
            self.fenster.setContentSize(NSSize(width: breite, height: CGFloat(hoehe)))
            self.web.frame = NSRect(x: 0, y: 0, width: breite, height: CGFloat(hoehe))
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.bild() }
        }
    }
    func bild() {
        web.takeSnapshot(with: WKSnapshotConfiguration()) { bild, fehler in
            guard let bild, let tiff = bild.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                  let png = rep.representation(using: .png, properties: [:]) else {
                print("Bild fehlgeschlagen: \(String(describing: fehler))"); exit(1)
            }
            try? png.write(to: URL(fileURLWithPath: ziel))
            print("gespeichert: \(ziel) \(rep.pixelsWide)x\(rep.pixelsHigh)")
            exit(0)
        }
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let lader = Lader(breite: breite)
lader.web.load(URLRequest(url: url))
DispatchQueue.main.asyncAfter(deadline: .now() + 40) { print("Zeit um"); exit(2) }
app.run()
