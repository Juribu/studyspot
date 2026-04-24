/**
 * Layout Module
 * Lets the user toggle an edit mode to drag and resize the three utility
 * blocks (timer, music, tasks). Positions are not persisted — every session
 * starts in the default flex layout.
 * @module LayoutModule
 */
const LayoutModule = (function() {
  const BLOCK_SELECTOR = '.pomodoro-timer, .music-section, .todo-list';
  const MIN_W = 200;
  const MIN_H = 100;

  let editMode = false;
  let toggleBtn = null;

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
      attachDrag(block);
    });
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
    };
    handle.addEventListener('pointerup', endResize);
    handle.addEventListener('pointercancel', endResize);
  };

  const toggle = () => {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    toggleBtn.classList.toggle('active', editMode);
    toggleBtn.setAttribute('aria-pressed', String(editMode));
    if (editMode) freezeBlocks();
  };

  return {
    init() {
      toggleBtn = document.getElementById('edit-layout-btn');
      if (!toggleBtn) return;
      toggleBtn.addEventListener('click', toggle);
    }
  };
})();
