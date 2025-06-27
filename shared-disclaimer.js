// shared-disclaimer.js
export function addPaginationDisclaimer() {
  const disclaimerHTML = `
    <div class="pagination-disclaimer">
      <p>⚠️ Disclaimer: GomoTV does not host any videos. All content is provided by third-party servers.</p>
      <p>Support creators via <a href="https://www.justwatch.com" target="_blank">official platforms</a>.</p>
    </div>
  `;

  // Check if disclaimer already exists
  if (document.querySelector('.pagination-disclaimer')) return;

  // Insert after pagination
  const pagination = document.querySelector('.pagination');
  if (pagination) {
    pagination.insertAdjacentHTML('afterend', disclaimerHTML);
  }
}

// CSS for pagination disclaimer
export const disclaimerStyle = `
  .pagination-disclaimer {
    grid-column: 1 / -1;
    text-align: center;
    padding: 25px 20px;
    margin-top: 20px;
    font-size: 0.75rem;
    color: #aaa;
    line-height: 1.6;
    border-top: 1px solid #333;
  }
  .pagination-disclaimer a {
    color: #e50914;
    text-decoration: none;
  }
  body.light .pagination-disclaimer {
    color: #666;
    border-top: 1px solid #ddd;
  }
`;
