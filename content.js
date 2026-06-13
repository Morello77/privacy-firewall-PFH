// Run at document_start for early overrides

// Spoof navigator properties if enabled
chrome.storage.sync.get(['spoofUserAgent', 'spoofGeolocation'], (result) => {
  try {
    if (result.spoofUserAgent) {
      const spoofedUA = 'Mozilla/5.0 (PrivacyFirewall/2.0; Compatible)';
      Object.defineProperty(navigator, 'userAgent', { value: spoofedUA, writable: false, configurable: true });
      Object.defineProperty(navigator, 'platform', { value: 'PFHPlatform', writable: false, configurable: true });
      Object.defineProperty(navigator, 'vendor', { value: 'PFH', writable: false, configurable: true });
      Object.defineProperty(navigator, 'languages', { value: ['en-US'], writable: false, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4, writable: false, configurable: true });
      console.log('User-agent spoofed:', navigator.userAgent);
      // Verify spoofing persists
      window.addEventListener('load', () => {
        if (navigator.userAgent !== spoofedUA) {
          Object.defineProperty(navigator, 'userAgent', { value: spoofedUA, writable: false, configurable: true });
          console.log('Reapplied user-agent spoofing');
        }
      });
    }

    if (result.spoofGeolocation) {
      const fakeCoords = () => ({
        coords: {
          latitude: 0 + Math.random() * 0.1 - 0.05,
          longitude: -30 + Math.random() * 0.1 - 0.05,
          accuracy: 100
        }
      });
      navigator.geolocation.getCurrentPosition = (success, error, options) => {
        console.log('Geolocation requested, returning spoofed coords');
        success(fakeCoords());
      };
      navigator.geolocation.watchPosition = (success, error, options) => {
        console.log('Geolocation watch requested, returning spoofed coords');
        success(fakeCoords());
      };
      console.log('Geolocation spoofed with randomization');
    }
  } catch (e) {
    console.error('Spoofing error:', e);
  }
});

// Rewrite tracker scripts (fallback for dynamic scripts)
const TRACKER_PATTERNS = [/google-analytics\.com/, /doubleclick\.net/, /adservice\.google\.com/, /permutive\.com/, /kargo\.com/];
const observer = new MutationObserver((mutations) => {
  try {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && node.src && TRACKER_PATTERNS.some(pattern => pattern.test(node.src))) {
          node.src = '';
          node.textContent = '/* Neutralized by PFH */';
          console.log('Neutralized tracker script:', node.src || 'inline script');
        }
      });
    });
  } catch (e) {
    console.error('Tracker neutralization error:', e);
  }
});
observer.observe(document, { childList: true, subtree: true });