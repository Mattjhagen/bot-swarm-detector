// content.js - Reddit Bot Detector

console.log("Bot Swarm Detector: Content Script Loaded");

// Helper to generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to find comments on "Shreddit" (New Reddit)
function extractComments() {
    // Primary Selector: Shreddit (2024 UI)
    let commentElements = Array.from(document.querySelectorAll('shreddit-comment'));
    
    // Fallback: 2023 React UI (divs with data-testid="comment")
    if (commentElements.length === 0) {
        const fallbackElements = document.querySelectorAll('div[data-testid="comment"]');
        if (fallbackElements.length > 0) {
             // For fallback, we need to wrap them to behave like the shreddit elements for the rest of the logic
             // This is a bit complex due to structure differences, so we'll log a warning for now if using old UI.
             console.warn("Bot Detector: Detected older Reddit UI. Only 'shreddit-comment' elements are fully supported in this MVP.");
        }
    }

    const payload = [];
    const elementMap = new Map(); 

    commentElements.forEach((el) => {
        // Avoid reprocessing
        if (el.getAttribute('data-bot-scanned') === 'true') return;

        const author = el.getAttribute('author') || "unknown";
        
        // Text extraction for Shreddit
        const textDiv = el.querySelector('div[slot="comment"]'); 
        // Sometimes text is in specific p tags inside the slot
        const text = textDiv ? (textDiv.innerText || textDiv.textContent) : "";

        if (!text || text.length < 5) return; 

        const id = el.getAttribute('id') || generateUUID();
        
        // MOCK METADATA logic for MVP
        const mockAge = Math.floor(Math.random() * 150); 
        const mockKarma = Math.floor(Math.random() * 5000);

        payload.push({
            id: id,
            author: author,
            text: text,
            account_age_days: mockAge,
            post_volume: mockKarma
        });

        elementMap.set(id, el);
    });

    return { payload, elementMap };
}

// Function to inject badges
function applyResults(results, elementMap) {
    results.forEach(res => {
        const el = elementMap.get(res.comment_id);
        if (!el) return;

        el.setAttribute('data-bot-scanned', 'true');

        const badge = document.createElement('span');
        badge.style.marginLeft = '8px';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '700';
        badge.style.fontFamily = 'Verdana, sans-serif';
        badge.style.verticalAlign = 'middle';
        badge.style.cursor = 'help';
        badge.title = `Metadata Risk: ${res.breakdown.metadata_risk}\nLinguistic Risk: ${res.breakdown.linguistic_risk}\nSwarm Risk: ${res.breakdown.swarm_risk}`;
        badge.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";

        if (res.risk_level === 'HIGH') {
            badge.style.backgroundColor = '#dc2626'; // Red 600
            badge.style.color = 'white';
            badge.innerText = `🤖 BOT: ${res.bot_score}%`;
            el.style.borderLeft = "4px solid #dc2626";
            el.style.backgroundColor = "rgba(220, 38, 38, 0.05)";
        } else if (res.risk_level === 'MEDIUM') {
            badge.style.backgroundColor = '#f59e0b'; // Amber 500
            badge.style.color = 'black';
            badge.innerText = `⚠️ RISK: ${res.bot_score}%`;
            el.style.borderLeft = "4px solid #f59e0b";
        } else {
            badge.style.backgroundColor = '#16a34a'; // Green 600
            badge.style.color = 'white';
            badge.innerText = `✅ SAFE`;
            badge.style.opacity = "0.7";
        }

        // Injection logic for Shreddit
        const header = el.querySelector('span[slot="authorName"]') 
                    || el.shadowRoot?.querySelector('.author-container')
                    || el.querySelector('.faceplate-tracker'); // Fallback anchor
        
        if (header) {
            header.parentNode.insertBefore(badge, header.nextSibling);
        } else {
            el.prepend(badge);
        }
    });
}

// Main execution function
function scanThread() {
    const { payload, elementMap } = extractComments();

    if (payload.length === 0) {
        return;
    }

    console.log(`Bot Detector: Sending ${payload.length} comments to analysis...`);

    // Use runtime.sendMessage to go through Background script (avoids CORS/Mixed Content on production Reddit)
    chrome.runtime.sendMessage(
        { type: 'ANALYZE_COMMENTS', payload: payload },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("Bot Detector Runtime Error:", chrome.runtime.lastError);
                return;
            }
            
            if (response && response.status === 'success') {
                applyResults(response.data, elementMap);
                console.log("Bot Detector: Analysis applied.");
            } else {
                console.error("Bot Detector API Error:", response ? response.error : "Unknown error");
            }
        }
    );
}

// Run scan when page loads and periodically
setTimeout(scanThread, 3000); 
setInterval(scanThread, 8000);
