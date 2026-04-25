# StudySpot — Claude Notes

## Project overview
StudySpot is a single-page productivity dashboard you keep open on a laptop while you work on a main monitor. One static HTML page bundles a clock, hourly-rotating quote, Pomodoro timer with study stats, todo list, music player (SoundCloud + Spotify embed), background picker (images + MP4 videos), and a drag/resize "edit layout" mode. Everything is plain HTML/CSS/vanilla JS — no build step, no dependencies, no server. State lives in `localStorage`. Hosted on GitHub Pages at https://juribu.github.io/studyspot/.

## Tech stack
- **HTML / CSS / vanilla JavaScript** — no framework, no bundler, no transpiler
- **No package manager** — no `package.json`, no `node_modules`. Don't add one without asking.
- **External runtime deps loaded by URL only**:
  - SoundCloud Widget API: `https://w.soundcloud.com/player/api.js` (loaded dynamically by `js/music.js`)
  - Spotify embeds: `https://open.spotify.com/embed/playlist/<id>` iframes
  - Google Fonts (Inter): loaded in `index.html` `<head>`
- **Persistence**: `localStorage` only. No backend, no API calls outside the third-party embeds above.
- **Deployment**: GitHub Pages (the live site is served straight from this repo).

## Architecture
Every JS file is a self-contained IIFE module that exposes one global (`TimerModule`, `MusicModule`, etc.) with at minimum an `init()` method. `js/main.js` owns the boot order — it lists every module and calls `init()` on each after `DOMContentLoaded`. Modules don't import each other; they reference each other through the globals (e.g. `TimerModule` calls `StudyStatsModule.recordSession(...)` directly, guarded by `typeof StudyStatsModule !== 'undefined'`).

UI is laid out in `index.html` once at load. JS modules attach behavior to existing DOM nodes by ID/class. The "edit layout" mode (`js/layout.js`) freezes the three main blocks (`.pomodoro-timer`, `.music-section`, `.todo-list`) into `position: fixed` so the user can drag/resize them; positions are *not* persisted.

All styles live in a single `style.css`. It is large (~2,200 lines) and section-commented (`/* ====== HEADER ====== */`). It uses a few CSS custom properties on `:root`, lots of `clamp()` for fluid sizing, and `:has()` selectors in places (e.g. lifting the music-section z-index when its dropdown is open).

## Key directories and files
```
/
├── index.html                  # The whole UI — one page, no templates
├── style.css                   # All styles (~2200 lines, section-commented)
├── README.md                   # User-facing readme (motivation, features, run instructions)
├── js/
│   ├── main.js                 # Boots all modules in order on DOMContentLoaded
│   ├── clock.js                # Live HH:MM clock, ticks every minute
│   ├── timer.js                # Pomodoro/short/long timer + popup + alarm.wav
│   ├── tasks.js                # Todo list with inline edit, drag-to-bottom on complete
│   ├── stats.js                # Session tracking, weekly chart, streak, daily goal, export/import
│   ├── music.js                # Source toggle (SoundCloud Widget API + Spotify embed), playlist/mood/genre/custom-link pickers
│   ├── background.js           # Image + video background picker
│   ├── quotes.js               # Hourly-deterministic quote rotation
│   └── layout.js               # Edit mode: drag and resize the 3 main blocks
├── assets/
│   ├── icons/                  # SVG icons used by buttons (timer_settings, play, prev, next, mood, sound, background, stats, fullscreen, etc.)
│   ├── images/                 # Background images (street, rain, coffee, forrest, library) + lofi.png thumbnail
│   ├── mp4/                    # Video backgrounds (hideout, traveling, watchingSunset, windowStar)
│   └── music/                  # alarm.wav for timer end
└── .claude/
    ├── settings.local.json     # Local Claude permissions (gitignored — no, actually committed)
    └── resume-notes.md         # Session handoff notes (template)
```

## Conventions
**Module pattern** — every JS file follows the same shape:
```js
const SomeModule = (function() {
  const elements = { foo: document.getElementById('foo'), ... };
  const STORAGE_KEY = 'studyspot_<thing>';
  // private helpers...
  return {
    init() { /* wire up listeners, restore from localStorage */ }
  };
})();
```
Don't deviate from this — `js/main.js` calls `.init()` on each module by global name and silently skips any that aren't defined.

**localStorage keys** are namespaced with the `studyspot_` prefix:
- `studyspot_tasks`, `studyspot_sessions`, `studyspot_daily_goal`, `studyspot_timer_durations`, `studyspot_background`, `studyspot_music_source`, `studyspot_music_selections`, `studyspot_spotify_intro_seen`
- One legacy key (`studyspot.background` with a dot) is migrated on read in `js/background.js` — pattern to follow if you ever rename a key.

