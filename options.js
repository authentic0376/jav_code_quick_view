const patternList = document.getElementById('pattern-list');
const newPatternInput = document.getElementById('new-pattern');
const addButton = document.getElementById('add-btn');

// Loads saved patterns and displays them on the screen
function restoreOptions() {
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
function saveOptions(patterns) {
    browser.storage.local.set({ patterns });
}

// "Add" button click event
addButton.addEventListener('click', () => {
    const newPattern = newPatternInput.value.trim();
    if (newPattern) {
        browser.storage.local.get('patterns').then(result => {
            const patterns = result.patterns || ['[A-Z]{2,5}-[0-9]{3,5}'];
            patterns.push(newPattern);
            saveOptions(patterns);
            newPatternInput.value = ''; // Clear the input field
            restoreOptions(); // Refresh the list
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
            saveOptions(patterns);
            restoreOptions(); // Refresh the list
        });
    }
});

// Restore options when the page loads
document.addEventListener('DOMContentLoaded', restoreOptions);
