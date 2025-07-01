const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ====================== IMAGE HANDLING ======================
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080/222/666?text=No+Banner'
      : 'https://via.placeholder.com/500x750/222/666?text=No+Poster';
  }
  return isBackdrop ? `${BACKDROP_BASE}${path}` : `${IMG_BASE}${path}`;
}

// ====================== BANNER SLIDER ======================
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch banner data');
    
    const data = await res.json();
    bannerItems = data.results.filter(item => item.backdrop_path).slice(0, 10);

    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      setupBannerNavigation();
      startAutoSlide();
      
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

function showDefaultBanner() {
  const banner = document.querySelector('.banner-slider');
  if (!banner) return;

  const img = document.getElementById('poster-img');
  const summary = document.getElementById('poster-summary');
  const meta = document.getElementById('poster-meta');

  if (img) img.src = getImageUrl(null, true);
  if (summary) summary.textContent = 'GomoTV';
  if (meta) meta.textContent = 'Featured Content';

  banner.classList.add('loaded');
}

function showBannerSlide(index) {
  const banner = document.querySelector('.banner-slider');
  const item = bannerItems[index];
  
  if (!banner || !item) {
    showDefaultBanner();
    return;
  }

  const img = document.getElementById('poster-img');
  const meta = document.getElementById('poster-meta');
  const summary = document.getElementById('poster-summary');

  // Preload image with error handling
  const tempImg = new Image();
  tempImg.src = getImageUrl(item.backdrop_path, true);

  tempImg.onload = () => {
    if (img) img.src = tempImg.src;
    if (meta) meta.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • ${item.release_date?.slice(0, 4) || ''}`;
    if (summary) summary.textContent = item.title || 'Untitled';
    banner.classList.add('loaded');
  };

  tempImg.onerror = () => {
    if (img) img.src = getImageUrl(null, true);
    banner.classList.add('loaded');
  };
}

function setupBannerNavigation() {
  document.querySelector('.prev')?.addEventListener('click', () => {
    bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });

  document.querySelector('.next')?.addEventListener('click', () => {
    bannerIndex = (bannerIndex + 1) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });
}

function startAutoSlide() {
  return setInterval(() => {
    bannerIndex = (bannerIndex + 1) % bannerItems.length;
    showBannerSlide(bannerIndex);
  }, 5000);
}

// ====================== CONTENT DISPLAY ======================
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

function displayMedia(items, container, type) {
  container.innerHTML = items.map(item => {
    const title = item.title || item.name || 'Untitled';
    const imageUrl = getImageUrl(item.poster_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average?.toFixed(1) || 'N/A';

    return `
      <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
        ${item.vote_average > 7 ? '<div class="poster-badge">TOP</div>' : ''}
        <img src="${imageUrl}" 
             alt="${title}" 
             loading="lazy"
             onerror="this.src='${getImageUrl(item.backdrop_path)}';this.onerror='this.src=\\'${getImageUrl(null)}\\''">
        <div class="poster-label">${title}</div>
        <div class="poster-meta">
          <span>⭐ ${rating}</span>
          <span>${year}</span>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      window.location.href = `watch.html?id=${poster.dataset.id}&type=${poster.dataset.type}`;
    });
  });
}

// ====================== UI COMPONENTS ======================
function createLoadingSpinner() {
  return `
    <div class="loading">
      <div class="spinner"></div>
      Loading...
    </div>
  `;
}

function createNoResultsMessage() {
  return `
    <div class="no-results">
      <span>🎬</span>
      <p>No content available</p>
    </div>
  `;
}

function createErrorMessage() {
  return `
    <div class="error-message">
      <span>⚠️</span>
      <p>Failed to load content</p>
      <button onclick="window.location.reload()">Try Again</button>
    </div>
  `;
}

// ====================== MENU SYSTEM ======================
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

// ====================== THEME SYSTEM ======================
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
    
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }, 100);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
}

function updateThemeIcons(theme) {
  const darkIcon = document.querySelector('.dark-icon');
  const lightIcon = document.querySelector('.light-icon');
  
  if (darkIcon) darkIcon.hidden = theme === 'light';
  if (lightIcon) lightIcon.hidden = theme === 'dark';
}

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  setupMenuToggle();
  setupMenuSearch();

  // Load content sections
  loadBannerSlider();
  fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
});

// Sa theme toggle function
const logoSvg = document.querySelector('.logo-svg text');
if (newTheme === 'dark') {
  logoSvg.setAttribute('fill', 'white');
} else {
  logoSvg.setAttribute('fill', '#e50914');
}

// Sa theme toggle script
const logoRect = document.querySelector('.logo-svg rect');
if (theme === 'dark') {
  logoRect.setAttribute('stroke', '#ff4d4d'); // Brighter red
} else {
  logoRect.setAttribute('stroke', '#cc0000'); // Darker red
}
