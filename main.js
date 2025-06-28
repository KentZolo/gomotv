// === CONFIG ===
const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

// === UTILITIES ===
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return `${IMG_BASE}${path}`;
}

// === BANNER SLIDER ===
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
    }
  } catch (err) {
    console.error('Banner error:', err);
    document.getElementById('poster-summary').textContent = 'Failed to load featured content';
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  const img = document.getElementById('poster-img');

  img.src = getImageUrl(item.backdrop_path, true);
  img.alt = item.title;
  img.dataset.id = item.id;
  img.dataset.type = 'movie';

  document.getElementById('poster-meta').textContent =
    `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • Movie • ${item.release_date?.slice(0, 4) || ''}`;
  document.getElementById('poster-summary').textContent = item.title;
}

function setupBannerNavigation() {
  document.querySelector('.prev').addEventListener('click', prevSlide);
  document.querySelector('.next').addEventListener('click', nextSlide);
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

// === CONTENT LOADER ===
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = '<div class="loading"></div>';

    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      displayMedia(data.results, containerSelector, type);
    } else {
      container.innerHTML = '<p class="error-message">No content available</p>';
    }
  } catch (err) {
    console.error(`Failed to load content:`, err);
    document.querySelector(containerSelector).innerHTML =
      '<p class="error-message">Failed to load content</p>';
  }
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const imageUrl = getImageUrl(item.poster_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const type = item.media_type || defaultType;
    const quality = determineQuality(item.release_date || item.first_air_date);

    return `
      <div class="poster-wrapper">
        ${quality ? `<div class="poster-badge">${quality}</div>` : ''}
        <img src="${imageUrl}" alt="${title}" data-id="${item.id}" data-type="${type}" loading="lazy">
        <div class="poster-label">${title}</div>
        <div class="poster-meta">${year}</div>
      </div>
    `;
  }).join('');

  setupPosterClickEvents(containerSelector);
}

function determineQuality(releaseDate) {
  if (!releaseDate) return 'HD';
  const now = new Date();
  const released = new Date(releaseDate);
  const diffDays = Math.floor((now - released) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return 'CAM';
  if (diffDays < 21) return 'TS';
  return 'HD';
}

function setupPosterClickEvents(containerSelector) {
  const posters = document.querySelectorAll(`${containerSelector} .poster-wrapper`);
  if (!posters) return;
  posters.forEach(poster => {
    poster.addEventListener('click', () => {
      const img = poster.querySelector('img');
      if (img) {
        openModal(img.dataset.id, img.dataset.type);
      }
    });
  });
}

// === MODAL PLAYER ===
// (same as your existing openModal, createModal, setupModalEvents, loadDefaultServer, closeModal functions)
// Include those here unchanged

// === HAMBURGER MENU ===
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);

  if (!menuBtn || !menu) return;

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  overlay.addEventListener('click', () => {
    menuBtn.classList.remove('active');
    menu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  document.querySelectorAll('#hamburger-menu a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      menu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

function setupMenuSearch() {
  const input = document.getElementById('menu-search-input');
  const button = document.getElementById('menu-search-button');
  if (!input || !button) return;

  function performSearch() {
    const term = input.value.trim();
    if (term.length >= 2) {
      document.getElementById('hamburger-menu').classList.remove('active');
      document.querySelector('.menu-overlay').classList.remove('active');
      document.getElementById('menu-toggle').classList.remove('active');
      document.body.style.overflow = '';
      window.location.href = `search.html?q=${encodeURIComponent(term)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  }

  button.addEventListener('click', performSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

// === THEME TOGGLE ===
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(currentTheme);

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    document.body.classList.toggle('light', isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });
}

// === GENRE PAGE ===
function initGenrePage() {
  const genreGrid = document.getElementById('genre-grid');
  if (genreGrid) {
    genreGrid.innerHTML = GENRES.map(g => `
      <a href="genre.html?id=${g.id}&name=${encodeURIComponent(g.name)}" class="genre-link">${g.name}</a>
    `).join('');
  }

  const params = new URLSearchParams(location.search);
  const genreId = params.get('id');
  const genreName = params.get('name');
  const page = parseInt(params.get('page')) || 1;

  if (genreId && genreName) {
    document.title = `${genreName} - GomoTV`;
    document.getElementById('genre-title').textContent = `${genreName} Movies`;
    fetchGenreMovies(genreId, page);
  }
}

async function fetchGenreMovies(genreId, page = 1) {
  try {
    const container = document.getElementById('results-grid');
    container.innerHTML = '<div class="loading"></div>';

    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      displayGenreResults(data.results);
      renderGenrePagination(data.total_pages, page, genreId);
    } else {
      container.innerHTML = '<p class="no-results">No movies found in this genre.</p>';
    }
  } catch (error) {
    console.error('Error fetching genre movies:', error);
    document.getElementById('results-grid').innerHTML =
      '<p class="error-message">Failed to load movies. Please try again later.</p>';
  }
}

function displayGenreResults(movies) {
  const container = document.getElementById('results-grid');
  container.innerHTML = movies.map(movie => `
    <div class="poster-wrapper">
      <img src="${getImageUrl(movie.poster_path)}"
           alt="${movie.title}"
           data-id="${movie.id}"
           data-type="movie"
           loading="lazy">
      <div class="poster-label">${movie.title}</div>
      <div class="poster-meta">${movie.release_date?.slice(0, 4) || ''}</div>
    </div>
  `).join('');

  document.querySelectorAll('.poster-wrapper img').forEach(img => {
    img.addEventListener('click', () => {
      openModal(img.dataset.id, img.dataset.type);
    });
  });
}

function renderGenrePagination(totalPages, currentPage, genreId) {
  const pagTop = document.getElementById('pagination-top');
  const pagBottom = document.getElementById('pagination');
  if (totalPages <= 1) {
    pagTop.innerHTML = '';
    pagBottom.innerHTML = '';
    return;
  }

  let buttons = '';
  const minPage = Math.max(1, currentPage - 2);
  const maxPage = Math.min(totalPages, currentPage + 2);

  if (currentPage > 1) {
    buttons += `<a href="genre.html?id=${genreId}&page=${currentPage - 1}" class="page-link">‹ Prev</a>`;
  }

  for (let i = minPage; i <= maxPage; i++) {
    buttons += `<a href="genre.html?id=${genreId}&page=${i}" class="page-link ${i === currentPage ? 'active' : ''}">${i}</a>`;
  }

  if (currentPage < totalPages) {
    buttons += `<a href="genre.html?id=${genreId}&page=${currentPage + 1}" class="page-link">Next ›</a>`;
  }

  pagTop.innerHTML = buttons;
  pagBottom.innerHTML = buttons;
}

// === DOM READY ===
window.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  setupMenuToggle();
  setupMenuSearch();

  if (document.getElementById('genre-grid') || document.getElementById('results-grid')) {
    initGenrePage();
  }

  if (document.querySelector('.banner-slider')) {
    loadBannerSlider();
  }

  if (document.querySelector('.movie-list')) {
    fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  }

  const params = new URLSearchParams(location.search);
  if (params.get('id') && params.get('type')) {
    openModal(params.get('id'), params.get('type'));
  }

  window.addEventListener('popstate', (e) => {
    if (e.state?.modal) {
      const modal = document.querySelector('.modal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
    }
  });
});
