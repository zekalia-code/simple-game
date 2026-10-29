# NEON RELIC — Base44 dev environment notes

Static three.js browser game. There is **no build step, no package manager and no backend**: `index.html`, `style.css` and `game.js` are served as-is.

## How it runs here

- `docker-compose.base44.yml` runs a plain `nginx:alpine` container serving the checkout directly from the repo root (read-only bind mount) on host port 3000. Edits to the source files show on the next page load — there is no dev server or hot reload, so call `reload_preview` after a change.
- `docker/nginx-main.conf` runs nginx workers as **root**. The sandbox checkout directory is mode `700`/root-owned, so the image's default `nginx` user cannot traverse it and every request returns 403. Do not "fix" this by loosening the checkout permissions.
- No caching is set in `docker/nginx.conf`, so a browser refresh always reflects the current files.

## External dependency

`index.html` loads Three.js 0.128 from the jsDelivr CDN (`https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js`). The page needs internet access; without it the start card replaces itself with "3D LIBRARY DID NOT LOAD". No API keys or credentials of any kind are needed.

## Verifying it works

```sh
docker compose -f docker-compose.base44.yml up -d
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/   # expect 200
```

In the preview: the "NEON RELIC" start card must render, clicking **START EXPEDITION** must hide it and show a WebGL canvas with the HUD (ENERGY / TIME). If the card says "3D LIBRARY DID NOT LOAD", the CDN fetch failed.

## Notes

- Controls: WASD/arrows to move, Space to jump. Not verifiable by automation beyond the start click; play-test by hand.
- The sandbox host has no language runtimes; run nothing directly on the host.
