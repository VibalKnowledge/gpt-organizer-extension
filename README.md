# GPT Organizer Chrome Extension

A Chrome extension that seamlessly integrates into ChatGPT's sidebar to organize your custom GPTs into folders with smart highlighting, right-click actions, and enhanced navigation.

## Features

- 📁 **Smart Folder Organization**: Create color-coded folders with drag-and-drop reordering
- ✨ **Current GPT Highlighting**: Automatically highlights your active GPT with a green gradient at the top
- 🖱️ **Right-Click Context Menus**: Instantly add GPTs to folders or create new ones with right-click actions
- 🔍 **Intelligent Search**: Search through organized GPTs and recent history
- 🌙 **Dark/Light Mode**: Seamless theme switching that matches ChatGPT's interface
- 💾 **Reliable Auto-Save**: Enhanced data persistence with error handling and backup storage
- ⌨️ **Keyboard Shortcuts**: Quick actions with Ctrl+Shift combinations
- 📱 **Sidebar Integration**: Lives directly in ChatGPT's sidebar—no popup needed

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. Navigate to [chat.openai.com](https://chat.openai.com) to see the extension in action

### Method 2: Chrome Web Store

The extension is be available on the Chrome Web Store.

## Usage

### Getting Started

1. Navigate to [chat.openai.com](https://chat.openai.com) and open any custom GPT
2. The GPT Organizer automatically appears in the sidebar
3. Your current GPT will be highlighted at the top with a green gradient
4. Click the **"+ Create Folder"** button to make your first folder
5. Choose a name and color for your folder

### Adding GPTs to Folders

**Method 1: Right-Click (Recommended)**
1. Right-click on any GPT (current, recent, or in folders)
2. Select "Add to [Folder Name]" or "Create New Folder"
3. Done! The GPT is instantly organized

**Method 2: Context Menu from Current GPT**
1. Open any custom GPT—it appears highlighted at the top
2. Right-click the highlighted GPT
3. Choose your destination folder or create a new one

### Interface Layout

The extension organizes content in this order:
1. **Current GPT** - Highlighted with green gradient when active
2. **Folders** - Your organized GPT collections with color coding
3. **Recent GPTs** - Recently visited GPTs (collapsible)
4. **Search** - Find GPTs in your folders and recent history

### Managing Your Organization

- **Search**: Use the search box to find GPTs in folders or recent history
- **Reorder Folders**: Drag and drop folders to rearrange them
- **Remove GPTs**: Click the "×" button next to any GPT to remove it from a folder
- **Edit Folders**: Click the pencil icon to rename folders
- **Delete Folders**: Click the trash icon to delete entire folders
- **Collapse Sections**: Click the arrow next to "Recent GPTs" to collapse/expand

### Keyboard Shortcuts

- **Ctrl+Shift+F**: Create new folder
- **Ctrl+Shift+S**: Focus search box
- **Ctrl+Shift+O**: Toggle sidebar visibility
- **Esc**: Clear search or close menus

### Settings & Customization

Click the gear icon (⚙) in the header to access:
- **Dark/Light Mode Toggle**: Switch themes without closing settings
- **How to Use Guide**: Complete instructions and tips
- **Clear Recent GPTs**: Remove all recent history
- **Reset All Data**: Start fresh (with confirmation)

## Technical Details

### Architecture

The extension uses a content script that injects directly into ChatGPT's sidebar, providing a native feel without popup windows.

### Permissions

- `storage`: Save folder structure and GPT assignments
- `activeTab`: Interact with ChatGPT pages
- `host_permissions`: Access to ChatGPT domains for sidebar integration

### Storage & Data Persistence

**Enhanced Storage System:**
- Primary: Chrome sync storage for cross-device synchronization
- Backup: Chrome local storage as fallback
- Error handling prevents data loss during storage failures
- Debounced saving prevents excessive storage operations

**Data Stored:**
- Folder structure with names and colors
- GPT assignments to folders
- Recent GPTs history
- User preferences (theme, collapsed states)

### GPT Detection

The extension automatically detects custom GPTs by:
- Monitoring URL patterns (`/g/g-[id]`)
- Extracting GPT names from page titles and headings
- Filtering out generic "ChatGPT" entries
- Tracking recently visited custom GPTs

## Development

### Prerequisites

- Chrome browser with Developer mode enabled
- Knowledge of JavaScript ES6+, HTML5, and CSS3
- Familiarity with Chrome Extension APIs

### Local Development

1. Clone the repository
2. Make changes to source files
3. Reload extension in `chrome://extensions/`
4. Test on ChatGPT pages with custom GPTs

### Key Files

```
gpt-organizer-extension/
├── manifest.json          # Extension configuration
├── content.js             # Main sidebar integration (1700+ lines)
├── welcome.html           # Welcome page for new users
├── icons/                 # Extension icons
└── README.md              # This file
```

### Building for Production

1. Test thoroughly across different ChatGPT layouts
2. Verify error handling and data persistence
3. Optimize performance and remove debug code
4. Update version in manifest.json
5. Test keyboard shortcuts and accessibility

## Troubleshooting

### Extension Not Appearing

1. Ensure you're on a ChatGPT page with a custom GPT
2. Refresh the page and wait a moment for injection
3. Check extension is enabled in `chrome://extensions/`
4. Look for console errors (F12 → Console)

### GPTs Not Being Detected

1. Make sure you're logged into ChatGPT
2. Navigate to actual custom GPTs (URLs with `/g/g-`)
3. Generic ChatGPT conversations won't show the current GPT section
4. Try visiting the GPT store and opening a custom GPT

### Data Not Saving

1. Check browser console for "GPT Organizer" error messages
2. Verify storage permissions in extension settings
3. Try creating a test folder to verify storage works
4. Extension automatically falls back to local storage if sync fails

### Right-Click Menu Not Working

1. Ensure you're right-clicking directly on GPT items
2. Try refreshing the page if context menus don't appear
3. Check that no other extensions are interfering with right-click

## Privacy & Security

This extension:
- ✅ Stores all data locally in your browser
- ✅ Uses Chrome's secure storage APIs
- ✅ Does not send data to external servers
- ✅ Only accesses ChatGPT pages when active
- ✅ No tracking, analytics, or data collection
- ✅ Open source for transparency

## Contributing

Contributions welcome! Areas for improvement:

### Current Features
- [x] Sidebar integration
- [x] Right-click context menus
- [x] Current GPT highlighting
- [x] Drag-and-drop folder reordering
- [x] Dark/light mode toggle
- [x] Keyboard shortcuts
- [x] Enhanced error handling
- [x] Search functionality

### Future Enhancements
- [ ] Import/export configurations
- [ ] Folder templates and presets
- [ ] Advanced search filters
- [ ] GPT usage statistics
- [ ] Bulk operations for GPTs
- [ ] Custom folder icons
- [ ] Backup to cloud services

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:

1. Check troubleshooting section above
2. Look for console errors (F12 → Console → search "GPT Organizer")
3. Open an issue on GitHub with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Console error messages

## Changelog

### v1.1.0 (Current)
- ✨ Added right-click context menus for instant GPT organization
- ✨ Current GPT highlighting with green gradient at top of sidebar
- ✨ Reorganized interface: Current GPT → Folders → Recent → Search
- ✨ Enhanced error handling and data persistence
- ✨ Dark/light mode toggle in settings
- ✨ Keyboard shortcuts for power users
- 🐛 Fixed folder creation on blank slate
- 🐛 Improved text wrapping throughout interface
- 🐛 Prevented "undefined" GPT entries
- 🐛 Made search results clickable
- 🔧 Moved Create Folder button to top for better UX
- 🔧 Removed emojis from headers for cleaner look
- 🔧 Added comprehensive help documentation in settings

---

**Note**: This extension is not affiliated with OpenAI or ChatGPT. It's an independent tool created to enhance the organization and navigation of custom GPTs.
