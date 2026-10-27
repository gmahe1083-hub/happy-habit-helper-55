/* Shared publication is separate from the manually restored safety backup. */
(function (root) {
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (key) { out[key] = canonical(value[key]); });
      return out;
    }
    return value;
  }
  function fingerprint(data) { return JSON.stringify(canonical(data)); }
  function create(options) {
    var meta = options.readMeta() || {}, pending = null, checking = false, publishing = false;
    var status = 'Checking shared updates…', bootApplied = false;
    function localChanged() { return meta.baseline !== fingerprint(options.snapshot()); }
    function save() { options.writeMeta(meta); }
    function setStatus(text) { status = text; options.status(text, !!pending); }
    async function apply(row, boot) {
      if (!row.payload || row.payload.format !== 'unified' || !row.payload.data) throw new Error('Invalid shared data');
      // Persist a recovery copy before replacing even a clean local snapshot.
      await options.recovery(options.snapshot());
      await options.apply(row.payload.data);
      meta = { revision: row.revision, baseline: fingerprint(options.snapshot()) };
      save(); pending = null; bootApplied = !!boot;
      setStatus('Shared data is up to date.');
      if (!boot) options.refresh();
    }
    async function check(boot) {
      if (checking || publishing) return;
      checking = true;
      try {
        var row = await options.latest(meta.revision);
        if (!row) { setStatus(meta.revision ? 'Shared data is up to date.' : 'No shared upload yet.'); return; }
        if (row.revision === meta.revision) {
          setStatus(localChanged() ? 'Local entries are waiting to be uploaded.' : 'Shared data is up to date.'); return;
        }
        pending = row;
        var empty = options.empty();
        if ((empty || !localChanged()) && (boot || options.idle())) await apply(row, boot);
        else setStatus(localChanged() && !empty ? 'Shared update waiting — local entries are protected.' : 'Shared update waiting until the current screen closes.');
      } catch (e) { setStatus('Offline or cloud unavailable — local data is kept.'); }
      finally { checking = false; }
    }
    async function upload() {
      if (publishing || checking) throw new Error('Cloud check in progress. Please try again.');
      publishing = true;
      var snapshot = options.snapshot(), signature = fingerprint(snapshot);
      try {
        var row = await options.publish({ app: 'Bharat Surgicals Tracker', format: 'unified', version: 1, exportedAt: new Date().toISOString(), data: snapshot }, meta.revision || 0);
        meta = { revision: row.revision, baseline: signature }; save(); pending = null;
        setStatus(localChanged() ? 'Uploaded. Newer local entries still need uploading.' : 'Uploaded — other devices receive this update automatically.');
      } finally { publishing = false; }
    }
    return {
      check: check, upload: upload,
      activate: function () {
        if (bootApplied || meta.baseline == null) { meta.baseline = fingerprint(options.snapshot()); save(); }
      },
      receive: async function () {
        var row = await options.latest();
        if (row) await apply(row, false);
      },
      status: function () { return status; },
      waiting: function () { return !!pending; }
    };
  }
  root.BharatCloudSync = { create: create, fingerprint: fingerprint };
})(typeof window === 'undefined' ? globalThis : window);