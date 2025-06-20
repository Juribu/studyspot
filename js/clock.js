/**
 * Clock Module for displaying current time
 * Updates every minute to show current hours and minutes
 * @module ClockModule
 */
const ClockModule = (function() {
  /** DOM element for clock display */
  const clockElement = document.getElementById('clock');

  /**
   * Updates the clock display with current time
   */
  const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    if (clockElement) {
      clockElement.textContent = `${hours}:${minutes}`;
    }
  };

  return {
    /**
     * Initializes the clock module
     */
    init: function() {
      updateClock();
      // Update every minute (60000ms)
      setInterval(updateClock, 60000);
    }
  };
})();
