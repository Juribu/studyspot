# StudySpot

A single-screen productivity dashboard that bundles all the tools you need to get into focus mode — a clock, pomodoro timer, todo list, lofi/jazz music player, motivational quotes, study stats, and a picker for aesthetic backgrounds — into one clean page you can throw up on your laptop while you work on your main monitor.

![StudySpot](assets/images/PlayScreen.jpg)

## Motivation

I have a monitor and I like to do work on my big monitor and use my laptop screen as a background, and pomodoro timer, task tracker. I realized that there are too many things to open, so I integrated all of these functions into one screen, so that I can just open all of these tools that I use while I'm on productivity mode with just one click!

## Features

- **Clock** — a big, always-visible current time display
- **Rotating quotes** — a new motivational quote every hour to keep you going
- **Pomodoro timer** — Pomodoro, Short Break, and Long Break modes with customizable durations and an end-of-session alarm
- **Todo list** — add, edit, check off, drag-reorder, and delete tasks; completed tasks slide to the bottom; persists across sessions
- **Music player** — built-in lofi and jazz tracks with play/pause/prev/next controls and mood/genre/playlist pickers, plus a custom-link field for any SoundCloud URL. A **Spotify** option is also available alongside SoundCloud — toggle it inside the player block. Full-track playback requires a Spotify Premium account; free accounts can still browse and play 30-second previews. StudySpot never sees, stores, or transmits your Spotify credentials — login is handled entirely inside Spotify's own embed, and whether your Spotify session sticks across reloads depends on your browser's third-party cookie policy (most modern browsers will ask you to log in again each session).
- **Background picker** — choose from curated still backgrounds (coffee shop, forest, library, rain, street) or animated video backgrounds (hideout, traveling, watching sunset, window stars) to match your vibe
- **Study stats** — daily goal, focus-time totals, weekly bar chart, completed-sessions count, and a 🔥 daily streak; only Pomodoro sessions count toward focus time (breaks are logged but excluded)
- **Backup & restore** — export your stats and settings to a JSON file, or import a previous backup
- **Edit layout mode** — drag and freely resize the timer, music player, and todo blocks to fit your screen; positions persist across reloads, with a one-click reset
- **Fullscreen mode** — one click to hide everything else on your laptop

## Roadmap — what's next

Ideas in rough priority order. Nothing here is committed; this is a sketch of where StudySpot could go.

- **Leaderboard** — compare daily / weekly focus time with friends. Needs a lightweight backend (Firebase or Supabase would fit), opt-in account, and a privacy-respecting "share by handle" model so you don't have to expose anything you don't want to.
- **Achievements & streak milestones** — small badges for things like first 10-hour week, 30-day streak, finishing a task that's been on your list for a week. Slots in naturally next to the leaderboard.
- **Ambient sound mixer** — layerable rain / cafe / fireplace / white noise on top of the music player, with per-track volume sliders.
- **Scratchpad / notes block** — a fourth resizable block for quick notes during a session, persisted to `localStorage`.
- **Task ↔ session linking** — pick a task before starting a Pomodoro and have the session count toward that task. Unlocks per-task time tracking and a "what did I actually spend time on this week?" view.
- **GitHub-style yearly heatmap** — a contributions-style grid for study sessions, in addition to the current weekly chart.
- **Custom backgrounds** — let users drop in their own image or short MP4 loop.
- **Theme / accent customization** — pick the highlight color and font weight; pairs well with the existing background picker.
- **Keyboard shortcuts + cheatsheet overlay** — start/pause timer, next track, toggle fullscreen, open stats, etc., from the keyboard.
- **Cloud sync** — opt-in cross-device sync for stats and tasks. Mostly only worth doing once the leaderboard backend exists, since it reuses the same infra.
- **Mobile / tablet layout** — the current layout assumes a laptop screen; a stacked single-column variant would make it usable on a phone next to the main monitor.

## Getting Started

**Live site:** [https://juribu.github.io/studyspot/](https://juribu.github.io/studyspot/) — just open it in your browser, no install needed.

Or run it locally — no build step, no dependencies, no setup, it's just HTML, CSS, and vanilla JavaScript.

```bash
git clone <this-repo>
cd studyspot
open index.html
```

Or just double-click `index.html`. That's it.

Tip: open it on your laptop, hit the fullscreen button (or `fn + f` on Mac), and keep your main monitor for actual work.

## Project Structure

```
studyspot/
├── index.html          # main page
├── style.css           # all styles
├── js/
│   ├── main.js         # boots everything up
│   ├── clock.js        # live clock
│   ├── timer.js        # pomodoro timer
│   ├── tasks.js        # todo list
│   ├── music.js        # music player (SoundCloud + Spotify)
│   ├── quotes.js       # hourly quote rotation
│   ├── background.js   # background picker (images + video)
│   ├── stats.js        # study stats, streak, daily goal, export/import
│   └── layout.js       # edit-mode drag/resize for the main blocks
└── assets/
    ├── icons/          # UI icons (SVG)
    ├── images/         # background images
    ├── mp4/            # animated video backgrounds
    └── music/          # alarm sound
```

## Tech

Plain HTML + CSS + JavaScript. State (tasks, stats, chosen background, timer settings) is saved to `localStorage` so it survives page reloads.

## Credits

Backgrounds and lofi artwork are for personal study use. Fonts via Google Fonts (Inter).
