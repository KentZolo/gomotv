/**
 * ads.js - One-time Ad Loader for All Pages
 * Instructions:
 * 1. Place this in /js/ads.js
 * 2. Add <script src="js/ads.js"></script> before </body> in ALL pages
 */

// ===== CONFIGURATION =====
const AD_URL = '//activelymoonlight.com/a9/48/b5/a948b5f59db616a7ea2e7a5f79e3d0d3.js';
const AD_SESSION_KEY = 'adShown';
const AD_LOAD_DELAY = 300; // 0.3s delay for better UX

// ===== AD LOADER =====
function loadAd() {
  if (shouldLoadAd()) {
    const adScript = document.createElement('script');
    adScript.src = AD_URL;
    adScript.dataset.cfasync = 'false';
    adScript.onload = () => {
      console.log('[Ads] Ad script loaded successfully');
      markAdAsShown();
    };
    adScript.onerror = () => {
      console.error('[Ads] Failed to load ad script');
    };

    setTimeout(() => {
      document.body.appendChild(adScript);
    }, AD_LOAD_DELAY);
  }
}

// ===== HELPERS =====
function shouldLoadAd() {
  // Never load in local development
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    console.log('[Ads] Skipped loading on localhost');
    return false;
  }

  return !sessionStorage.getItem(AD_SESSION_KEY);
}

function markAdAsShown() {
  try {
    sessionStorage.setItem(AD_SESSION_KEY, 'true');
  } catch (e) {
    console.error('[Ads] Error accessing sessionStorage:', e);
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', loadAd);

// For pages that load content dynamically
window.addEventListener('load', loadAd);
