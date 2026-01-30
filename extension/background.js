// background.js
console.log("Bot Swarm Detector: Background Service Worker Loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_COMMENTS') {
    console.log("Background: Received comments to analyze", message.payload.length);
    
    fetch('https://bot-swarm-detector-extension.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments: message.payload })
    })
    .then(response => {
      if (!response.ok) throw new Error('Server error');
      return response.json();
    })
    .then(data => {
      console.log("Background: Analysis successful", data);
      sendResponse({ status: 'success', data: data });
    })
    .catch(error => {
      console.error("Background: Fetch error", error);
      sendResponse({ status: 'error', error: error.message });
    });

    return true; // Indicates we wish to send a response asynchronously
  }
});