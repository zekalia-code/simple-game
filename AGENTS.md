# Agent notes

## What this repo is
Two dependency-free static sites (ES modules + one vendored library). No build,
no package manager, no bundler, no test suite, no database.

- `/` → `index.html` + `js/*.js` + `styles/ar.css` (RELIC AR camera app)
- `/game/` → `game/index.html` + `game/game.js` + `game/style.css` (three.js game)

## Running / verifying
- `docker compose -f docker-compose.base44.yml up -d` serves the working tree
  through `dev/serve.mjs` (Node, zero dependencies) on host port **3000**. The
  repo is bind-mounted read-only and files are served with
  `Cache-Control: no-store`, so an edit is visible on the next load — there is
  no dev server to restart and no hot reload.
- Do not swap the server for nginx without checking permissions: the clone's
  root directory is mode 700, so nginx's worker user cannot traverse it and
  every request returns 403.
- Verify with `curl -s http://localhost:3000/ | head` (expects the RELIC AR
  markup) and `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/js/main.js`.
- Because nothing is compiled, a broken app is a JS runtime error, not a build
  error. Check the browser console (`window.__base44_preview.consoleLogs`) when a
  page renders but nothing responds.

## Non-obvious gotchas
- **Camera access is expected to fail inside the preview iframe.** The preview
  frame has no `camera` permissions policy, so `getUserMedia` rejects with
  `NotAllowedError` and the app intentionally falls back to its synthetic demo
  scene (`js/demo.js`). That fallback is the correct behaviour in the sandbox —
  do not "fix" it by removing the permission handling. Real camera use requires
  opening the app in a top-level tab over HTTPS.
- `three` is imported by bare specifier through the import map in `index.html`
  (`./js/vendor/three.module.js`). If you upgrade three, replace the vendored file
  and keep it a single ES module build — there is no bundler to resolve anything else.
- The WebGL renderer uses `preserveDrawingBuffer: true` so `js/capture.js` can
  read the canvas after the frame is drawn. Removing it silently breaks photo capture.
- `document.body.dataset.mode` is the app's observable state: `idle` → `live`
  (real camera) or `demo` (fallback). Useful for verifying the start flow.
- The relic counter in the HUD (`#count`) reflects placements; `✕` clears them.
