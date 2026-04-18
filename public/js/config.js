// BG_CONFIG — Environment detection for static deploy vs server
const BG_CONFIG = (() => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  const isStaticDeploy = hostname.includes('sites.super.myninja.ai') ||
                          hostname.includes('s3.') ||
                          hostname.includes('cloudfront.net') ||
                          hostname.includes('.s3-website');
  const API_SERVER = isStaticDeploy ? '' : origin;
  return {
    API_SERVER,
    API_BASE: API_SERVER ? API_SERVER + '/api' : '/api',
    isStaticDeploy,
    apiUrl(path) {
      if (API_SERVER) return API_SERVER + path;
      return path;
    }
  };
})();

// ============================================
// UNIVERSAL PRELOADER DISMISSAL
// Ensures no page gets stuck on the loading screen
// regardless of which scripts load or fail
// ============================================
(function() {
  function hidePreloader() {
    const p = document.getElementById('preloader');
    if (p) {
      p.classList.add('hidden');
      p.style.opacity = '0';
      p.style.visibility = 'hidden';
      p.style.pointerEvents = 'none';
      // Remove from DOM after transition
      setTimeout(function() {
        if (p && p.parentNode) p.parentNode.removeChild(p);
      }, 700);
    }
  }

  // Attempt dismissal at multiple lifecycle points
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hidePreloader);
  } else {
    hidePreloader();
  }
  window.addEventListener('load', hidePreloader);
  // Hard fallback — dismiss after 2s no matter what
  setTimeout(hidePreloader, 2000);
  // Even harder fallback — 5s absolute safety net
  setTimeout(hidePreloader, 5000);

  // Expose globally so other scripts can call it
  window.BG_hidePreloader = hidePreloader;
})();