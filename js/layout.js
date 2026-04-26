/**
 * Layout Module
 * Lets the user toggle an edit mode to drag and resize the three utility
 * blocks (timer, music, tasks). Positions persist across reloads via
 * localStorage; the reset button clears them and restores the default flex
 * layout.
 * @module LayoutModule
 */
const LayoutModule = (function() {
  const BLOCK_SELECTOR = '.pomodoro-timer, .music-section, .todo-list';
  const MIN_W = 200;
  const MIN_H = 100;
  const STORAGE_KEY = 'studyspot_layout';

  let editMode = false;
  let toggleBtn = null;
  let resetBtn = null;

  /**
   * Stable per-block identifier used as the localStorage key for each block's
   * geometry. Tied to the class names in BLOCK_SELECTOR.
   */
  const blockKey = (block) => {
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
   * after each drag/resize gesture ends.
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
        width: block.style.width,
        height: block.style.height,
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /**
   * On boot, restore any previously-saved geometry by floating each block
   * with its stored width/height/left/top. Drag handlers and resize handles
   * are wired immediately so entering edit mode is instant.
   */
  const restoreSavedPositions = () => {
    const data = loadPositions();
    if (!data) return;
    document.querySelectorAll(BLOCK_SELECTOR).forEach(block => {
      const key = blockKey(block);
      if (!key || !data[key]) return;
      const pos = data[key];
      block.style.width = pos.width;
      block.style.height = pos.height;
      block.style.left = pos.left;
      block.style.top = pos.top;
      block.classList.add('floating');
      addResizeHandle(block);
      if (!block.dataset.dragAttached) {
        attachDrag(block);
        block.dataset.dragAttached = '1';
      }
    });
  };

  /**
   * Freeze each block at its current computed position by switching it to
   * position:fixed with explicit width/height. Called the first time the
   * user enters edit mode.
   */
  const freezeBlocks = () => {
    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR))
      .filter(b => !b.classList.contains('floating'));
    // Measure all blocks BEFORE mutating any of them — otherwise removing
    // the first from normal flow reflows the rest upward and they collapse.
    const rects = blocks.map(b => b.getBoundingClientRect());
    blocks.forEach((block, i) => {
      const rect = rects[i];
      block.style.width = rect.width + 'px';
      block.style.height = rect.height + 'px';
      block.style.left = rect.left + 'px';
      block.style.top = rect.top + 'px';
      block.classList.add('floating');
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
    let startX = 0, startY = 0, startW = 0, startH = 0, resizing = false;

    handle.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = block.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!resizing) return;
      block.style.width = Math.max(MIN_W, startW + e.clientX - startX) + 'px';
      block.style.height = Math.max(MIN_H, startH + e.clientY - startY) + 'px';
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
