/**
 * Background Hint Module
 * Shows a one-time fading bubble pointing to the background button the first
 * time the user enters fullscreen. Persisted via STORAGE_KEY so it only
 * ever appears once per browser.
 * @module BgHintModule
 */
const BgHintModule = (function() {
  const STORAGE_KEY = 'studyspot_bg_hint_seen';

  const elements = {
    bgBtn: document.getElementById('background-btn')
  };

  const hasSeen = () => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch (_e) { return false; }
  };

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_e) {}
  };

  const positionHint = (overlay, btn) => {
    const r = btn.getBoundingClientRect();
    const buttonCenterX = (r.left + r.right) / 2;
    const TIP_INSET = 17;
    const rightOffset = Math.max(20, window.innerWidth - buttonCenterX - TIP_INSET);
    const bottomOffset = Math.max(20, window.innerHeight - r.top + 10);
    overlay.style.right = rightOffset + 'px';
    overlay.style.bottom = bottomOffset + 'px';
  };

  const showHint = () => {
    const btn = elements.bgBtn;
    if (!btn) return;

    const overlay = document.createElement('div');
    overlay.id = 'bg-hint';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="bg-hint__bubble">
        <div class="bg-hint__title">You can change the background</div>
        <div class="bg-hint__sub">Click the icon to pick an image or video scene</div>
        <button class="bg-hint__ok" type="button">OK</button>
      </div>
      <svg class="bg-hint__arrow" viewBox="0 0 90 80" aria-hidden="true">
        <path d="M 8 6 C 8 50, 76 28, 76 72"
              fill="none" stroke="rgba(255,255,255,0.95)"
              stroke-width="2" stroke-linecap="round" />
        <path d="M 69 64 L 76 74 L 83 64"
              fill="none" stroke="rgba(255,255,255,0.95)"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;

    overlay.style.cssText = `
      position: fixed;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity 400ms ease;
      font-family: 'Inter', sans-serif;
    `;

    const bubble = overlay.querySelector('.bg-hint__bubble');
    bubble.style.cssText = `
      background-color: rgba(0, 0, 0, 0.85);
      color: rgba(255, 255, 255, 0.96);
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      max-width: 260px;
      text-align: left;
      pointer-events: auto;
    `;

    const okBtn = overlay.querySelector('.bg-hint__ok');
    okBtn.style.cssText = `
      display: block;
      margin-top: 10px;
      margin-left: auto;
      background: rgba(255, 255, 255, 0.16);
      color: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 4px 14px;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      pointer-events: auto;
    `;

    const title = overlay.querySelector('.bg-hint__title');
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      letter-spacing: 0.1px;
    `;

    const sub = overlay.querySelector('.bg-hint__sub');
    sub.style.cssText = `
      font-size: 12px;
      opacity: 0.78;
    `;

    const arrow = overlay.querySelector('.bg-hint__arrow');
    arrow.style.cssText = `
      width: 70px;
      height: 62px;
      margin-top: -4px;
      margin-right: 6px;
    `;

    // Fullscreen rewrites the top-layer; appending to the active fullscreen
    // element keeps the bubble visible. Falls back to body otherwise.
    const host = document.fullscreenElement || document.body;
    host.appendChild(overlay);

    requestAnimationFrame(() => {
      positionHint(overlay, btn);
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });
    });

    const FADE_MS = 200;
    okBtn.addEventListener('click', () => {
      overlay.style.transition = `opacity ${FADE_MS}ms ease`;
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (typeof LayoutHintModule !== 'undefined') {
          LayoutHintModule.show();
        }
      }, FADE_MS);
    });
  };

  /**
   * Surface the hint once. No-op if already seen or button missing.
   * Called by IntroHintModule after the user OKs the fullscreen hint.
   */
  const show = (delayMs = 100) => {
    if (hasSeen()) return;
    if (!elements.bgBtn) return;
    setTimeout(() => {
      if (hasSeen()) return;
      showHint();
      markSeen();
    }, delayMs);
  };

  return {
    init() {},
    show
  };
})();
