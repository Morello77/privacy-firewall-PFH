// Load rule count
try {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    console.log('Rule count:', rules.length);
    document.getElementById('ruleCount').textContent = rules.length;
  });
} catch (e) {
  console.error('Rule count error:', e);
}

// Refresh rules
document.getElementById('refreshRules').addEventListener('click', () => {
  try {
    chrome.runtime.sendMessage({ type: 'REFRESH_RULES' }, (response) => {
      if (response.success) {
        location.reload();
      } else {
        alert('Failed to refresh rules');
      }
    });
  } catch (e) {
    console.error('Rule refresh error:', e);
  }
});

// Load and save settings
try {
  chrome.storage.local.get(['flaggedRequests'], (localResult) => {
    chrome.storage.sync.get(['spoofUserAgent', 'spoofGeolocation', 'aiNoiseInjection'], (syncResult) => {
      console.log('Options settings:', syncResult, 'Flagged:', localResult.flaggedRequests || []);
      document.getElementById('spoofUserAgent').checked = !!syncResult.spoofUserAgent;
      document.getElementById('spoofGeolocation').checked = !!syncResult.spoofGeolocation;
      document.getElementById('aiNoiseInjection').checked = !!syncResult.aiNoiseInjection;

      const logList = document.getElementById('logList');
      const noLogsDiv = document.getElementById('no-logs');
      const flagged = localResult.flaggedRequests || [];
      if (flagged.length === 0) {
        noLogsDiv.style.display = 'block';
      } else {
        noLogsDiv.style.display = 'none';
        flagged.forEach((req) => {
          const li = document.createElement('li');
          li.textContent = `${req.url} (${req.type}) at ${new Date(req.timestamp).toLocaleString()}`;
          logList.appendChild(li);
        });
      }
    });
  });
} catch (e) {
  console.error('Settings load error:', e);
}

['spoofUserAgent', 'spoofGeolocation', 'aiNoiseInjection'].forEach(id => {
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

// Clear logs
document.getElementById('clearLogs').addEventListener('click', () => {
  try {
    chrome.storage.local.set({ flaggedRequests: [] }, () => {
      document.getElementById('logList').innerHTML = '';
      document.getElementById('no-logs').style.display = 'block';
    });
  } catch (e) {
    console.error('Clear logs error:', e);
  }
});