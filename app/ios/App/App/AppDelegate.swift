import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // URL opens and universal links: UIKit delivers them to SceneDelegate under
    // the scene life cycle, so they are forwarded to Capacitor there.

}

// MARK: - SlantBridgeViewController
//
// The storyboard's root view controller. It only frames the sealed game:
// the web view takes the system background (white or black, as the game's
// own theme follows the system) so nothing flashes before the first paint,
// the page does not rubber-band, and the status bar stays out of the way of
// a board that runs edge to edge (the game pads itself with the safe areas).
// It also carries iPhone Duo's fold to the page (DuoBridge.swift + duo-fold.js,
// laid out by duo-layout.css in the payload) and opens the share sheet for the
// Download button's picture (PictureSaver below; native.js sends it).
class SlantBridgeViewController: CAPBridgeViewController {
    private var duo: DuoBridge?
    private var saver: PictureSaver?

    override open func capacitorDidLoad() {
        view.backgroundColor = .systemBackground
        guard let webView = webView else { return }
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        webView.scrollView.backgroundColor = .systemBackground
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // Here, on the web view's own configuration, not in webViewConfiguration(for:):
        // Capacitor swaps the user content controller after that hook (DuoBridge README).
        duo = DuoBridge(configuration: webView.configuration)
        duo?.attach(to: webView)
        let saver = PictureSaver(host: self)
        webView.configuration.userContentController.add(WeakScriptHandler(saver), name: PictureSaver.messageName)
        self.saver = saver
        #if DEBUG
        StoreShot.installPageCheck(on: webView)
        StoreShot.install(on: webView, duo: duo)
        #endif
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        #if DEBUG
        if let duo, let webView { StoreShot.simulateFold(on: duo, size: webView.bounds.size) }
        #endif
        duo?.refresh()
    }

    override var prefersStatusBarHidden: Bool { true }
}

// MARK: - PictureSaver
//
// Slant's Download button makes a PNG of the colored puzzle and clicks a
// detached <a download href="blob:...">, which WKWebView does not save.
// native.js reads the blob and posts {name, data (base64)} here; this writes it
// to a temporary file and opens the share sheet (Save Image, Save to Files,
// Messages...). Nothing leaves the device unless the player picks a destination.
@MainActor
final class PictureSaver: NSObject, WKScriptMessageHandler {
    static let messageName = "slantSave"
    private static let png: [UInt8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    private weak var host: UIViewController?

    init(host: UIViewController) { self.host = host }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              let body = message.body as? [String: Any],
              let encoded = body["data"] as? String,
              let data = Data(base64Encoded: encoded),
              data.count > Self.png.count, data.count <= 16 * 1024 * 1024,
              Array(data.prefix(Self.png.count)) == Self.png,
              let host, host.presentedViewController == nil else { return }
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("pictures", isDirectory: true)
        let url = dir.appendingPathComponent(Self.fileName(body["name"] as? String))
        do {
            // Keep recent pictures: an app the player shared to may read its file
            // later. Ones older than an hour go.
            let files = FileManager.default
            let cutoff = Date().addingTimeInterval(-3600)
            for old in (try? files.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.contentModificationDateKey])) ?? [] {
                let changed = (try? old.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast
                if changed < cutoff { try? files.removeItem(at: old) }
            }
            try files.createDirectory(at: dir, withIntermediateDirectories: true)
            try data.write(to: url, options: .atomic)
        } catch {
            NSLog("PictureSaver: %@", error.localizedDescription)
            return
        }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = host.view
            popover.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.maxY - 60, width: 1, height: 1)
            popover.permittedArrowDirections = .down
        }
        host.present(sheet, animated: true)
    }

    /// A plain name ending in .png; anything else becomes "slant.png".
    static func fileName(_ raw: String?) -> String {
        guard let raw else { return "slant.png" }
        let allowed = Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        let clean = String(raw.map { allowed.contains($0) ? $0 : "-" })
        guard clean.count >= 5, clean.count <= 80, !clean.hasPrefix("."), clean.hasSuffix(".png") else { return "slant.png" }
        return clean
    }
}

/// WKUserContentController retains its handlers; this keeps it from retaining ours.
final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    private weak var target: (any WKScriptMessageHandler)?
    init(_ target: any WKScriptMessageHandler) { self.target = target }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(controller, didReceive: message)
    }
}

