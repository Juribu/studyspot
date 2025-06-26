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

  /** Playlist URLs for different genres */
  const playlistUrls = {
    lofi: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
    jazz: 'https://soundcloud.com/relaxcafemusic/sets/10-hours-jazz-relaxing-music',
    ambient: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
    piano: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
    acoustic: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
    electric: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
    nature: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus'
  };

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
   * @param {string} playlistUrl - The URL of the playlist to load
   */
  const createSoundCloudPlayer = (playlistUrl = playlistUrls.lofi) => {
    // Remove existing iframe if it exists
    const existingIframe = document.getElementById('soundcloud-player');
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create hidden iframe for SoundCloud player
    const iframe = document.createElement('iframe');
    iframe.id = 'soundcloud-player';
    iframe.width = '100%';
    iframe.height = '166';
    iframe.scrolling = 'no';
    iframe.frameBorder = 'no';
    iframe.allow = 'autoplay';
    iframe.style.display = 'none'; // Hide the player
    
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

    // Add a small delay to ensure widget is fully ready after genre switch
    setTimeout(() => {
      if (isPlaying) {
        widget.pause();
      } else {
        widget.play();
      }
    }, 100);
  };

  /**
   * Goes to previous track
   */
  const previousTrack = () => {
    if (!widget) return;
    setTimeout(() => {
      widget.prev();
    }, 100);
  };

  /**
   * Goes to next track
   */
  const nextTrack = () => {
    if (!widget) return;
    setTimeout(() => {
      widget.next();
    }, 100);
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
   * Loads a new playlist for the selected genre
   * @param {string} genre - The genre to load
   */
  const loadPlaylistForGenre = (genre) => {
    const playlistUrl = playlistUrls[genre] || playlistUrls.lofi;
    
    // Reset playing state when switching
    isPlaying = false;
    updatePlayButton(false);
    
    // Create new player with the selected playlist
    const iframe = createSoundCloudPlayer(playlistUrl);
    
    // Reinitialize widget with new iframe
    if (window.SC && window.SC.Widget) {
      widget = SC.Widget(iframe);
      
      // Set up event listeners for the new widget
      widget.bind(SC.Widget.Events.READY, () => {
        console.log(`SoundCloud player ready with ${genre} playlist`);
        
        // Reset playing state once widget is ready
        isPlaying = false;
        updatePlayButton(false);
        
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
              // Only update title if we're not showing the genre format
              if (!elements.trackTitle.textContent.includes(' by ')) {
                elements.trackTitle.textContent = sound.title;
              }
            }
          });
        });
      });
      
      // Handle widget load errors
      widget.bind(SC.Widget.Events.ERROR, () => {
        console.error(`Error loading ${genre} playlist`);
      });
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
    
    // Load the appropriate playlist for the selected genre
    loadPlaylistForGenre(genre);
    
    // Update track title to show selected genre
    if (elements.trackTitle) {
      if (genre === 'jazz') {
        elements.trackTitle.innerHTML = `Jazz<br><span class="author-name">RelaxCafeMusic</span>`;
      } else {
        elements.trackTitle.innerHTML = `${genre.charAt(0).toUpperCase() + genre.slice(1)}<br><span class="author-name">Lofi Girl</span>`;
      }
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
