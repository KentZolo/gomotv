// ads.js - UPDATED WITH ERROR HANDLING
const allowedPages = ['genre.html', 'search.html', 'watch.html', 'country.html'];
const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Fallback

// Debug: I-log ang current page at status
console.log(`[Ads] Page: ${currentPage}`, `Allowed: ${allowedPages.includes(currentPage)}`);

if (allowedPages.includes(currentPage)) {
  // FOR TESTING: Force reset (comment out kapag live na)
  sessionStorage.removeItem('adShown'); // <<-- TEMPORARY FOR DEBUGGING
  
  if (!sessionStorage.getItem('adShown')) {
    const adScript = document.createElement('script');
    adScript.src = '//activelymoonlight.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
    adScript.dataset.cfasync = 'false';
    
    // Magdagdag ng error handler
    adScript.onerror = () => {
      console.error('[Ads] Failed to load script! Trying backup...');
      loadBackupAd(); // Optional fallback
    };
    
    document.body.appendChild(adScript);
    sessionStorage.setItem('adShown', 'true');
    console.log('[Ads] Script injected successfully');
  }
}

// Optional backup ad provider
function loadBackupAd() {
  const backupScript = document.createElement('script');
  backupScript.src = '//pl16597884.highperformancecpm.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
  document.body.appendChild(backupScript);
}
