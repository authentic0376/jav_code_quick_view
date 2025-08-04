# JAV Code Quick-View

A Firefox browser extension that instantly fetches and displays image search results for JAV codes found on web pages.

## Features

- Automatic Code Detection: Automatically recognizes JAV-style codes (e.g., DSVR-1691) within links on any webpage.

- Instant Image Preview: Hovering over a link with a recognized code opens a sidebar displaying the top image search results from Google.

- Customizable Patterns: Add or remove new code-matching patterns (using Regex) via the extension's options page.

- Efficient Sidebar UI: Image results are displayed in a clean, masonry-style sidebar that occupies the right third of the screen, ensuring it doesn't interfere with page content or native tooltips.

## How to Use

1. Install the extension.

1. Browse the web. When you hover your mouse over a link containing a JAV code, a sidebar will automatically appear on the right side of your screen.

1. View the results. The sidebar will show a collage of the top image search results for that code.

1. Move your mouse away from the link to automatically close the sidebar.

## Installation for Development

To load this extension for development or testing:

1. Clone this repository or download the source code as a ZIP file.

1. Open Firefox and navigate to about:debugging.

1. Click on "This Firefox" in the left-hand menu.

1. Click the "Load Temporary Add-on..." button.

1. Select the manifest.json file from the project's root directory.

The extension icon will now appear in your Firefox toolbar.

## License

This project is licensed under the MIT License. See the LICENSE.md file for details.