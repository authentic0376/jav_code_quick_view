// Listens for a message from content.js
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.query) {
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
                browser.tabs.sendMessage(sender.tab.id, { imageUrls: imageUrls.slice(0, 10) });
            })
            .catch(error => {
                console.error("Background: A critical error occurred during fetch:", error);
                browser.tabs.sendMessage(sender.tab.id, { imageUrls: [] });
            });
    }
    return true; // Indicates an asynchronous response
});

/**
 * Parses image URLs from the Google Image search result HTML.
 * Uses a multi-step fallback logic for increased stability.
 */
function parseImageUrls(html) {
    const urls = new Set();

    // --- Step 1: Attempt to extract high-resolution original image URLs ---
    const highResRegex = /"ou":"(https?:\/\/[^"]+)"/g;
    let match;
    while ((match = highResRegex.exec(html)) !== null) {
        // Exclude unnecessary images like the Google logo
        if (!match[1].includes('google.com/logo')) {
            urls.add(match[1]);
        }
    }

    // If high-res images were found, return them
    if (urls.size > 0) {
        console.log(`Background: Step 1 successful. Found ${urls.size} high-res URLs.`);
        return Array.from(urls);
    }

    // --- Step 2: Attempt to extract thumbnail image URLs (if Step 1 fails) ---
    console.warn("Background: Step 1 failed. Falling back to Step 2 (thumbnails).");
    const thumbRegex = /\["(https?:\/\/[^"]+)",\d+,\d+\]/g;
    while ((match = thumbRegex.exec(html)) !== null) {
        const url = match[1];
        // Improve accuracy by checking for the thumbnail server address
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
