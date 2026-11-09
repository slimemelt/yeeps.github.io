# Yeeps Channel site

Static site for yeeps.bloomnetworks.net: Channel / Don't Sleep, schedule, Watch (HLS), Fundings, DMCA and a small admin editor.

## Layout

- `index.html` – markup only, one `<section>` per view
- `css/` – `base` (tokens, reset), `stage` (artboard scaling, view visibility), `layout` (positioned art, from the Figma export), one file per view
- `js/` – ES modules: `router`, `menu`, `loader`, `content`, `store`, `views/*`, `admin/*` (lazy-loaded)
- `content/` – `channel.json`, `dont-sleep.json` (shows, schedule, text)
- `assets/` – `img/` artwork, `icons/` player icons

## Run locally

ES modules need http, not `file://`:

    python3 -m http.server 8000

## Content and the admin

`js/config.js` holds `API_BASE`. Empty: the admin at `#admin` needs no login and saves to localStorage (preview only). Set it to the deployed Worker URL (see `../worker`) for real login and shared saves.

## Short links

Redirects such as `yeeps.bloomnetworks.net/discord` are managed in the admin (Redirects tab) and stored by the Worker. GitHub Pages serves `404.html` for any path that doesn't exist; it asks the Worker for the saved links and forwards the visitor, or shows "Page not found". The same `404.html` lives in the Bloom and Monarch repos.

## Deploy (GitHub Pages)

1. Push this folder as its own repo under `slimemelt` (the `slimemelt.github.io` repo is already used by another project).
2. Settings > Pages > deploy from `main` / root. `CNAME` is already `yeeps.bloomnetworks.net`.
3. At Spaceship DNS add `CNAME yeeps -> slimemelt.github.io`.
