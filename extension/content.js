// content.js - Bot Swarm Detector
// Supports: Reddit, Facebook, X (Twitter), YouTube

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
    } else if (host.includes('youtube')) {
        return {
            type: 'youtube',
            // Selects individual comment renderers (both top-level and replies)
            commentSelector: 'ytd-comment-renderer, ytd-comment-view-model',
            textSelector: (el) => {
                // Try standard ID first, then fallback for newer view models
                const content = el.querySelector('#content-text') || el.querySelector('.yt-core-attributed-string');
                return content ? (content.innerText || content.textContent) : "";
            },
            insertBadge: (el, badge) => {
                // Find the header area where author name and time are located
                const header = el.querySelector('#header-author') || el.querySelector('.ytd-comment-view-model-wiz__header');
                
                if (header) {
                    // Try to insert after the author name/time
                    const timeEl = header.querySelector('#published-time-text') || header.querySelector('.ytd-comment-view-model-wiz__timestamp');
                    if (timeEl) {
                        timeEl.parentNode.insertBefore(badge, timeEl.nextSibling);
                    } else {
                        header.appendChild(badge);
                    }
                    // Adjust badge style for YouTube's tight spacing
                    badge.style.marginLeft = "8px";
                    badge.style.marginTop = "0px";
                    badge.style.verticalAlign = "middle";
                }
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
        // Mock Metadata
        const mockAge = Math.floor(Math.random() * 365); 
        const mockKarma = Math.floor(Math.random() * 5000);

        payload.push({
            id: id,
            author: "user_unknown", 
            text: text,
            account_age_days: mockAge,
            post_volume: mockKarma
        });

        elementMap.set(id, el);
    });

    return { payload, elementMap, config };
}

// --- TOOLTIP SYSTEM (DOM Builder Version) ---

function style(el, rules) {
    Object.assign(el.style, rules);
}

function createTooltip() {
    let t = document.getElementById("bsd-tooltip");
    if (!t) {
        t = document.createElement('div');
        t.id = "bsd-tooltip";
        style(t, {
            position: "fixed",
            zIndex: "2147483647", // Max integer value
            backgroundColor: "#1e293b",
            color: "#f1f5f9",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            boxShadow: "0 10px 15px 3px rgba(0, 0, 0, 0.5)", // Stronger shadow
            maxWidth: "280px",
            display: "none",
            pointerEvents: "none", // Let mouse pass through
            border: "1px solid #475569",
            lineHeight: "1.5",
            textAlign: "left",
            whiteSpace: "normal"
        });
        // Attach to documentElement (HTML) instead of body to escape some CSS resets
        document.documentElement.appendChild(t);
    } 
    return t;
}

function createRow(label, value, valueColor = "white") {
    const div = document.createElement('div');
    style(div, { display: "flex", justifyContent: "space-between", marginBottom: "2px" });
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.color = "#94a3b8";
    
    const valSpan = document.createElement('span');
    valSpan.textContent = value;
    valSpan.style.fontWeight = "bold";
    valSpan.style.color = valueColor;
    
    div.appendChild(labelSpan);
    div.appendChild(valSpan);
    return div;
}

