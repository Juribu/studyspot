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
- **`tasks.js`** — Todo list. Persists `[{text, completed, depth}]` (depth defaults to 0; legacy entries without it migrate transparently via destructuring default). The label is a `<span class="task-label">` (not `<label for>`), so clicking the row never toggles completion — only the checkbox itself does. Clicking the label enters inline edit mode; in edit, **Tab / Shift+Tab** adjusts indent depth on the parent `.todo-item` (capped at `MAX_DEPTH = 3`, applied as inline `padding-left = depth * 24px`). The same Tab handling exists on the add-task input (depth applied when the new task is saved). Indent is **visual + ordering grouping**: a depth-0 task plus all immediately following greater-depth tasks form a "group" (built by `buildGroups` / `collectGroup`). Checking a parent cascades the checked state down to all its subtasks (unchecking does not cascade), and it also *moves* the whole group — `reorganizeTasks` (replaces the old `moveCompletedTasksToBottom`) sinks groups whose parent is checked to the bottom, and within each group it also pushes completed children to the bottom of that parent's subtask list. **Subtask checkboxes do not trigger reorganize** — only a depth-0 toggle does, so a checked subtask stays put inside its parent's group until the parent itself moves. A Notion-style 6-dot drag handle (`.task-drag-handle`) sits before the checkbox and reveals on row hover (opacity-only, so layout doesn't jitter); HTML5 drag/drop reorders rows, and dragging a parent carries its whole `collectGroup(...)` block as one. The row only flips to `draggable=true` while the handle is mousedown (with a global mouseup/dragend cleanup) so click-drag from the label never starts a drag. Drop position is decided by cursor-vs-row-midline; dropping "below" inserts after the target's *whole group* so a dragged item never lands mid-subtask-run. Sample tasks in HTML are replaced on load if any saved tasks exist; `ensureDragHandles()` injects the handle span into any pre-existing `.todo-item` that lacks one.
- **`stats.js`** — Sessions stored as `{id, startTime, endTime, durationSeconds, type, completed}`. Stats math (totals, streak, weekly chart) **only counts `type === 'pomodoro'`** — breaks are recorded but excluded. Modal is built by string-concat HTML helpers (`buildGoalRing`, `buildWeeklyChart`, etc.). Export/import round-trips JSON; import dedupes by `id`.
- **`music.js`** — Two source UIs with different shapes:
  - SoundCloud — genre/mood dropdown pickers in the right column → SoundCloud Widget API in a hidden iframe.
  - Spotify — the right column (`.music-taste`) is collapsed by CSS (`.music-section:has(.player-spotify:not([hidden])) .music-taste { display: none; }`) so the embed gets the full width. A slim always-visible `.spotify-input-bar` (Spotify-icon + paste-link input + Load button) sits inside `.music-player` directly below the embed, right-aligned so it visually anchors the bottom-right of the section without overlaying the iframe. Invalid links flash a red shake (`.error` class). A sample playlist (`SAMPLE_SPOTIFY_ID`, Lofi Beats) loads by default; pasting a Spotify share link replaces it.
  
  `selections` keeps a separate last-pick per source so toggling never bleeds state. `playlistUrls` only catalogs the SoundCloud entries (lofi/jazz/focus). Spotify selections are `{type:'sample'|'custom', value:<playlistId>}` — only `'custom'` is persisted; legacy `genre`/`mood` saves are silently dropped on load. Custom IDs are parsed from any `playlist[:/]<id>` URL form. Notification toast and source-toggle styles are inline.
- **`background.js`** — Image and video backgrounds. Switching to a video adds `body.has-video-bg` and plays `<video id="bg-video">`; switching back clears `src` and pauses. Has a one-time legacy-key migration (`studyspot.background` → `studyspot_background`) — pattern to copy if you rename keys.
- **`quotes.js`** — Hourly rotation, deterministic by `Math.floor(Date.now() / 3600_000) % quotes.length`. Schedules a one-shot `setTimeout` to the next hour boundary, then a `setInterval` for every hour after. Same hour always shows the same quote.
- **`layout.js`** — Edit mode. First entry into edit mode `freezeBlocks()` measures all four blocks **before** mutating any (otherwise pulling one out of flow reflows the others). After freezing, blocks are `position: fixed` with explicit left/top. Each block records its natural size in `dataset.origW`/`origH` (captured at freeze time, never mutated); resize mutates `dataset.scaleX`/`scaleY`. Drag still sets `style.left/top`; `getBoundingClientRect()` returns post-transform coords so the math works unchanged. Storage shape is `{ left, top, origW, origH, scaleX, scaleY }` — legacy entries with `scale` (uniform) or `width`/`height` are still loadable. Block identity in storage uses class-name keys (`center-display` / `pomodoro-timer` / `music-section` / `todo-list`) — keep them in sync if you rename a block.
  
  **Two strategies, chosen per block by `usesFreeSizing(block)`:**
  - **uniform** (default): `transform: scale()` with `transform-origin: top left`. Aspect ratio locked (scaleX === scaleY). Browsers re-rasterize text/SVG sharply at the transformed scale.
  - **free**: mutate the block's actual `width = origW * scaleX` / `height = origH * scaleY` independently. Inner content keeps its CSS sizes — the block just provides more or less room. Used for the **todo list** (`.todo-list.floating .todo-items` drops its 200px max-height in style.css so the scroll area fills the taller block) and the **Spotify embed** (the `.player-spotify` wrapper + iframe height = `SPOTIFY_IFRAME_H * scaleY`, so Spotify re-renders at the new size and upgrades from compact to large UI as the block grows — `transform: scale()` would just stretch the iframe's bitmap, causing visible pixelation).
  
  A `MutationObserver` on `.music-player`'s class list re-runs `applyScaleStrategy` when the source toggles between SoundCloud and Spotify, so swapping mid-edit picks up the right strategy without involving `music.js`.

## Things to be careful about
- **Don't add ES modules** (`import`/`export`). The repo loads scripts via plain `<script>` tags in document order; switching to modules would change script execution timing and break the `MusicModule`-needs-`SC`-after-script-load dance.
- **Don't add a build step.** No bundler, no transpiler. The "open `index.html` and it works" property is load-bearing.
- **Cache DOM refs in the `elements` object** at module top — match the pattern. Don't re-`querySelector` inside event handlers.
- **Wrap `JSON.parse(localStorage.getItem(...))` in try/catch** with a sane fallback. Writes are unwrapped — that's deliberate.
- **`alarm.wav` must remain at `assets/music/alarm.wav`** — `timer.js` hardcodes the path.
- **The SoundCloud widget script is fetched from a URL.** No offline mode. If `SC` is undefined the widget silently no-ops.
