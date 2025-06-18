// GPT Organizer Chrome Extension - v2.1.1
// Phase 1 + Feedback: Collapsible Recent, Dark/Light Mode Toggle, Compact Modal

(function() {
    'use strict';

    // Color options for folders (20 colors)
    const FOLDER_COLORS = [
        { name: 'Blue', value: '#3b82f6', bg: '#eff6ff' },
        { name: 'Green', value: '#10b981', bg: '#f0fdf4' },
        { name: 'Purple', value: '#8b5cf6', bg: '#faf5ff' },
        { name: 'Red', value: '#ef4444', bg: '#fef2f2' },
        { name: 'Orange', value: '#f97316', bg: '#fff7ed' },
        { name: 'Pink', value: '#ec4899', bg: '#fdf2f8' },
        { name: 'Teal', value: '#14b8a6', bg: '#f0fdfa' },
        { name: 'Indigo', value: '#6366f1', bg: '#eef2ff' },
        { name: 'Emerald', value: '#059669', bg: '#ecfdf5' },
        { name: 'Cyan', value: '#06b6d4', bg: '#ecfeff' },
        { name: 'Sky', value: '#0ea5e9', bg: '#f0f9ff' },
        { name: 'Violet', value: '#7c3aed', bg: '#f5f3ff' },
        { name: 'Fuchsia', value: '#d946ef', bg: '#fdf4ff' },
        { name: 'Rose', value: '#f43f5e', bg: '#fff1f2' },
        { name: 'Amber', value: '#f59e0b', bg: '#fffbeb' },
        { name: 'Lime', value: '#65a30d', bg: '#f7fee7' },
        { name: 'Slate', value: '#64748b', bg: '#f8fafc' },
        { name: 'Gray', value: '#6b7280', bg: '#f9fafb' },
        { name: 'Zinc', value: '#71717a', bg: '#fafafa' },
        { name: 'Stone', value: '#78716c', bg: '#fafaf9' }
    ];

    // Keyboard shortcuts
    const SHORTCUTS = {
        TOGGLE_SIDEBAR: 'KeyO',
        SEARCH_FOCUS: 'KeyS',
        CREATE_FOLDER: 'KeyF',
        ESCAPE: 'Escape'
    };

    let isCollapsed = false;
    let folders = {};
    let folderOrder = [];
    let currentGPT = null;
    let draggedElement = null;
    let recentGPTs = [];
    let searchQuery = '';
    let isSearchActive = false;
    let isRecentCollapsed = false;
    let isDarkMode = false;

    // Load data from storage
    function loadData() {
        chrome.storage.sync.get(['gptFolders', 'folderOrder', 'headerCollapsed', 'recentGPTs', 'recentCollapsed', 'darkMode'], function(result) {
            folders = result.gptFolders || {};
            folderOrder = result.folderOrder || Object.keys(folders);
            isCollapsed = result.headerCollapsed || false;
            recentGPTs = result.recentGPTs || [];
            isRecentCollapsed = result.recentCollapsed || false;
            isDarkMode = result.darkMode || false;
            injectIntoSidebar();
        });
    }

    // Save data to storage
    function saveData() {
        chrome.storage.sync.set({
            gptFolders: folders,
            folderOrder: folderOrder,
            headerCollapsed: isCollapsed,
            recentGPTs: recentGPTs,
            recentCollapsed: isRecentCollapsed,
            darkMode: isDarkMode
        });
    }

    // Add to recent GPTs
    function addToRecent(gpt) {
        // Remove if already exists
        recentGPTs = recentGPTs.filter(recent => recent.id !== gpt.id);
        // Add to beginning
        recentGPTs.unshift(gpt);
        // Keep only last 10
        recentGPTs = recentGPTs.slice(0, 10);
        saveData();
    }

    // Search GPTs across all folders
    function searchGPTs(query) {
        if (!query.trim()) return [];
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search in all folders
        Object.entries(folders).forEach(([folderId, folder]) => {
            folder.gpts.forEach(gpt => {
                if (gpt.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...gpt,
                        folderName: folder.name,
                        folderColor: folder.color,
                        folderId: folderId
                    });
                }
            });
        });
        
        // Search in recent GPTs
        recentGPTs.forEach(gpt => {
            if (gpt.name.toLowerCase().includes(lowerQuery) && 
                !results.find(r => r.id === gpt.id)) {
                results.push({
                    ...gpt,
                    folderName: 'Recent',
                    folderColor: '#6b7280',
                    folderId: null
                });
            }
        });
        
        return results;
    }

    // Detect current GPT
    function detectCurrentGPT() {
        const url = window.location.href;
        const gptMatch = url.match(/\/g\/g-([a-zA-Z0-9]+)/);
        
        if (gptMatch) {
            const gptId = gptMatch[1];
            
            // Try to get GPT name from page title or heading
            let gptName = document.title;
            
            // Try to find a better name from the page content
            const titleElement = document.querySelector('h1') || 
                                document.querySelector('[data-testid="conversation-turn-0"] h1') ||
                                document.querySelector('.text-2xl');
            
            if (titleElement && titleElement.textContent.trim()) {
                gptName = titleElement.textContent.trim();
            }
            
            // Clean up the name
            gptName = gptName.replace(' - ChatGPT', '').trim();
            
            currentGPT = {
                id: gptId,
                name: gptName,
                url: url,
                timestamp: Date.now()
            };
            
            // Add to recent GPTs
            addToRecent(currentGPT);
        } else {
            currentGPT = null;
        }
        
        injectIntoSidebar();
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Only trigger if Ctrl+Shift is pressed
            if (e.ctrlKey && e.shiftKey) {
                switch(e.code) {
                    case SHORTCUTS.TOGGLE_SIDEBAR:
                        e.preventDefault();
                        toggleCollapse();
                        break;
                    case SHORTCUTS.SEARCH_FOCUS:
                        e.preventDefault();
                        focusSearch();
                        break;
                    case SHORTCUTS.CREATE_FOLDER:
                        e.preventDefault();
                        showCreateFolderModal();
                        break;
                }
            }
            
            // Escape key handling
            if (e.code === SHORTCUTS.ESCAPE) {
                if (isSearchActive) {
                    clearSearch();
                }
                // Close any open modals
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.remove());
            }
        });
    }

    // Focus search input
    function focusSearch() {
        const searchInput = document.getElementById('gpt-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    // Clear search
    function clearSearch() {
        const searchInput = document.getElementById('gpt-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
            isSearchActive = false;
            updateContent();
        }
    }

    // Toggle recent GPTs collapse
    function toggleRecentCollapse() {
        isRecentCollapsed = !isRecentCollapsed;
        const recentList = document.querySelector('.recent-list');
        const recentCaret = document.querySelector('.recent-caret');
        
        if (recentList && recentCaret) {
            if (isRecentCollapsed) {
                recentList.classList.add('collapsed');
                recentCaret.classList.add('collapsed');
            } else {
                recentList.classList.remove('collapsed');
                recentCaret.classList.remove('collapsed');
            }
            saveData();
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        saveData();
        updateContent();
    }

    // Get theme-based colors
    function getThemeColors() {
        if (isDarkMode) {
            return {
                background: '#1f2937',
                surface: '#374151',
                text: '#f9fafb',
                textSecondary: '#d1d5db',
                border: '#4b5563',
                hover: '#4b5563'
            };
        } else {
            return {
                background: 'white',
                surface: 'white',
                text: '#374151',
                textSecondary: '#6b7280',
                border: '#e5e7eb',
                hover: '#f3f4f6'
            };
        }
    }

    // Format time ago
    function timeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    }

    // Inject into ChatGPT's sidebar
    function injectIntoSidebar() {
        // Find ChatGPT's sidebar
        const sidebar = document.querySelector('nav[aria-label="Chat history"]') || 
                       document.querySelector('nav') ||
                       document.querySelector('[data-testid="navigation"]') ||
                       document.querySelector('aside') ||
                       document.querySelector('.flex.h-full.w-full.flex-1.flex-col');

        if (!sidebar) {
            setTimeout(injectIntoSidebar, 1000);
            return;
        }

        // Remove existing organizer
        const existingOrganizer = document.getElementById('gpt-organizer-section');
        if (existingOrganizer) {
            existingOrganizer.remove();
        }

        const theme = getThemeColors();

        // Create organizer section
        const organizerSection = document.createElement('div');
        organizerSection.id = 'gpt-organizer-section';
        organizerSection.innerHTML = `
            <style>
                #gpt-organizer-section {
                    border-top: 1px solid ${theme.border};
                    margin-top: 12px;
                    padding-top: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .gpt-organizer-header {
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-weight: 600;
                    font-size: 13px;
                    color: ${theme.text};
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }
                
                .gpt-organizer-header:hover {
                    background-color: ${theme.hover};
                }
                
                .organizer-caret {
                    transition: transform 0.2s;
                    font-size: 11px;
                }
                
                .organizer-caret.collapsed {
                    transform: rotate(-90deg);
                }
                
                .gpt-organizer-content {
                    transition: all 0.2s;
                    overflow: hidden;
                    padding: 0 12px;
                }
                
                .gpt-organizer-content.collapsed {
                    max-height: 0;
                    padding: 0 12px;
                }
                
                .search-section {
                    margin-bottom: 12px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 6px 10px;
                    border: 1px solid ${theme.border};
                    border-radius: 4px;
                    font-size: 11px;
                    box-sizing: border-box;
                    background: ${theme.surface};
                    color: ${theme.text};
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 1px #3b82f6;
                }
                
                .search-input::placeholder {
                    color: ${theme.textSecondary};
                }
                
                .search-results {
                    margin-top: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .search-result-item {
                    padding: 6px 8px;
                    margin-bottom: 2px;
                    border-radius: 4px;
                    font-size: 11px;
                    background: ${theme.surface};
                    border: 1px solid ${theme.border};
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .search-result-item:hover {
                    background: ${theme.hover};
                }
                
                .search-result-name {
                    font-weight: 500;
                    color: #3b82f6;
                    margin-bottom: 2px;
                }
                
                .search-result-folder {
                    font-size: 10px;
                    opacity: 0.7;
                    color: ${theme.textSecondary};
                }
                
                .recent-section {
                    margin-bottom: 12px;
                }
                
                .recent-header {
                    font-size: 11px;
                    font-weight: 600;
                    color: ${theme.textSecondary};
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .recent-header:hover {
                    background-color: ${theme.hover};
                }
                
                .recent-caret {
                    transition: transform 0.2s;
                    font-size: 10px;
                }
                
                .recent-caret.collapsed {
                    transform: rotate(-90deg);
                }
                
                .recent-list {
                    max-height: 120px;
                    overflow-y: auto;
                    transition: all 0.2s;
                }
                
                .recent-list.collapsed {
                    max-height: 0;
                    overflow: hidden;
                }
                
                .recent-item {
                    padding: 4px 6px;
                    margin-bottom: 2px;
                    border-radius: 3px;
                    font-size: 10px;
                    background: ${theme.surface};
                    border: 1px solid ${theme.border};
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .recent-item:hover {
                    background: ${theme.hover};
                }
                
                .recent-item-name {
                    color: #3b82f6;
                    font-weight: 500;
                    flex: 1;
                    text-decoration: none;
                }
                
                .recent-item-time {
                    font-size: 9px;
                    color: ${theme.textSecondary};
                }
                
                .current-gpt-section {
                    margin-bottom: 12px;
                    padding: 8px;
                    background: #fef3c7;
                    border-radius: 6px;
                    font-size: 11px;
                }
                
                .current-gpt-name {
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #92400e;
                }
                
                .organizer-btn {
                    width: 100%;
                    padding: 6px 10px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    margin-bottom: 6px;
                    transition: background 0.2s;
                }
                
                .organizer-btn:hover {
                    background: #2563eb;
                }
                
                .organizer-btn.add-btn {
                    background: #10b981;
                }
                
                .organizer-btn.add-btn:hover {
                    background: #059669;
                }
                
                .organizer-btn.settings-btn {
                    background: #6b7280;
                    margin-bottom: 0;
                }
                
                .organizer-btn.settings-btn:hover {
                    background: #4b5563;
                }
                
                .folder-list {
                    margin-bottom: 8px;
                }
                
                .folder-item {
                    margin-bottom: 6px;
                    padding: 6px 8px;
                    border: 1px solid ${theme.border};
                    border-radius: 4px;
                    transition: all 0.2s;
                    min-height: 28px;
                    width: 100%;
                    box-sizing: border-box;
                    display: block;
                    cursor: move;
                    position: relative;
                    background: ${theme.surface};
                }
                
                .folder-item:hover {
                    border-color: ${theme.textSecondary};
                    transform: translateY(-1px);
                }
                
                .folder-item.dragging {
                    opacity: 0.5;
                    transform: rotate(2deg);
                }
                
                .folder-item.drag-over {
                    border-color: #3b82f6;
                    border-width: 2px;
                    background-color: #eff6ff;
                }
                
                .folder-name {
                    font-weight: 500;
                    font-size: 11px;
                }
                
                .folder-count {
                    font-size: 10px;
                    color: ${theme.textSecondary};
                    background: ${theme.hover};
                    padding: 1px 4px;
                    border-radius: 8px;
                }
                
                .folder-actions {
                    display: flex;
                    gap: 2px;
                }
                
                .folder-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px;
                    border-radius: 2px;
                    font-size: 10px;
                    color: ${theme.textSecondary};
                }
                
                .folder-action-btn:hover {
                    background: ${theme.hover};
                    color: ${theme.text};
                }
                
                .folder-action-btn.delete-btn {
                    color: #ef4444;
                    font-weight: bold;
                }
                
                .folder-action-btn.delete-btn:hover {
                    background: #fef2f2;
                    color: #dc2626;
                }
                
                .folder-action-btn.expand-btn.expanded {
                    transform: rotate(90deg);
                }
                
                .folder-header {
                    cursor: pointer;
                }
                
                .folder-gpts {
                    margin-top: 4px;
                    margin-left: 0;
                    padding-left: 0;
                    display: none;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                .folder-gpts.expanded {
                    display: block;
                }
                
                .folder-gpt-item {
                    padding: 6px 8px;
                    margin-bottom: 2px;
                    border-radius: 4px;
                    font-size: 11px;
                    background: ${theme.surface};
                    border: 1px solid ${theme.border};
                    width: 100% !important;
                    box-sizing: border-box;
                    position: relative;
                    display: block;
                    margin-left: 0;
                    margin-right: 0;
                }
                
                .folder-gpt-item:hover {
                    background: ${theme.hover};
                }
                
                .folder-gpt-link {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 500;
                    display: block;
                    width: calc(100% - 20px);
                    padding-right: 20px;
                    box-sizing: border-box;
                }
                
                .folder-gpt-link:hover {
                    text-decoration: underline;
                }
                
                .remove-from-folder-btn {
                    color: #ef4444;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                    position: absolute;
                    right: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                .remove-from-folder-btn:hover {
                    background: #fef2f2;
                }
                
                .drag-handle {
                    position: absolute;
                    left: 2px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: ${theme.textSecondary};
                    font-size: 12px;
                    cursor: move;
                }
                
                .shortcuts-hint {
                    font-size: 9px;
                    color: ${theme.textSecondary};
                    text-align: center;
                    margin-top: 8px;
                    padding: 4px;
                    background: ${theme.surface};
                    border-radius: 3px;
                    border: 1px solid ${theme.border};
                }
                
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-content {
                    background: ${theme.surface};
                    padding: 20px;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90vw;
                    color: ${theme.text};
                }
                
                .modal-header {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 12px;
                }
                
                .form-group {
                    margin-bottom: 12px;
                }
                
                .form-label {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 500;
                    font-size: 13px;
                }
                
                .form-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid ${theme.border};
                    border-radius: 6px;
                    font-size: 13px;
                    background: ${theme.background};
                    color: ${theme.text};
                }
                
                .form-input::placeholder {
                    color: ${theme.textSecondary};
                }
                
                .color-options {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .color-option {
                    width: 40px;
                    height: 40px;
                    border-radius: 6px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .color-option.selected {
                    border-color: #374151;
                    transform: scale(1.1);
                }
                
                .color-option:hover {
                    transform: scale(1.05);
                }
                
                .modal-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                    margin-top: 16px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #2563eb;
                }
                
                .btn-secondary {
                    background: ${theme.hover};
                    color: ${theme.text};
                }
                
                .btn-secondary:hover {
                    background: ${theme.border};
                }
                
                .btn-danger {
                    background: #ef4444;
                    color: white;
                }
                
                .btn-danger:hover {
                    background: #dc2626;
                }
                
                .gpt-list {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid ${theme.border};
                    border-radius: 6px;
                    margin-top: 8px;
                }
                
                .gpt-item {
                    padding: 8px 12px;
                    border-bottom: 1px solid ${theme.border};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    background: ${theme.surface};
                }
                
                .gpt-item:last-child {
                    border-bottom: none;
                }
                
                .gpt-item:hover {
                    background: ${theme.hover};
                }
                
                .remove-gpt-btn {
                    color: #ef4444;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 11px;
                }
                
                .remove-gpt-btn:hover {
                    background: #fef2f2;
                }
                
                .theme-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .theme-switch {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    background: ${isDarkMode ? '#3b82f6' : '#d1d5db'};
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .theme-switch::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: ${isDarkMode ? '22px' : '2px'};
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s;
                }
            </style>
            
            <div class="gpt-organizer-header" id="organizer-header">
                <span>📁 My GPT Folders</span>
                <span class="organizer-caret ${isCollapsed ? 'collapsed' : ''}">▼</span>
            </div>
            
            <div class="gpt-organizer-content ${isCollapsed ? 'collapsed' : ''}">
                <div class="search-section">
                    <input type="text" class="search-input" id="gpt-search-input" placeholder="🔍 Search GPTs... (Ctrl+Shift+S)">
                    <div class="search-results" id="search-results"></div>
                </div>
                
                <div class="recent-section" id="recent-section">
                    <div class="recent-header" id="recent-header">
                        <span>🕒 Recent GPTs</span>
                        <span class="recent-caret ${isRecentCollapsed ? 'collapsed' : ''}">▼</span>
                    </div>
                    <div class="recent-list ${isRecentCollapsed ? 'collapsed' : ''}" id="recent-list"></div>
                </div>
                
                <div id="current-gpt-display"></div>
                <div class="folder-list" id="folder-list"></div>
                <button class="organizer-btn" id="create-folder-btn">+ Create Folder (Ctrl+Shift+F)</button>
                <button class="organizer-btn settings-btn" id="settings-btn">⚙️ Settings</button>
                
                <div class="shortcuts-hint">
                    💡 Ctrl+Shift+O: Toggle | S: Search | F: New Folder | Esc: Clear
                </div>
            </div>
        `;

        // Insert at the top of the sidebar
        sidebar.insertBefore(organizerSection, sidebar.firstChild);

        // Add event listeners
        document.getElementById('organizer-header').addEventListener('click', toggleCollapse);
        document.getElementById('create-folder-btn').addEventListener('click', showCreateFolderModal);
        document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
        document.getElementById('recent-header').addEventListener('click', toggleRecentCollapse);
        
        // Search functionality
        const searchInput = document.getElementById('gpt-search-input');
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', () => isSearchActive = true);

        updateContent();
    }

    // Handle search input
    function handleSearch(e) {
        searchQuery = e.target.value;
        isSearchActive = searchQuery.length > 0;
        
        const searchResults = document.getElementById('search-results');
        
        if (searchQuery.length === 0) {
            searchResults.innerHTML = '';
            updateContent();
            return;
        }
        
        const results = searchGPTs(searchQuery);
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #6b7280; text-align: center;">No GPTs found</div>';
            return;
        }
        
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="window.open('${result.url}', '_self')">
                <div class="search-result-name">${result.name}</div>
                <div class="search-result-folder" style="color: ${result.folderColor}">📁 ${result.folderName}</div>
            </div>
        `).join('');
    }

    // Toggle collapse state
    function toggleCollapse() {
        isCollapsed = !isCollapsed;
        const content = document.querySelector('.gpt-organizer-content');
        const caret = document.querySelector('.organizer-caret');
        
        if (content && caret) {
            if (isCollapsed) {
                content.classList.add('collapsed');
                caret.classList.add('collapsed');
            } else {
                content.classList.remove('collapsed');
                caret.classList.remove('collapsed');
            }
            saveData();
        }
    }

    // Toggle folder expansion
    function toggleFolderExpansion(folderId, folderDiv) {
        const gptsList = folderDiv.querySelector('.folder-gpts');
        const expandBtn = folderDiv.querySelector('.expand-btn');
        
        if (gptsList.classList.contains('expanded')) {
            gptsList.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
        } else {
            gptsList.classList.add('expanded');
            expandBtn.classList.add('expanded');
        }
    }

    // Drag and drop functionality
    function setupDragAndDrop(folderDiv, folderId) {
        folderDiv.draggable = true;
        
        folderDiv.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
        });
        
        folderDiv.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            draggedElement = null;
            // Remove drag-over class from all items
            document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
        
        folderDiv.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });
        
        folderDiv.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
        
        folderDiv.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedElement && draggedElement !== this) {
                // Get the dragged folder ID
                const draggedFolderId = draggedElement.dataset.folderId;
                const targetFolderId = this.dataset.folderId;
                
                // Update folder order
                const draggedIndex = folderOrder.indexOf(draggedFolderId);
                const targetIndex = folderOrder.indexOf(targetFolderId);
                
                // Remove dragged item from its current position
                folderOrder.splice(draggedIndex, 1);
                
                // Insert at new position
                folderOrder.splice(targetIndex, 0, draggedFolderId);
                
                // Save and update display
                saveData();
                updateContent();
            }
        });
    }

    // Update content
    function updateContent() {
        const currentSection = document.getElementById('current-gpt-display');
        const folderList = document.getElementById('folder-list');
        const recentSection = document.getElementById('recent-section');
        const recentList = document.getElementById('recent-list');
        
        if (!currentSection || !folderList) return;

        // Update recent GPTs
        if (recentGPTs.length > 0) {
            recentSection.style.display = 'block';
            recentList.innerHTML = recentGPTs.slice(0, 5).map(gpt => `
                <div class="recent-item">
                    <a href="${gpt.url}" class="recent-item-name">${gpt.name}</a>
                    <span class="recent-item-time">${timeAgo(gpt.timestamp)}</span>
                </div>
            `).join('');
        } else {
            recentSection.style.display = 'none';
        }

        // Update current GPT section
        if (currentGPT) {
            currentSection.innerHTML = `
                <div class="current-gpt-section">
                    <div class="current-gpt-name">${currentGPT.name}</div>
                    <button class="organizer-btn add-btn" id="add-to-folder-btn">Add to Folder</button>
                </div>
            `;
            
            const addBtn = document.getElementById('add-to-folder-btn');
            if (addBtn) {
                addBtn.addEventListener('click', showAddToFolderModal);
            }
        } else {
            currentSection.innerHTML = '';
        }

        // Hide folders if searching
        if (isSearchActive) {
            folderList.style.display = 'none';
            return;
        } else {
            folderList.style.display = 'block';
        }

        // Update folders list in the specified order
        folderList.innerHTML = '';
        
        // Ensure all folders are in the order array
        Object.keys(folders).forEach(folderId => {
            if (!folderOrder.includes(folderId)) {
                folderOrder.push(folderId);
            }
        });
        
        // Remove deleted folders from order
        folderOrder = folderOrder.filter(folderId => folders[folderId]);
        
        folderOrder.forEach(folderId => {
            const folder = folders[folderId];
            if (!folder) return;
            
            const folderDiv = document.createElement('div');
            folderDiv.className = 'folder-item';
            folderDiv.dataset.folderId = folderId;
            folderDiv.style.borderLeftColor = folder.color;
            folderDiv.style.borderLeftWidth = '3px';
            folderDiv.style.backgroundColor = FOLDER_COLORS.find(c => c.value === folder.color)?.bg || '#f9fafb';
            
            folderDiv.innerHTML = `
                <div class="drag-handle">⋮⋮</div>
                <div class="folder-header" style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-left: 16px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="folder-action-btn expand-btn" data-folder-id="${folderId}" title="Expand">▶</button>
                        <div class="folder-name" style="color: ${folder.color}">${folder.name}</div>
                        <span class="folder-count">${folder.gpts.length}</span>
                    </div>
                    <button class="folder-action-btn delete-btn" data-folder-id="${folderId}" title="Delete">✕</button>
                </div>
                <div class="folder-gpts" id="folder-gpts-${folderId}">
                    ${folder.gpts.map(gpt => `
                        <div class="folder-gpt-item">
                            <a href="${gpt.url}" class="folder-gpt-link">${gpt.name}</a>
                            <button class="remove-from-folder-btn" data-folder-id="${folderId}" data-gpt-id="${gpt.id}">✕</button>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Add event listeners
            const expandBtn = folderDiv.querySelector('.expand-btn');
            const folderHeader = folderDiv.querySelector('.folder-header');
            const deleteBtn = folderDiv.querySelector('.delete-btn');
            
            // Make the entire header clickable for expansion (except delete button)
            folderHeader.addEventListener('click', (e) => {
                if (e.target !== deleteBtn) {
                    toggleFolderExpansion(folderId, folderDiv);
                }
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFolder(folderId);
            });
            
            // Add event listeners for remove buttons
            folderDiv.querySelectorAll('.remove-from-folder-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const folderId = btn.dataset.folderId;
                    const gptId = btn.dataset.gptId;
                    folders[folderId].gpts = folders[folderId].gpts.filter(gpt => gpt.id !== gptId);
                    saveData();
                    updateContent();
                });
            });
            
            // Setup drag and drop
            setupDragAndDrop(folderDiv, folderId);
            
            folderList.appendChild(folderDiv);
        });
    }

    // Show create folder modal
    function showCreateFolderModal() {
        const theme = getThemeColors();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">Create New Folder</div>
                <div class="form-group">
                    <label class="form-label">Folder Name</label>
                    <input type="text" class="form-input" id="folder-name-input" placeholder="Enter folder name">
                </div>
                <div class="form-group">
                    <label class="form-label">Choose Color (${FOLDER_COLORS.length} options)</label>
                    <div class="color-options">
                        ${FOLDER_COLORS.map((color, index) => `
                            <div class="color-option ${index === 0 ? 'selected' : ''}" 
                                 style="background-color: ${color.bg}; border-color: ${color.value};"
                                 data-color="${color.value}"
                                 title="${color.name}">
                                <div style="width: 16px; height: 16px; background-color: ${color.value}; border-radius: 50%;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancel-create-btn">Cancel</button>
                    <button class="btn btn-primary" id="create-folder-submit-btn">Create</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.getElementById('folder-name-input').focus();
        
        // Add event listeners
        modal.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                modal.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        document.getElementById('create-folder-submit-btn').addEventListener('click', function() {
            const name = document.getElementById('folder-name-input').value.trim();
            const selectedColor = modal.querySelector('.color-option.selected').dataset.color;
            
            if (name) {
                const folderId = Date.now().toString();
                folders[folderId] = {
                    name: name,
                    color: selectedColor,
                    gpts: []
                };
                folderOrder.push(folderId); // Add to end of order
                saveData();
                updateContent();
                closeModal();
            }
        });
        
        document.getElementById('cancel-create-btn').addEventListener('click', closeModal);
        
        function closeModal() {
            modal.remove();
        }
    }

    // Show add to folder modal
    function showAddToFolderModal() {
        if (!currentGPT) return;
        
        const theme = getThemeColors();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">Add "${currentGPT.name}" to Folder</div>
                <div class="form-group">
                    ${folderOrder.map(folderId => {
                        const folder = folders[folderId];
                        return `
                            <div style="margin-bottom: 8px;">
                                <button class="btn btn-secondary add-gpt-btn" data-folder-id="${folderId}" style="width: 100%; text-align: left; border-left: 3px solid ${folder.color};">
                                    ${folder.name} (${folder.gpts.length} GPTs)
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancel-add-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.add-gpt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const folderId = this.dataset.folderId;
                if (!folders[folderId].gpts.find(gpt => gpt.id === currentGPT.id)) {
                    folders[folderId].gpts.push(currentGPT);
                    saveData();
                    updateContent();
                }
                closeModal();
            });
        });
        
        document.getElementById('cancel-add-btn').addEventListener('click', closeModal);
        
        function closeModal() {
            modal.remove();
        }
    }

    // Delete folder
    function deleteFolder(folderId) {
        if (confirm('Are you sure you want to delete this folder?')) {
            delete folders[folderId];
            folderOrder = folderOrder.filter(id => id !== folderId);
            saveData();
            updateContent();
        }
    }

    // Show settings modal
    function showSettingsModal() {
        const theme = getThemeColors();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">Settings</div>
                <div class="form-group">
                    <div class="theme-toggle">
                        <span>Dark Mode</span>
                        <div class="theme-switch" id="theme-switch"></div>
                    </div>
                    <button class="btn btn-secondary" id="export-btn" style="width: 100%; margin-bottom: 8px;">Export Data</button>
                    <button class="btn btn-secondary" id="import-btn" style="width: 100%; margin-bottom: 8px;">Import Data</button>
                    <button class="btn btn-secondary" id="clear-recent-btn" style="width: 100%; margin-bottom: 8px;">Clear Recent GPTs</button>
                    <button class="btn btn-danger" id="reset-btn" style="width: 100%;">Reset All Data</button>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="close-settings-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('theme-switch').addEventListener('click', function() {
            toggleDarkMode();
            closeModal();
            // Re-inject to apply theme changes
            setTimeout(injectIntoSidebar, 100);
        });
        
        document.getElementById('export-btn').addEventListener('click', function() {
            const data = JSON.stringify({ folders, folderOrder, recentGPTs, isDarkMode }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gpt-folders-backup.json';
            a.click();
            URL.revokeObjectURL(url);
        });
        
        document.getElementById('import-btn').addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            folders = importedData.folders || importedData.gptFolders || {};
                            folderOrder = importedData.folderOrder || Object.keys(folders);
                            recentGPTs = importedData.recentGPTs || [];
                            isDarkMode = importedData.isDarkMode || false;
                            saveData();
                            updateContent();
                            closeModal();
                            alert('Data imported successfully!');
                        } catch (error) {
                            alert('Error importing data. Please check the file format.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
        
        document.getElementById('clear-recent-btn').addEventListener('click', function() {
            if (confirm('Clear all recent GPTs?')) {
                recentGPTs = [];
                saveData();
                updateContent();
                closeModal();
            }
        });
        
        document.getElementById('reset-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                folders = {};
                folderOrder = [];
                recentGPTs = [];
                isDarkMode = false;
                saveData();
                updateContent();
                closeModal();
            }
        });
        
        document.getElementById('close-settings-btn').addEventListener('click', closeModal);
        
        function closeModal() {
            modal.remove();
        }
    }

    // Initialize
    function init() {
        loadData();
        detectCurrentGPT();
        setupKeyboardShortcuts();
        
        // Watch for URL changes
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(detectCurrentGPT, 1000);
            }
        }).observe(document, { subtree: true, childList: true });
        
        // Re-inject if sidebar gets removed
        setInterval(() => {
            if (!document.getElementById('gpt-organizer-section')) {
                injectIntoSidebar();
            }
        }, 2000);
    }

    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
