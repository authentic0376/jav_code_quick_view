// -- DOM Elements --
const patternList = document.getElementById('pattern-list');
const newPatternInput = document.getElementById('new-pattern');
const addButton = document.getElementById('add-btn');
const toggleButton = document.getElementById('toggle-enabled-btn');
const statusMessage = document.getElementById('status-message');

// -- State Management --

// Load and display enabled/disabled status
function restoreStatus() {
    browser.storage.local.get({ isEnabled: true }).then(result => {
        updateStatusUI(result.isEnabled);
    }, console.error);
}

// Update button and text to reflect current status
function updateStatusUI(isEnabled) {
    if (isEnabled) {
        toggleButton.textContent = 'Disable Extension';
        toggleButton.style.backgroundColor = '#e74c3c'; // Red for disable action
        statusMessage.textContent = 'Extension is currently enabled.';
        statusMessage.style.color = '#27ae60'; // Green
    } else {
        toggleButton.textContent = 'Enable Extension';
        toggleButton.style.backgroundColor = '#2ecc71'; // Green for enable action
        statusMessage.textContent = 'Extension is currently disabled.';
        statusMessage.style.color = '#c0392b'; // Red
    }
}

// Toggle the enabled/disabled state
toggleButton.addEventListener('click', () => {
    browser.storage.local.get({ isEnabled: true }).then(result => {
        const newIsEnabled = !result.isEnabled;
        browser.storage.local.set({ isEnabled: newIsEnabled }).then(() => {
            updateStatusUI(newIsEnabled);
            // Notify background script to update the icon immediately
            browser.runtime.sendMessage({ action: "updateIcon" });
        });
    });
});


// -- Pattern Management --

// Loads saved patterns and displays them on the screen
function restorePatterns() {
    browser.storage.local.get('patterns').then(result => {
        const patterns = result.patterns || ['[A-Z]{2,5}-[0-9]{3,5}']; // Default pattern
        patternList.innerHTML = ''; // Clear the list
        patterns.forEach((pattern, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<code>${pattern}</code> <button class="delete-btn" data-index="${index}">Delete</button>`;
            patternList.appendChild(li);
        });
    }, console.error);
}

// Saves the patterns
function savePatterns(patterns) {
    browser.storage.local.set({ patterns });
}

// "Add" button click event
addButton.addEventListener('click', () => {
    const newPattern = newPatternInput.value.trim();
    if (newPattern) {
        browser.storage.local.get('patterns').then(result => {
            const patterns = result.patterns || ['[A-Z]{2,5}-[0-9]{3,5}'];
            patterns.push(newPattern);
            savePatterns(patterns);
            newPatternInput.value = ''; // Clear the input field
            restorePatterns(); // Refresh the list
        });
    }
});

// "Delete" button click event (uses event delegation)
patternList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const indexToDelete = parseInt(e.target.dataset.index, 10);
        browser.storage.local.get('patterns').then(result => {
            const patterns = result.patterns || ['[A-Z]{2,5}-[0-9]{3,5}'];
            patterns.splice(indexToDelete, 1);
            savePatterns(patterns);
            restorePatterns(); // Refresh the list
        });
    }
});

// -- Initialization --
document.addEventListener('DOMContentLoaded', () => {
    restoreStatus();
    restorePatterns();
});