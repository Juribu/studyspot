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
    // SoundCloud picker
    genreBtn: document.getElementById('genre'),
    genreDropdown: document.querySelector('.genre-dropdown'),
    genreOptions: document.querySelectorAll('.genre-option'),
    moodBtn: document.getElementById('mood'),
    moodDropdown: document.querySelector('.mood-dropdown'),
    moodOptions: document.querySelectorAll('.mood-option'),
    // Spotify inline link bar (always visible below the embed)
    spotifyInputBar: document.querySelector('.spotify-input-bar'),
    spotifyLinkInput: document.getElementById('spotify-link-input'),
    spotifyLinkLoad: document.getElementById('spotify-link-load'),
    // Source toggle and panels
    sourceOptions: document.querySelectorAll('.source-option'),
    musicPlayer: document.querySelector('.music-player'),
    soundcloudPanel: document.querySelector('.player-soundcloud'),
    spotifyPanel: document.querySelector('.player-spotify'),
    spotifyEmbed: document.getElementById('spotify-embed'),
    tasteSoundcloud: document.querySelector('.taste-soundcloud')
  };

  const SOURCE_KEY = 'studyspot_music_source';
  const SELECTIONS_KEY = 'studyspot_music_selections';
  const SPOTIFY_INTRO_KEY = 'studyspot_spotify_intro_seen';

  /** Default Spotify playlist used until the user pastes their own (Lofi Beats). */
  const SAMPLE_SPOTIFY_ID = '37i9dQZF1DWWQRwui0ExPn';

  /** SoundCloud player widget */
  let widget = null;
  let isPlaying = false;
  let hasShownNotification = false;
  let currentSource = 'soundcloud';
  /** Per-source last selection — kept independent so toggling sources never bleeds state.
   *  Spotify only has two states: 'sample' (default lofi playlist) or 'custom' (pasted link). */
  const selections = {
    soundcloud: { type: 'genre', value: 'lofi' },
    spotify: { type: 'sample', value: SAMPLE_SPOTIFY_ID }
  };

  /** Playlist URLs for SoundCloud genres and moods. Spotify uses raw playlist IDs (sample or custom). */
  const playlistUrls = {
    lofi: {
      url: 'https://soundcloud.com/lofi_girl/sets/peaceful-piano-music-to-focus',
      artist: 'Lofi Girl'
    },
    jazz: {
      url: 'https://soundcloud.com/relaxcafemusic/sets/10-hours-jazz-relaxing-music',
      artist: 'RelaxCafeMusic'
    },
    focus: {
      url: 'https://soundcloud.com/relaxdaily/sets/deep-focus-music-studying-concentration-work',
      artist: 'RelaxDaily'
    }
  };

  const buildSpotifyEmbedUrl = (id) =>
    `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;

  /**
   * Extracts a Spotify playlist ID from a sharable link or URI.
   * Accepts open.spotify.com/playlist/<id>, the intl-XX variant, and spotify:playlist:<id>.
   * Returns null when no ID can be parsed.
   */
  const parseSpotifyPlaylistId = (input) => {
    if (!input) return null;
    const match = String(input).trim().match(/playlist[:/]([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  };

  /**
   * Shows a notification popup about SoundCloud music source
   * @param {string} selectionType - The type of selection ('genre' or 'mood')
   * @param {string} selectionValue - The selected value
   */
  const showMusicNotification = (selectionType = null, selectionValue = null, overrideName = null, overrideInfo = null) => {
    // Get current active selection to show in notification
    let currentInfo = 'Lofi Girl';
    let selectionName = 'Lofi';

    if (overrideName) {
      selectionName = overrideName;
      currentInfo = overrideInfo || '';
    } else if (selectionType && selectionValue && playlistUrls[selectionValue]) {
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
    
    const sourceLabel = currentSource === 'spotify' ? 'Spotify' : 'SoundCloud';
    const showInfo = currentInfo && (currentSource === 'soundcloud' || overrideInfo);
    const notification = document.createElement('div');
    notification.id = 'music-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <p>Playing: ${selectionName}</p>
        <p class="playlist-info">${sourceLabel}${showInfo ? ` · ${currentInfo}` : ''}</p>
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
    
    const playlist = playlistUrls[value];
    if (playlist) {
      selections.soundcloud = { type, value };
      saveSelections();

      loadPlaylist(value);
      if (elements.trackTitle) {
        elements.trackTitle.innerHTML = `${value.charAt(0).toUpperCase() + value.slice(1)}<br><span class="author-name">${playlist.artist}</span>`;
      }

      showMusicNotification(type, value);
    }
  };

  /**
   * Loads a Spotify playlist into the embed iframe.
   * `sel` is a selection object: { type: 'sample'|'custom', value: <playlistId> }.
   */
  const loadSpotifyPlaylist = (sel) => {
    if (!elements.spotifyEmbed) return;
    const id = sel?.value || SAMPLE_SPOTIFY_ID;
    elements.spotifyEmbed.src = buildSpotifyEmbedUrl(id);
  };

  const saveSource = () => {
    try { localStorage.setItem(SOURCE_KEY, currentSource); } catch {}
  };

  const saveSelections = () => {
    try { localStorage.setItem(SELECTIONS_KEY, JSON.stringify(selections)); } catch {}
  };

  const loadSavedState = () => {
    try {
      const savedSource = localStorage.getItem(SOURCE_KEY);
      if (savedSource === 'soundcloud' || savedSource === 'spotify') {
        currentSource = savedSource;
      }
      const savedSels = JSON.parse(localStorage.getItem(SELECTIONS_KEY));
      if (savedSels && typeof savedSels === 'object') {
        if (savedSels.soundcloud && playlistUrls[savedSels.soundcloud.value]) {
          selections.soundcloud = savedSels.soundcloud;
        }
        // Spotify only persists user-pasted links now; legacy genre/mood selections
        // are silently dropped and the user falls back to the sample playlist.
        if (savedSels.spotify && savedSels.spotify.type === 'custom' && savedSels.spotify.value) {
          selections.spotify = savedSels.spotify;
        }
      }
    } catch {}
  };

  /**
   * Updates active state on SoundCloud picker option buttons to match current selection
   */
  const syncSoundcloudActiveState = () => {
    const sel = selections.soundcloud;
    elements.genreOptions.forEach(o => o.classList.toggle('active',
      sel.type === 'genre' && o.dataset.genre === sel.value));
    elements.moodOptions.forEach(o => o.classList.toggle('active',
      sel.type === 'mood' && o.dataset.mood === sel.value));
  };

  /**
   * Switches between SoundCloud and Spotify backends
   * @param {string} source - 'soundcloud' or 'spotify'
   */
  const setSource = (source) => {
    if (source === currentSource) return;
    currentSource = source;
    saveSource();

    // Toggle source pill active state
    elements.sourceOptions.forEach(btn => {
      const isActive = btn.dataset.source === source;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (source === 'spotify') {
      if (widget && isPlaying) widget.pause();
      elements.soundcloudPanel.hidden = true;
      elements.spotifyPanel.hidden = false;
      if (elements.spotifyInputBar) elements.spotifyInputBar.hidden = false;
      elements.tasteSoundcloud.hidden = true;
      elements.musicPlayer?.classList.add('music-player--spotify');
      loadSpotifyPlaylist(selections.spotify);
      if (!localStorage.getItem(SPOTIFY_INTRO_KEY)) {
        showSpotifyInstructions();
      }
    } else {
      if (elements.spotifyEmbed) elements.spotifyEmbed.src = '';
      elements.spotifyPanel.hidden = true;
      if (elements.spotifyInputBar) elements.spotifyInputBar.hidden = true;
      elements.soundcloudPanel.hidden = false;
      elements.tasteSoundcloud.hidden = false;
      elements.musicPlayer?.classList.remove('music-player--spotify');
      syncSoundcloudActiveState();
    }
  };

  /** Pre-fills the input with the current playlist URL when one is loaded
   *  so users can see / edit / copy what's currently playing. */
  const reflectCurrentSpotifyInInput = () => {
    if (!elements.spotifyLinkInput) return;
    const isCustom = selections.spotify?.type === 'custom' && !!selections.spotify.value;
    elements.spotifyLinkInput.value = isCustom
      ? `https://open.spotify.com/playlist/${selections.spotify.value}`
      : '';
  };

  /**
   * One-time onboarding overlay explaining how Spotify playback works.
   * Persisted via SPOTIFY_INTRO_KEY so it only appears the first time.
   */
  const showSpotifyInstructions = () => {
    const existing = document.getElementById('spotify-intro');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'spotify-intro';
    popup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <h2>Heads up about Spotify</h2>
          <ol class="spotify-intro-steps">
            <li><strong>Open <a href="https://open.spotify.com" target="_blank" rel="noopener">open.spotify.com</a> in another tab and log in.</strong> Keep that tab open in the background.</li>
            <li><strong>Premium accounts</strong> can play full tracks here. <strong>Free accounts</strong> only get 30-second previews — that's a Spotify limit, not ours.</li>
            <li>If playback still doesn't work, your browser is blocking third-party cookies for the embed (common in Safari/Firefox). Allow cookies for <code>open.spotify.com</code>, or use the SoundCloud option instead.</li>
          </ol>
          <p class="spotify-intro-note">StudySpot never sees or stores your Spotify login.</p>
          <button id="spotify-intro-ok" class="popup-button">Got it</button>
        </div>
      </div>
    `;

    popup.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 10000; display: flex; align-items: center; justify-content: center;
    `;

    const overlay = popup.querySelector('.popup-overlay');
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex; align-items: center; justify-content: center;
    `;

    const content = popup.querySelector('.popup-content');
    content.style.cssText = `
      background-color: rgba(40, 40, 40, 0.97);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 32px 40px;
      color: white;
      font-family: 'Inter', sans-serif;
      max-width: 460px;
      width: calc(100% - 40px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
    `;

    const title = popup.querySelector('h2');
    title.style.cssText = `
      margin: 0 0 18px 0; font-size: 22px; font-weight: 600;
      display: flex; align-items: center; gap: 10px;
    `;

    const steps = popup.querySelector('.spotify-intro-steps');
    steps.style.cssText = `
      margin: 0 0 16px 0; padding-left: 20px;
      font-size: 14px; line-height: 1.55; opacity: 0.92;
    `;
    steps.querySelectorAll('li').forEach(li => {
      li.style.cssText = `margin-bottom: 10px;`;
    });
    steps.querySelectorAll('a').forEach(a => {
      a.style.cssText = `color: #1db954; text-decoration: underline;`;
    });
    steps.querySelectorAll('code').forEach(c => {
      c.style.cssText = `
        background: rgba(255,255,255,0.08); padding: 1px 6px;
        border-radius: 4px; font-size: 12px;
      `;
    });

    const note = popup.querySelector('.spotify-intro-note');
    note.style.cssText = `
      margin: 0 0 22px 0; font-size: 12px; opacity: 0.6; font-style: italic;
    `;

    const button = popup.querySelector('.popup-button');
    button.style.cssText = `
      background-color: white; color: black; border: none;
      border-radius: 36px; padding: 11px 28px;
      font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500;
      cursor: pointer; transition: all 0.2s ease; display: block; margin-left: auto;
    `;

    document.body.appendChild(popup);

    const dismiss = () => {
      try { localStorage.setItem(SPOTIFY_INTRO_KEY, '1'); } catch {}
      popup.remove();
    };

    button.addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });
  };

  /**
   * Closes dropdown when clicking outside
   */
  const handleClickOutside = (event) => {
    if (!event.target.closest('.taste-soundcloud .genre-container')) {
      elements.genreDropdown?.classList.remove('show');
    }
    if (!event.target.closest('.taste-soundcloud .mood-container')) {
      elements.moodDropdown?.classList.remove('show');
    }
  };

  /** Brief red-border flash on the input bar when the pasted link is invalid. */
  const flashSpotifyLinkError = () => {
    const bar = elements.spotifyInputBar;
    if (!bar) return;
    bar.classList.add('error');
    setTimeout(() => bar.classList.remove('error'), 1200);
  };

  /**
   * Validates the pasted Spotify link, loads it into the embed, and
   * persists it as the current Spotify selection so it survives reload.
   */
  const loadCustomSpotifyPlaylist = () => {
    const id = parseSpotifyPlaylistId(elements.spotifyLinkInput?.value);
    if (!id) {
      flashSpotifyLinkError();
      return;
    }
    selections.spotify = { type: 'custom', value: id };
    saveSelections();
    loadSpotifyPlaylist(selections.spotify);
    reflectCurrentSpotifyInInput();
    elements.spotifyLinkInput?.blur();
    showMusicNotification(null, null, 'Your playlist', 'Custom Spotify link');
  };

  return {
    /**
     * Initializes the music module
     */
    init() {
      loadSavedState();
      initializeSoundCloudWidget();

      // Source toggle (SoundCloud / Spotify)
      elements.sourceOptions.forEach(btn => {
        btn.addEventListener('click', () => setSource(btn.dataset.source));
      });

      // Restore initial UI based on saved source
      if (currentSource === 'spotify') {
        elements.sourceOptions.forEach(btn => {
          const isActive = btn.dataset.source === 'spotify';
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        elements.soundcloudPanel.hidden = true;
        elements.spotifyPanel.hidden = false;
        if (elements.spotifyInputBar) elements.spotifyInputBar.hidden = false;
        elements.tasteSoundcloud.hidden = true;
        elements.musicPlayer?.classList.add('music-player--spotify');
        loadSpotifyPlaylist(selections.spotify);
      }

      // Reflect saved selections in active button states (SoundCloud only)
      syncSoundcloudActiveState();
      reflectCurrentSpotifyInInput();

      if (elements.playBtn) elements.playBtn.addEventListener('click', togglePlayPause);
      if (elements.prevBtn) elements.prevBtn.addEventListener('click', previousTrack);
      if (elements.nextBtn) elements.nextBtn.addEventListener('click', nextTrack);

      // SoundCloud picker
      if (elements.genreBtn) {
        elements.genreBtn.addEventListener('click', () => toggleDropdown('genre'));
      }
      elements.genreOptions.forEach(option => {
        option.addEventListener('click', () => handleSelection('genre', option.dataset.genre));
      });
      if (elements.moodBtn) {
        elements.moodBtn.addEventListener('click', () => toggleDropdown('mood'));
      }
      elements.moodOptions.forEach(option => {
        option.addEventListener('click', () => handleSelection('mood', option.dataset.mood));
      });

      // Spotify inline link bar
      if (elements.spotifyLinkLoad) {
        elements.spotifyLinkLoad.addEventListener('click', loadCustomSpotifyPlaylist);
      }
      if (elements.spotifyLinkInput) {
        elements.spotifyLinkInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            loadCustomSpotifyPlaylist();
          }
        });
        elements.spotifyLinkInput.addEventListener('input', () => {
          elements.spotifyInputBar?.classList.remove('error');
        });
      }

      document.addEventListener('click', handleClickOutside);
    }
  };
})();
