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
    trackTitle: document.querySelector('.track-details h4'),
    genreBtn: document.getElementById('genre'),
    genreDropdown: document.querySelector('.genre-dropdown'),
    genreOptions: document.querySelectorAll('.genre-option'),
    moodBtn: document.getElementById('mood'),
    moodDropdown: document.querySelector('.mood-dropdown'),
    moodOptions: document.querySelectorAll('.mood-option')
  };

  /** SoundCloud player widget */
  let widget = null;
  let isPlaying = false;
  let currentGenre = 'lofi'; // Default genre
  let currentMood = 'focus'; // Default mood

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
    const playlistUrl = 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus';
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

  /**
   * Toggles genre dropdown visibility
   */
  const toggleGenreDropdown = () => {
    if (elements.genreDropdown) {
      elements.genreDropdown.classList.toggle('show');
    }
  };

  /**
   * Toggles mood dropdown visibility
   */
  const toggleMoodDropdown = () => {
    if (elements.moodDropdown) {
      elements.moodDropdown.classList.toggle('show');
    }
  };

  /**
   * Handles genre selection
   * @param {string} genre - Selected genre
   */
  const selectGenre = (genre) => {
    currentGenre = genre;
    
    // Remove active class from all genre options first
    elements.genreOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Remove active class from all mood options (mutual exclusivity)
    elements.moodOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Add active class only to the selected genre option
    const selectedOption = document.querySelector(`.genre-option[data-genre="${genre}"]`);
    if (selectedOption) {
      selectedOption.classList.add('active');
    }
    
    // Hide dropdown
    if (elements.genreDropdown) {
      elements.genreDropdown.classList.remove('show');
    }
    
    // Update track title to show selected genre
    if (elements.trackTitle) {
      elements.trackTitle.textContent = `Lofi Girl - ${genre.charAt(0).toUpperCase() + genre.slice(1)} - music to focus/study to`;
    }
    
    console.log(`Genre changed to: ${genre}`);
  };

  /**
   * Handles mood selection
   * @param {string} mood - Selected mood
   */
  const selectMood = (mood) => {
    currentMood = mood;
    
    // Remove active class from all mood options first
    elements.moodOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Remove active class from all genre options (mutual exclusivity)
    elements.genreOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Add active class only to the selected mood option
    const selectedOption = document.querySelector(`.mood-option[data-mood="${mood}"]`);
    if (selectedOption) {
      selectedOption.classList.add('active');
    }
    
    // Hide dropdown
    if (elements.moodDropdown) {
      elements.moodDropdown.classList.remove('show');
    }
    
    // Update track title to show selected mood
    if (elements.trackTitle) {
      elements.trackTitle.textContent = `Lofi Girl - ${mood.charAt(0).toUpperCase() + mood.slice(1)} vibes - music to focus/study to`;
    }
    
    console.log(`Mood changed to: ${mood}`);
  };

  /**
   * Closes dropdown when clicking outside
   */
  const handleClickOutside = (event) => {
    if (!event.target.closest('.genre-container')) {
      if (elements.genreDropdown) {
        elements.genreDropdown.classList.remove('show');
      }
    }

    if (!event.target.closest('.mood-container')) {
      if (elements.moodDropdown) {
        elements.moodDropdown.classList.remove('show');
      }
    }
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

      // Genre button event
      if (elements.genreBtn) {
        elements.genreBtn.addEventListener('click', toggleGenreDropdown);
      }

      // Genre option events
      elements.genreOptions.forEach(option => {
        option.addEventListener('click', () => {
          const genre = option.dataset.genre;
          selectGenre(genre);
        });
      });

      // Mood button event
      if (elements.moodBtn) {
        elements.moodBtn.addEventListener('click', toggleMoodDropdown);
      }

      // Mood option events
      elements.moodOptions.forEach(option => {
        option.addEventListener('click', () => {
          const mood = option.dataset.mood;
          selectMood(mood);
        });
      });

      // Close dropdown if clicked outside
      document.addEventListener('click', handleClickOutside);

      console.log('Music module initialized');
    }
  };
})();
