/**
 * Background Picker Module
 * Lets the user switch between curated background images.
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
      url: 'assets/images/street.jpg'
    },
    {
      id: 'rain',
      name: 'Rainy Window',
      url: 'assets/images/rain.jpg'
    },
    {
      id: 'cafe',
      name: 'Cozy Cafe',
      url: 'assets/images/coffee.jpg'
    },
    {
      id: 'forest',
      name: 'Misty Forest',
      url: 'assets/images/forrest.jpg'
    },
    {
      id: 'library',
      name: 'Library',
      url: 'assets/images/library.jpg'
    }
  ];

  const elements = {
    btn: document.getElementById('background-btn'),
    dropdown: document.querySelector('.background-dropdown')
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
    document.documentElement.style.setProperty('--bg-image', `url("${bg.url}")`);
  };

  const renderOptions = (selectedId) => {
    if (!elements.dropdown) return;
    elements.dropdown.innerHTML = backgrounds.map(bg => `
      <button class="background-option${bg.id === selectedId ? ' active' : ''}" data-bg="${bg.id}">
        <img src="${bg.url}" alt="${bg.name}" loading="lazy">
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
