/* Native bridge for the Android (Capacitor) build.
   In a normal browser every hook falls through to the original behaviour. */
(function () {
  var Cap = window.Capacitor;
  var native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var P = (Cap && Cap.Plugins) || {};

  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  async function saveAndShare(blob, filename) {
    var data = await blobToBase64(blob);
    var w = await P.Filesystem.writeFile({ path: filename, data: data, directory: 'CACHE' });
    try {
      await P.Share.share({ title: filename, files: [w.uri], dialogTitle: 'Save or share ' + filename });
    } catch (e) { /* user dismissed the share sheet */ }
    return w.uri;
  }

  async function openFile(blob, filename) {
    var data = await blobToBase64(blob);
    var w = await P.Filesystem.writeFile({ path: filename, data: data, directory: 'CACHE' });
    if (P.FileOpener) {
      await P.FileOpener.open({ filePath: w.uri, contentType: blob.type || 'application/pdf' });
    } else {
      await P.Share.share({ files: [w.uri] });
    }
  }

  async function openExternal(url) {
    try {
      if (P.AppLauncher) {
        var c = await P.AppLauncher.canOpenUrl({ url: url });
        if (c && c.value) { await P.AppLauncher.openUrl({ url: url }); return; }
      }
    } catch (e) {}
    window.location.href = url; // falls back to the system browser
  }

  function install(win) {
    if (!native || !win || win.__nbInstalled) return;
    win.__nbInstalled = true;

    // 1. Exports: <a download href="blob:..."> clicks -> file + share sheet
    var origClick = win.HTMLAnchorElement.prototype.click;
    win.HTMLAnchorElement.prototype.click = function () {
      var href = this.href || '', name = this.download;
      if (name && /^(blob:|data:)/.test(href)) {
        fetch(href).then(function (r) { return r.blob(); })
          .then(function (b) { return saveAndShare(b, name); })
          .catch(function (e) { win.alert('Could not save file: ' + (e && e.message || e)); });
        return;
      }
      return origClick.apply(this, arguments);
    };

    // 2. Maps / external links: skip the intent:// path, use a native opener
    try {
      Object.defineProperty(win.navigator, 'userAgent', {
        get: function () { return navigator.userAgent.replace(/Android/gi, 'Linux'); }
      });
    } catch (e) {}
    var origOpen = win.open;
    win.open = function (url, target) {
      if (url && /^(https?:|geo:|tel:|sms:|mailto:|whatsapp:)/i.test(String(url))) {
        openExternal(String(url));
        return { closed: false, close: function () {}, focus: function () {} };
      }
      return origOpen.apply(win, arguments);
    };

    // 3. ID proofs: PDFs open in the phone's PDF app
    var origCOU = win.URL.createObjectURL;
    win.URL.createObjectURL = function (obj) {
      var url = origCOU.call(win.URL, obj);
      if (obj && obj.type === 'application/pdf' && !win.__nbSkipPdf) {
        openFile(obj, 'id-proof-' + Date.now() + '.pdf')
          .catch(function (e) { win.alert('Could not open PDF: ' + (e && e.message || e)); });
      }
      return url;
    };

    // 4. Tap-to-call / message links
    win.document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/^(tel:|sms:|mailto:|geo:|https?:\/\/(maps\.|www\.google\.[a-z.]+\/maps|goo\.gl|maps\.app))/i.test(h)) {
        ev.preventDefault();
        openExternal(a.href);
      }
    }, true);
  }

  // Hardware Back button: modal -> screen -> dashboard -> confirm exit
  function wireBack() {
    if (!native || !P.App) return;
    P.App.addListener('backButton', function () {
      var handled = false;
      try { handled = window.Shell && window.Shell.back && window.Shell.back(); } catch (e) {}
      if (!handled && window.confirm('Exit Bharat Surgicals Tracker?')) P.App.exitApp();
    });
  }

  window.NB = { native: native, install: install, saveAndShare: saveAndShare, openExternal: openExternal };
  install(window);
  wireBack();
})();
