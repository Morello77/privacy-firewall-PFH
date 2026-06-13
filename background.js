// Constants
const EASYLIST_URL = 'https://easylist.to/easylist/easylist.txt';
const MAX_RULES = 5000;
const MAX_FLAGS = 50;
const BATCH_INTERVAL = 5000;

// Fallback rules for common trackers
const FALLBACK_RULES = [
  { id: 1, priority: 1, action: { type: 'block' }, condition: { urlFilter: '*google-analytics.com/*', resourceTypes: ['script', 'image', 'xmlhttprequest'] } },
  { id: 2, priority: 1, action: { type: 'block' }, condition: { urlFilter: '*doubleclick.net/*', resourceTypes: ['script', 'image', 'xmlhttprequest'] } },
  { id: 3, priority: 1, action: { type: 'block' }, condition: { urlFilter: '*adservice.google.com/*', resourceTypes: ['script', 'image', 'xmlhttprequest'] } }
];

// Storage defaults
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.sync.set({
      autoBlock: true,
      spoofUserAgent: false,
      spoofGeolocation: false,
      aiNoiseInjection: false
    });
    await chrome.storage.local.set({ flaggedRequests: [] });
    await loadTrackerRules();
    console.log('Extension installed and initialized');
  } catch (error) {
    console.error('Installation error:', error);
  }
});

// Fetch and load EasyList rules
chrome.runtime.onStartup.addListener(loadTrackerRules);
setInterval(loadTrackerRules, 24 * 60 * 60 * 1000);

async function loadTrackerRules() {
  try {
    let rules = [...FALLBACK_RULES];
    try {
      const response = await fetch(EASYLIST_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch EasyList`);
      const text = await response.text();
      const filters = text.split('\n')
        .filter(line => line && !line.startsWith('!') && !line.startsWith('[') && isValidFilter(line))
        .slice(0, MAX_RULES - FALLBACK_RULES.length);
      const easyListRules = filters.map((filter, index) => ({
        id: index + FALLBACK_RULES.length + 1,
        priority: 1,
        action: { type: 'block' },
        condition: { urlFilter: convertEasyListFilter(filter), resourceTypes: ['script', 'image', 'xmlhttprequest'] }
      }));
      rules = [...FALLBACK_RULES, ...easyListRules];
      console.log(`Parsed ${easyListRules.length} EasyList rules`);
    } catch (e) {
      console.warn('EasyList fetch failed, using fallback rules:', e);
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: MAX_RULES }, (_, i) => i + 1),
      addRules: rules
    });
    console.log(`Applied ${rules.length} tracker rules`);
    chrome.declarativeNetRequest.getDynamicRules(rules => console.log('Active rules:', rules.length));
  } catch (error) {
    console.error('Error loading tracker rules:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'PFH Error',
      message: 'Failed to update tracker rules. Using fallback rules.'
    });
  }
}

// Convert EasyList filter to urlFilter format
function convertEasyListFilter(filter) {
  let urlFilter = filter;
  if (urlFilter.startsWith('||')) {
    urlFilter = '*' + urlFilter.slice(2);
  }
  if (urlFilter.endsWith('^')) {
    urlFilter = urlFilter.slice(0, -1) + '*';
  }
  return urlFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Validate EasyList filter
function isValidFilter(filter) {
  try {
    return filter && !filter.includes(' ') && !filter.includes('\t') && filter.length > 3 && !filter.includes('*|') && !filter.includes('|*');
  } catch {
    return false;
  }
}

// Batch flagged requests
let pendingFlags = [];
let isWriting = false;

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  console.log('Rule matched:', details.request.url, details.rule.ruleId); // Debug log
  chrome.storage.sync.get(['autoBlock'], async (result) => {
    try {
      if (!result.autoBlock) {
        console.log('Auto-block disabled, skipping flag');
        return;
      }
      pendingFlags.push({
        url: details.request.url,
        type: details.request.type,
        timestamp: Date.now()
      });
      console.log('Added to pendingFlags:', pendingFlags.length);
      if (pendingFlags.length <= 5 || !isWriting) {
        isWriting = true;
        await writePendingFlags();
        setTimeout(writePendingFlags, BATCH_INTERVAL);
      }
    } catch (e) {
      console.error('Flag handling error:', e);
    }
  });
});

async function writePendingFlags() {
  try {
    const flags = pendingFlags.splice(0, MAX_FLAGS);
    if (flags.length === 0) {
      isWriting = false;
      return;
    }
    await chrome.storage.local.get(['flaggedRequests'], async (result) => {
      let flagged = result.flaggedRequests || [];
      flagged = [...flagged, ...flags].slice(-MAX_FLAGS);
      await chrome.storage.local.set({ flaggedRequests: flagged });
      console.log(`Wrote ${flags.length} flags, total: ${flagged.length}`);
      chrome.action.setBadgeText({ text: flagged.length.toString() });
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'PFH Alert',
        message: `Blocked ${flags.length} tracker(s)`
      });
      chrome.runtime.sendMessage({ type: 'NEW_FLAG' }).catch(() => {});
    });
  } catch (error) {
    console.error('Error writing flagged requests:', error);
  } finally {
    isWriting = pendingFlags.length > 0;
    if (isWriting) setTimeout(writePendingFlags, BATCH_INTERVAL);
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.type === 'UPDATE_SETTINGS') {
      chrome.storage.sync.set(message.settings);
      sendResponse({ success: true });
    } else if (message.type === 'CLEAR_BADGE') {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    } else if (message.type === 'REFRESH_RULES') {
      loadTrackerRules().then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});