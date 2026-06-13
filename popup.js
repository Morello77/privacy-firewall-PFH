// Load settings
chrome.storage.local.get(['flaggedRequests'], (localResult) => {
  chrome.storage.sync.get(['autoBlock', 'spoofUserAgent', 'spoofGeolocation', 'aiNoiseInjection'], (syncResult) => {
    try {
      console.log('Popup settings:', syncResult, 'Flagged:', localResult.flaggedRequests || []);
      document.getElementById('autoBlock').checked = !!syncResult.autoBlock;
      document.getElementById('spoofUserAgent').checked = !!syncResult.spoofUserAgent;
      document.getElementById('spoofGeolocation').checked = !!syncResult.spoofGeolocation;
      document.getElementById('aiNoiseInjection').checked = !!syncResult.aiNoiseInjection;

      const requestsDiv = document.getElementById('requests');
      const noRequestsDiv = document.getElementById('no-requests');
      const flagged = localResult.flaggedRequests || [];
      if (flagged.length === 0) {
        noRequestsDiv.style.display = 'block';
      } else {
        noRequestsDiv.style.display = 'none';
        flagged.forEach((req) => {
          const alert = document.createElement('div');
          alert.className = 'alert';
          alert.textContent = `Flagged: ${req.url} (${req.type}) at ${new Date(req.timestamp).toLocaleTimeString()}`;
          requestsDiv.appendChild(alert);
        });
      }
    } catch (e) {
      console.error('Popup initialization error:', e);
    }
  });
});

// Save toggles
['autoBlock', 'spoofUserAgent', 'spoofGeolocation', 'aiNoiseInjection'].forEach(id => {
  document.getElementById(id).addEventListener('change', (e) => {
    try {
      const settings = { [id]: e.target.checked };
      console.log('Saving setting:', settings);
      chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
    } catch (e) {
      console.error('Settings save error:', e);
    }
  });
});

// Open options
document.getElementById('openOptions').addEventListener('click', () => {
  try {
    chrome.runtime.openOptionsPage();
  } catch (e) {
    console.error('Options page error:', e);
  }
});

// Update on new flag
chrome.runtime.onMessage.addListener((message) => {
  try {
    if (message.type === 'NEW_FLAG') {
      console.log('Received NEW_FLAG, refreshing popup');
      location.reload();
    }
  } catch (e) {
    console.error('Message handling error:', e);
  }
});

// Clear badge on open
chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }).catch(() => {});