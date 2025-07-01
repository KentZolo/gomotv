const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

/* ================= THEME SYSTEM (Gaya ng sa movies.html) ================= */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  body.classList.remove('dark', 'light');
  body.classList.add(newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
  const darkIcon = document.querySelector('.dark-icon');
  const lightIcon = document.querySelector('.light-icon');
  if (darkIcon && lightIcon) {
    darkIcon.hidden = theme === 'light';
    lightIcon.hidden = theme === 'dark';
  }
}

/* ================= HAMBURGER MENU (Original Functionality) ================= */
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  const overlay = document.createElement('div');
  
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

/* ================= BANNER SLIDER ================= */
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    const data = await response.json();
    bannerItems = data.results.slice(0, 10);
    
    if (bannerItems.length > 0) {
      showBannerSlide(0);
      setupBannerNavigation();
    }
  } catch (error) {
    console.error('Error loading banner:', error);
    showDefaultBanner();
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  const img = document.getElementById('poster-img');
  const meta = document.getElementById('poster-meta');
  const summary = document.getElementById('poster-summary');

  if (item && img) {
    img.src = getImageUrl(item.backdrop_path, true);
    img.onload = () => {
      document.querySelector('.banner-slider').classList.add('loaded');
    };
  }

  if (meta) meta.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • ${item.release_date?.slice(0, 4) || ''}`;
  if (summary) summary.textContent = item.title || item.name;
}

function setupBannerNavigation() {
  document.querySelector('.prev').addEventListener('click', () => {
    bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });

  document.querySelector('.next').addEventListener('click', () => {
    bannerIndex = (bannerIndex + 1) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });
}

/* ================= CONTENT LOADING ================= */
async function fetchAndDisplay(endpoint, containerSelector, type = 'movie') {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await response.json();

    if (data.results?.length > 0) {
      renderMovies(data.results, container, type);
    }
  } catch (error) {
    console.error(`Error loading ${containerSelector}:`, error);
  }
}

function renderMovies(movies, container, type) {
  container.innerHTML = movies.map(movie => `
    <div class="poster-wrapper" data-id="${movie.id}" data-type="${type}">
      ${movie.vote_average > 7 ? '<div class="poster-badge">TOP</div>' : ''}
      <img src="${getImageUrl(movie.poster_path)}" alt="${movie.title || movie.name}" loading="lazy">
      <div class="poster-label">${movie.title || movie.name}</div>
      <div class="poster-meta">
        <span>⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
        <span>${(movie.release_date || movie.first_air_date)?.slice(0, 4) || ''}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      window.location.href = `watch.html?id=${poster.dataset.id}&type=${poster.dataset.type}`;
    });
  });
}

/* ================= UTILITY FUNCTIONS ================= */
function getImageUrl(path, isBackdrop = false) {
  return path 
    ? `${isBackdrop ? BACKDROP_BASE : IMG_BASE}${path}`
    : `https://via.placeholder.com/${isBackdrop ? '1920x1080' : '500x750'}?text=No+Image`;
}

/* ================= INITIALIZE ================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  setupMenuToggle();

  // Load content if elements exist
  if (document.querySelector('.banner-slider')) loadBannerSlider();
  if (document.querySelector('.movie-list')) {
    fetchAndDisplay('/trending/all/day', '.movie-list', 'mixed');
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  }
});
