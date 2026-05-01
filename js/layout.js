/**
 * Layout Module
 * Lets the user toggle an edit mode to drag and resize the four utility
 * blocks (clock/quote, timer, music, tasks). Each block records its natural
 * size (`origW`/`origH`) once at freeze time; resize mutates `scaleX` and
 * `scaleY`.
 *
 * Two strategies, picked per block by `usesFreeSizing(block)`:
 *  - **uniform** (default): `transform: scale(s)` with `transform-origin: top left`.
 *    Aspect ratio is locked (scaleX === scaleY). Browsers re-rasterize text
 *    and SVG sharply under transform. Used for clock/quote, timer, and
 *    music-section in SoundCloud mode (where text + small thumbnail want to
 *    grow as one rigid unit).
 *  - **free**: mutate the block's actual `width = origW * scaleX` and
 *    `height = origH * scaleY` — independently. No transform, so inner
 *    content keeps its CSS-defined sizes; the block just provides more or
 *    less room. Used for the todo list (more rows / longer labels) and the
 *    music-section in Spotify mode (the `<iframe>` re-renders at the new
 *    size, avoiding the bitmap-stretch pixelation `transform: scale()`
 *    would cause). The music-player's `.music-player--spotify` class is
 *    observed so toggling sources mid-edit re-applies the right strategy.
 *
 * Positions and scale persist across reloads via localStorage; the reset
 * button clears them and restores the default flex layout.
 * @module LayoutModule
 */
