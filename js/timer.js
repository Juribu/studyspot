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
  let alarmAudio = null;

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
          showTimerPopup();
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
      
      // Timer settings dropdown functionality
      const timerSettingBtn = document.getElementById('timer-setting');
      const timerDropdown = document.querySelector('.timer-settings-dropdown');
      const timerInputs = document.querySelectorAll('.timer-input');

      // Toggle dropdown visibility
      timerSettingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        timerDropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function() {
        timerDropdown.classList.remove('show');
      });

      // Prevent dropdown from closing when clicking inside it
      timerDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      // Handle timer input changes
      timerInputs.forEach(input => {
        // Store the initial value as the previous value
        let previousValue = input.value;
        
        // Update previous value when input gains focus
        input.addEventListener('focus', function(e) {
          previousValue = this.value;
          e.stopPropagation();
        });

        input.addEventListener('change', function() {
          const timerType = this.dataset.timer;
          const minutes = parseInt(this.value);
          
          // Validate input
          if (minutes < 1 || isNaN(minutes)) {
            this.value = previousValue;
            return;
          }
          
          // Update previous value with valid input
          previousValue = this.value;
          
          // Update timer states
          switch(timerType) {
            case 'pomodoro':
              timerStates.pomodoro = minutes * 60;
              if (elements.pomodoro.classList.contains('active')) {
                timeLeft = timerStates.pomodoro;
                updateTimer();
                resetTimer();
              }
              break;
            case 'short-break':
              timerStates.short = minutes * 60;
              if (elements.short.classList.contains('active')) {
                timeLeft = timerStates.short;
                updateTimer();
                resetTimer();
              }
              break;
            case 'long-break':
              timerStates.long = minutes * 60;
              if (elements.long.classList.contains('active')) {
                timeLeft = timerStates.long;
                updateTimer();
                resetTimer();
              }
              break;
          }
        });

        // Prevent input from closing dropdown when focused
        input.addEventListener('focus', function(e) {
          e.stopPropagation();
        });

        // Handle Enter key to apply changes, revert empty input, and close dropdown
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            // If input is empty, revert to previous value
            if (this.value === '' || this.value === null) {
              this.value = previousValue;
            }
            this.blur();
            timerDropdown.classList.remove('show');
          }
          e.stopPropagation();
        });
      });
    }
  };
})();
