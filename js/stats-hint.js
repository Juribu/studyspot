/**
 * Stats Hint Module
 * Shows a one-time fading bubble pointing to the stats button after the
 * user's first pomodoro session has been recorded. Persisted via STORAGE_KEY
 * so it only ever appears once per browser.
 * @module StatsHintModule
 */
const StatsHintModule = (function() {
  const STORAGE_KEY = 'studyspot_stats_hint_seen';

  const elements = {
    statsBtn: document.getElementById('stats-btn')
  };

  const hasSeen = () => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch (_e) { return false; }
  };

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_e) {}
  };

  /**
   * Position the hint so its arrow tip lands just above-left of the button.
   * Mirrors intro-hint.js positioning so the bubble feels consistent.
   */
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
    const btn = elements.statsBtn;
    if (!btn) return;

    const overlay = document.createElement('div');
    overlay.id = 'stats-hint';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="stats-hint__bubble">
        <div class="stats-hint__title">Your study sessions are logged here</div>
        <div class="stats-hint__sub">Click the chart icon any time to see your stats</div>
        <button class="stats-hint__ok" type="button">OK</button>
      </div>
      <svg class="stats-hint__arrow" viewBox="0 0 90 80" aria-hidden="true">
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

    const bubble = overlay.querySelector('.stats-hint__bubble');
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

    const okBtn = overlay.querySelector('.stats-hint__ok');
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

    const title = overlay.querySelector('.stats-hint__title');
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      letter-spacing: 0.1px;
    `;

    const sub = overlay.querySelector('.stats-hint__sub');
    sub.style.cssText = `
      font-size: 12px;
      opacity: 0.78;
    `;

    const arrow = overlay.querySelector('.stats-hint__arrow');
    arrow.style.cssText = `
      width: 70px;
      height: 62px;
      margin-top: -4px;
      margin-right: 6px;
    `;

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
        if (typeof SpotifyHintModule !== 'undefined') {
          SpotifyHintModule.show();
        }
      }, FADE_MS);
    });
  };

  /**
   * Try to surface the hint. No-op if already seen or button missing.
   * Safe to call multiple times — only shows once per browser.
   */
  const maybeShow = (delayMs = 100) => {
    if (hasSeen()) return;
    if (!elements.statsBtn) return;
    setTimeout(() => {
      if (hasSeen()) return;
      showHint();
      markSeen();
    }, delayMs);
  };

  return {
    /**
     * No boot-time auto-show. The hint is only surfaced when TimerModule
     * calls maybeShow() after the user closes the "Time's Up" popup
     * following a completed pomodoro.
     */
    init() {},
    maybeShow
  };
})();
