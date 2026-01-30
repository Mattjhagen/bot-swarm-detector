// content.js - Reddit Bot Detector

console.log("Bot Swarm Detector: Loaded");

// Helper to generate a UUID for tracking if the DOM element doesn't have a clean ID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to find comments on "Shreddit" (New Reddit)
function extractComments() {
    // Selector for modern Reddit comment containers
    const commentElements = document.querySelectorAll('shreddit-comment');
    const payload = [];
    const elementMap = new Map(); // Map internal ID to DOM element for updating later

    commentElements.forEach((el) => {
        // Avoid reprocessing
        if (el.getAttribute('data-bot-scanned') === 'true') return;

        const author = el.getAttribute('author') || "unknown";
        // To get text, we often need to dive into shadow roots or specific slots
        // This is a simplified selector for the text content
        const textDiv = el.querySelector('div[slot="comment"]'); 
        const text = textDiv ? textDiv.innerText : "";

        if (text.length < 5) return; // Skip empty/short comments

        const id = el.getAttribute('id') || generateUUID();
        
        // MOCK METADATA: 
        // Real extraction requires profile scraping. 
        // For MVP, we randomize age to demonstrate Layer 1 logic.
        const mockAge = Math.floor(Math.random() * 150); // 0-150 days
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

// Function to inject badges based on results
function applyResults(results, elementMap) {
    results.forEach(res => {
        const el = elementMap.get(res.comment_id);
        if (!el) return;

        // Mark as processed
        el.setAttribute('data-bot-scanned', 'true');

        // Create Badge
        const badge = document.createElement('span');
        badge.style.marginLeft = '10px';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.fontFamily = 'monospace';
        badge.style.verticalAlign = 'middle';
        badge.style.cursor = 'help';
        badge.title = `Metadata: ${res.breakdown.metadata_risk} | Ling: ${res.breakdown.linguistic_risk} | Swarm: ${res.breakdown.swarm_risk}`;

        if (res.risk_level === 'HIGH') {
            badge.style.backgroundColor = '#ff4d4d'; // Red
            badge.style.color = 'white';
            badge.innerText = `BOT: ${res.bot_score}%`;
            // Add border to comment
            el.style.borderLeft = "4px solid #ff4d4d";
        } else if (res.risk_level === 'MEDIUM') {
            badge.style.backgroundColor = '#ffcc00'; // Yellow
            badge.style.color = 'black';
            badge.innerText = `RISK: ${res.bot_score}%`;
            el.style.borderLeft = "4px solid #ffcc00";
        } else {
            badge.style.backgroundColor = '#4caf50'; // Green
            badge.style.color = 'white';
            badge.innerText = `SAFE: ${res.bot_score}%`;
        }

        // Inject badge next to the author name (usually in the header slot)
        const header = el.querySelector('span[slot="authorName"]') || el.shadowRoot?.querySelector('.author-container');
        if (header) {
            header.appendChild(badge);
        } else {
            // Fallback: prepend to the comment itself
            el.prepend(badge);
        }
    });
}

// Main execution function
async function scanThread() {
    const { payload, elementMap } = extractComments();

    if (payload.length === 0) {
        console.log("No new comments to scan.");
        return;
    }

    console.log(`Sending ${payload.length} comments to analysis engine...`);

    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comments: payload })
        });

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        applyResults(data, elementMap);
        console.log("Analysis complete.");

    } catch (err) {
        console.error("Bot Detector Error:", err);
    }
}

// Run scan when page loads and periodically (for infinite scroll)
setTimeout(scanThread, 3000); // Initial delay
setInterval(scanThread, 10000); // Re-scan every 10s for new comments
