/* App lock (4–6 digit PIN) and overdue-rent phone notifications. */
(function () {
  var PIN_KEY = 'bharat_pin_v1', LOCK_AFTER_MS = 60 * 1000;
  var P = (window.Capacitor && window.Capacitor.Plugins) || {};
  var native = !!(window.NB && window.NB.native);
  var hiddenAt = 0;

  async function hash(pin, salt) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function getPin() { try { return JSON.parse(localStorage.getItem(PIN_KEY) || 'null'); } catch (e) { return null; } }

  /* ---------- Lock screen ---------- */
  function showLock() {
    var rec = getPin();
    if (!rec || document.getElementById('lockscreen')) return;
    var el = document.createElement('div');
    el.id = 'lockscreen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#0f968d,#087a73);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:inherit;padding:24px';
    el.innerHTML =
      '<img src="bharat-logo.jpg" style="width:84px;height:84px;border-radius:20px;background:#fff;object-fit:contain;margin-bottom:18px">' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:6px">Bharat Surgicals Tracker</div>' +
      '<div id="lk_msg" style="font-size:14px;opacity:.9;margin-bottom:18px">Enter your PIN</div>' +
      '<input id="lk_in" type="password" inputmode="numeric" maxlength="6" autocomplete="off" style="width:200px;text-align:center;font-size:28px;letter-spacing:10px;padding:12px;border:0;border-radius:14px;color:#182336">' +
      '<button id="lk_go" style="margin-top:14px;width:200px;padding:13px;border:2px solid #fff;background:transparent;color:#fff;border-radius:14px;font-weight:700;font-size:16px">Unlock</button>';
    document.body.appendChild(el);
    var inp = el.querySelector('#lk_in'), fails = 0;
    async function tryUnlock() {
      var r = getPin();
      if (r && (await hash(inp.value, r.salt)) === r.hash) { el.remove(); scheduleSoon(); return; }
      fails++; inp.value = '';
      el.querySelector('#lk_msg').textContent = fails >= 5 ? 'Wrong PIN. Wait 30 seconds.' : 'Wrong PIN, try again';
      if (fails >= 5) { inp.disabled = true; setTimeout(function () { inp.disabled = false; fails = 0; el.querySelector('#lk_msg').textContent = 'Enter your PIN'; }, 30000); }
    }
    el.querySelector('#lk_go').onclick = tryUnlock;
    inp.addEventListener('keyup', function (e) { if (e.key === 'Enter' || inp.value.length === (getPin() || {}).len) tryUnlock(); });
    setTimeout(function () { inp.focus(); }, 100);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) showLock();
  });

  async function setPin() {
    var a = prompt('Choose a 4–6 digit PIN');
    if (a == null) return false;
    if (!/^\d{4,6}$/.test(a)) { alert('PIN must be 4 to 6 digits.'); return false; }
    if (prompt('Enter the same PIN again') !== a) { alert('PINs did not match.'); return false; }
    var salt = crypto.getRandomValues(new Uint32Array(2)).join('-');
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt: salt, hash: await hash(a, salt), len: a.length }));
    alert('App lock is on. The app will ask for this PIN when opened.');
    return true;
  }
  async function removePin() {
    var r = getPin(); if (!r) return;
    var a = prompt('Enter current PIN to turn off app lock');
    if (a == null) return;
    if ((await hash(a, r.salt)) !== r.hash) { alert('Wrong PIN.'); return; }
    localStorage.removeItem(PIN_KEY); alert('App lock turned off.');
  }

  /* ---------- Overdue-rent notifications ---------- */
  function rentalWin() { var f = document.getElementById('f_rental'); return f && f.contentWindow; }
  function getAlerts() {
    var w = rentalWin();
    try { return w && typeof w.alerts === 'function' ? w.alerts() : null; } catch (e) { return null; }
  }
  function at9(dateStr) { var d = new Date(dateStr + 'T09:00:00'); return d; }
  function money(n) { return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }
  function custName(w, id) {
    try { var c = (w.state.customers || []).find(function (x) { return x.id === id; }); return c ? c.name : 'Customer'; } catch (e) { return 'Customer'; }
  }
  function equipName(w, id) {
    try { var e = (w.state.equipment || []).find(function (x) { return x.id === id; }); return e ? e.name : 'device'; } catch (e) { return 'device'; }
  }
  function buildNotifications(list) {
    var w = rentalWin(), out = [], now = Date.now(), id = 1000;
    var tomorrow9 = new Date(); tomorrow9.setDate(tomorrow9.getDate() + 1); tomorrow9.setHours(9, 0, 0, 0);
    var overdue = list.filter(function (x) { return x.until < 0 && x.s.due > 0; });
    if (overdue.length) {
      var total = overdue.reduce(function (s, x) { return s + x.s.due; }, 0);
      out.push({ id: id++, title: overdue.length + ' overdue rental' + (overdue.length > 1 ? 's' : ''),
        body: overdue.slice(0, 3).map(function (x) { return custName(w, x.customerId) + ' ' + money(x.s.due); }).join(', ') + ' · total ' + money(total),
        schedule: { at: new Date(now + 5000) } });
      out.push({ id: id++, title: 'Rent still overdue', body: overdue.length + ' rental(s), ' + money(total) + ' pending. Open the app to record payment.',
        schedule: { at: tomorrow9 } });
    }
    list.filter(function (x) { return x.until >= 0; }).forEach(function (x) {
      var when = at9(x.c.due);
      if (when.getTime() > now) out.push({ id: id++, title: 'Rent due today', body: custName(w, x.customerId) + ' – ' + equipName(w, x.equipmentId) + (x.s.due ? ' · ' + money(x.s.due) + ' due' : ''), schedule: { at: when } });
    });
    return out;
  }
  async function schedule() {
    var list = getAlerts();
    if (!list) return null;
    var n = buildNotifications(list);
    if (native && P.LocalNotifications) {
      try {
        var perm = await P.LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') perm = await P.LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') return n;
        var pend = await P.LocalNotifications.getPending();
        if (pend.notifications.length) await P.LocalNotifications.cancel({ notifications: pend.notifications.map(function (x) { return { id: x.id }; }) });
        if (n.length) await P.LocalNotifications.schedule({ notifications: n });
      } catch (e) { console.warn('notifications', e); }
    }
    return n;
  }
  function scheduleSoon() {
    var tries = 0;
    (function poll() { if (getAlerts()) schedule(); else if (++tries < 30) setTimeout(poll, 1000); })();
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) schedule(); });

  window.BharatSecurity = {
    hasPin: function () { return !!getPin(); }, setPin: setPin, removePin: removePin,
    lock: showLock, schedule: schedule, preview: function () { var l = getAlerts(); return l ? buildNotifications(l) : null; }
  };

  showLock();
  scheduleSoon();
})();
