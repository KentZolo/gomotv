const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://via.placeholder.com/500x750?text=No+Poster';

const SERVERS = [
  { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` },
  { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
  { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` }
];

// === FETCH MOVIES FOR HOMEPAGE ===
async function fetchTrending(mediaType = 'all', timeWindow = 'week') {
  const res = await fetch(`https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?api_key=${API_KEY}`);
  const data = await res.json();
  displayResults(data.results);
}

// === DISPLAY MOVIES TO GRID ===
function displayResults(items) {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';

  items.forEach(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const img = item.poster_path || item.backdrop_path;
    const id = item.id;
    const type = item.media_type || (item.title ? 'movie' : 'tv');

    const poster = img ? `${IMG_BASE}${img}` : FALLBACK_IMAGE;

    const div = document.createElement('div');
    div.className = 'poster-wrapper';
    div.innerHTML = `
      <img src="${poster}" alt="${title}" data-id="${id}" data-type="${type}" data-title="${title}">
      <div class="poster-label">${title}</div>
      <div class="poster-meta">${type === 'movie' ? '🎬' : '📺'} ${year}</div>
    `;

    div.querySelector('img').addEventListener('click', () => {
      openModalPlayer(id, title, type);
    });

    grid.appendChild(div);
  });
}

// === OPEN MODAL PLAYER ===
function openModalPlayer(id, title, type) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  document.body.style.overflow = 'hidden';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <h3>${title}</h3>
      <label>Server:</label>
      <select id="server-select"></select>
      <div class="iframe-shield">Loading player...</div>
      <iframe id="player-frame" allowfullscreen></iframe>
    </div>
  `;

  document.getElementById('modal-container').appendChild(modal);

  const select = modal.querySelector('#server-select');

  SERVERS.forEach(server => {
    const option = document.createElement('option');
    option.value = server.id;
    option.textContent = server.name;
    select.appendChild(option);
  });

  function loadServer(index) {
    const server = SERVERS[index];
    select.value = server.id;

    const iframe = modal.querySelector('#player-frame');
    iframe.src = server.url(type, id);

    const shield = modal.querySelector('.iframe-shield');
    shield.style.display = 'flex';
    setTimeout(() => shield.style.display = 'none', 3000);

    iframe.onerror = () => {
      if (index + 1 < SERVERS.length) {
        loadServer(index + 1);
      } else {
        shield.textContent = 'No working server found.';
      }
    };
  }

  loadServer(0);

  select.addEventListener('change', () => {
    const selected = SERVERS.find(s => s.id === select.value);
    if (selected) {
      modal.querySelector('#player-frame').src = selected.url(type, id);
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

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  fetchTrending(); // Load trending movies or TV shows
});
