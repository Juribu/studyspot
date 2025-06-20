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
    pomodoro: document.getElementById("pomodoro"),
    short: document.getElementById("short-break"),
    long: document.getElementById("long-break")
  };

  /** Timer durations in seconds */
  const timerStates = {
    pomodoro: 1500,    // 25 minutes
    short: 300,        // 5 minutes
    long: 600          // 10 minutes
  };

  let timeLeft = timerStates.pomodoro;
  let isRunning = false;
  let interval;

  /**
   * Updates the timer display with current time
   */
  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.innerHTML = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Resets timer to stopped state
   */
  const resetTimer = () => {
    clearInterval(interval);
    isRunning = false;
    elements.start.textContent = "Start";
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
   * Starts or stops the timer
   */
  const startTimer = () => {
    if (isRunning) {
      resetTimer();
    } else {
      interval = setInterval(() => {
        timeLeft--;
        updateTimer();

        if (timeLeft === 0) {
          resetTimer();
          alert("Time's up!");
          timeLeft = timerStates.pomodoro;
          updateTimer();
        }
      }, 1000);

      elements.start.textContent = "Pause";
      isRunning = true;
    }
  };

  /**
   * Sets timer to specified mode and duration
   * @param {string} mode - Timer mode (pomodoro, short, long)
   * @param {HTMLElement} button - Button element to set as active
   */
  const setTimerMode = (mode, button) => {
    timeLeft = timerStates[mode];
    updateTimer();
    setActiveButton(button);
  };

  return {
    /**
     * Initializes the timer module
     */
    init() {
      updateTimer();
      
      // Start button
      elements.start.addEventListener("click", startTimer);
      
      // Timer mode buttons - simplified with object mapping
      const timerModes = {
        'pomodoro': elements.pomodoro,
        'short': elements.short,
        'long': elements.long
      };
      
      Object.entries(timerModes).forEach(([mode, button]) => {
        button.addEventListener("click", () => setTimerMode(mode, button));
      });
    }
  };
})();
