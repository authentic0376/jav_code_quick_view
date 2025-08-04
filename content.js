// Variables for the tooltip
let tooltip;
let tooltipTimeout;

// Load saved patterns and create an array of regular expressions
let patterns = [];
browser.storage.local.get('patterns').then(result => {
    const savedPatterns = result.patterns || ['[A-Z]{2,5}-[0-9]{3,5}']; // Default pattern
    patterns = savedPatterns.map(p => new RegExp(p, 'i'));
});

// Update patterns in real-time when changes are made in storage
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.patterns) {
        patterns = changes.patterns.newValue.map(p => new RegExp(p, 'i'));
    }
});

// Function to run when the mouse hovers over a link
document.body.addEventListener('mouseover', (e) => {
    if (e.target.tagName !== 'A' || !e.target.textContent) return;

    const linkText = e.target.textContent.trim();
    let matchedCode = null;

    // Check if there is a code that matches the saved patterns
    for (const regex of patterns) {
        const match = linkText.match(regex);
        if (match) {
            matchedCode = match[0];
            break;
        }
    }

    if (matchedCode) {
        // Delay tooltip creation
        tooltipTimeout = setTimeout(() => {
            console.log(`Content: Code '${matchedCode}' recognized. Requesting tooltip creation.`);
            createTooltip(matchedCode);
        }, 500); // 0.5 second delay

        // Hide the tooltip when the mouse leaves
        e.target.addEventListener('mouseout', hideTooltip, { once: true });
    }
});

// Creates the tooltip and requests an image search
function createTooltip(code) {
    hideTooltip();

    tooltip = document.createElement('div');
    tooltip.id = 'image-search-tooltip';
    tooltip.innerHTML = `<div class="tooltip-loading"><span>'${code}'</span> Searching...</div>`;
    document.body.appendChild(tooltip);

    // Send a search message to the background script
    console.log(`Content: Sending search message for '${code}' to background.`);
    browser.runtime.sendMessage({ query: code });
}

// Hides and removes the tooltip
function hideTooltip() {
    clearTimeout(tooltipTimeout);
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// Receives image URLs from the background and displays them in the tooltip
browser.runtime.onMessage.addListener((message) => {
    console.log("Content: Message received from background:", message);
    if (message.imageUrls && tooltip) {
        if (message.imageUrls.length > 0) {
            console.log("Content: Displaying received image URLs in the tooltip.");
            tooltip.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'tooltip-image-grid';
            message.imageUrls.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.onerror = () => {
                    console.error("Content: Image failed to load:", url);
                    img.style.display = 'none';
                };
                grid.appendChild(img);
            });
            tooltip.appendChild(grid);
        } else {
            console.warn("Content: Received image URL array is empty.");
            tooltip.innerHTML = `<div class="tooltip-loading">Images not found.</div>`;
        }
    }
});
