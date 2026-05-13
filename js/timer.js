/**
 * Timer Module for Pomodoro functionality
 * Handles timer controls, display updates, and session management
 * @module TimerModule
 */
const TimerModule = (function() {
  /** DOM element references */
  const elements = {
    timer: document.getElementById("time"),
    start: document.getElementById("start"),
    endEarly: document.getElementById("end-early"),
    pomodoro: document.getElementById("pomodoro"),
    short: document.getElementById("short-break"),
    long: document.getElementById("long-break")
  };

  const DURATIONS_KEY = 'studyspot_timer_durations';
  const EARLY_RECORD_THRESHOLD_SECONDS = 600; // 10 minutes

  /** Timer durations in seconds */
  const timerStates = {
    pomodoro: 1500,    // 25 minutes
    short: 300,        // 5 minutes
    long: 600          // 10 minutes
  };

  /**
   * Loads saved timer durations from localStorage into timerStates
   */
  const loadDurations = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(DURATIONS_KEY));
      if (saved && typeof saved === 'object') {
        ['pomodoro', 'short', 'long'].forEach(key => {
          if (typeof saved[key] === 'number' && saved[key] > 0) {
            timerStates[key] = saved[key];
          }
        });
      }
    } catch (e) {
      console.warn('Could not load saved timer durations', e);
    }
  };

  /**
   * Persists the current timer durations to localStorage
   */
  const saveDurations = () => {
    localStorage.setItem(DURATIONS_KEY, JSON.stringify(timerStates));
  };

  let timeLeft = timerStates.pomodoro;
  let state = 'idle'; // 'idle' | 'running' | 'paused'
  let interval;
  let endTime = null;
  let alarmAudio = null;
  let currentMode = 'pomodoro';
  let sessionStartTime = null;

  // SVG markup for the start-button icon states.
  const PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const PLAY_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7,5 19,12 7,19"/></svg>';

  /**
   * Reflects the current state onto the start/end-early buttons.
   * - idle:    "Start" text pill, no end-early button
   * - running: pause icon + stop icon
   * - paused:  play icon + stop icon
   */
  const renderControls = () => {
    if (state === 'idle') {
      elements.start.classList.remove('icon-mode');
      elements.start.textContent = 'Start';
      elements.start.setAttribute('aria-label', 'Start timer');
      if (elements.endEarly) elements.endEarly.hidden = true;
      elements.timer.classList.remove('running');
    } else {
      elements.start.classList.add('icon-mode');
      elements.start.innerHTML = state === 'running' ? PAUSE_SVG : PLAY_SVG;
      elements.start.setAttribute('aria-label', state === 'running' ? 'Pause timer' : 'Resume timer');
      if (elements.endEarly) elements.endEarly.hidden = false;
      elements.timer.classList.add('running');
    }
  };

  /**
   * Creates and shows the timer popup when time is up
   */
  const showTimerPopup = () => {
    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'timer-popup';
    popup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <h2>⏰ Time's Up!</h2>
          <p>Your timer session has ended.</p>
          <button id="popup-ok" class="popup-button">OK</button>
        </div>
      </div>
    `;

    // Add styles
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const overlay = popup.querySelector('.popup-overlay');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const content = popup.querySelector('.popup-content');
    content.style.cssText = `
      background-color: rgba(53, 53, 53, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 40px 60px;
      text-align: center;
      color: white;
      font-family: 'Inter', sans-serif;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    const title = popup.querySelector('h2');
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 28px;
      font-weight: 600;
    `;

    const message = popup.querySelector('p');
    message.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 16px;
      opacity: 0.9;
    `;

    const button = popup.querySelector('.popup-button');
    button.style.cssText = `
      background-color: white;
      color: black;
      border: none;
      border-radius: 36px;
      padding: 12px 32px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    // Play alarm sound
    alarmAudio = new Audio('assets/music/alarm.wav');
    alarmAudio.loop = true;
    alarmAudio.play().catch(error => {
      console.log('Could not play alarm sound:', error);
    });

    document.body.appendChild(popup);

    // Handle OK button click
    button.addEventListener('click', () => {
      if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        alarmAudio = null;
      }
      popup.remove();
      if (currentMode === 'pomodoro' && typeof StatsHintModule !== 'undefined') {
        StatsHintModule.maybeShow();
      }
    });

    // Handle button hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });
  };

  /**
   * Shows the "end early" confirmation overlay.
   * Resolves via the provided callback with `true` if the user confirms.
   */
  const showEndEarlyConfirm = (onConfirm) => {
    if (document.getElementById('end-early-popup')) return;

    const popup = document.createElement('div');
    popup.id = 'end-early-popup';
    popup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <h2>End early?</h2>
          <p>Sessions shorter than <strong>10 minutes</strong> won't be recorded in your stats.</p>
          <div class="popup-actions">
            <button class="popup-button popup-button--secondary" data-action="cancel">Keep going</button>
            <button class="popup-button" data-action="confirm">End anyway</button>
          </div>
        </div>
      </div>
    `;

    popup.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 10000; display: flex; align-items: center; justify-content: center;
    `;
    popup.querySelector('.popup-overlay').style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex; align-items: center; justify-content: center;
    `;
    popup.querySelector('.popup-content').style.cssText = `
      background-color: rgba(53, 53, 53, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px; padding: 36px 48px; text-align: center;
      color: white; font-family: 'Inter', sans-serif; max-width: 440px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    popup.querySelector('h2').style.cssText = `margin: 0 0 12px 0; font-size: 26px; font-weight: 600;`;
    popup.querySelector('p').style.cssText = `margin: 0 0 24px 0; font-size: 16px; opacity: 0.9;`;
    popup.querySelector('.popup-actions').style.cssText = `display: flex; gap: 12px; justify-content: center;`;

    popup.querySelectorAll('.popup-button').forEach(btn => {
      const isSecondary = btn.classList.contains('popup-button--secondary');
      btn.style.cssText = `
        background-color: ${isSecondary ? 'transparent' : 'white'};
        color: ${isSecondary ? 'white' : 'black'};
        border: ${isSecondary ? '1px solid rgba(255,255,255,0.5)' : 'none'};
        border-radius: 36px; padding: 12px 28px;
        font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500;
        cursor: pointer; transition: all 0.2s ease;
      `;
      btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-1px)'; });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translateY(0)'; });
    });

    const close = (confirmed) => {
      popup.remove();
      if (confirmed) onConfirm();
    };
    popup.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    popup.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));

    document.body.appendChild(popup);
  };

  /**
   * Updates the timer display with current time
   */
  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.innerHTML = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Syncs timer based on real elapsed time (handles background tabs)
   */
  const syncTimer = () => {
    if (endTime === null) return;

    const remainingMs = endTime - Date.now();
    const newTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

    if (newTimeLeft === timeLeft) return;

    timeLeft = newTimeLeft;
    updateTimer();

    if (timeLeft === 0) {
      const duration = timerStates[currentMode];
      completeSession(duration, true);
      resetTimer();
      showTimerPopup();
      timeLeft = timerStates[currentMode];
      updateTimer();
    }
  };

  /**
   * Records a completed (or partially completed) session to StudyStatsModule
   */
  const completeSession = (durationSeconds, completed) => {
    if (typeof StudyStatsModule !== 'undefined' && sessionStartTime) {
      StudyStatsModule.recordSession({
        startTime: sessionStartTime,
        endTime: new Date().toISOString(),
        durationSeconds: durationSeconds,
        type: currentMode,
        completed: completed
      });
    }
    sessionStartTime = null;
  };

  /**
   * Resets timer to idle state (full reset — drops any in-flight session)
   */
  const resetTimer = () => {
    clearInterval(interval);
    state = 'idle';
    endTime = null;
    sessionStartTime = null;
    renderControls();
  };

  /**
   * Sets active timer button and resets timer
   * @param {HTMLElement} activeButton - Button to set as active
   */
  const setActiveButton = (activeButton) => {
    document.querySelectorAll(".timer-right button").forEach(button =>
      button.classList.remove("active")
    );
    activeButton.classList.add("active");
    resetTimer();
  };

  /**
   * Toggles the timer between idle→running, running→paused, paused→running.
   * Stopping (full reset) happens via the End Early button.
   */
  const startTimer = () => {
    if (state === 'running') {
      // Pause — keep timeLeft and sessionStartTime so we can resume.
      clearInterval(interval);
      endTime = null;
      state = 'paused';
      renderControls();
      return;
    }

    // idle → running, or paused → running
    if (state === 'idle') {
      sessionStartTime = new Date().toISOString();
    }
    endTime = Date.now() + timeLeft * 1000;
    interval = setInterval(syncTimer, 250);
    state = 'running';
    renderControls();
  };

  /**
   * Handles user clicking the End Early button: confirms, then records
   * a partial pomodoro only if at least 10 minutes have elapsed.
   */
  const handleEndEarly = () => {
    if (state === 'idle') return;
    showEndEarlyConfirm(() => {
      const totalDuration = timerStates[currentMode];
      const elapsed = Math.max(0, totalDuration - timeLeft);
      // Only record pomodoro sessions over the threshold. Breaks are never
      // recorded as partial — they're not counted toward study stats anyway.
      if (currentMode === 'pomodoro' && elapsed >= EARLY_RECORD_THRESHOLD_SECONDS) {
        completeSession(elapsed, false);
      } else {
        sessionStartTime = null;
      }
      resetTimer();
      timeLeft = timerStates[currentMode];
      updateTimer();
    });
  };

  /**
   * Sets timer to specified mode and duration
   * @param {string} mode - Timer mode (pomodoro, short, long)
   * @param {HTMLElement} button - Button element to set as active
   */
  const setTimerMode = (mode, button) => {
    currentMode = mode;
    timeLeft = timerStates[mode];
    updateTimer();
    setActiveButton(button);
  };

  /**
   * Enters inline edit mode on the time display. Only allowed when the
   * timer is not running. The user types minutes; on Enter/blur we apply
   * and persist the new duration for the current mode.
   */
  const enterTimeEdit = () => {
    if (state !== 'idle') return;
    if (elements.timer.querySelector('input')) return;

    const currentMinutes = Math.max(1, Math.round(timerStates[currentMode] / 60));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '180';
    input.value = String(currentMinutes);
    input.className = 'time-edit-input';
    input.setAttribute('aria-label', 'Set timer minutes');

    elements.timer.innerHTML = '';
    elements.timer.appendChild(input);
    input.focus();
    input.select();

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const minutes = parseInt(input.value, 10);
      if (!isNaN(minutes) && minutes >= 1 && minutes <= 180) {
        timerStates[currentMode] = minutes * 60;
        timeLeft = timerStates[currentMode];
        saveDurations();
      }
      updateTimer();
    };
    const cancel = () => {
      if (committed) return;
      committed = true;
      updateTimer();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); input.blur(); }
    });
  };

  return {
    /**
     * Initializes the timer module
     */
    init() {
      loadDurations();
      timeLeft = timerStates.pomodoro;
      updateTimer();

      // Start button
      elements.start.addEventListener("click", startTimer);

      // End-early button
      if (elements.endEarly) {
        elements.endEarly.addEventListener('click', handleEndEarly);
      }

      // Click-to-edit duration on the time display (disabled while running)
      elements.timer.addEventListener('click', enterTimeEdit);

      // Timer mode buttons - simplified with object mapping
      const timerModes = {
        'pomodoro': elements.pomodoro,
        'short': elements.short,
        'long': elements.long
      };

      Object.entries(timerModes).forEach(([mode, button]) => {
        button.addEventListener("click", () => setTimerMode(mode, button));
      });

      // Immediately sync timer when returning from background tab
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state === 'running') {
          syncTimer();
        }
      });
    }
  };
})();
