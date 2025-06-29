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
  let hasShownNotification = false;

  /** Playlist URLs for different genres and moods */
  const playlistUrls = {
    // Genres
    lofi: {
      url: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
      artist: 'Lofi Girl'
    },
    jazz: {
      url: 'https://soundcloud.com/relaxcafemusic/sets/10-hours-jazz-relaxing-music',
      artist: 'RelaxCafeMusic'
    },
    // Moods
    focus: {
      url: 'https://soundcloud.com/relaxdaily/sets/deep-focus-music-studying-concentration-work',
      artist: 'RelaxDaily'
    }
  };

  /**
   * Shows a notification popup about SoundCloud music source
   * @param {string} selectionType - The type of selection ('genre' or 'mood')
   * @param {string} selectionValue - The selected value
   */
  const showMusicNotification = (selectionType = null, selectionValue = null) => {
    // Get current active selection to show in notification
    let currentInfo = 'Lofi Girl';
    let selectionName = 'Lofi';
    
    if (selectionType && selectionValue && playlistUrls[selectionValue]) {
      currentInfo = playlistUrls[selectionValue].artist;
      selectionName = selectionValue.charAt(0).toUpperCase() + selectionValue.slice(1);
    } else {
      const activeGenre = document.querySelector('.genre-option.active');
      const activeMood = document.querySelector('.mood-option.active');
      
      if (activeGenre) {
        const genreValue = activeGenre.dataset.genre;
        currentInfo = playlistUrls[genreValue]?.artist || 'Lofi Girl';
        selectionName = genreValue.charAt(0).toUpperCase() + genreValue.slice(1);
      } else if (activeMood) {
        const moodValue = activeMood.dataset.mood;
        currentInfo = playlistUrls[moodValue]?.artist || 'Lofi Girl';
        selectionName = moodValue.charAt(0).toUpperCase() + moodValue.slice(1);
      }
    }
    
    // Remove existing notification if any
    const existingNotification = document.getElementById('music-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'music-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <p>Playing: ${selectionName}</p>
        <p class="playlist-info">Author: ${currentInfo} - SoundCloud</p>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      font-family: 'Inter', sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      max-width: 250px;
    `;
    
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
      margin: 0;
    `;
    
    const mainText = notification.querySelector('p:first-child');
    mainText.style.cssText = `
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
    `;
    
    const playlistInfo = notification.querySelector('.playlist-info');
    playlistInfo.style.cssText = `
      margin: 0;
      font-size: 12px;
      opacity: 0.8;
      font-weight: 400;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
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
  const createSoundCloudPlayer = (playlistUrl = playlistUrls.lofi.url) => {
    const existingIframe = document.getElementById('soundcloud-player');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'soundcloud-player';
    iframe.width = '100%';
    iframe.height = '166';
    iframe.allow = 'autoplay';
    iframe.style.display = 'none';
    
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
    
    document.body.appendChild(iframe);
    
    return iframe;
  };

  /**
   * Initializes SoundCloud Widget API
   */
  const initializeSoundCloudWidget = () => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = () => {
      const iframe = createSoundCloudPlayer();
      
      widget = SC.Widget(iframe);
      
      widget.bind(SC.Widget.Events.READY, () => {
        console.log('SoundCloud player ready');
        
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
        // Show notification on first play only
        if (!hasShownNotification) {
          showMusicNotification();
          hasShownNotification = true;
        }
      }
    }, 100);
  };

  const previousTrack = () => {
    if (!widget) return;
    setTimeout(() => {
      widget.prev();
    }, 100);
  };

  const nextTrack = () => {
    if (!widget) return;
    setTimeout(() => {
      widget.next();
    }, 100);
  };

  const toggleDropdown = (type) => {
    const dropdown = type === 'genre' ? elements.genreDropdown : elements.moodDropdown;
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  };

  /**
   * Loads a new playlist for the selected option
   * @param {string} key - The key to load from playlistUrls
   */
  const loadPlaylist = (key) => {
    const playlist = playlistUrls[key];
    if (!playlist) {
      console.error(`No playlist found for: ${key}`);
      return;
    }

    const playlistUrl = playlist.url;
    
    // Reset playing state when switching
    isPlaying = false;
    updatePlayButton(false);
    
    const iframe = createSoundCloudPlayer(playlistUrl);
    
    if (window.SC && window.SC.Widget) {
      widget = SC.Widget(iframe);
      
      widget.bind(SC.Widget.Events.READY, () => {
        console.log(`SoundCloud player ready with ${key} playlist`);
        
        // Reset playing state once widget is ready
        isPlaying = false;
        updatePlayButton(false);
        
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
              // Only update title if we're not showing the custom format
              if (!elements.trackTitle.innerHTML.includes('<br>')) {
                elements.trackTitle.textContent = sound.title;
              }
            }
          });
        });
      });
      
      widget.bind(SC.Widget.Events.ERROR, () => {
        console.error(`Error loading ${key} playlist`);
      });
    }
  };
  /**
   * Handles selection of genre or mood
   * @param {string} type - 'genre' or 'mood'
   * @param {string} value - The selected value
   */
  const handleSelection = (type, value) => {
    const isGenre = type === 'genre';
    const currentOptions = isGenre ? elements.genreOptions : elements.moodOptions;
    const otherOptions = isGenre ? elements.moodOptions : elements.genreOptions;
    const dropdown = isGenre ? elements.genreDropdown : elements.moodDropdown;
    const selector = isGenre ? `.genre-option[data-genre="${value}"]` : `.mood-option[data-mood="${value}"]`;
    
    // Remove active class from current type options
    currentOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Remove active class from other type options (mutual exclusivity)
    otherOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Add active class to selected option
    const selectedOption = document.querySelector(selector);
    if (selectedOption) {
      selectedOption.classList.add('active');
    }
    
    // Close dropdown
    if (dropdown) {
      dropdown.classList.remove('show');
    }
    
    // Load playlist if available
    const playlist = playlistUrls[value];
    if (playlist) {
      loadPlaylist(value);
      
      // Update track title
      if (elements.trackTitle) {
        elements.trackTitle.innerHTML = `${value.charAt(0).toUpperCase() + value.slice(1)}<br><span class="author-name">${playlist.artist}</span>`;
      }
      
      // Show notification when switching genres/moods
      showMusicNotification(type, value);
    }
    
    console.log(`${type} changed to: ${value}`);
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
      initializeSoundCloudWidget();

      if (elements.playBtn) {
        elements.playBtn.addEventListener('click', togglePlayPause);
      }

      if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', previousTrack);
      }

      if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', nextTrack);
      }

      if (elements.genreBtn) {
        elements.genreBtn.addEventListener('click', () => toggleDropdown('genre'));
      }

      elements.genreOptions.forEach(option => {
        option.addEventListener('click', () => {
          const genre = option.dataset.genre;
          handleSelection('genre', genre);
        });
      });

      if (elements.moodBtn) {
        elements.moodBtn.addEventListener('click', () => toggleDropdown('mood'));
      }

      elements.moodOptions.forEach(option => {
        option.addEventListener('click', () => {
          const mood = option.dataset.mood;
          handleSelection('mood', mood);
        });
      });

      document.addEventListener('click', handleClickOutside);

      console.log('Music module initialized');
    }
  };
})();
