# Joseph Ukpong's Portfolio

A space-themed, pixel-art portfolio. Plain HTML, CSS and JavaScript (canvas); no build step.

**Flow:** Landing (ship drifting past Earth) → **Launch** → Mission Control (live star readouts that cycle every 20 s) → **Projects / Experience** → *Confirm Interstellar Travel* → hyperspace → planet map → land on a planet to read the details.

## Editing content

All planet text lives in **`js/data.js`** (`PORTFOLIO.experience` and `PORTFOLIO.projects`). Every entry currently holds placeholder text and has `placeholder: true`, which shows a "Placeholder content" badge. Fill in the fields and set `placeholder` to `false`.

The Mission Control star catalogue (`STARS`) is in the same file. Its values are approximate figures from each star's Wikipedia infobox.

## Files

- `index.html`: markup for every screen and the two confirmation dialogs
- `styles.css`: cockpit, CRT and pixel UI styles
- `js/pixel.js`: noise helpers, the starfield/Earth/ship/hyperspace engine, star and planet sprites
- `js/scenes.js`: the six planet landscapes
- `js/app.js`: screen flow, dialogs, star cycling and the clickable cockpit controls
- `classic/`: the previous version of the site, kept intact

Respects `prefers-reduced-motion` (slower drift, no zoom or shake, and a short static hyperspace frame). All controls are real buttons, so they work from the keyboard.

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Live Site

[justjokan.github.io/personal-portfolio](https://justjokan.github.io/personal-portfolio)