const LayoutModule = (function() {
  const BLOCK_SELECTOR = '.center-display, .pomodoro-timer, .music-section, .todo-list';
  const MIN_SCALE = 0.4;
  const STORAGE_KEY = 'studyspot_layout';

  let editMode = false;
  let toggleBtn = null;
  let resetBtn = null;

  /**
   * Stable per-block identifier used as the localStorage key for each block's
   * geometry. Tied to the class names in BLOCK_SELECTOR.
   */
  const blockKey = (block) => {
    if (block.classList.contains('center-display')) return 'center-display';
    if (block.classList.contains('pomodoro-timer')) return 'pomodoro-timer';
    if (block.classList.contains('music-section')) return 'music-section';
    if (block.classList.contains('todo-list')) return 'todo-list';
    return null;
  };

  const loadPositions = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  };

  /**
   * Snapshot the geometry of every floating block to localStorage. Called
   * after each drag/resize gesture ends. `origW`/`origH` are the block's
   * natural size captured at freeze time and never change after; resize
   * mutates `scaleX`/`scaleY`.
   */
  const savePositions = () => {
    const data = {};
    document.querySelectorAll(BLOCK_SELECTOR).forEach(block => {
      if (!block.classList.contains('floating')) return;
      const key = blockKey(block);
      if (!key) return;
      data[key] = {
        left: block.style.left,
        top: block.style.top,
        origW: block.dataset.origW,
        origH: block.dataset.origH,
        scaleX: block.dataset.scaleX,
        scaleY: block.dataset.scaleY,
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /**
   * Free-sizing blocks expose independent width and height: the block's
   * actual CSS dimensions change, no transform is applied, inner content
   * keeps its CSS sizes. Used for the todo list (more rows / longer labels
   * fit) and the Spotify embed (iframe re-renders sharply at the new size,
   * avoiding the bitmap-stretch pixelation `transform: scale()` causes).
   * Other blocks scale uniformly via `transform: scale()` so text and
   * icons grow as one rigid unit.
   */
  const usesFreeSizing = (block) => {
    if (block.classList.contains('todo-list')) return true;
    if (block.classList.contains('music-section') &&
        block.querySelector('.music-player.music-player--spotify')) {
      return true;
    }
    return false;
  };

  // Spotify embed's natural height (matches `.player-spotify { height }` in
  // style.css). Free-sizing mode scales the iframe height alongside the
  // block so Spotify upgrades from compact to large UI as the block grows.
  const SPOTIFY_IFRAME_H = 152;

  /**
   * Apply the current scale to a block using whichever strategy is correct
   * for it right now. Idempotent — safe to call again when the source
   * toggles between SoundCloud and Spotify.
   */
  const applyScaleStrategy = (block) => {
    const origW = parseFloat(block.dataset.origW);
    const origH = parseFloat(block.dataset.origH);
    if (!origW || !origH) return;
    const sx = parseFloat(block.dataset.scaleX || '1') || 1;
    const sy = parseFloat(block.dataset.scaleY || '1') || 1;
    const free = usesFreeSizing(block);
    if (free) {
      block.style.transform = '';
      block.style.width = (origW * sx) + 'px';
      block.style.height = (origH * sy) + 'px';
    } else {
      // Uniform mode: sx === sy by construction (resize keeps them locked).
      block.style.width = origW + 'px';
      block.style.height = origH + 'px';
      block.style.transform = `scale(${sx})`;
    }
    if (block.classList.contains('music-section')) {
      const iframe = block.querySelector('.player-spotify iframe');
      const wrap = block.querySelector('.player-spotify');
      if (iframe && wrap) {
        if (free) {
          const h = (SPOTIFY_IFRAME_H * sy) + 'px';
          wrap.style.height = h;
          iframe.style.height = h;
        } else {
          wrap.style.height = '';
          iframe.style.height = '';
        }
      }
    }
  };

  /**
   * Watch the music-player's class list so toggling between SoundCloud and
   * Spotify re-runs the scale strategy on the music-section. Wired exactly
   * once per block via `dataset.modeObserved`.
   */
  const observeMusicMode = (block) => {
    if (!block.classList.contains('music-section')) return;
    if (block.dataset.modeObserved) return;
    const player = block.querySelector('.music-player');
    if (!player) return;
    block.dataset.modeObserved = '1';
    const observer = new MutationObserver(() => applyScaleStrategy(block));
    observer.observe(player, { attributes: true, attributeFilter: ['class'] });
  };

  /**
   * Apply the floating geometry: lock the block at its natural size and
   * render any user resize via the strategy `applyScaleStrategy` picks.
   */
  const applyFloatingStyles = (block, origW, origH, scaleX, scaleY, left, top) => {
    block.style.left = left;
    block.style.top = top;
    block.style.transformOrigin = 'top left';
    block.dataset.origW = origW;
    block.dataset.origH = origH;
    block.dataset.scaleX = scaleX;
    block.dataset.scaleY = scaleY;
    block.classList.add('floating');
    applyScaleStrategy(block);
    observeMusicMode(block);
  };

  /**
   * On boot, restore any previously-saved geometry. Drag handlers and
   * resize handles are wired immediately so entering edit mode is instant.
   * Falls back to legacy `scale` (uniform) and `width`/`height` entries for
   * layouts saved before independent scaleX/scaleY existed.
   */
  const restoreSavedPositions = () => {
    const data = loadPositions();
    if (!data) return;
    document.querySelectorAll(BLOCK_SELECTOR).forEach(block => {
      const key = blockKey(block);
      if (!key || !data[key]) return;
      const pos = data[key];
      const origW = parseFloat(pos.origW || pos.width);
      const origH = parseFloat(pos.origH || pos.height);
      if (!origW || !origH) return;
      const legacyScale = parseFloat(pos.scale || '1') || 1;
      const scaleX = parseFloat(pos.scaleX || legacyScale) || 1;
      const scaleY = parseFloat(pos.scaleY || legacyScale) || 1;
      applyFloatingStyles(block, origW, origH, scaleX, scaleY, pos.left, pos.top);
      addResizeHandle(block);
      if (!block.dataset.dragAttached) {
        attachDrag(block);
        block.dataset.dragAttached = '1';
      }
    });
  };

  /**
   * Freeze each block at its current computed position by switching it to
   * position:fixed and recording its natural size as `origW`/`origH`. From
   * that point on, resize mutates `scaleX`/`scaleY` so inner content
   * tracks the block's size (uniformly via transform, or independently via
   * direct width/height — see `applyScaleStrategy`). Called the first time
   * the user enters edit mode.
   */
  const freezeBlocks = () => {
    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR))
      .filter(b => !b.classList.contains('floating'));
    // Measure all blocks BEFORE mutating any of them — otherwise removing
    // the first from normal flow reflows the rest upward and they collapse.
    const rects = blocks.map(b => b.getBoundingClientRect());
    blocks.forEach((block, i) => {
      const rect = rects[i];
      applyFloatingStyles(block, rect.width, rect.height, 1, 1, rect.left + 'px', rect.top + 'px');
      addResizeHandle(block);
      // Drag handlers attach exactly once per block. Re-entering edit mode
      // (e.g. after a reset) re-freezes positions but must not stack listeners.
      if (!block.dataset.dragAttached) {
        attachDrag(block);
        block.dataset.dragAttached = '1';
      }
    });
  };

  /**
   * Drop the floating state and inline geometry so blocks fall back into the
   * default flex layout. Saved positions are cleared so reloading also lands
   * in the default layout. Resize handles are removed; drag listeners stay
   * attached (cheap, idempotent) so a subsequent re-freeze is instant.
   * If still in edit mode, re-freeze on the next frame so the user can keep
   * dragging from the freshly restored default positions.
   */
  const resetBlocks = () => {
    document.querySelectorAll(BLOCK_SELECTOR).forEach(block => {
      block.classList.remove('floating');
      block.style.width = '';
      block.style.height = '';
      block.style.left = '';
      block.style.top = '';
      block.style.transform = '';
      block.style.transformOrigin = '';
      delete block.dataset.origW;
      delete block.dataset.origH;
      delete block.dataset.scaleX;
      delete block.dataset.scaleY;
      // `modeObserved` is intentionally NOT cleared — the MutationObserver
      // it gates is set once per page lifetime and is harmless when no
      // origW/scale exist.
      if (block.classList.contains('music-section')) {
        const iframe = block.querySelector('.player-spotify iframe');
        const wrap = block.querySelector('.player-spotify');
        if (iframe) iframe.style.height = '';
        if (wrap) wrap.style.height = '';
      }
      const handle = block.querySelector('.resize-handle');
      if (handle) handle.remove();
    });
    localStorage.removeItem(STORAGE_KEY);
    if (editMode) {
      requestAnimationFrame(freezeBlocks);
    }
  };

  const addResizeHandle = (block) => {
    if (block.querySelector('.resize-handle')) return;
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.setAttribute('aria-hidden', 'true');
    block.appendChild(handle);
    attachResize(handle, block);
  };

  const attachDrag = (block) => {
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false;

    block.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      if (e.target.closest('.resize-handle')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = block.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      block.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    block.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      block.style.left = (origLeft + e.clientX - startX) + 'px';
      block.style.top = (origTop + e.clientY - startY) + 'px';
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { block.releasePointerCapture(e.pointerId); } catch (_) {}
      savePositions();
    };
    block.addEventListener('pointerup', endDrag);
    block.addEventListener('pointercancel', endDrag);
  };

  const attachResize = (handle, block) => {
    let startX = 0, startY = 0, startScaleX = 1, startScaleY = 1, resizing = false;

    handle.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startScaleX = parseFloat(block.dataset.scaleX || '1') || 1;
      startScaleY = parseFloat(block.dataset.scaleY || '1') || 1;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    // Two resize behaviors depending on the block:
    //   - Free-sizing blocks (todo list, Spotify embed) update scaleX and
    //     scaleY independently — corner follows the mouse on both axes.
    //   - Uniform blocks lock the aspect ratio (scaleX === scaleY) so text
    //     and icons stay proportional under transform: scale().
    handle.addEventListener('pointermove', (e) => {
      if (!resizing) return;
      const origW = parseFloat(block.dataset.origW);
      const origH = parseFloat(block.dataset.origH);
      if (!origW || !origH) return;
      const scaleFromX = (origW * startScaleX + (e.clientX - startX)) / origW;
      const scaleFromY = (origH * startScaleY + (e.clientY - startY)) / origH;
      if (usesFreeSizing(block)) {
        block.dataset.scaleX = Math.max(MIN_SCALE, scaleFromX);
        block.dataset.scaleY = Math.max(MIN_SCALE, scaleFromY);
      } else {
        // Uniform: pick whichever axis the user moved further along so the
        // corner tracks the dominant drag direction.
        const newScale = Math.max(MIN_SCALE, Math.max(scaleFromX, scaleFromY));
        block.dataset.scaleX = newScale;
        block.dataset.scaleY = newScale;
      }
      applyScaleStrategy(block);
    });

    const endResize = (e) => {
      if (!resizing) return;
      resizing = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      savePositions();
    };
    handle.addEventListener('pointerup', endResize);
    handle.addEventListener('pointercancel', endResize);
  };

  const toggle = () => {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    toggleBtn.classList.toggle('active', editMode);
    toggleBtn.setAttribute('aria-pressed', String(editMode));
    if (resetBtn) resetBtn.hidden = !editMode;
    if (editMode) freezeBlocks();
  };

  return {
    init() {
      toggleBtn = document.getElementById('edit-layout-btn');
      if (!toggleBtn) return;
      toggleBtn.addEventListener('click', toggle);
      resetBtn = document.getElementById('reset-layout-btn');
      if (resetBtn) resetBtn.addEventListener('click', resetBlocks);
      restoreSavedPositions();
    }
  };
})();
