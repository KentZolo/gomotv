// API Configuration
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
  
  // Apply theme-based styles to banner elements
  const overlay = document.querySelector('.overlay');
  const metaText = document.getElementById('poster-meta');
  const titleText = document.getElementById('poster-summary');
  
  img.src = getImageUrl(item.backdrop_path, true);
  img.alt = item.title;
  img.dataset.id = item.id;
  img.dataset.type = 'movie';

  metaText.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • Movie • ${item.release_date?.slice(0, 4) || ''}`;
  titleText.textContent = item.title;

  // Update theme-specific elements
  if (document.body.classList.contains('light')) {
    metaText.style.color = '#666';
    titleText.style.color = '#333';
    overlay.style.background = 'linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent)';
  } else {
    metaText.style.color = '#ccc';
    titleText.style.color = '#fff';
    overlay.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)';
  }

  img.addEventListener('click', () => {
    window.location.href = `watch.html?id=${item.id}&type=movie`;
  });
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
  updatePosterStylesForTheme();
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
        window.location.href = `watch.html?id=${img.dataset.id}&type=${img.dataset.type}`;
      }
    });
  });
}

function updatePosterStylesForTheme() {
  const isLight = document.body.classList.contains('light');
  const posters = document.querySelectorAll('.poster-wrapper');
  
  posters.forEach(poster => {
    const label = poster.querySelector('.poster-label');
    const meta = poster.querySelector('.poster-meta');
    
    if (isLight) {
      poster.style.backgroundColor = '#eeeeee';
      if (label) label.style.color = '#333';
      if (meta) meta.style.color = '#666';
    } else {
      poster.style.backgroundColor = '#1a1a1a';
      if (label) label.style.color = '#fff';
      if (meta) meta.style.color = '#ccc';
    }
  });
}

// Theme Management System
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
  
  // Update navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.backgroundColor = isLight ? '#ffffff' : '#000000';
  }
  
  // Update banner elements
  if (bannerItems.length > 0) {
    showBannerSlide(bannerIndex);
  }
  
  // Update all posters
  updatePosterStylesForTheme();
  
  // Update footer
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.style.backgroundColor = isLight ? '#ffffff' : '#000000';
    footer.style.color = isLight ? '#666666' : '#aaaaaa';
  }
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
  const menuSearchInput = document.getElementById('menu-search-input');
  const menuSearchButton = document.getElementById('menu-search-button');

  if (!menuSearchButton || !menuSearchInput) return;

  function performMenuSearch() {
    const searchTerm = menuSearchInput.value.trim();
    if (searchTerm.length >= 2) {
      closeMenu();
      window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  }

  function closeMenu() {
    document.getElementById('hamburger-menu').classList.remove('active');
    document.querySelector('.menu-overlay').classList.remove('active');
    document.getElementById('menu-toggle').classList.remove('active');
    document.body.style.overflow = '';
  }

  menuSearchButton.addEventListener('click', performMenuSearch);
  menuSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performMenuSearch();
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme system
  initTheme();
  
  // Setup theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Setup menu system
  setupMenuToggle();
  setupMenuSearch();
  
  // Load content
  if (document.querySelector('.banner-slider')) {
    loadBannerSlider();
  }

  if (document.querySelector('.movie-list')) {
    fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  }
});
