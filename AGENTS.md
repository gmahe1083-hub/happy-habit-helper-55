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
