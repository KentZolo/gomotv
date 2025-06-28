const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Core Functions
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return `${IMG_BASE}${path}`;
}

// Banner Slider
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

// Content Loading
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const container = document.querySelector(containerSelector);
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
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const imageUrl = getImageUrl(item.poster_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const type = item.media_type || defaultType;
    const quality = determineQuality(item.release_date || item.first_air_date);

    return `
      <div class="poster-wrapper">
        ${quality ? `<div class="poster-badge">${quality}</div>` : ''}
        <img src="${imageUrl}" alt="${title}" data-id="${item.id}" data-type="${type}">
        <div class="poster-label">${title}</div>
        <div class="poster-meta">📅 ${year}</div>
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
      openModal(img.dataset.id, img.dataset.type);
    });
  });
}

// Modal Player
const SERVERS = [
  { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` },
  { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
  { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` }
];

async function openModal(id, type) {
  try {
    // Close any existing all-movies modal first
    const existingAllMoviesModal = document.querySelector('.all-movies-modal-container');
    if (existingAllMoviesModal) {
      existingAllMoviesModal.style.display = 'none';
    }

    history.pushState({ modal: true }, "", `?id=${id}&type=${type}`);

    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();

    const modal = createModal(data, type, id);
    document.getElementById('modal-container').appendChild(modal);
    document.body.style.overflow = 'hidden';

    setupModalEvents(modal, id, type);
    loadDefaultServer(modal, type, id);
  } catch (err) {
    console.error('Modal error:', err);
    alert('Failed to load movie details');
    
    // Re-show all-movies modal if it exists
    const existingAllMoviesModal = document.querySelector('.all-movies-modal-container');
    if (existingAllMoviesModal) {
      existingAllMoviesModal.style.display = 'flex';
    }
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

  modal.querySelector('#server-select').addEventListener('change', (e) => {
    const server = SERVERS.find(s => s.id === e.target.value);
    if (server) {
      const iframe = modal.querySelector('#player-frame');
      iframe.src = server.url(type, id);
    }
  });
}

function loadDefaultServer(modal, type, id) {
  const iframe = modal.querySelector('#player-frame');
  const loading = modal.querySelector('.loading-server');

  function tryServer(index) {
    if (index >= SERVERS.length) {
      loading.textContent = 'No working server found';
      return;
    }

    const server = SERVERS[index];
    iframe.src = server.url(type, id);
    loading.style.display = 'flex';

    iframe.onload = () => {
      loading.style.display = 'none';
    };

    iframe.onerror = () => {
      tryServer(index + 1);
    };
  }

  tryServer(0);
}

function closeModal(modal) {
  modal.remove();
  document.body.style.overflow = '';
  history.back();
  
  // Re-show all-movies modal if it exists
  const existingAllMoviesModal = document.querySelector('.all-movies-modal-container');
  if (existingAllMoviesModal) {
    existingAllMoviesModal.style.display = 'flex';
  }
}

// Hamburger Menu Toggle
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');

  if (!menuBtn || !menu) return;

  menuBtn.addEventListener('click', () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';

    if (menu.style.display === 'block') {
      const menuSearchInput = document.getElementById('menu-search-input');
      if (menuSearchInput) setTimeout(() => menuSearchInput.focus(), 100);
    }
  });
}

// Hamburger Menu Search
function setupMenuSearch() {
  const menuSearchInput = document.getElementById('menu-search-input');
  const menuSearchButton = document.getElementById('menu-search-button');

  if (!menuSearchButton || !menuSearchInput) return;

  function performMenuSearch() {
    const searchTerm = menuSearchInput.value.trim();
    if (searchTerm.length >= 2) {
      document.getElementById('hamburger-menu').style.display = 'none';
      window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  }

  menuSearchButton.addEventListener('click', performMenuSearch);
  menuSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performMenuSearch();
  });
}

// Theme Toggle
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

// All Movies Functionality
async function fetchAllMovies(page = 1) {
  try {
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching movies:', err);
    return { results: [], total_pages: 0 };
  }
}

function setupAllMoviesLink() {
  const allMoviesLink = document.getElementById('all-movies-link');
  if (!allMoviesLink) return;

  allMoviesLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Close any existing modal first
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal container
    const container = document.createElement('div');
    container.className = 'all-movies-modal-container';
    container.innerHTML = `
      <div class="modal">
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh; overflow-y: auto;">
          <span class="close-btn">×</span>
          <h2>All Movies</h2>
          <div class="search-results-grid" id="all-movies-grid"></div>
          <div class="pagination" id="all-movies-pagination"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    document.body.style.overflow = 'hidden';
    
    // Close button handler
    const closeBtn = container.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      container.remove();
      document.body.style.overflow = '';
    });
    
    // Load first page of movies
    const moviesGrid = container.querySelector('#all-movies-grid');
    const pagination = container.querySelector('#all-movies-pagination');
    
    moviesGrid.innerHTML = '<div class="loading"></div>';
    
    const data = await fetchAllMovies();
    if (data.results.length > 0) {
      displayMedia(data.results, '#all-movies-grid', 'movie');
      renderMoviesPagination(pagination, data.total_pages, 1);
    } else {
      moviesGrid.innerHTML = '<p class="error-message">No movies found</p>';
    }
  });
}

