/**
 * Background Picker Module
 * Lets the user switch between curated background images and videos.
 * Persists the selection to localStorage.
 * @module BackgroundModule
 */
const BackgroundModule = (function () {
  const STORAGE_KEY = 'studyspot_background';
  const LEGACY_KEY = 'studyspot.background';

  const backgrounds = [
    {
      id: 'street',
      name: 'City Night',
      type: 'image',
      url: 'assets/images/street.jpg'
    },
    {
      id: 'rain',
      name: 'Rainy Window',
      type: 'image',
      url: 'assets/images/rain.jpg'
    },
    {
      id: 'cafe',
      name: 'Cozy Cafe',
      type: 'image',
      url: 'assets/images/coffee.jpg'
    },
    {
      id: 'forest',
      name: 'Misty Forest',
      type: 'image',
      url: 'assets/images/forrest.jpg'
    },
    {
      id: 'library',
      name: 'Library',
      type: 'image',
      url: 'assets/images/library.jpg'
    },
    {
      id: 'hideout',
      name: 'Hideout',
      type: 'video',
      url: 'assets/mp4/hideout.mp4'
    },
    {
      id: 'traveling',
      name: 'Traveling',
      type: 'video',
      url: 'assets/mp4/traveling.mp4'
    },
    {
      id: 'sunset',
      name: 'Sunset Watch',
      type: 'video',
      url: 'assets/mp4/watchingSunset.mp4'
    },
    {
      id: 'windowStar',
      name: 'Starry Window',
      type: 'video',
      url: 'assets/mp4/windowStar.mp4'
    }
  ];

  const elements = {
    btn: document.getElementById('background-btn'),
    dropdown: document.querySelector('.background-dropdown'),
    video: document.getElementById('bg-video')
  };

  const getSelectedId = () => {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
        saved = legacy;
      }
    }
    return backgrounds.some(b => b.id === saved) ? saved : backgrounds[0].id;
  };

  const applyBackground = (id) => {
    const bg = backgrounds.find(b => b.id === id) || backgrounds[0];

    if (bg.type === 'video') {
      document.body.classList.add('has-video-bg');
      if (elements.video) {
        if (elements.video.getAttribute('src') !== bg.url) {
          elements.video.setAttribute('src', bg.url);
        }
        elements.video.classList.add('active');
        const playPromise = elements.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    } else {
      document.body.classList.remove('has-video-bg');
      document.documentElement.style.setProperty('--bg-image', `url("${bg.url}")`);
      if (elements.video) {
        elements.video.classList.remove('active');
        elements.video.pause();
        elements.video.removeAttribute('src');
        elements.video.load();
      }
    }
  };

  const renderPreview = (bg) => {
    if (bg.type === 'video') {
      // #t=0.1 nudges browsers to render the first frame as a still preview
      return `<video src="${bg.url}#t=0.1" muted playsinline preload="metadata"></video>`;
    }
    return `<img src="${bg.url}" alt="${bg.name}" loading="lazy">`;
  };

  const renderOptions = (selectedId) => {
    if (!elements.dropdown) return;
    elements.dropdown.innerHTML = backgrounds.map(bg => `
      <button class="background-option${bg.id === selectedId ? ' active' : ''}" data-bg="${bg.id}">
        ${renderPreview(bg)}
        <span>${bg.name}</span>
      </button>
    `).join('');

    elements.dropdown.querySelectorAll('.background-option').forEach(option => {
      option.addEventListener('click', () => {
        const id = option.dataset.bg;
        selectBackground(id);
      });
    });
  };

  const selectBackground = (id) => {
    applyBackground(id);
    localStorage.setItem(STORAGE_KEY, id);

    if (elements.dropdown) {
      elements.dropdown.querySelectorAll('.background-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.bg === id);
      });
      elements.dropdown.classList.remove('show');
    }
  };

  const toggleDropdown = () => {
    if (elements.dropdown) {
      elements.dropdown.classList.toggle('show');
    }
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.background-container')) {
      if (elements.dropdown) {
        elements.dropdown.classList.remove('show');
      }
    }
  };

  return {
    init() {
      const selectedId = getSelectedId();
      applyBackground(selectedId);
      renderOptions(selectedId);

      if (elements.btn) {
        elements.btn.addEventListener('click', toggleDropdown);
      }

      document.addEventListener('click', handleClickOutside);

      console.log('Background module initialized');
    }
  };
})();
