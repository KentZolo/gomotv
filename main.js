// API Configuration
const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Global Variables
let bannerIndex = 0;
let bannerItems = [];
let currentMovies = [];
let currentTVShows = [];
let currentTrending = [];

// DOM Elements
const elements = {
  bannerImage: document.getElementById('poster-img'),
  bannerMeta: document.getElementById('poster-meta'),
  bannerTitle: document.getElementById('poster-summary'),
  movieList: document.querySelector('.movie-list'),
  popularList: document.querySelector('.popular-list'),
  tvList: document.querySelector('.tv-list'),
  prevBtn: document.querySelector('.prev'),
  nextBtn: document.querySelector('.next')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  loadAllContent();
});

// Core Functions
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return isBackdrop ? `${BACKDROP_BASE}${path}` : `${IMG_BASE}${path}`;
}

// Content Loading
async function loadAllContent() {
  try {
    await Promise.all([
      loadBannerSlider(),
      loadTrendingContent(),
      loadPopularMovies(),
      loadPopularTVShows()
    ]);
  } catch (error) {
    console.error('Error loading content:', error);
    showErrorMessages();
  }
}

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);
    
    if (bannerItems.length > 0) {
      updateBanner();
      setupBannerNavigation();
      startBannerAutoRotation();
    }
  } catch (err) {
    console.error('Banner error:', err);
    elements.bannerTitle.textContent = 'Failed to load featured content';
  }
}

async function loadTrendingContent() {
  try {
    const res = await fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
    const data = await res.json();
    currentTrending = data.results;
    displayContent(currentTrending, elements.movieList);
  } catch (err) {
    console.error('Trending error:', err);
    elements.movieList.innerHTML = '<p class="error-message">Failed to load trending content</p>';
  }
}

async function loadPopularMovies() {
  try {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    const data = await res.json();
    currentMovies = data.results;
    displayContent(currentMovies, elements.popularList, 'movie');
  } catch (err) {
    console.error('Movies error:', err);
    elements.popularList.innerHTML = '<p class="error-message">Failed to load popular movies</p>';
  }
}

async function loadPopularTVShows() {
  try {
    const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
    const data = await res.json();
    currentTVShows = data.results;
    displayContent(currentTVShows, elements.tvList, 'tv');
  } catch (err) {
    console.error('TV Shows error:', err);
    elements.tvList.innerHTML = '<p class="error-message">Failed to load TV shows</p>';
  }
}

// Display Functions
function displayContent(items, container, defaultType = 'movie') {
  if (!container) return;
  
  container.innerHTML = items.map(item => {
    const type = item.media_type || defaultType;
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const year = date ? date.slice(0, 4) : '';
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    
    return `
      <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
        ${item.vote_average > 7 ? '<div class="poster-badge">TOP</div>' : ''}
        <img src="${getImageUrl(item.poster_path)}" alt="${title}" loading="lazy">
        <div class="poster-label">${title}</div>
        <div class="poster-meta">
          <span>⭐ ${rating}</span>
          <span>${year}</span>
        </div>
      </div>
    `;
  }).join('');

  setupPosterClickEvents(container);
}

function updateBanner() {
  const item = bannerItems[bannerIndex];
  elements.bannerImage.src = getImageUrl(item.backdrop_path, true);
  elements.bannerImage.alt = item.title;
  elements.bannerImage.dataset.id = item.id;
  elements.bannerImage.dataset.type = 'movie';
  
  elements.bannerMeta.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • Movie • ${item.release_date?.slice(0, 4) || ''}`;
  elements.bannerTitle.textContent = item.title;
}

// Banner Controls
function setupBannerNavigation() {
  elements.prevBtn.addEventListener('click', prevSlide);
  elements.nextBtn.addEventListener('click', nextSlide);
}

function startBannerAutoRotation() {
  setInterval(nextSlide, 5000);
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  updateBanner();
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  updateBanner();
}

// Event Handlers
function setupPosterClickEvents(container) {
  const posters = container.querySelectorAll('.poster-wrapper');
  posters.forEach(poster => {
    poster.addEventListener('click', () => {
      const id = poster.dataset.id;
      const type = poster.dataset.type;
      window.location.href = `watch.html?id=${id}&type=${type}`;
    });
  });
}

function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Menu system
  setupMenuToggle();
  setupMenuSearch();
  
  // Banner image click
  elements.bannerImage?.addEventListener('click', () => {
    const id = elements.bannerImage.dataset.id;
    if (id) {
      window.location.href = `watch.html?id=${id}&type=movie`;
    }
  });
}

// Menu System
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  const overlay = document.querySelector('.menu-overlay');

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

  function search() {
    const query = input.value.trim();
    if (query.length >= 2) {
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  }

  button.addEventListener('click', search);
  input.addEventListener('keypress', (e) => e.key === 'Enter' && search());
}

// Theme Management
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
    updateThemeDependentElements(newTheme);
    
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }, 100);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(savedTheme);
  updateThemeIcons(savedTheme);
  updateThemeDependentElements(savedTheme);
}

function updateThemeIcons(theme) {
  const darkIcon = document.querySelector('.dark-icon');
  const lightIcon = document.querySelector('.light-icon');
  if (darkIcon && lightIcon) {
    darkIcon.hidden = theme === 'light';
    lightIcon.hidden = theme === 'dark';
  }
}

function updateThemeDependentElements(theme) {
  const isLight = theme === 'light';
  
  // Update text colors
  const textElements = document.querySelectorAll('.title-text, .poster-label');
  textElements.forEach(el => {
    el.style.color = isLight ? '#333' : '#fff';
  });
  
  // Update meta text colors
  const metaElements = document.querySelectorAll('.meta-text, .poster-meta');
  metaElements.forEach(el => {
    el.style.color = isLight ? '#666' : '#ccc';
  });
  
  // Update backgrounds
  const bgElements = document.querySelectorAll('.poster-wrapper, .poster-box');
  bgElements.forEach(el => {
    el.style.backgroundColor = isLight ? '#eee' : '#1a1a1a';
  });
}

// Error Handling
function showErrorMessages() {
  const errorContainers = [
    elements.movieList,
    elements.popularList,
    elements.tvList
  ];
  
  errorContainers.forEach(container => {
    if (container && container.innerHTML.includes('error-message')) {
      container.innerHTML = '<p class="error-message">Content unavailable. Please try again later.</p>';
    }
  });
}
