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
let bannerInterval;

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
  darkIcon.hidden = theme === 'light';
  lightIcon.hidden = theme === 'dark';
}

// ===== MENU FUNCTIONS =====
function setupMenuToggle() {
  if (!menuToggle || !hamburgerMenu || !menuOverlay) return;

  const toggleMenu = () => {
    menuToggle.classList.toggle('active');
    hamburgerMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
  };

  menuToggle.addEventListener('click', toggleMenu);
  menuOverlay.addEventListener('click', toggleMenu);
  document.querySelectorAll('#hamburger-menu a').forEach(link => {
    link.addEventListener('click', toggleMenu);
  });
}

function setupMenuSearch() {
  if (!menuSearchButton || !menuSearchInput) return;

  const performSearch = () => {
    const searchTerm = menuSearchInput.value.trim();
    if (searchTerm.length >= 2) {
      window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
    } else {
      alert('Please enter at least 2 characters');
    }
  };

  menuSearchButton.addEventListener('click', performSearch);
  menuSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

// ===== BANNER FUNCTIONS =====
function setupBannerNavigation() {
  if (prevBtn) prevBtn.addEventListener('click', showPrevBanner);
  if (nextBtn) nextBtn.addEventListener('click', showNextBanner);
  if (bannerSlider) {
    bannerSlider.addEventListener('mouseenter', pauseBannerRotation);
    bannerSlider.addEventListener('mouseleave', startBannerRotation);
  }
}

function updateBanner() {
  if (!bannerItems.length) return;

  const currentItem = bannerItems[currentBannerIndex];
  const isMovie = 'title' in currentItem;

  posterImg.style.opacity = 0;
  posterImg.onload = () => {
    posterImg.style.opacity = 1;
  };
  posterImg.src = `${IMAGE_BASE_URL}${currentItem.backdrop_path || currentItem.poster_path}`;
  posterImg.alt = isMovie ? currentItem.title : currentItem.name;

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
  resetBannerRotation();
}

function showPrevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
  updateBanner();
  resetBannerRotation();
}

function startBannerRotation() {
  bannerInterval = setInterval(showNextBanner, 8000);
}

function pauseBannerRotation() {
  if (bannerInterval) clearInterval(bannerInterval);
}

function resetBannerRotation() {
  pauseBannerRotation();
  startBannerRotation();
}

// ===== POSTER CLICK HANDLER =====
function setupPosterClicks() {
  document.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', function() {
      const id = this.dataset.id;
      const type = this.dataset.type;
      window.location.href = `watch.html?id=${id}&type=${type}`;
    });
  });
}

// ===== CONTENT FETCHING =====
async function fetchAllContent() {
  try {
    const [trendingRes, popularMoviesRes, popularTVRes] = await Promise.all([
      fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`),
      fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
      fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`)
    ]);

    trendingMovies = await trendingRes.json();
    popularMovies = await popularMoviesRes.json();
    popularTVShows = await popularTVRes.json();

    bannerItems = [
      ...trendingMovies.results.slice(0, 3),
      ...popularMovies.results.slice(0, 3),
      ...popularTVShows.results.slice(0, 3)
    ].filter(item => item.backdrop_path || item.poster_path);

    displayAllContent();
    if (bannerItems.length > 0) {
      updateBanner();
      startBannerRotation();
    }
  } catch (error) {
    console.error('Error fetching content:', error);
  }
}

function displayAllContent() {
  displayContentGrid(trendingMovies.results, movieList, 'movie');
  displayContentGrid(popularMovies.results, popularList, 'movie');
  displayContentGrid(popularTVShows.results, tvList, 'tv');
}

function displayContentGrid(items, container, type) {
  if (!container || !items) return;
  
  container.innerHTML = items.slice(0, 20).map(item => `
    <div class="poster-wrapper" data-id="${item.id}" data-type="${type}">
      <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://via.placeholder.com/150x225?text=No+Image'}" 
           alt="${item.title || item.name}" 
           loading="lazy"
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

  setupPosterClicks();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupMenuToggle();
  setupMenuSearch();
  setupBannerNavigation();
  fetchAllContent();
});

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

const adKey = 'adLastShown';
const now = Date.now();
const lastShown = localStorage.getItem(adKey);
const interval = 5 * 60 * 1000; // 5 minutes

if (!lastShown || now - parseInt(lastShown) > interval) {
  const openAd = () => {
    localStorage.setItem(adKey, now.toString());

    // ✅ Fake click to trigger Adsterra's popunder ad
    const evt = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    });
    document.body.dispatchEvent(evt);

    document.removeEventListener('click', openAd);
    document.removeEventListener('touchstart', openAd);
  };

  // ✅ Trigger on first interaction only
  document.addEventListener('click', openAd, { once: true });
  document.addEventListener('touchstart', openAd, { once: true }); // mobile
}
