// GPT Organizer Chrome Extension - Enhanced Version
// Features: Color coding, compact interface, collapsible header, drag-and-drop reordering

(function() {
    'use strict';

    // Color options for folders (expanded to 20 colors)
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

    let isCollapsed = false;
    let folders = {};
    let folderOrder = []; // New: track folder order
    let currentGPT = null;
    let draggedElement = null;

    // Load data from storage
    function loadData() {
        chrome.storage.sync.get(['gptFolders', 'folderOrder', 'headerCollapsed'], function(result) {
            folders = result.gptFolders || {};
            folderOrder = result.folderOrder || Object.keys(folders);
            isCollapsed = result.headerCollapsed || false;
            injectIntoSidebar();
        });
    }

    // Save data to storage
    function saveData() {
        chrome.storage.sync.set({
            gptFolders: folders,
            folderOrder: folderOrder,
            headerCollapsed: isCollapsed
        });
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
                url: url
            };
        } else {
            currentGPT = null;
        }
        
        injectIntoSidebar();
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

        // Create organizer section
        const organizerSection = document.createElement('div');
        organizerSection.id = 'gpt-organizer-section';
        organizerSection.innerHTML = `
            <style>
                #gpt-organizer-section {
                    border-top: 1px solid #e5e7eb;
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
                    color: #374151;
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }
                
                .gpt-organizer-header:hover {
                    background-color: #f3f4f6;
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
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    transition: all 0.2s;
                    min-height: 28px;
                    width: 100%;
                    box-sizing: border-box;
                    display: block;
                    cursor: move;
                    position: relative;
                }
                
                .folder-item:hover {
                    border-color: #d1d5db;
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
                    color: #6b7280;
                    background: #f3f4f6;
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
                    color: #6b7280;
                }
                
                .folder-action-btn:hover {
                    background: #f3f4f6;
                    color: #374151;
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
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    width: 100% !important;
                    box-sizing: border-box;
                    position: relative;
                    display: block;
                    margin-left: 0;
                    margin-right: 0;
                }
                
                .folder-gpt-item:hover {
                    background: #e9ecef;
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
                    color: #9ca3af;
                    font-size: 12px;
                    cursor: move;
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
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90vw;
                }
                
                .modal-header {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                
                .form-group {
                    margin-bottom: 16px;
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
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 13px;
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
                    margin-top: 20px;
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
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .btn-secondary:hover {
                    background: #e5e7eb;
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
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-top: 8px;
                }
                
                .gpt-item {
                    padding: 8px 12px;
                    border-bottom: 1px solid #f3f4f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                }
                
                .gpt-item:last-child {
                    border-bottom: none;
                }
                
                .gpt-item:hover {
                    background: #f9fafb;
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
            </style>
            
            <div class="gpt-organizer-header" id="organizer-header">
                <span>📁 My GPT Folders</span>
                <span class="organizer-caret ${isCollapsed ? 'collapsed' : ''}">▼</span>
            </div>
            
            <div class="gpt-organizer-content ${isCollapsed ? 'collapsed' : ''}">
                <div id="current-gpt-display"></div>
                <div class="folder-list" id="folder-list"></div>
                <button class="organizer-btn" id="create-folder-btn">+ Create Folder</button>
                <button class="organizer-btn settings-btn" id="settings-btn">⚙️ Settings</button>
            </div>
        `;

        // Insert at the top of the sidebar
        sidebar.insertBefore(organizerSection, sidebar.firstChild);

        // Add event listeners
        document.getElementById('organizer-header').addEventListener('click', toggleCollapse);
        document.getElementById('create-folder-btn').addEventListener('click', showCreateFolderModal);
        document.getElementById('settings-btn').addEventListener('click', showSettingsModal);

        updateContent();
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
        
        if (!currentSection || !folderList) return;

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
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">Settings</div>
                <div class="form-group">
                    <button class="btn btn-secondary" id="export-btn" style="width: 100%; margin-bottom: 8px;">Export Data</button>
                    <button class="btn btn-secondary" id="import-btn" style="width: 100%; margin-bottom: 8px;">Import Data</button>
                    <button class="btn btn-danger" id="reset-btn" style="width: 100%;">Reset All Data</button>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="close-settings-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('export-btn').addEventListener('click', function() {
            const data = JSON.stringify({ folders, folderOrder }, null, 2);
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
        
        document.getElementById('reset-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                folders = {};
                folderOrder = [];
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
