#!/bin/bash

# GPT Organizer Extension - Repository Setup Script
# Run this script to commit all extension files to your GitHub repository

echo "🚀 Setting up GPT Organizer Extension repository..."

# Add all files to git
git add .

# Commit with a descriptive message
git commit -m "Add GPT Organizer Chrome Extension

- Complete Chrome extension for organizing custom GPTs into folders
- Popup interface for folder management and GPT organization
- Content script integration with ChatGPT pages
- Local storage for persistent folder structure
- Search and filter functionality
- Visual indicators for organized GPTs
- Welcome page for new users
- Comprehensive documentation

Features:
✅ Folder creation and management
✅ GPT detection and organization  
✅ One-click GPT launching
✅ Search and filtering
✅ Local storage persistence
✅ Visual indicators on ChatGPT pages"

# Push to GitHub
git push origin main

echo "✅ Extension files successfully pushed to GitHub!"
echo "📁 Repository: https://github.com/VibalKnowledge/gpt-organizer-extension"
echo ""
echo "Next steps:"
echo "1. Download/clone the repository"
echo "2. Load as unpacked extension in Chrome"
echo "3. Start organizing your GPTs!"
