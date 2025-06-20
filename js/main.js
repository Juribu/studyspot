/**
 * Main Application Module
 * Initializes and coordinates all other modules
 * @module StudySpotApp
 */
const StudySpotApp = (function() {
  /** Array of modules to initialize */
  const modules = [
    { name: 'TimerModule', module: () => typeof TimerModule !== 'undefined' && TimerModule },
    { name: 'TaskModule', module: () => typeof TaskModule !== 'undefined' && TaskModule },
    { name: 'ClockModule', module: () => typeof ClockModule !== 'undefined' && ClockModule },
    { name: 'MusicModule', module: () => typeof MusicModule !== 'undefined' && MusicModule }
  ];

  /**
   * Handles fullscreen toggle functionality
   */
  const initializeFullscreen = () => {
    const fullscreenBtn = document.querySelector('.full-screen');
    
    if (!fullscreenBtn) return;

    /**
     * Toggles fullscreen mode on/off
     */
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        // Exit fullscreen
        document.exitFullscreen().catch(err => {
          console.log(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    };

    // Add click event listener
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Optional: Add keyboard shortcut (F11 alternative)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F' && e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    });
  };

  return {
    /**
     * Initializes the StudySpot application
     * Waits for DOM to load, then initializes all modules
     */
    init() {
      document.addEventListener('DOMContentLoaded', () => {
        modules.forEach(({ name, module }) => {
          const moduleInstance = module();
          if (moduleInstance) {
            moduleInstance.init();
            console.log(`${name} initialized`);
          }
        });
        
        // Initialize fullscreen functionality
        initializeFullscreen();
        
        console.log('StudySpot App initialized successfully!');
      });
    }
  };
})();

// Initialize the application
StudySpotApp.init();
