// background.js
console.log("Bot Swarm Detector: Background Service Worker Loaded");

// API CONFIGURATION
// Change this to your Render URL if deploying: 'https://bot-swarm-detector-extension.onrender.com/analyze'
const API_URL = 'http://127.0.0.1:8000/analyze'; 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_COMMENTS') {
    console.log(`Background: Analyzing ${message.payload.length} comments via ${API_URL}`);
    
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comments: message.payload })
    })
    .then(response => {
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
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