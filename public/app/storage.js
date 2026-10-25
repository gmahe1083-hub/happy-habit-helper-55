/* Durable storage + one-time migration + unified backup.
   The trackers keep calling localStorage exactly as before; the three data
   keys are served from an in-memory copy that is persisted to IndexedDB
   (no 5 MB limit, survives browser cache clearing of localStorage). */
(function () {
  var KEYS = ['bharat_shared_v1', 'bharat_surgicals_device_buy_sell_v1', 'bharat_surgicals_rental_v2'];
  var MIGRATED = 'bharat_migrated_v1';
  var DB = 'bharat_tracker', OS = 'kv';
  var cache = {}, db, dirty = {}, timer;

  function open() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(OS); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return new Promise(function (res, rej) {
      var t = db.transaction(OS, mode), s = t.objectStore(OS), out = fn(s);
      t.oncomplete = function () { res(out && out.result); };
      t.onerror = function () { rej(t.error); };
    });
  }
  function idbGet(k) { return tx('readonly', function (s) { return s.get(k); }); }
  function idbPutMany(obj) {
    return tx('readwrite', function (s) {
      Object.keys(obj).forEach(function (k) { obj[k] == null ? s.delete(k) : s.put(obj[k], k); });
    });
  }

  function flush() {
    clearTimeout(timer);
    var batch = {};
    Object.keys(dirty).forEach(function (k) { batch[k] = cache[k] == null ? null : cache[k]; });
    dirty = {};
    if (!Object.keys(batch).length) return Promise.resolve();
    return idbPutMany(batch).catch(function (e) {
      alert('Saving failed: ' + (e && e.message || e) + '. Please export a backup.');
    });
  }
  function schedule(k) { dirty[k] = 1; clearTimeout(timer); timer = setTimeout(flush, 300); }

  var origGet = Storage.prototype.getItem, origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
  function patch(win) {
    var SP = win.Storage.prototype;
    if (SP.__bharat) return;
    SP.__bharat = true;
    var g = SP.getItem, s = SP.setItem, r = SP.removeItem;
    SP.getItem = function (k) {
      if (this === win.localStorage && KEYS.indexOf(k) >= 0) return k in cache ? cache[k] : null;
      return g.apply(this, arguments);
    };
    SP.setItem = function (k, v) {
      if (this === win.localStorage && KEYS.indexOf(k) >= 0) { cache[k] = String(v); schedule(k); return; }
      return s.apply(this, arguments);
    };
    SP.removeItem = function (k) {
      if (this === win.localStorage && KEYS.indexOf(k) >= 0) { delete cache[k]; schedule(k); return; }
      return r.apply(this, arguments);
    };
  }

  async function migrate() {
    if (origGet.call(localStorage, MIGRATED)) return;
    var moved = {};
    for (var i = 0; i < KEYS.length; i++) {
      var k = KEYS[i], v = origGet.call(localStorage, k);
      if (v != null && cache[k] == null) { moved[k] = v; cache[k] = v; }
    }
    if (Object.keys(moved).length) {
      await idbPutMany(moved);
      for (var k2 in moved) {
        var check = await idbGet(k2);
        if (check !== moved[k2]) throw new Error('Migration check failed for ' + k2);
      }
    }
    origSet.call(localStorage, MIGRATED, new Date().toISOString());
    Object.keys(moved).forEach(function (k) { origRemove.call(localStorage, k); });
  }

  function loadScripts(list) {
    list.forEach(function (src) {
      var s = document.createElement('script'); s.src = src; s.async = false; document.body.appendChild(s);
    });
  }

  /* ---------- Unified backup ---------- */
  function parse(k) { try { return JSON.parse(cache[k] || 'null'); } catch (e) { return null; } }
  function counts(d) {
    var dv = d.device || {}, rn = d.rental || {}, sh = d.shared || {};
    var n = function (a) { return Array.isArray(a) ? a.length : 0; };
    return 'Devices: ' + n(dv.devices) + '\nSales: ' + n(dv.sales) + '\nMasks: ' + n(dv.masks) +
      '\nSuppliers: ' + n(dv.suppliers) + '\nEquipment: ' + n(rn.equipment) + '\nRental customers: ' + n(rn.customers) +
      '\nRentals: ' + n(rn.rentals) + '\nPayments: ' + n(rn.payments) + '\nShared customers: ' + n(sh.customers) +
      '\nMask sales: ' + n(sh.maskSales);
  }
  function exportAll() {
    var payload = {
      app: 'Bharat Surgicals Tracker', format: 'unified', version: 1, exportedAt: new Date().toISOString(),
      data: { shared: parse(KEYS[0]), device: parse(KEYS[1]), rental: parse(KEYS[2]) }
    };
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Bharat_Surgicals_Backup_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    try { origSet.call(localStorage, 'bharat_last_backup', new Date().toISOString()); } catch (e) {}
  }
  function normalise(p) {
    if (p && p.format === 'unified' && p.data) return { kind: 'Full backup', data: p.data, full: true };
    var dv = p && p.data ? p.data : p;
    if (dv && Array.isArray(dv.devices) && Array.isArray(dv.sales) && Array.isArray(dv.masks))
      return { kind: 'Old Device Tracker backup', data: { device: dv } };
    var rn = p && p.state ? p.state : p;
    if (rn && Array.isArray(rn.equipment) && Array.isArray(rn.customers) && Array.isArray(rn.rentals) && Array.isArray(rn.payments))
      return { kind: 'Old Rental Tracker backup', data: { rental: rn } };
    throw new Error('This file is not a Bharat Surgicals backup.');
  }
  async function importFile(file) {
    var text = await file.text(), n;
    try { n = normalise(JSON.parse(text)); } catch (e) { alert('Could not read backup: ' + e.message); return; }
    var msg = n.kind + '\n\n' + counts(n.data) + '\n\n' +
      (n.full ? 'ALL current data will be replaced.' : 'Only this tracker\'s data will be replaced.') + ' Continue?';
    if (!confirm(msg)) return;
    if (n.data.shared !== undefined) { cache[KEYS[0]] = n.data.shared == null ? undefined : JSON.stringify(n.data.shared); dirty[KEYS[0]] = 1; }
    if (n.data.device) { cache[KEYS[1]] = JSON.stringify(n.data.device); dirty[KEYS[1]] = 1; }
    if (n.data.rental) { cache[KEYS[2]] = JSON.stringify(n.data.rental); dirty[KEYS[2]] = 1; }
    Object.keys(cache).forEach(function (k) { if (cache[k] === undefined) delete cache[k]; });
    await flush();
    alert('Backup restored.');
    location.reload();
  }
  /* ---------- Cloud backup (shared online copy) ---------- */
  var CLOUD_URL = 'https://ymdcuqsioeqpebopswbs.supabase.co';
  var CLOUD_KEY = 'sb_publishable_wRx8Hvcvs-0RQ_Oxgst8Gw_5zvGSKjU';
  function cloudHeaders(extra) {
    var h = { apikey: CLOUD_KEY, 'Content-Type': 'application/json' };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  async function cloudPush(btn) {
    try {
      btn.disabled = true; btn.textContent = 'Updating…';
      await flush();
      var payload = {
        app: 'Bharat Surgicals Tracker', format: 'unified', version: 1, exportedAt: new Date().toISOString(),
        data: { shared: parse(KEYS[0]), device: parse(KEYS[1]), rental: parse(KEYS[2]) }
      };
      var r = await fetch(CLOUD_URL + '/rest/v1/cloud_backup', {
        method: 'POST',
        headers: cloudHeaders({ Prefer: 'resolution=merge-duplicates' }),
        body: JSON.stringify({ id: 1, payload: payload, updated_at: new Date().toISOString() })
      });
      if (!r.ok) throw new Error('Cloud error ' + r.status);
      origSet.call(localStorage, 'bharat_last_cloud', new Date().toISOString());
      alert('Cloud backup updated. Anyone with the app can now restore this data.');
    } catch (e) { alert('Cloud update failed: ' + (e && e.message || e)); }
    openBackup();
  }
  async function cloudPull(btn) {
    try {
      btn.disabled = true; btn.textContent = 'Checking…';
      var r = await fetch(CLOUD_URL + '/rest/v1/cloud_backup?id=eq.1&select=payload,updated_at', { headers: cloudHeaders() });
      if (!r.ok) throw new Error('Cloud error ' + r.status);
      var rows = await r.json();
      if (!rows.length) { alert('No cloud backup yet. Use "Update cloud backup" first.'); openBackup(); return; }
      var d = rows[0].payload && rows[0].payload.data;
      if (!d) throw new Error('Cloud backup is empty');
      var msg = 'Cloud backup from ' + new Date(rows[0].updated_at).toLocaleString() + '\n\n' + counts(d) +
        '\n\nALL current data on this device will be replaced. Continue?';
      if (!confirm(msg)) { openBackup(); return; }
      if (d.shared !== undefined) { cache[KEYS[0]] = d.shared == null ? undefined : JSON.stringify(d.shared); dirty[KEYS[0]] = 1; }
      if (d.device) { cache[KEYS[1]] = JSON.stringify(d.device); dirty[KEYS[1]] = 1; }
      if (d.rental) { cache[KEYS[2]] = JSON.stringify(d.rental); dirty[KEYS[2]] = 1; }
      Object.keys(cache).forEach(function (k) { if (cache[k] === undefined) delete cache[k]; });
      await flush();
      alert('Cloud backup restored.');
      location.reload();
    } catch (e) { alert('Cloud restore failed: ' + (e && e.message || e)); openBackup(); }
  }

  function openBackup() {
    var last = origGet.call(localStorage, 'bharat_last_backup');
    var lastC = origGet.call(localStorage, 'bharat_last_cloud');
    document.getElementById('mt').textContent = 'Settings & Backup';
    document.getElementById('mb').innerHTML =
      '<p style="margin:0 0 12px;color:#697586;font-size:14px">One file with all device, rental, customer and mask-sale data. ' +
      'Last backup: <b>' + (last ? new Date(last).toLocaleString() : 'never') + '</b></p>' +
      '<pre style="background:#f7f8fa;border-radius:10px;padding:10px;font-size:12px;margin:0 0 14px;white-space:pre-wrap">' +
      counts({ shared: parse(KEYS[0]) || {}, device: parse(KEYS[1]) || {}, rental: parse(KEYS[2]) || {} }) + '</pre>' +
      '<button id="bk_exp" style="width:100%;padding:14px;border:0;border-radius:12px;background:#0f968d;color:#fff;font-weight:700;font-size:15px;margin-bottom:10px">Export full backup</button>' +
      '<label style="display:block;text-align:center;padding:14px;border:2px solid #0f968d;border-radius:12px;color:#0f968d;font-weight:700;font-size:15px">Restore from file' +
      '<input id="bk_imp" type="file" accept="application/json,.json" style="display:none"></label>' +
      '<p style="margin:10px 0 0;color:#697586;font-size:12px">Also accepts older Device Tracker and Rental Tracker backups.</p>' +
      '<h3 style="margin:20px 0 8px;font-size:16px">Cloud backup</h3>' +
      '<p style="margin:0 0 10px;color:#697586;font-size:13px">One shared copy stored online. Anyone with the app can restore it. Last update: <b>' + (lastC ? new Date(lastC).toLocaleString() : 'never') + '</b></p>' +
      '<button id="cl_up" style="width:100%;padding:14px;border:0;border-radius:12px;background:#0b7a8f;color:#fff;font-weight:700;font-size:15px;margin-bottom:10px">Update cloud backup</button>' +
      '<button id="cl_dn" style="width:100%;padding:14px;border:2px solid #0b7a8f;border-radius:12px;background:#fff;color:#0b7a8f;font-weight:700;font-size:15px">Restore from cloud</button>' +
      '<h3 style="margin:20px 0 8px;font-size:16px">App lock</h3>' +
      '<p style="margin:0 0 10px;color:#697586;font-size:13px">Protects customer ID proofs and money records. Asks for the PIN when the app opens or after 1 minute away.</p>' +
      '<button id="sec_pin" style="width:100%;padding:13px;border:0;border-radius:12px;background:#182336;color:#fff;font-weight:700;font-size:15px">' + (window.BharatSecurity && BharatSecurity.hasPin() ? 'Turn off app lock' : 'Set PIN lock') + '</button>' +
      '<h3 style="margin:20px 0 8px;font-size:16px">Rent alerts</h3>' +
      '<p id="sec_notes" style="margin:0;color:#697586;font-size:13px">The phone will remind you at 9 AM on each rent due date, and daily while any rent is overdue.</p>';
    document.getElementById('bk_exp').onclick = exportAll;
    document.getElementById('cl_up').onclick = function () { cloudPush(this); };
    document.getElementById('cl_dn').onclick = function () { cloudPull(this); };
    document.getElementById('sec_pin').onclick = async function () {
      if (!window.BharatSecurity) return;
      if (BharatSecurity.hasPin()) await BharatSecurity.removePin(); else await BharatSecurity.setPin();
      openBackup();
    };
    var pv = window.BharatSecurity && BharatSecurity.preview();
    if (pv) document.getElementById('sec_notes').insertAdjacentHTML('beforeend', '<br><b>' + pv.length + ' reminder(s) currently planned.</b>');
    document.getElementById('bk_imp').onchange = function (e) { var f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); };
    document.getElementById('sheet').classList.remove('hidden');
  }
  function addBackupButton() {
    var logo = document.querySelector('.brand-logo');
    if (!logo) return;
    logo.style.cursor = 'pointer';
    logo.title = 'Backup & Restore';
    logo.addEventListener('click', openBackup);
  }

  window.BharatStore = { patch: patch, flush: flush, exportAll: exportAll, openBackup: openBackup };
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);

  (async function boot() {
    try {
      db = await open();
      for (var i = 0; i < KEYS.length; i++) { var v = await idbGet(KEYS[i]); if (v != null) cache[KEYS[i]] = v; }
      await migrate();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
      patch(window);
    } catch (e) {
      alert('Storage could not start (' + (e && e.message || e) + '). Using temporary storage — please export a backup.');
    }
    loadScripts(['shared.js', 'trackers.js', 'app.js', 'security.js']);
    addBackupButton();
  })();
})();
