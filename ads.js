// ads.js - One-time ad loader
if (!sessionStorage.getItem('adShown')) {
  // Optional: Mag-show ng alert para makita kung naglo-load
  alert("AD IS LOADING (First visit)"); // Pwedeng tanggalin later
  
  const adScript = document.createElement('script');
  adScript.src = '//activelymoonlight.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
  adScript.dataset.cfasync = 'false';
  document.body.appendChild(adScript);
  sessionStorage.setItem('adShown', 'true');
}
