# GPT Organizer Chrome Extension

A Chrome extension that allows you to organize your custom GPTs into folders for easy access and management.

## Features

- 📁 **Folder Organization**: Create custom folders to categorize your GPTs
- 🔍 **Quick Search**: Find GPTs instantly with built-in search
- ⚡ **One-Click Access**: Launch GPTs directly from the extension popup
- 💾 **Auto-Save**: Automatic saving and syncing of your organization
- 🎯 **Visual Indicators**: See which GPTs are organized with folder icons

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The GPT Organizer icon should appear in your browser toolbar

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## Usage

### Getting Started

1. Navigate to [chat.openai.com](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com)
2. Click the GPT Organizer extension icon in your browser toolbar
3. Create your first folder by clicking the "**+ Folder**" button
4. Give your folder a descriptive name (e.g., "Writing Tools", "Code Helpers", "Research")

### Adding GPTs to Folders

1. Open a folder by clicking on its header
2. Click "**+ Add GPT to folder**"
3. The extension will scan the current ChatGPT page for available GPTs
4. Select the GPT you want to add to the folder

### Managing Your GPTs

- **Search**: Use the search box at the top to quickly find specific GPTs
- **Launch**: Click on any GPT name to open it directly in ChatGPT
- **Remove**: Click the "×" button next to a GPT to remove it from a folder
- **Delete Folders**: Right-click on a folder header for deletion options

### Visual Indicators

When browsing ChatGPT, you'll see small folder icons (📁) next to GPTs that have been organized, making it easy to identify which ones are already categorized.

## File Structure

```
gpt-organizer-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Popup functionality
├── content.js             # ChatGPT page integration
├── content.css            # Content script styles
├── background.js          # Background service worker
├── welcome.html           # Welcome page for new users
├── icons/                 # Extension icons
└── README.md              # This file
```

## Technical Details

### Permissions

- `storage`: To save folder structure and GPT assignments locally
- `activeTab`: To interact with the current ChatGPT tab
- `host_permissions`: Access to ChatGPT domains for content script injection

### Storage

The extension uses Chrome's local storage API to save:
- Folder structure and names
- GPT assignments to folders
- User preferences and settings

### Content Script Integration

The extension automatically detects GPTs on ChatGPT pages by:
- Scanning sidebar navigation links
- Detecting GPT store listings
- Identifying conversation headers
- Monitoring URL patterns for custom GPT identifiers

## Development

### Prerequisites

- Chrome browser with Developer mode enabled
- Basic knowledge of JavaScript, HTML, and CSS

### Local Development

1. Clone the repository
2. Make changes to the source files
3. Reload the extension in `chrome://extensions/`
4. Test functionality on ChatGPT pages

### Building for Production

Before publishing:

1. Replace icon placeholder files with proper PNG icons
2. Test thoroughly across different ChatGPT page layouts
3. Optimize code and remove console.log statements
4. Update version number in manifest.json

## Troubleshooting

### Extension Not Working

1. Ensure you're on a ChatGPT page (chat.openai.com or chatgpt.com)
2. Refresh the page and try again
3. Check that the extension is enabled in `chrome://extensions/`
4. Look for errors in the browser console (F12)

### GPTs Not Being Detected

1. Make sure you're logged into ChatGPT
2. Navigate to different sections (GPT store, conversations)
3. The extension scans automatically but may need a moment to detect GPTs
4. Try refreshing the page if detection seems incomplete

### Data Not Saving

1. Check that the extension has storage permissions
2. Ensure you're not in incognito mode (unless extension is enabled for incognito)
3. Try creating a new folder to test storage functionality

## Privacy

This extension:
- ✅ Stores all data locally in your browser
- ✅ Does not send any data to external servers
- ✅ Only accesses ChatGPT pages when you're actively using them
- ✅ Does not track your usage or collect analytics

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Ideas for Future Enhancements

- Import/export folder configurations
- Drag-and-drop reordering of GPTs
- Folder color coding and icons
- Quick access floating button on ChatGPT pages
- Keyboard shortcuts for common actions
- Backup and sync across devices

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on the GitHub repository
3. Provide details about your browser version and the specific problem

---

**Note**: This extension is not affiliated with OpenAI or ChatGPT. It's an independent tool created to enhance the user experience of organizing custom GPTs.