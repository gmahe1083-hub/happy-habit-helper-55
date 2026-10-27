<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- The tracker app is the original vanilla HTML/JS in `public/app/`; keep business logic there unchanged. Why: PRD requires identical numbers and wrapping, not a rewrite.
- `public/app/` is Capacitor's `webDir`; the `/` route only iframes it for web preview. Why: one source for web and APK.
- All Android-native behaviour (exports, back button, maps, PDFs) lives in `public/app/native-bridge.js` and is a no-op in browsers. Why: keeps tracker code untouched.
- Tracker iframes get the bridge via `parent.NB.install(window)` prepended to the `pre` script in `trackers.js`. Why: iframes have their own window prototypes.
- Tracker data keys are served from memory and persisted to IndexedDB by `public/app/storage.js`, which patches `Storage.prototype` per window and loads the tracker scripts only after data is loaded. Why: removes the localStorage size limit without touching tracker logic.
- The unified backup (`format: "unified"`) is the single export; import also accepts old per-tracker files. Why: PRD backup requirement.
- App lock and rent reminders live in `public/app/security.js`, loaded after the trackers; reminders reuse the rental tracker's own `alerts()` function. Why: no duplicated billing logic.
- Logo and icon images are source-controlled under `public/` and `public/app/`, with contained header sizing and padded home-screen variants. Why: Capacitor must package the logo offline and launcher masks must not crop it.
- Cloud backup is a single shared row in `public.cloud_backup` (id=1), pushed/pulled manually from Settings & Backup in `public/app/storage.js` via PostgREST with the publishable key; anon read/write is intentional (no per-user accounts). Why: user wants one shared online copy anyone with the app can restore, without logins.
- Shared publication uses a separate revisioned row in `public.shared_app_updates`, with the browser-safe controller in `public/app/cloud-sync.js`; poll metadata, compare revisions on upload, persist local baselines and recovery snapshots, and apply only at idle shell boundaries with no unpublished changes. Why: automatic receiving must not overwrite active forms, local edits, or the manual safety backup.
- Keep screen-motion overrides at the end of shell and embedded tracker styles, using shared duration/easing variables and a final reduced-motion override. Why: uploaded CSS must not reintroduce conflicting animations or accessibility regressions.
