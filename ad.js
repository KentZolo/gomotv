// ads.js - Ilagay sa parehong directory ng HTML files
document.addEventListener('DOMContentLoaded', function() {
  if (!sessionStorage.getItem('adShown')) {
    const adScript = document.createElement('script');
    adScript.src = '//activelymoonlight.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
    adScript.dataset.cfasync = 'false';
    document.body.appendChild(adScript);
    sessionStorage.setItem('adShown', 'true');
  }
});
