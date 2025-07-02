const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ====================== CORE FUNCTIONS ======================
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return isBackdrop ? `${BACKDROP_BASE}${path}` : `${IMG_BASE}${path}`;
}

// ====================== BANNER SLIDER - UPDATED SPACING ======================
let bannerIndex = 0;
let bannerItems = [];
let autoSlideInterval;

async function loadBannerSlider() {
  try {
    // Clear existing interval if any
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await res.json();
    bannerItems = data.results.slice(0, 8); // Limit to 8 items for better performance

    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      setupBannerNavigation();
      startAutoSlide();
      
      // Add click handler for banner content
      const bannerContent = document.querySelector('.banner-content');
      if (bannerContent) {
        bannerContent.addEventListener('click', () => {
          const item = bannerItems[bannerIndex];
          window.location.href = `watch.html?id=${item.id}&type=movie`;
        });
      }
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
  const meta = document.getElementById('poster-meta');
  const summary = document.getElementById('poster-summary');

  if (img) img.src = getImageUrl(null, true);
  if (meta) meta.textContent = 'Featured Content';
  if (summary) summary.textContent = 'GomoTV';

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

  // Show loading state
  banner.classList.remove('loaded');

  // Preload image
  const tempImg = new Image();
  tempImg.src = getImageUrl(item.backdrop_path, true);

  tempImg.onload = () => {
    if (img) {
      img.src = tempImg.src;
      img.alt = item.title || 'Movie Banner';
    }

    if (meta) {
      meta.textContent = `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} • ${item.release_date?.slice(0, 4) || ''}`;
    }
    
    if (summary) {
      summary.textContent = item.title || 'Featured Movie';
    }

    banner.classList.add('loaded');
  };

  tempImg.onerror = () => showDefaultBanner();
}

function setupBannerNavigation() {
  const prevBtn = document.querySelector('.banner-prev');
  const nextBtn = document.querySelector('.banner-next');
  
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
}

function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    nextSlide();
  }, 6000); // 6 seconds interval
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
  resetAutoSlide();
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
  resetAutoSlide();
}

function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

// ====================== CONTENT LOADING - UPDATED SPACING ======================
async function fetchAndDisplay(endpoint, containerSelector, type, params = '') {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // Show loading state with animation
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading content...</p>
      </div>
    `;

    const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results?.length > 0) {
      displayMedia(data.results, containerSelector, type);
    } else {
      container.innerHTML = '<p class="no-content">No content available</p>';
    }
  } catch (err) {
    console.error(`Failed to load ${containerSelector}:`, err);
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>Failed to load content. Please try again later.</p>
          <button class="retry-btn">Retry</button>
        </div>
      `;
      
      // Add retry functionality
      const retryBtn = container.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          fetchAndDisplay(endpoint, containerSelector, type, params);
        });
      }
    }
  }
}

function displayMedia(items, containerSelector, type) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = items.slice(0, 12).map(item => { // Limit to 12 items
    const title = item.title || item.name;
    const imageUrl = getImageUrl(item.poster_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const mediaType = type === 'movie' ? 'Movie' : 'TV Show';

    return `
      <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
        ${item.vote_average > 7.5 ? '<div class="poster-badge">TOP</div>' : ''}
        <div class="rating-badge">⭐ ${rating}</div>
        <img src="${imageUrl}" alt="${title}" loading="lazy">
        <div class="poster-info">
          <div class="poster-label">${title}</div>
          <div class="poster-meta">
            <span>${mediaType}</span>
            <span>${year}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click events
  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      const id = poster.dataset.id;
      const type = poster.dataset.type;
      window.location.href = `watch.html?id=${id}&type=${type}`;
    });
  });
}

// ====================== MENU SYSTEM ======================
function setupMenuToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const menu = document.getElementById('hamburger-menu');
  
  if (!menuBtn || !menu) return;

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

  // Close menu when clicking links
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
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') performSearch();
  });
}

// ====================== THEME SYSTEM ======================
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  
  const overlay = document.querySelector('.theme-transition-overlay');
  if (overlay) {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
  }
  
  setTimeout(() => {
    body.classList.remove('dark', 'light');
    body.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
    
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
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

// ====================== INITIALIZATION - UPDATED CONTENT LOADING ======================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initTheme();
  
  // Setup theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Setup menu
  setupMenuToggle();
  setupMenuSearch();

  // Load banner if exists
  if (document.querySelector('.banner-slider')) {
    loadBannerSlider();
  }

  // Load content sections with proper spacing
  if (document.querySelector('.movie-list')) {
    // Add slight delay between loads for better performance
    setTimeout(() => {
      fetchAndDisplay('/trending/all/day', '.movie-list', 'mixed');
    }, 100);
    
    setTimeout(() => {
      fetchAndDisplay('/movie/popular', '.popular-list', 'movie', '&page=1');
    }, 300);
    
    setTimeout(() => {
      fetchAndDisplay('/tv/popular', '.tv-list', 'tv', '&page=1');
    }, 500);
  }
});

// Handle window resize for responsive adjustments
window.addEventListener('resize', () => {
  // Recalculate banner height if needed
  if (document.querySelector('.banner-slider')) {
    const banner = document.querySelector('.banner-slider');
    if (window.innerWidth < 768) {
      banner.style.height = '40vh';
    } else {
      banner.style.height = '55vh';
    }
  }
});
