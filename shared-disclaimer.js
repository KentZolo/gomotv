// shared-disclaimer.js
export function addGlobalDisclaimer() {
  const disclaimerHTML = `
    <div class="global-disclaimer">
      <p>⚠️ Disclaimer: GomoTV is a search engine only. We do not host or upload any videos.</p>
      <p>All content is property of their respective owners. <a href="https://www.justwatch.com" target="_blank">Watch legally</a>.</p>
    </div>
  `;

  // Main pages where disclaimer should appear
  const pages = ['genre', 'search', 'country'];
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');

  if (pages.includes(currentPage)) {
    const container = document.querySelector('.search-results-grid') || 
                     document.getElementById('results-grid');
    
    if (container && !document.querySelector('.global-disclaimer')) {
      container.insertAdjacentHTML('afterend', disclaimerHTML);
    }
  }
}

// CSS for the disclaimer
export const disclaimerStyle = `
  .global-disclaimer {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    margin: 30px 0;
    font-size: 0.8rem;
    color: #aaa;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
  }
  .global-disclaimer a {
    color: #e50914;
    text-decoration: none;
  }
  body.light .global-disclaimer {
    color: #666;
    border-color: #ddd;
  }
`;
