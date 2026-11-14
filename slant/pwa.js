/* Home-screen app support for this game: registers ./sw.js so the installed game opens offline.
   Written by tools/home-screen.py. Only on https pages that link a manifest; when workers or
   storage are blocked nothing happens and the game plays as before. */
(function () {
  'use strict';
  try {
    var script = document.currentScript;
    if (location.protocol !== 'https:' || !script || !document.querySelector('link[rel="manifest"]')) return;
    var workers = navigator.serviceWorker;
    if (!workers || typeof workers.register !== 'function') return;
    var url = new URL('sw.js', script.src).href;
    var start = function () {
      try { workers.register(url).catch(function () {}); } catch (e) {}
    };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
  } catch (e) {}
})();
