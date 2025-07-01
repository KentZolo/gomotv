const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ====================== LOGO PAINT EFFECT ======================
function setupPaintBrushLogo() {
  const svgNS = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(svgNS, "defs");
  const filter = document.createElementNS(svgNS, "filter");
  filter.setAttribute("id", "paintbrush");
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");

  // Create turbulence for paint texture
  const feTurbulence = document.createElementNS(svgNS, "feTurbulence");
  feTurbulence.setAttribute("type", "fractalNoise");
  feTurbulence.setAttribute("baseFrequency", "0.05");
  feTurbulence.setAttribute("numOctaves", "3");
  feTurbulence.setAttribute("result", "noise");

  // Create displacement map
  const feDisplacementMap = document.createElementNS(svgNS, "feDisplacementMap");
  feDisplacementMap.setAttribute("in", "SourceGraphic");
  feDisplacementMap.setAttribute("in2", "noise");
  feDisplacementMap.setAttribute("scale", "8");
  feDisplacementMap.setAttribute("xChannelSelector", "R");
  feDisplacementMap.setAttribute("yChannelSelector", "G");

  // Append filter elements
  filter.appendChild(feTurbulence);
  filter.appendChild(feDisplacementMap);
  defs.appendChild(filter);

  // Add to SVG
  const svg = document.querySelector('.logo-svg');
  if (svg) {
    svg.insertBefore(defs, svg.firstChild);
    
    // Apply to text
    const text = svg.querySelector('text');
    if (text) {
      text.setAttribute('filter', 'url(#paintbrush)');
      text.setAttribute('stroke', '#000');
      text.setAttribute('stroke-width', '1');
      text.setAttribute('paint-order', 'stroke');
    }
  }
}

// ====================== CORE FUNCTIONS ======================
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return isBackdrop ? `${BACKDROP_BASE}${path}` : `${IMG_BASE}${path}`;
}

// ====================== BANNER SLIDER ======================
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);

    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      setupBannerNavigation();
      startAutoSlide();
      
      document.querySelector('.banner-content').addEventListener('click', function() {
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
  if (img) {
    img.src = getImageUrl(null, true);
    img.alt = 'Default Banner';
  }

  const summary = document.getElementById('poster-summary');
  if (summary) summary.textContent = 'GomoTV';

  const meta = document.getElementById('poster-meta');
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

  const tempImg = new Image();
  tempImg.src = getImageUrl(item.backdrop_path, true);

  tempImg.onload = () => {
    if (img) {
      img.src = tempImg.src;
      img.alt = item.title;
    }

    if (meta) meta.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • Movie • ${item.release_date?.slice(0, 4) || ''}`;
    if (summary) summary.textContent = item.title;

    banner.classList.add('loaded');
  };

  tempImg.onerror = () => showDefaultBanner();
}

function setupBannerNavigation() {
  document.querySelector('.prev')?.addEventListener('click', prevSlide);
  document.querySelector('.next')?.addEventListener('click', nextSlide);
}

function startAutoSlide() {
  setInterval(nextSlide, 5000);
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

// ====================== CONTENT LOADING ======================
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = '<div class="loading"></div>';

    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();

    if (data.results?.length > 0) {
      displayMedia(data.results, containerSelector, type);
    } else {
      container.innerHTML = '<p class="no-content">No content available</p>';
    }
  } catch (err) {
    console.error(`Failed to load ${containerSelector}:`, err);
    document.querySelector(containerSelector).innerHTML = '<p class="error">Failed to load content</p>';
  }
}

function displayMedia(items, containerSelector, type) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const imageUrl = getImageUrl(item.poster_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average?.toFixed(1) || 'N/A';

    return `
      <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
        ${item.vote_average > 7 ? '<div class="poster-badge">TOP</div>' : ''}
        <img src="${imageUrl}" alt="${title}" loading="lazy">
        <div class="poster-label">${title}</div>
        <div class="poster-meta">
          <span>⭐ ${rating}</span>
          <span>${year}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      window.location.href = `watch.html?id=${poster.dataset.id}&type=${poster.dataset.type}`;
    });
  });
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
    updateLogoColor(newTheme);
    
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }, 100);
}

function updateLogoColor(theme) {
  const text = document.querySelector('.logo-svg text');
  if (text) {
    text.setAttribute('fill', theme === 'dark' ? '#ffffff' : '#e50914');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
  updateLogoColor(savedTheme);
}

function updateThemeIcons(theme) {
  const icons = {
    dark: document.querySelector('.dark-icon'),
    light: document.querySelector('.light-icon')
  };
  
  if (icons.dark) icons.dark.hidden = theme === 'light';
  if (icons.light) icons.light.hidden = theme === 'dark';
}

// ====================== INITIALIZATION ======================
document.addEventListener('DOMContentLoaded', () => {
  setupPaintBrushLogo(); // Initialize paint brush effect
  initTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  setupMenuToggle();
  setupMenuSearch();

  if (document.querySelector('.banner-slider')) loadBannerSlider();
  if (document.querySelector('.movie-list')) {
    fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  }
});
