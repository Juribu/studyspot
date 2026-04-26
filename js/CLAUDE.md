# js/ — Claude Notes

All files here are vanilla-JS IIFE modules with no imports. They share these conventions; check `../CLAUDE.md` for repo-wide context.

## Module shape (mandatory)
```js
const FooModule = (function() {
  const elements = { /* DOM refs cached up-front */ };
  const STORAGE_KEY = 'studyspot_foo';
  // private helpers...
  return { init() { /* wire listeners, restore from localStorage */ } };
})();
```
- One global per file, named `<Thing>Module`.
- `main.js`'s `modules` array lists every module by name and calls `init()` after `DOMContentLoaded` — **add new modules to that array, not just to `index.html`'s script tags.**
- Modules call each other through globals, guarded with `typeof X !== 'undefined'` (see `timer.js` → `StudyStatsModule.recordSession`).

## Per-file cheat sheet
- **`main.js`** — boot orchestrator + the global F-key fullscreen shortcut. Order in the `modules` array matters when one module calls another at init time.
- **`clock.js`** — trivial: `setInterval(updateClock, 60000)`.
- **`timer.js`** — Pomodoro state machine. Uses `endTime = Date.now() + ms` and a 250ms tick that calls `syncTimer()` so backgrounded tabs don't drift; also resyncs on `visibilitychange`. Reports completed sessions to `StudyStatsModule.recordSession`. Timer popup styles are inline (intentional — fully self-contained alarm UI).
- **`tasks.js`** — Todo list. Persists `[{text, completed}]`. Completed tasks slide to bottom via `moveCompletedTasksToBottom` after a 150ms animation delay. Sample tasks in HTML are replaced on load if any saved tasks exist.
- **`stats.js`** — Sessions stored as `{id, startTime, endTime, durationSeconds, type, completed}`. Stats math (totals, streak, weekly chart) **only counts `type === 'pomodoro'`** — breaks are recorded but excluded. Modal is built by string-concat HTML helpers (`buildGoalRing`, `buildWeeklyChart`, etc.). Export/import round-trips JSON; import dedupes by `id`.
- **`music.js`** — Two source UIs with different shapes:
  - SoundCloud — genre/mood dropdown pickers in the right column → SoundCloud Widget API in a hidden iframe.
  - Spotify — the right column (`.music-taste`) is collapsed by CSS (`.music-section:has(.player-spotify:not([hidden])) .music-taste { display: none; }`) so the embed gets the full width. A slim always-visible `.spotify-input-bar` (Spotify-icon + paste-link input + Load button) sits inside `.music-player` directly below the embed, right-aligned so it visually anchors the bottom-right of the section without overlaying the iframe. Invalid links flash a red shake (`.error` class). A sample playlist (`SAMPLE_SPOTIFY_ID`, Lofi Beats) loads by default; pasting a Spotify share link replaces it.
  
  `selections` keeps a separate last-pick per source so toggling never bleeds state. `playlistUrls` only catalogs the SoundCloud entries (lofi/jazz/focus). Spotify selections are `{type:'sample'|'custom', value:<playlistId>}` — only `'custom'` is persisted; legacy `genre`/`mood` saves are silently dropped on load. Custom IDs are parsed from any `playlist[:/]<id>` URL form. Notification toast and source-toggle styles are inline.
- **`background.js`** — Image and video backgrounds. Switching to a video adds `body.has-video-bg` and plays `<video id="bg-video">`; switching back clears `src` and pauses. Has a one-time legacy-key migration (`studyspot.background` → `studyspot_background`) — pattern to copy if you rename keys.
- **`quotes.js`** — Hourly rotation, deterministic by `Math.floor(Date.now() / 3600_000) % quotes.length`. Schedules a one-shot `setTimeout` to the next hour boundary, then a `setInterval` for every hour after. Same hour always shows the same quote.
- **`layout.js`** — Edit mode. First entry into edit mode `freezeBlocks()` measures all three blocks **before** mutating any (otherwise pulling one out of flow reflows the others). After freezing, blocks are `position: fixed` with explicit width/height/left/top. Geometry is persisted to `studyspot_layout` after every drag/resize and restored at boot via `restoreSavedPositions()`; the reset button clears the key. Block identity in storage uses class-name keys (`pomodoro-timer` / `music-section` / `todo-list`) — keep them in sync if you rename a block.

## Things to be careful about
- **Don't add ES modules** (`import`/`export`). The repo loads scripts via plain `<script>` tags in document order; switching to modules would change script execution timing and break the `MusicModule`-needs-`SC`-after-script-load dance.
- **Don't add a build step.** No bundler, no transpiler. The "open `index.html` and it works" property is load-bearing.
- **Cache DOM refs in the `elements` object** at module top — match the pattern. Don't re-`querySelector` inside event handlers.
- **Wrap `JSON.parse(localStorage.getItem(...))` in try/catch** with a sane fallback. Writes are unwrapped — that's deliberate.
- **`alarm.wav` must remain at `assets/music/alarm.wav`** — `timer.js` hardcodes the path.
- **The SoundCloud widget script is fetched from a URL.** No offline mode. If `SC` is undefined the widget silently no-ops.
