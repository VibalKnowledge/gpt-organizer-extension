// Background service worker for GPT Organizer

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize default data on first install
    chrome.storage.local.set({
      folders: [],
      gpts: [],
      settings: {
        showQuickAccess: true,
        autoDetectGPTs: true
      }
    });
    
    // Open welcome page or instructions
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'syncGPTs':
      handleGPTSync(request.gpts, sendResponse);
      break;
    case 'getStoredData':
      getStoredData(sendResponse);
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true; // Keep message channel open for async response
});

async function handleGPTSync(newGPTs, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['gpts']);
    const existingGPTs = result.gpts || [];
    
    // Merge new GPTs with existing ones, avoiding duplicates
    const mergedGPTs = [...existingGPTs];
    
    newGPTs.forEach(newGPT => {
      if (!existingGPTs.find(existing => existing.id === newGPT.id)) {
        mergedGPTs.push(newGPT);
      }
    });
    
    await chrome.storage.local.set({ gpts: mergedGPTs });
    sendResponse({ success: true, count: mergedGPTs.length });
  } catch (error) {
    console.error('Error syncing GPTs:', error);
    sendResponse({ error: error.message });
  }
}

async function getStoredData(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['folders', 'gpts', 'settings']);
    sendResponse(result);
  } catch (error) {
    console.error('Error getting stored data:', error);
    sendResponse({ error: error.message });
  }
}

// Context menu integration (optional enhancement)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToFolder') {
    // Open popup to add current GPT to a folder
    chrome.action.openPopup();
  }
});

// Update context menu when on ChatGPT pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com')) {
      // Add context menu for GPT pages
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: 'addToFolder',
          title: 'Add to GPT Folder',
          contexts: ['page', 'link'],
          documentUrlPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*']
        });
      });
    }
  }
});