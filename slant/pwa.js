/* Home-screen app support for this game: registers ./sw.js so the installed game opens offline,
   and asks the browser to keep saved boards. Written by tools/home-screen.py. Only on https pages that link a manifest; when workers or
   storage are blocked nothing happens and the game plays as before. */
(function () {
  'use strict';
  try {
    var script = document.currentScript;
    if (location.protocol !== 'https:' || !script || !document.querySelector('link[rel="manifest"]')) return;
    // Ask the browser to keep what the games have saved here, so it is not cleared to free space or
    // after a spell away. Only once something is saved (a return visit): a first visit never meets a
    // permission prompt, which Firefox shows for this. Asking again after a yes or a no does nothing.
    try {
      var store = navigator.storage;
      if (store && typeof store.persist === 'function' && typeof store.persisted === 'function' && localStorage.length) {
        store.persisted().then(function (kept) { if (!kept) return store.persist(); }).catch(function () {});
      }
    } catch (e) {}
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
