# assets/ — Claude Notes

Static assets shipped as-is. No processing, no manifest. Filenames are hardcoded in JS/HTML/CSS, so renaming an asset means hunting down references.

## Layout
- `icons/` — SVGs used by buttons. Names map directly to button purposes (`play.svg`, `pause.svg`, `prev.svg`, `next.svg`, `mood.svg`, `sound.svg`, `timer_settings.svg`, `background.svg`, `stats.svg`, `fullscreen.svg`). Referenced from `index.html` and from `js/music.js` (`updatePlayButton` swaps `play.svg` ↔ `pause.svg`).
- `images/` — JPG/PNG backgrounds + the `lofi.png` track thumbnail. Filenames are hardcoded in `js/background.js`'s `backgrounds` array — typos persist (`forrest.jpg`, not `forest.jpg`); don't "fix" them without updating the array. `PlayScreen.jpg` is only used by the README.
- `mp4/` — Video backgrounds (`hideout.mp4`, `traveling.mp4`, `watchingSunset.mp4`, `windowStar.mp4`). Same hardcoded-in-`background.js` rule.
- `music/` — `alarm.wav` only. Path is hardcoded in `js/timer.js` (`new Audio('assets/music/alarm.wav')`). Don't move it.

## Adding a new background
1. Drop the file into `images/` or `mp4/`.
2. Add an entry to the `backgrounds` array in `js/background.js` with a unique `id`, a display `name`, `type: 'image'|'video'`, and the `url`.
3. That's it — the dropdown rebuilds from that array.

## Adding a new icon
1. Drop the SVG into `icons/`.
2. Reference it from `index.html` (or wherever it's needed). No registry to update.
