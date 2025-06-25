const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

function getImageUrl(path, isBackdrop = false) {
  return path
    ? `${IMG_BASE}${path}`
    : isBackdrop
    ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
    : 'https://via.placeholder.com/500x750?text=No+Poster';
}

let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);
    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      document.querySelector('.prev').addEventListener('click', prevSlide);
      document.querySelector('.next').addEventListener('click', nextSlide);
    }
  } catch (err) {
    console.error('Banner error:', err);
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
    `★ ${item.vote_average?.toFixed(1) || 'N/A'} ·  Movie · ${item.release_date?.slice(0, 4) || ''}`;
  document.getElementById('poster-summary').textContent = item.title;

  img.addEventListener('click', () => {
    openModal(item.id, 'movie');
  });
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();
    displayMedia(data.results, containerSelector, type);
  } catch (err) {
    console.error(`Failed to load ${type}:`, err);
  }
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const imageUrl = getImageUrl(item.poster_path || item.backdrop_path);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const releaseDate = item.release_date || item.first_air_date || '';
    
    let quality = 'HD';
    if (releaseDate) {
      const now = new Date();
      const released = new Date(releaseDate);
      const diffDays = Math.floor((now - released) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) quality = 'CAM';
      else if (diffDays < 21) quality = 'TS';
    }

    return `
      <div class="swiper-slide poster-wrapper">
        <div class="poster-badge">${quality}</div>
        <img src="${imageUrl}" 
             alt="${title}" 
             data-id="${item.id}" 
             data-title="${title}" 
             data-type="${item.media_type || defaultType}">
        <div class="poster-label">${title}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      const img = poster.querySelector('img');
      const id = img.dataset.id;
      const type = img.dataset.type;
      openModal(id, type);
    });
  });
}

function initSwipers() {
  const options = {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  };
  new Swiper('.trending-swiper', options);
  new Swiper('.movie-swiper', options);
  new Swiper('.tv-swiper', options);
}

function setupSearchRedirect() {
  const searchBtn = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query.length > 1) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchBtn.click();
    });
  }
}

function toggleMenu() {
  const toggle = document.getElementById('menu-toggle');
  const panel = document.getElementById('menu-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  }
}

async function loadGenres() {
  const container = document.getElementById('genre-buttons');
  if (!container) return;

  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await res.json();
    const genres = data.genres;

    container.innerHTML = genres.map(genre => `
      <button class="genre-btn" data-id="${genre.id}">${genre.name}</button>
    `).join('');

    document.querySelectorAll('.genre-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const genreId = btn.dataset.id;
        const genreName = btn.textContent.trim();
        window.location.href = `genre.html?genre=${encodeURIComponent(genreName)}&id=${genreId}`;
      });
    });

  } catch (err) {
    console.error('Failed to load genres:', err);
  }
}

const SERVERS = [
  { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` },
  { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
  { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` }
];

async function openModal(id, type) {
  const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
  const data = await res.json();
  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const rating = data.vote_average?.toFixed(1) || 'N/A';
  const overview = data.overview || 'No description available.';
  const genres = data.genres?.map(g => `<span>${g.name}</span>`).join('');
  const poster = getImageUrl(data.poster_path);

  const modalHtml = `
    <div class="modal">
      <div class="modal-content">
        <span class="close-btn">×</span>
        <h3>${title}</h3>
        <p>★ ${rating} · ${type.toUpperCase()} · ${year}</p>
        <div class="genres">${genres}</div>
        <p>${overview}</p>
        <label>Server:</label>
        <select id="server-select">
          ${SERVERS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
        <div class="iframe-shield">Loading player...</div>
        <iframe id="player-frame" allowfullscreen></iframe>
      </div>
    </div>
  `;

  const container = document.getElementById('modal-container');
  container.innerHTML = modalHtml;
  document.body.style.overflow = 'hidden';

  const modal = document.querySelector('.modal');
  const iframe = modal.querySelector('#player-frame');
  const shield = modal.querySelector('.iframe-shield');
  const select = modal.querySelector('#server-select');

  function loadServer(index) {
    const server = SERVERS[index];
    select.value = server.id;
    iframe.src = server.url(type, id);
    shield.style.display = 'block';
    setTimeout(() => (shield.style.display = 'none'), 3000);
  }

  loadServer(0);

  select.addEventListener('change', () => {
    const selected = SERVERS.find(s => s.id === select.value);
    if (selected) {
      iframe.src = selected.url(type, id);
    }
  });

  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.remove();
    document.body.style.overflow = '';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  toggleMenu();
  setupSearchRedirect();
  loadGenres();
  loadBannerSlider();
  fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  initSwipers();
});
// DARK/LIGHT MODE TOGGLE
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.add(currentTheme);
  toggleBtn.textContent = '🌓';

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    document.body.classList.toggle('light', isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    toggleBtn.textContent = '🌓';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle(); // ✅ Initialize theme toggle on load
});
