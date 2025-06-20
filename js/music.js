/**
 * Music Player Module
 * Plays lofi music from SoundCloud playlist
 * @module MusicModule
 */
const MusicModule = (function() {
  /** DOM element references */
  const elements = {
    playBtn: document.getElementById('play'),
    prevBtn: document.getElementById('prev'),
    nextBtn: document.getElementById('next'),
    trackTitle: document.querySelector('.track-details h4')
  };

  /** SoundCloud player widget */
  let widget = null;
  let isPlaying = false;

  /**
   * Updates the play button icon
   * @param {boolean} playing - Whether audio is playing
   */
  const updatePlayButton = (playing) => {
    const playIcon = elements.playBtn.querySelector('img');
    if (playing) {
      playIcon.src = 'assets/icons/pause.svg';
      playIcon.alt = 'Pause';
    } else {
      playIcon.src = 'assets/icons/play.svg';
      playIcon.alt = 'Play';
    }
  };

  /**
   * Creates SoundCloud player widget
   */
  const createSoundCloudPlayer = () => {
    // Create hidden iframe for SoundCloud player
    const iframe = document.createElement('iframe');
    iframe.id = 'soundcloud-player';
    iframe.width = '100%';
    iframe.height = '166';
    iframe.scrolling = 'no';
    iframe.frameBorder = 'no';
    iframe.allow = 'autoplay';
    iframe.style.display = 'none'; // Hide the player
    
    // Your specific SoundCloud playlist URL
    const playlistUrl = 'https://soundcloud.com/lofi_girl/sets/sleep-lofi';
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
    
    // Add to page
    document.body.appendChild(iframe);
    
    return iframe;
  };

  /**
   * Initializes SoundCloud Widget API
   */
  const initializeSoundCloudWidget = () => {
    // Load SoundCloud Widget API
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = () => {
      // Create player iframe
      const iframe = createSoundCloudPlayer();
      
      // Initialize widget
      widget = SC.Widget(iframe);
      
      // Set up event listeners
      widget.bind(SC.Widget.Events.READY, () => {
        console.log('SoundCloud player ready');
        
        // Listen for play/pause events
        widget.bind(SC.Widget.Events.PLAY, () => {
          isPlaying = true;
          updatePlayButton(true);
        });
        
        widget.bind(SC.Widget.Events.PAUSE, () => {
          isPlaying = false;
          updatePlayButton(false);
        });
        
        widget.bind(SC.Widget.Events.FINISH, () => {
          isPlaying = false;
          updatePlayButton(false);
        });
        
        // Update track info when track changes
        widget.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
          widget.getCurrentSound((sound) => {
            if (sound && elements.trackTitle) {
              elements.trackTitle.textContent = sound.title;
            }
          });
        });
      });
    };
    
    document.head.appendChild(script);
  };

  /**
   * Toggles play/pause
   */
  const togglePlayPause = () => {
    if (!widget) {
      console.log('SoundCloud widget not ready');
      return;
    }

    if (isPlaying) {
      widget.pause();
    } else {
      widget.play();
    }
  };

  /**
   * Goes to previous track
   */
  const previousTrack = () => {
    if (!widget) return;
    widget.prev();
  };

  /**
   * Goes to next track
   */
  const nextTrack = () => {
    if (!widget) return;
    widget.next();
  };

  return {
    /**
     * Initializes the music module
     */
    init() {
      // Initialize SoundCloud Widget
      initializeSoundCloudWidget();

      // Add event listeners to buttons
      if (elements.playBtn) {
        elements.playBtn.addEventListener('click', togglePlayPause);
      }

      if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', previousTrack);
      }

      if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', nextTrack);
      }

      console.log('Music module initialized');
    }
  };
})();