#if DEBUG
// MARK: - StoreShot (Debug builds only)
//
// `xcrun simctl launch <device> com.oneimpossiblethingatatime.slant -SlantShot <scene>`
// opens the game on a fixed screen with no taps, for store screenshots on screens
// simctl cannot tap (the iPhone Duo's outer screen while folded). `scripts/capture-shots.sh`
// drives it. Scenes:
//   progress  board 42 (8 x 8), the first 40 logical moves drawn, light
//   solved    board 41 (7 x 7) solved, in color, light
//   free      Free draw, 8 x 8, a lattice of closed diamonds, all filled, dark
//   help      How to play, dark
//   save      as solved, then presses Settings > Download (checks the share sheet)
// The script writes the game's own saves (slant.*.v1) the first time the game reads
// one, after levels.js is in, so the game opens the scene through its normal
// start-up; the payload in www/ is untouched. Release builds compile none of this.
// Add `-SlantDuo book` or `-SlantDuo laptop` to fake a fold on a simulator that
// cannot fold, so the Duo layouts can be captured too.
@MainActor
enum StoreShot {
    static let scenes = ["progress", "solved", "free", "help", "save"]

    /// Logs, from the page itself, whether the fold shim and both message handlers
    /// reached it (the DuoBridge README's gotcha: a bridge the page never got still
    /// logs payloads natively). Capacitor forwards console.log to the device log.
    static func installPageCheck(on webView: WKWebView) {
        let check = "addEventListener('load',function(){var h=window.webkit&&webkit.messageHandlers||{};" +
            "console.log('SlantCheck duoFold='+!!window.DuoFold+' duoHandler='+!!h.duoFold+' saveHandler='+!!h.slantSave+" +
            "' native='+!!document.querySelector('script[src=\"./native.js\"]')+' duoCss='+!!document.querySelector('link[href=\"./duo-layout.css\"]'));});"
        webView.configuration.userContentController.addUserScript(
            WKUserScript(source: check, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
    }

    static func install(on webView: WKWebView, duo: DuoBridge?) {
        guard let scene = UserDefaults.standard.string(forKey: "SlantShot"), scenes.contains(scene) else { return }
        let source = script.replacingOccurrences(of: "__SCENE__", with: scene)
        webView.configuration.userContentController.addUserScript(
            WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        NSLog("SlantShot: %@", scene)
    }

    /// With `-SlantDuo book|laptop`, reports a 40 pt fold across the middle of the
    /// web view (the Duo simulator's fold is 40 pt wide), as if the phone were half open.
    static func simulateFold(on duo: DuoBridge, size: CGSize) {
        guard let pose = UserDefaults.standard.string(forKey: "SlantDuo"), size.width > 0 else { return }
        let fold: [String: Double] = pose == "laptop"
            ? ["x": 0, "y": Double(size.height / 2 - 20), "width": Double(size.width), "height": 40]
            : ["x": Double(size.width / 2 - 20), "y": 0, "width": 40, "height": Double(size.height)]
        duo.simulated = ["hinge": true, "fold": fold, "reserved": fold, "status": "partially-open", "angle": 110]
    }

    static let script = """
    (function () {
      'use strict';
      var scene = '__SCENE__', solved = scene === 'solved' || scene === 'save', theme = scene === 'free' || scene === 'help' ? 'dark' : 'light';
      var get = Storage.prototype.getItem, done = false;
      function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error('SlantShot', e); } }
      function cells(id, moves) {
        var p = window.SlantLevels.find(function (l) { return l.id === id; }), c = [];
        for (var i = 0; i < p.w * p.h; i++) c.push(0);
        p.trace.slice(0, moves).forEach(function (t) { c[t.i] = t.value; });
        return c;
      }
      function seed() {
        var L = window.SlantLevels, at = solved ? 's35' : 's49';
        localStorage.setItem('slant.primer.v1', '1');
        put('slant.settings.v1', { version: 1, theme: theme, motion: 'system', zoom: 'fit', difficulty: 'Normal', mode: 'Standard' });
        put('slant.progress.v1', { version: 1, completed: L.slice(0, solved ? 40 : 41).map(function (l) { return l.id; }) });
        var boards = {}; boards[at] = solved ? cells('s35', 999) : cells('s49', 40);
        put('slant.current.v1', { version: 1, at: at, boards: boards, generated: null });
        // Always written, so an earlier free scene cannot leave Free draw open.
        var d = [];
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) d.push(r % 2 === c % 2 ? 1 : 2);
        put('slant.free.v1', { version: 1, size: 8, open: scene === 'free', boards: { 8: d } });
      }
      Storage.prototype.getItem = function (k) {
        if (!done && String(k).indexOf('slant.') === 0 && window.SlantLevels) { done = true; Storage.prototype.getItem = get; seed(); }
        return get.apply(this, arguments);
      };
      if (scene === 'help') addEventListener('load', function () {
        setTimeout(function () { document.getElementById('help-btn').click(); }, 600);
      });
      if (scene === 'save') addEventListener('load', function () {
        setTimeout(function () { document.getElementById('download').click(); }, 1500);
      });
    })();
    """
}
#endif
