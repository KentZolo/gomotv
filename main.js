// Constants
const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Genre list
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

// Image URL utility
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return `${IMG_BASE}${path}`;
}

// ========== BANNER SLIDER ==========
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
  document.querySelector('.prev').addEventListener('click', () => {
    bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });

  document.querySelector('.next').addEventListener('click', () => {
    bannerIndex = (bannerIndex + 1) % bannerItems.length;
    showBannerSlide(bannerIndex);
  });

  setInterval(() => {
    bannerIndex = (bannerIndex + 1) % bannerItems.length;
    showBannerSlide(bannerIndex);
  }, 5000);
}

// ========== FETCH CONTENT ==========
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
  document.querySelectorAll(`${containerSelector} .poster-wrapper`).forEach(poster => {
    poster.addEventListener('click', () => {
      const img = poster.querySelector('img');
      if (img) {
        openModal(img.dataset.id, img.dataset.type);
      }
    });
  });
}

// ========== MODAL PLAYER ==========
const SERVERS = [
  { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` },
  { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
  { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` }
];

async function openModal(id, type) {
  try {
    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();

    const modal = createModal(data, type, id);
    document.getElementById('modal-container').appendChild(modal);
    document.body.style.overflow = 'hidden';

    setupModalEvents(modal, id, type);
    loadDefaultServer(modal, type, id);
  } catch (err) {
    console.error('Modal error:', err);
    alert('Failed to load details');
  }
}

function createModal(data, type, id) {
  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const rating = data.vote_average?.toFixed(1) || 'N/A';
  const overview = data.overview || 'No description available.';
  const genres = data.genres?.map(g => g.name).join(', ');

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <div class="modal-header">
        <h2>${title} (${year})</h2>
        <div class="meta-info">
          <span>⭐ ${rating}</span>
          <span>${type.toUpperCase()}</span>
          ${genres ? `<span>${genres}</span>` : ''}
        </div>
      </div>
      <div class="modal-body">
        <h3>Overview</h3>
        <p>${overview}</p>
        <select class="server-selector" id="server-select">
          ${SERVERS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
        <div class="player-container">
          <div class="loading-server">Loading player...</div>
          <iframe id="player-frame" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  `;
  return modal;
}

function setupModalEvents(modal, id, type) {
  modal.querySelector('.close-btn').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  const serverSelect = modal.querySelector('#server-select');
  serverSelect.addEventListener('change', (e) => {
    const server = SERVERS.find(s => s.id === e.target.value);
    if (server) modal.querySelector('#player-frame').src = server.url(type, id);
  });
}

function loadDefaultServer(modal, type, id) {
  const iframe = modal.querySelector('#player-frame');
  const loading = modal.querySelector('.loading-server');
  if (!iframe || !loading) return;

  let index = 0;
  function tryNextServer() {
    if (index >= SERVERS.length) {
      loading.textContent = 'No working server found';
      return;
    }
    iframe.src = SERVERS[index].url(type, id);
    iframe.onload = () => loading.style.display = 'none';
    iframe.onerror = () => {
      index++;
      tryNextServer();
    };
  }
  tryNextServer();
}

function closeModal(modal) {
  modal.remove();
  document.body.style.overflow = '';
}

// ========== MENU / SEARCH ==========
function setupMenuToggle() {
  const btn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);

  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  overlay.addEventListener('click', () => {
    btn.classList.remove('active');
    menu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  document.querySelectorAll('#hamburger-menu a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('active');
      menu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

function setupMenuSearch() {
  const input = document.getElementById('menu-search-input');
  const btn = document.getElementById('menu-search-button');

  if (!btn || !input) return;

  function doSearch() {
    const q = input.value.trim();
    if (q.length >= 2) {
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}

// ========== THEME TOGGLE ==========
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const current = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(current);

  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    document.body.classList.toggle('light', isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });
}

// ========== GENRE PAGE ==========
function initGenrePage() {
  const genreGrid = document.getElementById('genre-grid');
  if (genreGrid) {
    genreGrid.innerHTML = GENRES.map(g =>
      `<a href="genre.html?id=${g.id}&name=${encodeURIComponent(g.name)}" class="genre-link">${g.name}</a>`
    ).join('');
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

    if (data.results?.length) {
      displayGenreResults(data.results);
      renderGenrePagination(data.total_pages, page, genreId);
    } else {
      container.innerHTML = '<p class="no-results">No movies found in this genre.</p>';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('results-grid').innerHTML = '<p class="error-message">Failed to load movies.</p>';
  }
}

function displayGenreResults(movies) {
  const container = document.getElementById('results-grid');
  container.innerHTML = movies.map(m => `
    <div class="poster-wrapper">
      <img src="${getImageUrl(m.poster_path)}" alt="${m.title}" data-id="${m.id}" data-type="movie">
      <div class="poster-label">${m.title}</div>
      <div class="poster-meta">${m.release_date?.slice(0, 4) || ''}</div>
    </div>
  `).join('');

  setupPosterClickEvents('#results-grid');
}

function renderGenrePagination(total, current, genreId) {
  const top = document.getElementById('pagination-top');
  const bottom = document.getElementById('pagination');
  if (total <= 1) return top.innerHTML = bottom.innerHTML = '';

  let html = '';
  for (let i = 1; i <= total; i++) {
    if (Math.abs(i - current) <= 2 || i === 1 || i === total) {
      html += `<a href="?id=${genreId}&page=${i}" class="page-link ${i === current ? 'active' : ''}">${i}</a>`;
    } else if (i === current - 3 || i === current + 3) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
  }
  top.innerHTML = bottom.innerHTML = html;
}

// ========== INITIALIZE ==========
window.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  setupMenuToggle();
  setupMenuSearch();

  if (document.getElementById('genre-grid') || document.getElementById('results-grid')) {
    initGenrePage();
  }

  if (document.querySelector('.banner-slider')) loadBannerSlider();

  if (document.querySelector('.movie-list')) {
    fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  }

  const params = new URLSearchParams(location.search);
  if (params.get('id') && params.get('type')) {
    openModal(params.get('id'), params.get('type'));
  }

  window.addEventListener('popstate', () => {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
  });
});