**Reads from `localStorage` are wrapped in try/catch** and fall back to defaults. Writes are not (they should rarely throw). Match this.

**DOM element refs are cached up-front** in an `elements` object at module top, not requeried inside event handlers. `tasks.js` does the same per-task in `addTaskEventListeners`.

**CSS organization**: one big `style.css`, section banners in `/* ===== ... ===== */` comments, fluid sizing with `clamp(min, vw, max)`, dropdowns share a base `.dropdown` + size modifier (`.dropdown--small/medium/large/up`). Source-source toggling for music uses sibling `.taste-soundcloud` / `.taste-spotify` groups with `[hidden]`.

**Comments are JSDoc-style** (`/** ... */`) on most functions. Match the existing density — don't strip them when editing existing files, but don't over-document trivial new helpers either. WHY-comments only; the codebase already does this.

**No emojis in code or commits** unless the existing code has them (only quote strings and the timer popup `⏰` use them).

**Git commit style** (from `git log`): short lowercase imperative subject lines, sometimes with a `+` for follow-up work in the same commit (e.g. "added mp4backgrounds + make blocks adjustable", "fixed timer counting inconsistency + overall stats only show pomodoro time but still logs breaks"). No conventional-commit prefixes.

## Keeping this file up to date
Update CLAUDE.md only when a task changes something **durable** about the project — not after every task. Triggers:
- A new JS module, asset folder, or top-level file (update the directory tree + module load order notes)
- A new `localStorage` key or a renamed/migrated one (update the localStorage list)
- A new convention or a shift in an existing one (module pattern, comment style, commit style, etc.)
- A new gotcha worth warning future-Claude about (a non-obvious constraint, an embed quirk, a load-order trap)
- A new external runtime dependency or deployment change

Do **not** update for: bug fixes, refactors that don't change conventions, in-progress work, or anything that belongs in a commit message. When in doubt, skip.

After any update, echo back the exact diff (added/removed/changed lines) in the chat reply so the change can be sanity-checked.

## How to run things
- **Run locally**: `open /Users/jay/Desktop/studyspot/index.html` (macOS) or just double-click. No install, no server needed for the basics.
- **Serve over HTTP** (only needed if you hit autoplay or CORS issues with embeds): `python3 -m http.server 8000` from the repo root, then visit `http://localhost:8000/`.
- **Build**: none.
- **Test**: none. There's no test suite. Manual verification in a browser is the only check.
- **Lint / typecheck**: none configured. No `node` is installed in this environment, so don't try `node --check` for syntax — just be careful and verify in the browser.
- **Deploy**: push to `main`. GitHub Pages serves the repo as-is.

## Gotchas
- **No build, no node, no package manager.** Don't suggest npm/yarn installs, don't add bundling, don't reach for TypeScript or React. The "no setup" property is a feature.
- **`js/main.js` is the source of truth for module load order.** If you add a new `<script>` to `index.html`, also add it to `main.js`'s `modules` array so it gets `init()`-ed.
- **Modules talk via globals, not imports.** Use `typeof OtherModule !== 'undefined' && OtherModule.method(...)` when one module calls another, mirroring the existing pattern in `timer.js → StudyStatsModule`.
- **Spotify embed has fixed render heights** (~152px compact, ~352px+ large). Stretching to anything in between leaves a dark blank band inside the iframe — `style.css` shrinks the picker column in Spotify mode (via `:has()`) so the music-section doesn't grow past the embed's natural height. Don't undo this without thinking.
- **Spotify Premium required for full-track playback**; free accounts get 30-second previews. Login happens entirely inside Spotify's iframe — StudySpot never touches credentials.
- **SoundCloud Widget API is loaded by URL at runtime.** `js/music.js` injects the `<script>` and instantiates `SC.Widget(iframe)` after `READY`. If `SC` is undefined, the script tag failed to load (network/blocker).
- **Layout edit mode does not persist.** Reloading restores the default flex layout — by design (per `js/layout.js` header comment).
- **`align-items: stretch` on `.music-section`** is what makes the music-player and picker-column the same height. Beware when changing one side's height.
- **Stats only counts `type === 'pomodoro'`** for totals, streak, weekly chart — short/long breaks are recorded but excluded from "study time" math (see `js/stats.js`). This is intentional per recent commit.
- **Timer uses real-elapsed-time sync**, not a naïve countdown. `endTime = Date.now() + remaining`, polled every 250ms; resyncs on `visibilitychange` so background tabs don't drift.
- **`.gitignore` excludes `.env`, `.env.local`, `node_modules/`** — none of these exist in the repo, but if you ever add config that contains secrets, use one of these.
- **`.DS_Store` files are committed** (macOS metadata). Don't fight this — just don't `git add -A` blindly.
- **No CI, no pre-commit hooks.** Commits go straight in.
