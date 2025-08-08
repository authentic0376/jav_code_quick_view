const ENABLED_ICON_PATH = "icon.svg";
const DISABLED_ICON_PATH = "icon-disabled.svg";

// --- Icon and State Management ---

// Function to update the browser action icon based on the stored state
function updateIcon() {
    browser.storage.local.get({ isEnabled: true }).then(result => {
        const path = result.isEnabled ? ENABLED_ICON_PATH : DISABLED_ICON_PATH;
        browser.action.setIcon({ path: path });
        console.log(`Background: Extension is ${result.isEnabled ? 'enabled' : 'disabled'}. Icon set to ${path}.`);
    });
}

// --- Event Listeners ---

// Listener for messages from other parts of the extension (e.g., options page)
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle icon update requests from the options page
    if (request.action === "updateIcon") {
        updateIcon();
        return; // End execution for this message type
    }

    // Handle image search queries from the content script
    if (request.query) {
        // Check if the extension is enabled before proceeding
        browser.storage.local.get({ isEnabled: true }).then(result => {
            if (!result.isEnabled) {
                console.log("Background: Extension is disabled. Ignoring search query.");
                return; // Do not proceed if disabled
            }

            const searchQuery = request.query + ' jav'; // Appends ' jav' to the search term
            console.log(`Background: Starting search for '${searchQuery}'`);
            const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`;

            fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })
                .then(response => response.text())
                .then(html => {
                    const imageUrls = parseImageUrls(html);
                    console.log(`Background: Parsed ${imageUrls.length} image URLs:`, imageUrls);
                    // Sends up to 10 image URLs back to the content script
                    if (sender.tab && sender.tab.id) {
                        browser.tabs.sendMessage(sender.tab.id, { imageUrls: imageUrls.slice(0, 10) });
                    }
                })
                .catch(error => {
                    console.error("Background: A critical error occurred during fetch:", error);
                    if (sender.tab && sender.tab.id) {
                        browser.tabs.sendMessage(sender.tab.id, { imageUrls: [] });
                    }
                });
        });

        return true; // Indicates an asynchronous response
    }
});

// Set the initial icon when the extension is installed or updated
browser.runtime.onInstalled.addListener(() => {
    console.log("Background: onInstalled event triggered.");
    // Initialize the enabled state
    browser.storage.local.set({ isEnabled: true });
    updateIcon();
});

// Set the initial icon when the browser starts
browser.runtime.onStartup.addListener(() => {
    console.log("Background: onStartup event triggered.");
    updateIcon();
});

// Set the icon when the extension is first enabled after being disabled
browser.management.onEnabled.addListener(updateIcon);


// --- Utility Functions ---

/**
 * Parses image URLs from the Google Image search result HTML.
 * Uses a multi-step fallback logic for increased stability.
 */
function parseImageUrls(html) {
    const urls = new Set();
    const highResRegex = /"ou":"(https?:\/\/[^\"]+)"/g;
    let match;
    while ((match = highResRegex.exec(html)) !== null) {
        if (!match[1].includes('google.com/logo')) {
            urls.add(match[1]);
        }
    }

    if (urls.size > 0) {
        console.log(`Background: Step 1 successful. Found ${urls.size} high-res URLs.`);
        return Array.from(urls);
    }

    console.warn("Background: Step 1 failed. Falling back to Step 2 (thumbnails).");
    const thumbRegex = /\["(https?:\/\/[^\"]+)",\d+,\d+\]/g;
    while ((match = thumbRegex.exec(html)) !== null) {
        const url = match[1];
        if (url.includes('gstatic.com/images')) {
            const cleanedUrl = url.replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
            urls.add(cleanedUrl);
        }
    }

    if (urls.size > 0) {
        console.log(`Background: Step 2 successful. Found ${urls.size} thumbnail URLs.`);
    } else {
        console.error("Background: Failed to find image URLs in all steps. Google's HTML structure may have changed significantly.");
    }

    return Array.from(urls);
}