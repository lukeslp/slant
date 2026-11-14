/* Slant app shell, page side. Loaded only in the native app (scripts/export-www.py
   adds it); in a browser neither bridge exists and this does nothing.

   The game's Download button clicks a detached <a download href="blob:...">.
   Neither WKWebView nor Android's WebView saves such a link, so the picture is
   handed to the native shell, which opens the system share sheet with it
   (Save Image, Save to Files, Drive, Messages...). Nothing leaves the device
   unless the player picks a destination there. */
(function () {
  'use strict';
  var ios = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.slantSave;
  var android = window.SlantShell && typeof window.SlantShell.savePicture === 'function';
  if (!ios && !android) return;

  function base64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result).split(',')[1] || ''); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(blob);
    });
  }

  var click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.href || '';
    if (!this.hasAttribute('download') || href.indexOf('blob:') !== 0) return click.apply(this, arguments);
    var name = (this.getAttribute('download') || 'slant.png').replace(/[^A-Za-z0-9._-]/g, '-');
    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(base64)
      .then(function (data) {
        if (!data) return;
        if (ios) ios.postMessage({ name: name, data: data });
        else window.SlantShell.savePicture(name, data);
      })
      .catch(function (e) { console.error('Slant save', e); });
  };
})();
