/**
 * Stats Hint Module
 * Shows a bubble pointing to the stats button in two modes:
 *   - standalone (maybeShow, called by timer.js after the first pomodoro):
 *     a single OK button, no transition to any other hint.
 *   - chain (show({force}), called by LayoutHintModule/SpotifyHintModule):
 *     step 4/5 of the onboarding tour with prev/next nav buttons that
 *     navigate back to layout-hint or forward to spotify-hint.
 * Persisted via STORAGE_KEY so the standalone version only ever appears once.
 * @module StatsHintModule
 */
const StatsHintModule = (function() {
  const STANDALONE_KEY = 'studyspot_stats_hint_seen';
  const CHAIN_KEY = 'studyspot_stats_hint_chain_seen';

  const elements = {
    statsBtn: document.getElementById('stats-btn')
  };

  const hasSeen = (key) => {
    try { return localStorage.getItem(key) === '1'; }
    catch (_e) { return false; }
  };

  const markSeen = (key) => {
    try { localStorage.setItem(key, '1'); } catch (_e) {}
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

  const showHint = (mode) => {
    const btn = elements.statsBtn;
    if (!btn) return;

    const overlay = document.createElement('div');
    overlay.id = 'stats-hint';
    overlay.setAttribute('aria-hidden', 'true');

    const footerHtml = mode === 'chain'
      ? `
        <div class="stats-hint__footer">
          <span class="stats-hint__counter">4/5</span>
          <div class="stats-hint__nav">
            <button class="stats-hint__btn stats-hint__btn--left" type="button" aria-label="Back">&larr;</button>
            <button class="stats-hint__btn stats-hint__btn--right" type="button" aria-label="Next">&rarr;</button>
          </div>
        </div>
      `
      : `<button class="stats-hint__ok" type="button">OK</button>`;

    overlay.innerHTML = `
      <div class="stats-hint__bubble">
        <div class="stats-hint__title">Your study sessions are logged here</div>
        <div class="stats-hint__sub">Click the chart icon any time to see your stats</div>
        ${footerHtml}
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

    if (mode === 'chain') {
      const footer = overlay.querySelector('.stats-hint__footer');
      footer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 10px;
        gap: 10px;
      `;
      const counter = overlay.querySelector('.stats-hint__counter');
      counter.style.cssText = `
        font-size: 11px;
        opacity: 0.6;
      `;
      overlay.querySelectorAll('.stats-hint__btn').forEach((b) => {
        b.style.cssText = `
          background: rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 8px;
          padding: 4px 12px;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
          pointer-events: auto;
          margin-left: 6px;
        `;
      });
    } else {
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
    }

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
    const fadeAnd = (next) => {
      overlay.style.transition = `opacity ${FADE_MS}ms ease`;
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        next && next();
      }, FADE_MS);
    };

    if (mode === 'chain') {
      const leftBtn = overlay.querySelector('.stats-hint__btn--left');
      const rightBtn = overlay.querySelector('.stats-hint__btn--right');
      leftBtn.addEventListener('click', () => fadeAnd(() => {
        if (typeof LayoutHintModule !== 'undefined') LayoutHintModule.show({ force: true });
      }));
      rightBtn.addEventListener('click', () => fadeAnd(() => {
        if (typeof SpotifyHintModule !== 'undefined') SpotifyHintModule.show({ force: true });
      }));
    } else {
      const okBtn = overlay.querySelector('.stats-hint__ok');
      okBtn.addEventListener('click', () => fadeAnd(null));
    }
  };

  /**
   * Standalone post-pomodoro trigger. Single OK, no transition.
   * No-op if already seen or button missing.
   */
  const maybeShow = (delayMs = 100) => {
    if (hasSeen(STANDALONE_KEY)) return;
    if (!elements.statsBtn) return;
    setTimeout(() => {
      if (hasSeen(STANDALONE_KEY)) return;
      showHint('standalone');
      markSeen(STANDALONE_KEY);
    }, delayMs);
  };

  /**
   * Onboarding-chain trigger. Renders prev/next nav so the user can
   * walk back to layout-hint or forward to spotify-hint.
   */
  const show = (opts = {}) => {
    const { force = false, delayMs = 100 } = typeof opts === 'number' ? { delayMs: opts } : opts;
    if (!force && hasSeen(CHAIN_KEY)) return;
    if (!elements.statsBtn) return;
    setTimeout(() => {
      if (!force && hasSeen(CHAIN_KEY)) return;
      showHint('chain');
      markSeen(CHAIN_KEY);
    }, delayMs);
  };

  return {
    /**
     * No boot-time auto-show. The hint is only surfaced when TimerModule
     * calls maybeShow() after a completed pomodoro, or when the onboarding
     * chain navigates here via show({ force: true }).
     */
    init() {},
    maybeShow,
    show
  };
})();
