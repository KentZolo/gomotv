/**
 * Shared Modal Component for GomoTV
 * Overrides default modal behavior while maintaining all existing functionality
 */

// Configuration
const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const IMG_BASE = 'https://image.tmdb.org/t/p/';
const SERVERS = [
  { 
    id: 'vidsrccc', 
    name: 'Vidsrc.cc', 
    url: (type, id) => `https://vidsrc.cc/v2/embed/${type}/${id}` 
  },
  { 
    id: 'vidsrc', 
    name: 'Vidsrc.to', 
    url: (type, id) => `https://vidsrc.to/embed/${type}/${id}` 
  },
  { 
    id: 'apimocine', 
    name: 'Apimocine', 
    url: (type, id) => `https://apimocine.vercel.app/${type}/${id}?autoplay=true` 
  }
];

// Utility Functions
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : 'https://via.placeholder.com/500x750?text=No+Poster';
  }
  return `${IMG_BASE}${isBackdrop ? 'w1280' : 'w500'}${path}`;
}

// Main Modal Implementation
document.addEventListener('DOMContentLoaded', function() {
  // Only override if openModal exists
  if (typeof window.openModal === 'function') {
    const originalOpenModal = window.openModal;
    
    window.openModal = function(id, type) {
      // Close any existing modal first
      closeModal();
      
      // Create modal container if it doesn't exist
      if (!document.getElementById('modal-container')) {
        const container = document.createElement('div');
        container.id = 'modal-container';
        document.body.appendChild(container);
      }
      
      // Show loading state
      document.getElementById('modal-container').innerHTML = `
        <div class="modal-loading">
          <div class="loading-spinner"></div>
        </div>
      `;
      
      // Fetch media details
      fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          renderModal(data, type, id);
        })
        .catch(error => {
          console.error('Error fetching media details:', error);
          // Fallback to original modal if error occurs
          originalOpenModal(id, type);
        });
    };
  }
});

function renderModal(data, type, id) {
  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').substring(0, 4);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
  const overview = data.overview || 'No description available.';
  const genres = data.genres ? data.genres.map(g => g.name).join(' • ') : '';
  const backdropUrl = getImageUrl(data.backdrop_path, true);
  
  const modalHTML = `
    <div class="modal">
      <div class="modal-content">
        <span class="close-btn">×</span>
        
        <!-- Hero Section -->
        <div class="modal-header" style="background-image: url('${backdropUrl}')">
          <div class="modal-header-overlay"></div>
          <div class="modal-header-content">
            <h1 class="modal-title">${title.toUpperCase()}</h1>
          </div>
        </div>
        
        <!-- Server Selection -->
        <div class="server-selection">
          <select class="server-selector" id="server-select">
            ${SERVERS.map(server => `
              <option value="${server.id}">${server.name}</option>
            `).join('')}
          </select>
        </div>
        
        <!-- Media Details -->
        <div class="media-details">
          <h2 class="media-title">${title}</h2>
          <div class="media-meta">
            <span class="rating">⭐ ${rating}</span>
            <span class="type">${type === 'movie' ? 'Movie' : 'TV Show'}</span>
            ${genres ? `<span class="genres">${genres}</span>` : ''}
            ${year ? `<span class="year">${year}</span>` : ''}
          </div>
          <p class="media-overview">${overview}</p>
        </div>
        
        <!-- Player Container -->
        <div class="player-container">
          <div class="player-loading">
            <div class="loading-spinner"></div>
            <p>Loading player...</p>
          </div>
          <iframe id="player-iframe" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-container').innerHTML = modalHTML;
  document.body.style.overflow = 'hidden';
  
  setupModalEvents(id, type);
}

function setupModalEvents(id, type) {
  const modal = document.querySelector('.modal');
  if (!modal) return;
  
  // Close button
  modal.querySelector('.close-btn').addEventListener('click', closeModal);
  
  // Click outside to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Server selection change
  const serverSelector = document.getElementById('server-select');
  if (serverSelector) {
    serverSelector.addEventListener('change', function() {
      loadPlayer(this.value, id, type);
    });
    
    // Load initial player
    loadPlayer(serverSelector.value, id, type);
  }
}

function loadPlayer(serverId, id, type) {
  const iframe = document.getElementById('player-iframe');
  const loading = document.querySelector('.player-loading');
  
  if (!iframe || !loading) return;
  
  const server = SERVERS.find(s => s.id === serverId);
  if (!server) return;
  
  loading.style.display = 'flex';
  iframe.style.display = 'none';
  iframe.src = server.url(type, id);
  
  iframe.onload = function() {
    loading.style.display = 'none';
    iframe.style.display = 'block';
  };
  
  iframe.onerror = function() {
    loading.innerHTML = '<p>Failed to load player. Please try another server.</p>';
  };
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.classList.add('fade-out');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

// CSS (will be added dynamically)
const modalStyles = `
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    opacity: 0;
    animation: fadeIn 0.3s forwards;
  }
  
  @keyframes fadeIn {
    to { opacity: 1; }
  }
  
  .modal.fade-out {
    animation: fadeOut 0.3s forwards;
  }
  
  @keyframes fadeOut {
    to { opacity: 0; }
  }
  
  .modal-content {
    background-color: #1a1a1a;
    border-radius: 10px;
    width: 100%;
    max-width: 800px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    height: 250px;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  
  .modal-header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7));
  }
  
  .modal-header-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    z-index: 2;
  }
  
  .modal-title {
    font-size: 1.8rem;
    margin: 0;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.5rem;
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .server-selection {
    padding: 15px;
    background: rgba(0,0,0,0.7);
  }
  
  .server-selector {
    width: 100%;
    padding: 10px;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .media-details {
    padding: 20px;
  }
  
  .media-title {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: white;
  }
  
  .media-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 15px;
    color: #ccc;
    font-size: 0.9rem;
  }
  
  .media-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .media-overview {
    line-height: 1.6;
    color: #eee;
    margin-bottom: 0;
  }
  
  .player-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: black;
  }
  
  .player-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    color: white;
    z-index: 1;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(229, 9, 20, 0.3);
    border-top-color: #e50914;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  #player-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: none;
  }
  
  .modal-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.9);
    z-index: 10000;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .modal {
      padding: 10px;
    }
    
    .modal-header {
      height: 200px;
    }
    
    .modal-title {
      font-size: 1.4rem;
    }
    
    .media-details {
      padding: 15px;
    }
  }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.innerHTML = modalStyles;
document.head.appendChild(styleElement);
