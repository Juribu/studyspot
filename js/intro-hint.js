/**
 * First-visit Intro Hint Module
 * Shows a one-time fading bubble pointing to the fullscreen button.
 * Persisted via STORAGE_KEY so it only ever appears once per browser.
 * @module IntroHintModule
 */
const IntroHintModule = (function() {
  const STORAGE_KEY = 'studyspot_intro_hint_seen';

  const elements = {
    fullscreenBtn: document.querySelector('.full-screen')
  };

  const hasSeen = () => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch (_e) { return false; }
  };

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_e) {}
  };

  /**
   * Pick a sensible OS-specific fullscreen shortcut to surface.
   * The app's own Ctrl+F binding works everywhere, but most users reach
   * for the OS/browser-native combo first, so we show that instead.
   */
  const detectShortcut = () => {
    const platform = (
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform ||
      navigator.userAgent ||
      ''
    ).toLowerCase();
    if (/mac|iphone|ipad|ipod/.test(platform)) return 'Fn + F';
    return 'F11';
  };

  /**
   * Position the hint so its arrow tip lands just above-left of the button.
   * Uses fixed positioning anchored from the right/bottom of the viewport,
   * since the bottom-section already lives there.
   */
  const positionHint = (overlay, btn) => {
    const r = btn.getBoundingClientRect();
    const buttonCenterX = (r.left + r.right) / 2;
    // Arrow tip sits ~17px in from the overlay's right edge (viewBox x=76 of 90,
    // 70px svg width, plus 6px margin-right). Anchor the tip over button center.
    const TIP_INSET = 17;
    const rightOffset = Math.max(20, window.innerWidth - buttonCenterX - TIP_INSET);
    const bottomOffset = Math.max(20, window.innerHeight - r.top + 10);
    overlay.style.right = rightOffset + 'px';
    overlay.style.bottom = bottomOffset + 'px';
  };

  const showHint = () => {
    const btn = elements.fullscreenBtn;
    if (!btn) return;

    const shortcut = detectShortcut();

    const overlay = document.createElement('div');
    overlay.id = 'intro-hint';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="intro-hint__bubble">
        <div class="intro-hint__title">Full screen for best experience</div>
        <div class="intro-hint__sub">Click the icon, or press <kbd>${shortcut}</kbd></div>
      </div>
      <svg class="intro-hint__arrow" viewBox="0 0 90 80" aria-hidden="true">
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
      transition: opacity 250ms ease;
      font-family: 'Inter', sans-serif;
    `;

    const bubble = overlay.querySelector('.intro-hint__bubble');
    bubble.style.cssText = `
      background-color: rgba(0, 0, 0, 0.85);
      color: rgba(255, 255, 255, 0.96);
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      max-width: 260px;
      text-align: left;
    `;

    const title = overlay.querySelector('.intro-hint__title');
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      letter-spacing: 0.1px;
    `;

    const sub = overlay.querySelector('.intro-hint__sub');
    sub.style.cssText = `
      font-size: 12px;
      opacity: 0.78;
    `;

    const kbd = overlay.querySelector('kbd');
    if (kbd) {
      kbd.style.cssText = `
        font-family: inherit;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 4px;
        padding: 1px 6px;
        font-size: 11px;
        margin-left: 2px;
      `;
    }

    const arrow = overlay.querySelector('.intro-hint__arrow');
    arrow.style.cssText = `
      width: 70px;
      height: 62px;
      margin-top: -4px;
      margin-right: 6px;
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      positionHint(overlay, btn);
      // Two RAFs so the initial layout settles before we trigger the fade-in.
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });
    });

    // Linger briefly, then fade away over ~2s and remove.
    const LINGER_MS = 2500;
    const FADE_MS = 1500;
    setTimeout(() => {
      overlay.style.transition = `opacity ${FADE_MS}ms ease`;
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), FADE_MS + 50);
    }, LINGER_MS);
  };

  return {
    /**
     * Shows the hint once on the first visit only. No-op afterwards.
     */
    init() {
      if (hasSeen()) return;
      if (!elements.fullscreenBtn) return;
      // Small delay so the rest of the UI paints first; otherwise the
      // bubble can momentarily compete with bottom-section layout shifts.
      setTimeout(() => {
        showHint();
        markSeen();
      }, 700);
    }
  };
})();
