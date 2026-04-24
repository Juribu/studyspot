# StudySpot

A single-screen productivity dashboard that bundles all the tools you need to get into focus mode — a clock, pomodoro timer, todo list, lofi/jazz music player, motivational quotes, study stats, and a picker for aesthetic backgrounds — into one clean page you can throw up on your laptop while you work on your main monitor.

![StudySpot](assets/images/PlayScreen.jpg)

## Motivation

I have a monitor and I like to do work on my big monitor and use my laptop screen as a background, and pomodoro timer, task tracker. I realized that there are too many things to open, so I integrated all of these functions into one screen, so that I can just open all of these tools that I use while I'm on productivity mode with just one click!

## Features

- **Clock** — a big, always-visible current time display
- **Rotating quotes** — a new motivational quote every hour to keep you going
- **Pomodoro timer** — Pomodoro, Short Break, and Long Break modes with customizable durations
- **Todo list** — add, edit, check off, and delete tasks; persists across sessions
- **Music player** — built-in lofi and jazz tracks with play/pause/prev/next controls and mood/genre pickers
- **Background picker** — choose from curated backgrounds (coffee shop, forest, library, rain, street) to match your vibe
- **Study stats** — track your total focus time and sessions completed
- **Fullscreen mode** — one click to hide everything else on your laptop

## Getting Started

No build step, no dependencies, no setup — it's just HTML, CSS, and vanilla JavaScript.

```bash
git clone <this-repo>
cd studyspot
open index.html
```

Or just double-click `index.html`. That's it.

Tip: open it on your laptop, hit the fullscreen button, and keep your main monitor for actual work.

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
│   ├── music.js        # music player
│   ├── quotes.js       # hourly quote rotation
│   ├── background.js   # background picker
│   └── stats.js        # study stats tracking
└── assets/
    ├── icons/          # UI icons (SVG)
    ├── images/         # background images
    └── music/          # lofi + jazz tracks
```

## Tech

Plain HTML + CSS + JavaScript. State (tasks, stats, chosen background, timer settings) is saved to `localStorage` so it survives page reloads.

## Credits

Backgrounds and lofi artwork are for personal study use. Fonts via Google Fonts (Inter).
