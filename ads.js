// ads.js - UPDATED FIXED VERSION
const allowedPages = ['genre.html', 'search.html', 'watch.html', 'country.html'];
const currentPage = location.pathname.split('/').pop(); // Kunin ang filename (e.g. "country.html")

// Debugging: I-check kung nakikita ang current page
console.log('[Ads] Current Page:', currentPage); 

if (allowedPages.includes(currentPage)) {
  // I-reset muna ang sessionStorage para laging mag-show ads kapag nag-test
  sessionStorage.removeItem('adShown'); // COMMENT OUT ITO PAG LIVE NA
  
  if (!sessionStorage.getItem('adShown')) {
    console.log('[Ads] Injecting ad script...');
    
    const adScript = document.createElement('script');
    adScript.src = '//activelymoonlight.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
    adScript.dataset.cfasync = 'false';
    
    // Magdagdag ng error handler
    adScript.onerror = () => {
      console.error('[Ads] Failed to load ad script!');
    };
    
    document.body.appendChild(adScript);
    sessionStorage.setItem('adShown', 'true');
  }
}