function showTooltip(e, result) {
    console.log("BSD: Showing Tooltip", result); // Debug Log
    const t = createTooltip();
    
    // Clear content
    while (t.firstChild) t.removeChild(t.firstChild);

    // 1. Header
    const header = document.createElement('div');
    header.textContent = "Analysis Report";
    style(header, {
        color: "#60a5fa",
        fontWeight: "bold",
        fontSize: "13px",
        marginBottom: "8px",
        borderBottom: "1px solid #334155",
        paddingBottom: "4px"
    });
    t.appendChild(header);

    // 2. Stats Grid
    t.appendChild(createRow("🤖 Bot Score:", `${result.bot_score}%`, result.bot_score > 60 ? "#f87171" : "#86efac"));
    t.appendChild(createRow("📢 Misinfo Risk:", result.breakdown.misinfo_risk));
    t.appendChild(createRow("🧠 AI Pattern:", result.breakdown.linguistic_risk));
    t.appendChild(createRow("🕸️ Swarm:", result.breakdown.swarm_risk));

    // 3. Flags Section
    // SAFEGUARD: Ensure flags exists
    const flags = result.flags || [];
    
    if (flags.length > 0) {
        const flagContainer = document.createElement('div');
        style(flagContainer, {
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px dashed #334155"
        });

        const flagTitle = document.createElement('div');
        flagTitle.textContent = "FLAGS:";
        style(flagTitle, { fontSize: "10px", fontWeight: "bold", color: "#fca5a5", marginBottom: "2px" });
        flagContainer.appendChild(flagTitle);

        const ul = document.createElement('ul');
        style(ul, { paddingLeft: "15px", margin: "0", color: "#cbd5e1", listStyleType: "disc" });
        
        flags.forEach(flagText => {
            const li = document.createElement('li');
            li.textContent = flagText;
            ul.appendChild(li);
        });
        
        flagContainer.appendChild(ul);
        t.appendChild(flagContainer);
    } else {
        const safeMsg = document.createElement('div');
        safeMsg.textContent = "✅ No suspicious patterns.";
        style(safeMsg, { color: "#86efac", marginTop: "5px", fontSize: "11px" });
        t.appendChild(safeMsg);
    }
    
    // Positioning
    const x = e.clientX + 15;
    const y = e.clientY + 15;
    
    // Boundary check
    const maxX = window.innerWidth - 300;
    const finalX = x > maxX ? maxX : x;

    t.style.top = y + "px";
    t.style.left = finalX + "px";
    t.style.display = "block";
    t.style.visibility = "visible";
    t.style.opacity = "1";
}

function hideTooltip() {
    const t = document.getElementById("bsd-tooltip");
    if (t) t.style.display = "none";
}

function applyResults(results, elementMap, config) {
    if (!results || !Array.isArray(results)) {
        console.error("BSD: Invalid results format", results);
        return;
    }

    results.forEach(res => {
        const el = elementMap.get(res.comment_id);
        if (!el) return;

        el.setAttribute('data-bot-scanned', 'true');

        // SAFEGUARD: Default flags to empty array if missing
        const flags = res.flags || [];

        const badge = document.createElement('span');
        badge.textContent = res.risk_level === 'HIGH' ? `🤖 ${res.bot_score}%` 
                          : res.risk_level === 'MEDIUM' ? `⚠️ ${res.bot_score}%` 
                          : `✓ OK`;
        
        // Native tooltip fallback
        badge.title = `Score: ${res.bot_score}% | Flags: ${flags.join(', ') || 'None'}`;

        // Base Styles
        style(badge, {
            marginLeft: '8px',
            marginRight: '8px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'help',
            display: 'inline-block',
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            position: "relative", 
            zIndex: "9999",
            userSelect: "none",
            pointerEvents: "auto", 
            transition: "transform 0.1s"
        });

        // Color Logic
        if (res.risk_level === 'HIGH') {
            style(badge, { backgroundColor: '#dc2626', color: 'white', border: '1px solid #7f1d1d' });
            // Only add side border if it's not YouTube (too messy there)
            if(config.type !== 'youtube') el.style.borderLeft = "4px solid #dc2626";
        } else if (res.risk_level === 'MEDIUM') {
            style(badge, { backgroundColor: '#f59e0b', color: 'black', border: '1px solid #b45309' });
            if(config.type !== 'youtube') el.style.borderLeft = "4px solid #f59e0b";
        } else {
            style(badge, { backgroundColor: '#22c55e', color: 'white', border: '1px solid #14532d', opacity: "0.8" });
        }

        // Attach Events
        badge.addEventListener('mouseenter', (e) => showTooltip(e, res));
        badge.addEventListener('mousemove', (e) => {
             const t = document.getElementById("bsd-tooltip");
             if(t && t.style.display === 'block') {
                const x = e.clientX + 15;
                const y = e.clientY + 15;
                const maxX = window.innerWidth - 300;
                t.style.top = y + "px";
                t.style.left = (x > maxX ? maxX : x) + "px";
             }
        });
        badge.addEventListener('mouseleave', hideTooltip);

        config.insertBadge(el, badge);
    });
}

// Main execution function
function scanThread() {
    const { payload, elementMap, config } = extractComments();

    if (payload.length === 0) return;

    chrome.runtime.sendMessage(
        { type: 'ANALYZE_COMMENTS', payload: payload },
        (response) => {
            if (chrome.runtime.lastError) {
                console.log("BSD: Runtime error or background script sleeping.");
                return;
            }
            if (response && response.status === 'success') {
                applyResults(response.data, elementMap, config);
            }
        }
    );
}

// Run loop
setTimeout(scanThread, 2000); 
setInterval(scanThread, 5000);