// Background service worker for TabMind Chrome Extension

/**
 * Handles extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TabMind extension installed');
    
    // Set up initial storage
    chrome.storage.local.set({
      tabmind_analyses: [],
      tabmind_settings: {
        apiKey: '',
        model: 'anthropic/claude-3.5-sonnet',
        maxHistory: 50
      }
    });
  } else if (details.reason === 'update') {
    console.log('TabMind extension updated');
  }
});

/**
 * Handles messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'GET_TAB_INFO':
      handleGetTabInfo(sender.tab?.id, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'ANALYZE_TAB':
      handleAnalyzeTab(message.data, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Handles getting tab information
 */
async function handleGetTabInfo(tabId: number | undefined, sendResponse: (response: any) => void) {
  try {
    if (!tabId) {
      sendResponse({ error: 'No tab ID provided' });
      return;
    }
    
    const tab = await chrome.tabs.get(tabId);
    sendResponse({
      success: true,
      data: {
        title: tab.title,
        url: tab.url,
        id: tab.id
      }
    });
  } catch (error) {
    console.error('Error getting tab info:', error);
    sendResponse({ error: 'Failed to get tab info' });
  }
}

/**
 * Handles tab analysis requests
 */
async function handleAnalyzeTab(tabInfo: any, sendResponse: (response: any) => void) {
  try {
    // This would typically call the API service
    // For now, just acknowledge the request
    sendResponse({
      success: true,
      message: 'Analysis request received'
    });
  } catch (error) {
    console.error('Error handling analyze request:', error);
    sendResponse({ error: 'Failed to analyze tab' });
  }
}

/**
 * Handles extension icon click (if needed)
 */
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
  // Could open popup programmatically or perform other actions
});

console.log('TabMind background service worker loaded'); 