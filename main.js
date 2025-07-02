// ===== GLOBAL VARIABLES =====
const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// ===== DOM ELEMENTS =====
const menuToggle = document.getElementById('menu-toggle');
const hamburgerMenu = document.getElementById('hamburger-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const themeToggle = document.getElementById('theme-toggle');
const themeOverlay = document.querySelector('.theme-transition-overlay');
const menuSearchInput = document.getElementById('menu-search-input');
const menuSearchButton = document.getElementById('menu-search-button');

// ===== BANNER ELEMENTS =====
const bannerSlider = document.querySelector('.banner-slider');
const posterImg = document.getElementById('poster-img');
const posterMeta = document.getElementById('poster-meta');
const posterSummary = document.getElementById('poster-summary');
const prevBtn = document.querySelector('.banner-slider .prev');
const nextBtn = document.querySelector('.banner-slider .next');

// ===== CONTENT GRID ELEMENTS =====
const movieList = document.querySelector('.movie-list');
const popularList = document.querySelector('.popular-list');
const tvList = document.querySelector('.tv-list');

// ===== STATE VARIABLES =====
let currentBannerIndex = 0;
let trendingMovies = [];
let popularMovies = [];
let popularTVShows = [];
let bannerItems = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  fetchAllContent();
});

// ===== THEME FUNCTIONS =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  themeOverlay.style.opacity = '1';
  themeOverlay.style.pointerEvents = 'auto';
  
  setTimeout(() => {
    body.classList.remove('dark', 'light');
    body.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
    
    themeOverlay.style.opacity = '0';
    themeOverlay.style.pointerEvents = 'none';
  }, 100);
}

function updateThemeIcons(theme) {
  const darkIcon = document.querySelector('.dark-icon');
  const lightIcon = document.querySelector('.light-icon');
  if (darkIcon && lightIcon) {
    darkIcon.hidden = theme === 'light';
    lightIcon.hidden = theme === 'dark';
  }
}

// ===== MENU FUNCTIONS =====
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Menu toggle
  if (menuToggle && hamburgerMenu && menuOverlay) {
    menuToggle.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);
  }

  // Menu search
  if (menuSearchButton && menuSearchInput) {
    menuSearchButton.addEventListener('click', performMenuSearch);
    menuSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performMenuSearch();
    });
  }

  // Banner navigation
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', showPrevBanner);
    nextBtn.addEventListener('click', showNextBanner);
  }
}

function toggleMenu() {
  menuToggle.classList.toggle('active');
  hamburgerMenu.classList.toggle('active');
  menuOverlay.classList.toggle('active');
  document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
}

function performMenuSearch() {
  const searchTerm = menuSearchInput.value.trim();
  if (searchTerm.length >= 2) {
    toggleMenu();
    window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
  } else {
    alert('Please enter at least 2 characters');
  }
}

// ===== CONTENT FETCHING =====
async function fetchAllContent() {
  try {
    const [trendingRes, popularMoviesRes, popularTVRes] = await Promise.all([
      fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`),
      fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
      fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`)
    ]);

    if (!trendingRes.ok || !popularMoviesRes.ok || !popularTVRes.ok) {
      throw new Error('Failed to fetch content');
    }

    trendingMovies = await trendingRes.json();
    popularMovies = await popularMoviesRes.json();
    popularTVShows = await popularTVRes.json();

    // Combine first 5 items from each category for banner
    bannerItems = [
      ...trendingMovies.results.slice(0, 5),
      ...popularMovies.results.slice(0, 5),
      ...popularTVShows.results.slice(0, 5)
    ];

    displayAllContent();
    updateBanner();
  } catch (error) {
    console.error('Error fetching content:', error);
    // You might want to show an error message to users here
  }
}

// ===== CONTENT DISPLAY =====
function displayAllContent() {
  displayContentGrid(trendingMovies.results, movieList, 'movie');
  displayContentGrid(popularMovies.results, popularList, 'movie');
  displayContentGrid(popularTVShows.results, tvList, 'tv');
}

function displayContentGrid(items, container, type) {
  if (!container) return;
  
  container.innerHTML = items.slice(0, 20).map(item => `
    <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
      <img src="${IMAGE_BASE_URL}${item.poster_path}" alt="${item.title || item.name}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
      <div class="poster-info">
        <div class="poster-label">${item.title || item.name}</div>
        <div class="poster-meta">
          <span>${(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
          <span>⭐ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
      ${item.vote_average > 7.5 ? `<div class="rating-badge">Top Rated</div>` : ''}
    </div>
  `).join('');

  // Add click event listeners to all posters
  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      const id = poster.dataset.id;
      const type = poster.dataset.type;
      window.location.href = `watch.html?id=${id}&type=${type}`;
    });
  });
}

// ===== BANNER FUNCTIONS =====
function updateBanner() {
  if (bannerItems.length === 0) return;

  const currentItem = bannerItems[currentBannerIndex];
  const isMovie = currentItem.hasOwnProperty('title');

  // Set image source with loading state
  posterImg.style.opacity = 0;
  posterImg.onload = () => {
    posterImg.style.opacity = 1;
  };
  posterImg.src = `${IMAGE_BASE_URL}${currentItem.backdrop_path || currentItem.poster_path}`;
  posterImg.alt = isMovie ? currentItem.title : currentItem.name;

  // Update banner info
  posterMeta.textContent = `
    ${(currentItem.release_date || currentItem.first_air_date || '').slice(0, 4)} • 
    ⭐ ${currentItem.vote_average?.toFixed(1) || 'N/A'} • 
    ${isMovie ? 'Movie' : 'TV Show'}
  `;
  posterSummary.textContent = isMovie ? currentItem.title : currentItem.name;
}

function showNextBanner() {
  currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
  updateBanner();
}

function showPrevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
  updateBanner();
}

// ===== AUTO BANNER ROTATION =====
let bannerInterval;

function startBannerRotation() {
  // Clear existing interval if any
  if (bannerInterval) clearInterval(bannerInterval);
  
  // Start new interval (change every 8 seconds)
  bannerInterval = setInterval(showNextBanner, 8000);
}

// Start rotation when user is not hovering over banner
if (bannerSlider) {
  bannerSlider.addEventListener('mouseenter', () => {
    if (bannerInterval) clearInterval(bannerInterval);
  });

  bannerSlider.addEventListener('mouseleave', startBannerRotation);
}

// Initialize banner rotation
startBannerRotation();
