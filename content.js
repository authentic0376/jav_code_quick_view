// Global state
let isEnabled = true;
let patterns = [];
let tooltip;
let tooltipTimeout;

// Main function to attach event listeners
function initializeContentScript() {
    console.log("Content: Initializing script...");
    document.body.addEventListener('mouseover', handleMouseOver);
    browser.runtime.onMessage.addListener(handleBackgroundMessage);
}

// Function to tear down event listeners and hide UI
function teardownContentScript() {
    console.log("Content: Tearing down script...");
    document.body.removeEventListener('mouseover', handleMouseOver);
    // It's tricky to remove a specific message listener, but for now, we rely on the isEnabled flag
    hideTooltip();
}

// Check the extension's state before initializing
browser.storage.local.get({ isEnabled: true, patterns: ['[A-Z]{2,5}-[0-9]{3,5}'] })
    .then(result => {
        isEnabled = result.isEnabled;
        patterns = result.patterns.map(p => new RegExp(p, 'i'));
        if (isEnabled) {
            initializeContentScript();
        } else {
            console.log("Content: Extension is disabled. Script not initialized.");
        }
    });

// Listen for changes in storage to enable/disable the script on the fly
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.isEnabled) {
            isEnabled = changes.isEnabled.newValue;
            if (isEnabled) {
                initializeContentScript();
            } else {
                teardownContentScript();
            }
        }
        if (changes.patterns) {
            patterns = changes.patterns.newValue.map(p => new RegExp(p, 'i'));
        }
    }
});

// Function to run when the mouse hovers over a link
function handleMouseOver(e) {
    if (!isEnabled || e.target.tagName !== 'A' || !e.target.textContent) return;

    const linkText = e.target.textContent.trim();
    let matchedCode = null;

    for (const regex of patterns) {
        const match = linkText.match(regex);
        if (match) {
            matchedCode = match[0];
            break;
        }
    }

    if (matchedCode) {
        tooltipTimeout = setTimeout(() => {
            console.log(`Content: Code '${matchedCode}' recognized. Requesting tooltip creation.`);
            createTooltip(matchedCode);
        }, 500); // 0.5 second delay

        e.target.addEventListener('mouseout', hideTooltip, { once: true });
    }
}

// Creates the tooltip and requests an image search
function createTooltip(code) {
    hideTooltip();

    tooltip = document.createElement('div');
    tooltip.id = 'image-search-tooltip';
    tooltip.innerHTML = `<div class="tooltip-loading"><span>'${code}'</span> Searching...</div>`;
    document.body.appendChild(tooltip);

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

// Receives image URLs from the background and displays them
function handleBackgroundMessage(message) {
    if (!isEnabled) return;

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
}