const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ====================== LOGO FUNCTIONALITY (UPDATED) ======================
function setupLogoInteractions() {
  const logo = document.querySelector('.logo-svg');
  
  if (!logo) return;

  // Click animation
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Pulse animation
    logo.style.animation = 'none';
    void logo.offsetWidth; // Trigger reflow
    logo.style.animation = 'pulse 0.3s ease';
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 300);
  });

  // Hover effects (simplified without border)
  logo.addEventListener('mouseenter', () => {
    logo.style.filter = 'drop-shadow(0 2px 4px rgba(229, 9, 20, 0.3))';
    logo.style.transform = 'scale(1.03)';
  });

  logo.addEventListener('mouseleave', () => {
    logo.style.filter = 'none';
    logo.style.transform = 'scale(1)';
  });
}

// ====================== THEME SYSTEM (UPDATED FOR BORDERLESS LOGO) ======================
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  const overlay = document.querySelector('.theme-transition-overlay');
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'auto';
  
  setTimeout(() => {
    body.classList.remove('dark', 'light');
    body.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
    updateLogoColors(newTheme);
    
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }, 100);
}

function updateLogoColors(theme) {
  const logoSvgText = document.querySelector('.logo-svg text');
  
  if (logoSvgText) {
    logoSvgText.setAttribute('fill', theme === 'dark' ? 'white' : '#e50914');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
  
  // Initialize logo color
  const logoSvgText = document.querySelector('.logo-svg text');
  if (logoSvgText) {
    logoSvgText.setAttribute('fill', savedTheme === 'dark' ? 'white' : '#e50914');
  }
}

// ====================== BANNER SLIDER ====================== 
// (Mananatiling pareho gaya ng dati)
let bannerIndex = 0;
let bannerItems = [];
let autoSlideInterval;

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch banner data');
    
    const data = await res.json();
    bannerItems = data.results.filter(item => item.backdrop_path).slice(0, 10);

    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      setupBannerNavigation();
      autoSlideInterval = startAutoSlide();
      
      document.querySelector('.banner-content')?.addEventListener('click', () => {
        const item = bannerItems[bannerIndex];
        window.location.href = `watch.html?id=${item.id}&type=movie`;
      });
    } else {
      showDefaultBanner();
    }
  } catch (err) {
    console.error('Banner error:', err);
    showDefaultBanner();
  }
}

// ====================== CONTENT DISPLAY ======================
// (Mananatiling pareho gaya ng dati)
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = createLoadingSpinner();

    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    const validItems = data.results?.filter(item => item && (item.poster_path || item.backdrop_path)) || [];

    if (validItems.length === 0) {
      container.innerHTML = createNoResultsMessage();
      return;
    }

    displayMedia(validItems, container, type);
  } catch (err) {
    console.error(`Failed to load ${containerSelector}:`, err);
    document.querySelector(containerSelector).innerHTML = createErrorMessage();
  }
}

// ====================== UTILITY FUNCTIONS ======================
// (Mananatiling pareho gaya ng dati)
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080/222/666?text=No+Banner'
      : 'https://via.placeholder.com/500x750/222/666?text=No+Poster';
  }
  return isBackdrop ? `${BACKDROP_BASE}${path}` : `${IMG_BASE}${path}`;
}

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupLogoInteractions(); // Simplified version
  
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Menu system (mananatiling pareho)
  setupMenuToggle();
  setupMenuSearch();

  // Load content sections
  loadBannerSlider();
  fetchAndDisplay('/trending/all/day', '.movie-list', 'mixed');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
});

// ====================== MENU SYSTEM ======================
// (Mananatiling pareho gaya ng dati)
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  const overlay = document.createElement('div');
  
  if (!menuBtn || !menu) return;

  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);

  const toggleMenu = () => {
    menuBtn.classList.toggle('active');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  };

  menuBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);

  document.querySelectorAll('#hamburger-menu a').forEach(link => {
    link.addEventListener('click', toggleMenu);
  });
}

function setupMenuSearch() {
  const searchInput = document.getElementById('menu-search-input');
  const searchBtn = document.getElementById('menu-search-button');

  if (!searchInput || !searchBtn) return;

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', e => e.key === 'Enter' && performSearch());
}
