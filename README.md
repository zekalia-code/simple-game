# RELIC AR

Two static, no-build projects served from this repository:

- `/` — **RELIC AR**, an augmented-reality camera app.
- `/game/` — **NEON RELIC**, the original three.js browser game.

## Run it

```bash
docker compose -f docker-compose.base44.yml up -d
```

Then open <http://localhost:3000>. `dev/serve.mjs` serves the working tree
read-only with caching disabled, so edits appear on refresh; there is no build
step and no bundler.

## RELIC AR

- Live camera feed (`getUserMedia`, rear camera by default) with a three.js layer
  composited on top of it (`js/scene.js`).
- Tap anywhere in the scene to anchor a relic ~4 m away in world space; drag to
  look around. On phones the view follows the device orientation sensor
  (`js/look.js`); on desktop it is drag-driven.
- The shutter composites the background (video frame or demo canvas) with the WebGL
  canvas into a PNG (`js/capture.js`) for saving.
- Everything runs in the browser. Camera frames are never uploaded.

### Camera requirements

`getUserMedia` needs a secure context and permission. When the camera is missing,
blocked, or the page is embedded in a frame without camera permission, the app
falls back to a synthetic demo scene (`js/demo.js`) and says so in a toast.
To use the real camera, open the app in its own browser tab (and on a phone, over
HTTPS).

## Notes

- `three@0.160.0` is vendored at `js/vendor/three.module.js` and mapped through an
  import map in `index.html`, so the app does not depend on a CDN at runtime.
- The game under `game/` is self-contained and unchanged.
