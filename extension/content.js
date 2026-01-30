// content.js - Bot Swarm Detector
// Supports: Reddit, Facebook, X (Twitter)

console.log("Bot Swarm Detector: Loaded for " + window.location.hostname);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- PLATFORM SELECTORS ---
function getPlatformConfig() {
    const host = window.location.hostname;
    if (host.includes('reddit')) {
        return {
            type: 'reddit',
            commentSelector: 'shreddit-comment',
            textSelector: (el) => {
                const textDiv = el.querySelector('div[slot="comment"]');
                return textDiv ? (textDiv.innerText || textDiv.textContent) : "";
            },
            insertBadge: (el, badge) => {
                 const header = el.querySelector('span[slot="authorName"]') 
                    || el.shadowRoot?.querySelector('.author-container')
                    || el.querySelector('.faceplate-tracker');
                 if (header) header.parentNode.insertBefore(badge, header.nextSibling);
                 else el.prepend(badge);
            }
        };
    } else if (host.includes('facebook')) {
        return {
            type: 'facebook',
            // Generic container for FB comments/posts often has dir="auto"
            commentSelector: 'div[role="article"] div[dir="auto"]', 
            textSelector: (el) => el.innerText || el.textContent,
            insertBadge: (el, badge) => {
                // Insert before the text content
                el.prepend(badge);
            }
        };
    } else if (host.includes('twitter') || host.includes('x.com')) {
        return {
            type: 'twitter',
            commentSelector: '[data-testid="tweetText"]',
            textSelector: (el) => el.innerText || el.textContent,
            insertBadge: (el, badge) => {
                el.prepend(badge);
            }
        };
    }
    return null;
}

function extractComments() {
    const config = getPlatformConfig();
    if (!config) return { payload: [], elementMap: new Map() };

    let commentElements = Array.from(document.querySelectorAll(config.commentSelector));
    
    // Filter out very short elements or already scanned
    commentElements = commentElements.filter(el => 
        !el.getAttribute('data-bot-scanned') && el.innerText.length > 10
    );

    const payload = [];
    const elementMap = new Map(); 

    commentElements.forEach((el) => {
        const text = config.textSelector(el);
        if (!text || text.length < 5) return; 

        const id = generateUUID();
        // Mock Metadata (Since we can't scrape API data easily from FB/X frontends)
        const mockAge = Math.floor(Math.random() * 365); 
        const mockKarma = Math.floor(Math.random() * 5000);

        payload.push({
            id: id,
            author: "user_unknown", // Hard to get reliably across all sites without specific parsers
            text: text,
            account_age_days: mockAge,
            post_volume: mockKarma
        });

        elementMap.set(id, el);
    });

    return { payload, elementMap, config };
}

// --- TOOLTIP SYSTEM ---
let tooltipEl = null;

function createTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.id = "bsd-tooltip";
    tooltipEl.style.position = "absolute";
    tooltipEl.style.zIndex = "10000";
    tooltipEl.style.backgroundColor = "#1e293b";
    tooltipEl.style.color = "#f1f5f9";
    tooltipEl.style.padding = "10px";
    tooltipEl.style.borderRadius = "6px";
    tooltipEl.style.fontSize = "12px";
    tooltipEl.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.5)";
    tooltipEl.style.maxWidth = "250px";
    tooltipEl.style.display = "none";
    tooltipEl.style.pointerEvents = "none";
    tooltipEl.style.border = "1px solid #475569";
    document.body.appendChild(tooltipEl);
    return tooltipEl;
}

function showTooltip(e, result) {
    const t = createTooltip();
    
    // Build HTML Content
    const flagsHtml = result.flags.length > 0 
        ? `<ul style='padding-left:15px; margin:5px 0; list-style-type:disc;'>${result.flags.map(f => `<li>${f}</li>`).join('')}</ul>` 
        : "<p style='color:#86efac'>No suspicious patterns.</p>";
        
    t.innerHTML = `
        <strong style="color: #60a5fa; font-size:13px;">Analysis Report</strong>
        <div style="margin-top:4px; border-bottom:1px solid #334155; padding-bottom:4px;">
            <div>🤖 Bot Score: <b>${result.bot_score}%</b></div>
            <div>📢 Misinfo Risk: <b>${result.breakdown.misinfo_risk}</b></div>
            <div>🧠 AI Pattern: <b>${result.breakdown.linguistic_risk}</b></div>
            <div>🕸️ Swarm: <b>${result.breakdown.swarm_risk}</b></div>
        </div>
        <div style="margin-top:5px; font-style:italic;">
            ${flagsHtml}
        </div>
    `;
    
    t.style.display = "block";
    t.style.top = (e.pageY + 15) + "px";
    t.style.left = (e.pageX + 15) + "px";
}

function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = "none";
}

function applyResults(results, elementMap, config) {
    results.forEach(res => {
        const el = elementMap.get(res.comment_id);
        if (!el) return;

        el.setAttribute('data-bot-scanned', 'true');

        const badge = document.createElement('span');
        badge.style.marginLeft = '8px';
        badge.style.marginRight = '8px';
        badge.style.padding = '3px 8px';
        badge.style.borderRadius = '12px';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = 'bold';
        badge.style.fontFamily = 'Arial, sans-serif';
        badge.style.cursor = 'help';
        badge.style.display = 'inline-block';
        badge.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";

        // Mouse Events for Tooltip
        badge.addEventListener('mouseenter', (e) => showTooltip(e, res));
        badge.addEventListener('mousemove', (e) => {
             const t = document.getElementById("bsd-tooltip");
             if(t) {
                t.style.top = (e.pageY + 15) + "px";
                t.style.left = (e.pageX + 15) + "px";
             }
        });
        badge.addEventListener('mouseleave', hideTooltip);

        if (res.risk_level === 'HIGH') {
            badge.style.backgroundColor = '#dc2626'; 
            badge.style.color = 'white';
            badge.innerText = `🤖 BOT: ${res.bot_score}%`;
            el.style.borderLeft = "4px solid #dc2626";
        } else if (res.risk_level === 'MEDIUM') {
            badge.style.backgroundColor = '#f59e0b'; 
            badge.style.color = 'black';
            badge.innerText = `⚠️ CHECK: ${res.bot_score}%`;
            el.style.borderLeft = "4px solid #f59e0b";
        } else {
            badge.style.backgroundColor = '#22c55e';
            badge.style.color = 'white';
            badge.innerText = `✓ OK`;
            badge.style.opacity = "0.8";
        }

        config.insertBadge(el, badge);
    });
}

// Main execution function
function scanThread() {
    const { payload, elementMap, config } = extractComments();

    if (payload.length === 0) return;

    // Use runtime.sendMessage to go through Background script
    chrome.runtime.sendMessage(
        { type: 'ANALYZE_COMMENTS', payload: payload },
        (response) => {
            if (chrome.runtime.lastError) return; // Silent fail
            
            if (response && response.status === 'success') {
                applyResults(response.data, elementMap, config);
            }
        }
    );
}

// Run loop
setTimeout(scanThread, 2000); 
setInterval(scanThread, 5000);
