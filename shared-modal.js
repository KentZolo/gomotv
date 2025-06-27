// shared-modal.js
const SERVERS = [
  { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` },
  { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
  { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` }
];

async function openModal(id, type) {
  try {
    // Get current URL parameters
    const params = new URLSearchParams(window.location.search);
    const currentQuery = params.get('q') || '';
    const currentPage = params.get('page') || '1';
    const genreName = params.get('name') || '';
    const genreId = params.get('id') || '';
    const countryCode = params.get('country') || '';
    
    // Update URL with modal parameters
    let newUrl = window.location.pathname + '?';
    if (currentQuery) newUrl += `q=${encodeURIComponent(currentQuery)}&`;
    if (currentPage !== '1') newUrl += `page=${currentPage}&`;
    if (genreName) newUrl += `name=${encodeURIComponent(genreName)}&`;
    if (genreId) newUrl += `id=${genreId}&`;
    if (countryCode) newUrl += `country=${countryCode}&`;
    newUrl += `modalId=${id}&modalType=${type}`;
    
    history.pushState({ modal: true }, '', newUrl);

    // Show loading state
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
      <div class="modal">
        <div class="modal-content">
          <div class="loading-large"></div>
        </div>
      </div>
    `;
    document.body.style.overflow = 'hidden';

    // Fetch details from TMDB API
    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=77312bdd4669c80af3d08e0bf719d7ff`
    );
    
    if (!response.ok) throw new Error('Failed to fetch details');
    
    const data = await response.json();
    
    // Create modal HTML
    modalContainer.innerHTML = createModalHTML(data, type, id);
    
    // Set up modal functionality
    setupModalEvents(id, type);
    
    // Load default server
    loadDefaultServer(id, type);
    
  } catch (error) {
    console.error('Error opening modal:', error);
    showModalError();
  }
}

function createModalHTML(data, type, id) {
  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').substring(0, 4);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
  const overview = data.overview || 'No overview available.';
  const genres = data.genres ? data.genres.map(g => g.name).join(', ') : '';
  const backdropUrl = data.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
    : 'https://via.placeholder.com/1280x720?text=No+Backdrop';
  
  return `
    <div class="modal">
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        
        <div class="modal-header" style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${backdropUrl}')">
          <h2>${title} ${year ? `(${year})` : ''}</h2>
          <div class="meta-info">
            <span>⭐ ${rating}</span>
            <span>${type === 'movie' ? 'Movie' : 'TV Show'}</span>
            ${genres ? `<span>${genres}</span>` : ''}
          </div>
        </div>
        
        <div class="modal-body">
          <h3>Overview</h3>
          <p>${overview}</p>
          
          <select id="server-select" class="server-selector">
            ${SERVERS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          
          <div class="player-container">
            <div class="loading-server">Loading player...</div>
            <iframe id="player-frame" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupModalEvents(id, type) {
  const modal = document.querySelector('.modal');
  const closeBtn = document.querySelector('.close-btn');
  const serverSelect = document.getElementById('server-select');
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  serverSelect.addEventListener('change', function() {
    const server = SERVERS.find(s => s.id === this.value);
    if (server) loadServer(server.url(type, id));
  });
  
  // Handle back button
  window.addEventListener('popstate', function(e) {
    if (document.querySelector('.modal')) closeModal();
  });
}

function loadDefaultServer(id, type) {
  let currentServerIndex = 0;
  
  function tryNextServer() {
    if (currentServerIndex >= SERVERS.length) {
      document.querySelector('.loading-server').textContent = 'No working server found';
      return;
    }
    
    const server = SERVERS[currentServerIndex];
    document.getElementById('server-select').value = server.id;
    loadServer(server.url(type, id), () => {
      currentServerIndex++;
      tryNextServer();
    });
  }
  
  tryNextServer();
}

function loadServer(url, onError) {
  const iframe = document.getElementById('player-frame');
  const loading = document.querySelector('.loading-server');
  
  loading.style.display = 'flex';
  iframe.style.display = 'none';
  
  iframe.src = url;
  iframe.onload = function() {
    loading.style.display = 'none';
    iframe.style.display = 'block';
  };
  
  iframe.onerror = function() {
    if (onError) onError();
  };
}

function showModalError() {
  document.getElementById('modal-container').innerHTML = `
    <div class="modal">
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Error</h2>
        <p>Failed to load details. Please try again.</p>
      </div>
    </div>
  `;
  
  document.querySelector('.close-btn').addEventListener('click', closeModal);
}

function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = '';
  document.body.style.overflow = '';
  
  // Restore original URL without modal parameters
  const params = new URLSearchParams(window.location.search);
  params.delete('modalId');
  params.delete('modalType');
  
  history.replaceState(
    null,
    '',
    window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
  );
}

// Initialize modal if URL has modal parameters
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const modalId = params.get('modalId');
  const modalType = params.get('modalType');
  
  if (modalId && modalType) {
    openModal(modalId, modalType);
  }
});

// Make function available globally
window.openModal = openModal;
window.closeModal = closeModal;