function renderMoviesPagination(container, totalPages, currentPage) {
  let buttons = '';
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;
  
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (currentPage > 1) {
    buttons += `<button data-page="${currentPage - 1}">« Prev</button>`;
  }
  
  if (startPage > 1) {
    buttons += `<button data-page="1">1</button>`;
    if (startPage > 2) {
      buttons += `<span class="ellipsis">...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    buttons += `<button data-page="${i}" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      buttons += `<span class="ellipsis">...</span>`;
    }
    buttons += `<button data-page="${totalPages}">${totalPages}</button>`;
  }
  
  if (currentPage < totalPages) {
    buttons += `<button data-page="${currentPage + 1}">Next »</button>`;
  }
  
  container.innerHTML = buttons;
  
  // Add event listeners to pagination buttons
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const page = parseInt(btn.dataset.page);
      const moviesGrid = document.getElementById('all-movies-grid');
      moviesGrid.innerHTML = '<div class="loading"></div>';
      
      const data = await fetchAllMovies(page);
      if (data.results.length > 0) {
        displayMedia(data.results, '#all-movies-grid', 'movie');
        renderMoviesPagination(container, data.total_pages, page);
      }
    });
  });
}

/* ========== NEW TV SHOWS FEATURE ========== */
async function fetchAllTVShows(page = 1) {
  try {
    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}`);
    const data = await res.json();
    data.results = data.results.filter(show => show.poster_path); // Remove shows without posters
    return data;
  } catch (err) {
    console.error('Fetch TV shows error:', err);
    return { results: [], total_pages: 0 };
  }
}

function setupTVShowsLink() {
  const tvShowsLink = document.getElementById('tvshows-link');
  if (!tvShowsLink) return;

  tvShowsLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const container = document.createElement('div');
    container.className = 'tvshows-modal-container';
    container.innerHTML = `
      <div class="modal">
        <div class="modal-content">
          <span class="close-btn">×</span>
          <h2>📺 All TV Shows</h2>
          <div class="search-results-grid" id="tvshows-grid"></div>
          <div class="pagination" id="tvshows-pagination"></div>
          <div class="pagination-disclaimer">
            <p>⚠️ Content provided by third-party servers</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    document.body.style.overflow = 'hidden';
    
    // Load TV shows
    const tvShowsGrid = container.querySelector('#tvshows-grid');
    tvShowsGrid.innerHTML = '<div class="loading"></div>';
    
    const data = await fetchAllTVShows();
    if (data.results.length > 0) {
      displayMedia(data.results, '#tvshows-grid', 'tv');
      renderMoviesPagination( // Reuse same pagination function
        container.querySelector('#tvshows-pagination'),
        data.total_pages,
        1
      );
    }

    // Close button
    container.querySelector('.close-btn').addEventListener('click', () => {
      container.remove();
      document.body.style.overflow = '';
    });

    // Pagination
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const page = parseInt(btn.dataset.page);
        tvShowsGrid.innerHTML = '<div class="loading"></div>';
        const newData = await fetchAllTVShows(page);
        displayMedia(newData.results, '#tvshows-grid', 'tv');
        renderMoviesPagination(
          container.querySelector('#tvshows-pagination'),
          newData.total_pages,
          page
        );
      });
    });
  });
}

// Initialize Everything
window.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  setupMenuToggle();
  setupMenuSearch();
  setupAllMoviesLink();
  setupTVShowsLink(); 
  
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
