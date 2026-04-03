/**
 * Universal Admin Frontend Editor System
 * Whole-platform live editing that works across ALL pages
 * Features:
 * - Universal edit mode activation on any page
 * - Page-aware editing with automatic detection
 * - Global admin toolbar with all tools
 * - Asset library browser
 * - Page management (create/edit/delete)
 * - SEO & metadata editing
 * - Live preview before publishing
 * - Auto-save with manual override
 * - Keyboard shortcuts
 */

class UniversalAdminEditor {
  constructor() {
    this.apiBase = '/api';
    this.isEditMode = false;
    this.currentPage = this.detectCurrentPage();
    this.currentEditElement = null;
    this.editableElements = [];
    this.hasUnsavedChanges = false;
    this.lastSavedContent = {};
    this.history = [];
    this.historyIndex = -1;
    
    this.init();
  }

  init() {
    console.log('🚀 Universal Admin Editor initializing...');
    this.checkAdminStatus();
    this.setupKeyboardShortcuts();
    this.observeContentChanges();
    this.createGlobalToolbar();
    this.createPageManager();
    this.createAssetLibrary();
    this.createSEOPanel();
  }

  // ============================================
  // PAGE DETECTION
  // ============================================
  
  detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index';
    return filename.replace('.html', '');
  }

  // ============================================
  // ADMIN AUTHENTICATION
  // ============================================
  
  async checkAdminStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const user = await response.json();
        if (user.role === 'admin') {
          console.log('✅ Admin authenticated, enabling editing tools');
          this.enableAdminMode();
        }
      }
    } catch (error) {
      console.error('Admin check failed:', error);
    }
  }

  enableAdminMode() {
    this.showAdminIndicator();
    this.addEditButtonToNavigation();
    this.preloadInitialContent();
  }

  // ============================================
  // GLOBAL ADMIN TOOLBAR
  // ============================================
  
  createGlobalToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'universalAdminToolbar';
    toolbar.className = 'universal-admin-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-header">
        <span class="toolbar-title">✏️ Admin Panel</span>
        <button class="toolbar-toggle" data-action="toggle">−</button>
      </div>
      
      <div class="toolbar-content">
        <div class="current-page-indicator">
          <span class="page-label">Current Page:</span>
          <span class="page-name" id="currentPageName">${this.currentPage}</span>
        </div>

        <div class="toolbar-section">
          <h4>Edit Mode</h4>
          <button class="toolbar-btn btn-primary" data-action="toggleEdit">
            🎨 Edit This Page
          </button>
          <button class="toolbar-btn" data-action="preview">
            👁️ Preview Changes
          </button>
        </div>

        <div class="toolbar-section">
          <h4>Save Options</h4>
          <button class="toolbar-btn btn-success" data-action="save">
            💾 Save Changes
          </button>
          <button class="toolbar-btn btn-danger" data-action="cancel">
            ❌ Cancel
          </button>
          <div class="auto-save-status" id="autoSaveStatus">Auto-save: ON</div>
        </div>

        <div class="toolbar-section">
          <h4>Page Management</h4>
          <button class="toolbar-btn" data-action="pageManager">
            📄 All Pages
          </button>
          <button class="toolbar-btn" data-action="newPage">
            ➕ New Page
          </button>
        </div>

        <div class="toolbar-section">
          <h4>Assets</h4>
          <button class="toolbar-btn" data-action="assetLibrary">
            🖼️ Media Library
          </button>
          <button class="toolbar-btn" data-action="uploadImage">
            📤 Upload Image
          </button>
        </div>

        <div class="toolbar-section">
          <h4>SEO & Settings</h4>
          <button class="toolbar-btn" data-action="seoPanel">
            🔍 SEO Settings
          </button>
          <button class="toolbar-btn" data-action="themeEditor">
            🎨 Theme Colors
          </button>
        </div>

        <div class="toolbar-section">
          <h4>History</h4>
          <button class="toolbar-btn" data-action="undo" id="undoBtn" disabled>
            ↩️ Undo
          </button>
          <button class="toolbar-btn" data-action="redo" id="redoBtn" disabled>
            ↪️ Redo
          </button>
        </div>

        <div class="keyboard-shortcuts">
          <small>Shortcuts: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo)</small>
        </div>
      </div>
    `;

    toolbar.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 90vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    `;

    document.body.appendChild(toolbar);

    // Add toolbar styles
    this.addToolbarStyles();

    // Setup event listeners
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.toolbar-btn, .toolbar-toggle');
      if (btn) {
        const action = btn.dataset.action;
        if (action) this.handleToolbarAction(action, btn);
      }
    });

    // Store toolbar reference
    this.toolbar = toolbar;
  }

  addToolbarStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      .universal-admin-toolbar {
        animation: slideInRight 0.3s ease-out;
      }
      
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .toolbar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
      }

      .toolbar-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        padding: 0;
      }
      
      .toolbar-toggle:hover {
        background: rgba(255,255,255,0.3);
      }

      .toolbar-content {
        padding: 16px;
        overflow-y: auto;
        max-height: calc(90vh - 70px);
      }

      .current-page-indicator {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 13px;
      }

      .page-name {
        font-weight: 600;
        color: #667eea;
      }

      .toolbar-section {
        margin-bottom: 20px;
      }

      .toolbar-section h4 {
        font-size: 11px;
        text-transform: uppercase;
        color: #8898aa;
        margin: 0 0 8px 0;
        letter-spacing: 0.5px;
      }

      .toolbar-btn {
        display: block;
        width: 100%;
        padding: 10px 16px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        text-align: left;
      }

      .toolbar-btn:hover:not(:disabled) {
        background: #f8f9fa;
        border-color: #667eea;
        transform: translateX(2px);
      }

      .toolbar-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border: none !important;
      }

      .btn-primary:hover {
        transform: translateX(2px) scale(1.02);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .btn-success {
        background: #48bb78;
        color: white !important;
        border: none !important;
      }

      .btn-danger {
        background: #f56565;
        color: white !important;
        border: none !important;
      }

      .auto-save-status {
        font-size: 12px;
        color: #48bb78;
        margin-top: 4px;
        padding: 4px 8px;
        background: #f0fff4;
        border-radius: 4px;
        display: inline-block;
      }

      .keyboard-shortcuts {
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        color: #8898aa;
        font-size: 11px;
      }
    `;
    document.head.appendChild(styles);
  }

  // ============================================
  // EDIT MODE HANDLING
  // ============================================
  
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    const editBtn = document.querySelector('[data-action="toggleEdit"]');
    if (editBtn) {
      editBtn.textContent = this.isEditMode ? '✅ Exit Edit Mode' : '🎨 Edit This Page';
      editBtn.classList.toggle('btn-primary', !this.isEditMode);
      editBtn.classList.toggle('btn-danger', this.isEditMode);
    }

    if (this.isEditMode) {
      this.makeAllContentEditable();
      this.showRichTextToolbar();
    } else {
      this.disableEditing();
      this.hideRichTextToolbar();
    }
  }

  makeAllContentEditable() {
    // Find all editable elements on the page
    const editableSelectors = [
      'h1, h2, h3, h4, h5, h6',
      'p',
      'li',
      'span',
      'a:not(.toolbar-btn)',
      '.hero-title',
      '.hero-subtitle',
      '.feature-title',
      '.feature-description',
      '.content-block',
      '.section-title',
      '.section-description'
    ];

    const elements = document.querySelectorAll(editableSelectors.join(','));
    
    elements.forEach(el => {
      // Skip if already marked
      if (el.classList.contains('editable')) return;
      
      // Skip navigation links and buttons
      if (el.closest('nav') || el.closest('button')) return;
      
      // Skip already editable elements
      if (el.contentEditable === 'true') return;

      el.classList.add('editable');
      el.dataset.originalContent = el.innerHTML;
      el.dataset.editableKey = this.generateEditableKey(el);
      
      el.addEventListener('focus', () => this.handleElementFocus(el));
      el.addEventListener('blur', () => this.handleElementBlur(el));
      el.addEventListener('input', () => this.handleElementChange(el));
      
      this.editableElements.push(el);
    });

    this.addEditableStyles();
  }

  generateEditableKey(element) {
    // Create a unique identifier for each editable element
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList).join('.');
    const id = element.id || '';
    const index = Array.from(element.parentElement.children).indexOf(element);
    
    return `${tag}${id ? '#' + id : ''}${classes ? '.' + classes : ''}[${index}]`;
  }

  addEditableStyles() {
    if (document.getElementById('editableStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'editableStyles';
    styles.textContent = `
      .editable {
        position: relative;
        outline: none;
        cursor: text;
      }
      
      .editable::after {
        content: '✏️';
        position: absolute;
        top: -15px;
        right: 0;
        background: #667eea;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }
      
      .editable:hover::after {
        opacity: 1;
      }
      
      .editable:focus {
        background: rgba(102, 126, 234, 0.05);
        border-radius: 4px;
      }
      
      .editable:focus::after {
        opacity: 1;
        content: 'Editing...';
      }
      
      .has-unsaved-changes {
        border: 2px dashed #48bb78 !important;
      }
    `;
    document.head.appendChild(styles);
  }

  disableEditing() {
    this.editableElements.forEach(el => {
      el.classList.remove('editable');
      el.removeAttribute('contentEditable');
      delete el.dataset.originalContent;
      delete el.dataset.editableKey;
    });
    
    this.editableElements = [];
    const styles = document.getElementById('editableStyles');
    if (styles) styles.remove();
  }

  // ============================================
  // ELEMENT EVENT HANDLERS
  // ============================================
  
  handleElementFocus(element) {
    this.currentEditElement = element;
    this.saveToHistory();
  }

  handleElementBlur(element) {
    if (element.dataset.originalContent !== element.innerHTML) {
      this.hasUnsavedChanges = true;
      element.classList.add('has-unsaved-changes');
    }
  }

  handleElementChange(element) {
    this.hasUnsavedChanges = true;
    
    // Debounce auto-save
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.autoSave();
    }, 2000);
  }

  // ============================================
  // SAVE & AUTO-SAVE
  // ============================================
  
  async saveChanges() {
    if (!this.hasUnsavedChanges) {
      this.showNotification('No changes to save', 'info');
      return;
    }

    try {
      const pageContent = this.extractPageContent();
      
      const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          page: this.currentPage,
          content: pageContent
        })
      });

      if (response.ok) {
        this.lastSavedContent = pageContent;
        this.hasUnsavedChanges = false;
        this.editableElements.forEach(el => {
          el.classList.remove('has-unsaved-changes');
          el.dataset.originalContent = el.innerHTML;
        });
        this.showNotification('Changes saved successfully!', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showNotification('Failed to save changes', 'error');
    }
  }

  autoSave() {
    if (!this.hasUnsavedChanges) return;
    
    console.log('🔄 Auto-saving...');
    this.saveChanges();
  }

  extractPageContent() {
    const content = [];
    
    this.editableElements.forEach(el => {
      content.push({
        key: el.dataset.editableKey,
        tag: el.tagName.toLowerCase(),
        html: el.innerHTML,
        text: el.textContent.trim()
      });
    });
    
    return content;
  }

  cancelChanges() {
    if (!this.hasUnsavedChanges) return;
    
    if (confirm('Are you sure you want to cancel all unsaved changes?')) {
      this.editableElements.forEach(el => {
        if (el.dataset.originalContent) {
          el.innerHTML = el.dataset.originalContent;
          el.classList.remove('has-unsaved-changes');
        }
      });
      
      this.hasUnsavedChanges = false;
      this.showNotification('Changes cancelled', 'info');
    }
  }

  // ============================================
  // HISTORY SYSTEM (UNDO/REDO)
  // ============================================
  
  saveToHistory() {
    const state = this.extractPageContent();
    
    // Remove any future states if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(state);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
    
    this.updateHistoryButtons();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreHistoryState(this.history[this.historyIndex]);
      this.updateHistoryButtons();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreHistoryState(this.history[this.historyIndex]);
      this.updateHistoryButtons();
    }
  }

  restoreHistoryState(state) {
    // Create a map of keys to content
    const contentMap = new Map();
    state.forEach(item => {
      contentMap.set(item.key, item.html);
    });
    
    // Restore each editable element
    this.editableElements.forEach(el => {
      const key = el.dataset.editableKey;
      if (contentMap.has(key)) {
        el.innerHTML = contentMap.get(key);
      }
    });
    
    this.hasUnsavedChanges = true;
  }

  updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }

  // ============================================
  // RICH TEXT TOOLBAR
  // ============================================
  
  showRichTextToolbar() {
    if (document.getElementById('richTextToolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'richTextToolbar';
    toolbar.className = 'rich-text-toolbar';
    toolbar.innerHTML = `
      <button data-command="bold" title="Bold (Ctrl+B)"><b>B</b></button>
      <button data-command="italic" title="Italic (Ctrl+I)"><i>I</i></button>
      <button data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
      <span class="toolbar-divider"></span>
      <button data-command="formatBlock" data-value="h2" title="Heading"><b>H2</b></button>
      <button data-command="formatBlock" data-value="h3" title="Subheading"><b>H3</b></button>
      <button data-command="formatBlock" data-value="p" title="Paragraph"><b>P</b></button>
      <span class="toolbar-divider"></span>
      <button data-command="insertUnorderedList" title="Bullet List">●</button>
      <button data-command="insertOrderedList" title="Numbered List">1.</button>
      <span class="toolbar-divider"></span>
      <button data-command="justifyLeft" title="Align Left">←</button>
      <button data-command="justifyCenter" title="Align Center">↔</button>
      <button data-command="justifyRight" title="Align Right">→</button>
      <span class="toolbar-divider"></span>
      <button data-action="insertLink" title="Insert Link">🔗</button>
      <button data-action="insertImage" title="Insert Image">🖼️</button>
      <button data-command="removeFormat" title="Clear Format">✕</button>
    `;

    toolbar.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 12px;
      display: flex;
      gap: 8px;
      z-index: 10001;
      animation: slideUp 0.3s ease-out;
    `;

    document.body.appendChild(toolbar);

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }

      .rich-text-toolbar button {
        padding: 8px 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .rich-text-toolbar button:hover {
        background: #f8f9fa;
        border-color: #667eea;
      }

      .toolbar-divider {
        width: 1px;
        background: #e2e8f0;
        margin: 0 4px;
      }
    `;
    document.head.appendChild(styles);

    // Setup event listeners
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const command = btn.dataset.command;
      const value = btn.dataset.value;
      const action = btn.dataset.action;

      if (command) {
        document.execCommand(command, false, value);
      } else if (action === 'insertLink') {
        this.insertLink();
      } else if (action === 'insertImage') {
        this.insertImage();
      }
    });
  }

  hideRichTextToolbar() {
    const toolbar = document.getElementById('richTextToolbar');
    if (toolbar) toolbar.remove();
  }

  insertLink() {
    const url = prompt('Enter link URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  insertImage() {
    document.querySelector('[data-action="assetLibrary"]')?.click();
  }

  // ============================================
  // PAGE MANAGER
  // ============================================
  
  createPageManager() {
    // Placeholder - will be expanded
    console.log('Page manager ready');
  }

  showPageManager() {
    const modal = this.createModal();
    modal.innerHTML = `
      <div class="modal-header">
        <h3>📄 Page Manager</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="page-list" id="pageList">
          <div class="loading">Loading pages...</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-action="newPage">➕ New Page</button>
        <button class="btn" data-action="close">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadPageList();
  }

  async loadPageList() {
    try {
      const response = await fetch(`${this.apiBase}/content/pages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const pages = await response.json();
        this.renderPageList(pages);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  }

  renderPageList(pages) {
    const container = document.getElementById('pageList');
    if (!container) return;

    container.innerHTML = pages.map(page => `
      <div class="page-item ${page.slug === this.currentPage ? 'active' : ''}">
        <div class="page-info">
          <span class="page-name">${page.title || page.slug}</span>
          <span class="page-slug">${page.slug}.html</span>
        </div>
        <div class="page-actions">
          <button class="page-action-btn" data-action="editPage" data-slug="${page.slug}" title="Edit">
            ✏️
          </button>
          <button class="page-action-btn" data-action="viewPage" data-slug="${page.slug}" title="View">
            👁️
          </button>
          <button class="page-action-btn danger" data-action="deletePage" data-slug="${page.slug}" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Add styles
    if (!document.getElementById('pageManagerStyles')) {
      const styles = document.createElement('style');
      styles.id = 'pageManagerStyles';
      styles.textContent = `
        .page-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .page-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }
        
        .page-item:hover {
          background: #f8f9fa;
        }
        
        .page-item.active {
          background: rgba(102, 126, 234, 0.1);
          border-left: 3px solid #667eea;
        }
        
        .page-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .page-name {
          font-weight: 600;
        }
        
        .page-slug {
          font-size: 12px;
          color: #8898aa;
        }
        
        .page-actions {
          display: flex;
          gap: 8px;
        }
        
        .page-action-btn {
          padding: 6px 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .page-action-btn:hover {
          border-color: #667eea;
          transform: scale(1.1);
        }
        
        .page-action-btn.danger:hover {
          background: #fef2f2;
          border-color: #f56565;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // ============================================
  // ASSET LIBRARY
  // ============================================
  
  createAssetLibrary() {
    console.log('Asset library ready');
  }

  showAssetLibrary() {
    const modal = this.createModal();
    modal.innerHTML = `
      <div class="modal-header">
        <h3>🖼️ Media Library</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="asset-upload-zone" id="assetUploadZone">
          <div class="upload-placeholder">
            <span class="upload-icon">📤</span>
            <p>Drop images here or click to upload</p>
            <input type="file" id="assetFileInput" multiple accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="asset-grid" id="assetGrid">
          <div class="loading">Loading assets...</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-action="insertSelected">Insert Selected</button>
        <button class="btn" data-action="close">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadAssets();
    this.setupAssetUpload();
  }

  async loadAssets() {
    try {
      const response = await fetch(`${this.apiBase}/media`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const assets = await response.json();
        this.renderAssetGrid(assets);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }

  renderAssetGrid(assets) {
    const container = document.getElementById('assetGrid');
    if (!container) return;

    if (!assets || assets.length === 0) {
      container.innerHTML = '<div class="no-assets">No images found. Upload some to get started!</div>';
      return;
    }

    container.innerHTML = assets.map(asset => `
      <div class="asset-item" data-url="${asset.url}" data-id="${asset._id}">
        <img src="${asset.url}" alt="${asset.name || 'Image'}" loading="lazy">
        <div class="asset-overlay">
          <button class="asset-select-btn" data-action="selectAsset" data-url="${asset.url}">✓</button>
        </div>
      </div>
    `).join('');

    // Add styles
    if (!document.getElementById('assetLibraryStyles')) {
      const styles = document.createElement('style');
      styles.id = 'assetLibraryStyles';
      styles.textContent = `
        .asset-upload-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .asset-upload-zone:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }
        
        .upload-placeholder {
          color: #8898aa;
        }
        
        .upload-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }
        
        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .asset-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .asset-item:hover {
          transform: scale(1.05);
        }
        
        .asset-item.selected {
          border-color: #667eea;
        }
        
        .asset-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .asset-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .asset-item:hover .asset-overlay {
          opacity: 1;
        }
        
        .asset-select-btn {
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }
        
        .no-assets {
          text-align: center;
          color: #8898aa;
          padding: 40px 20px;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  setupAssetUpload() {
    const uploadZone = document.getElementById('assetUploadZone');
    const fileInput = document.getElementById('assetFileInput');

    if (!uploadZone || !fileInput) return;

    uploadZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadAssets(e.target.files);
      }
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#667eea';
      uploadZone.style.background = 'rgba(102, 126, 234, 0.1)';
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = '#e2e8f0';
      uploadZone.style.background = '';
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#e2e8f0';
      uploadZone.style.background = '';
      
      if (e.dataTransfer.files.length > 0) {
        this.uploadAssets(e.dataTransfer.files);
      }
    });
  }

  async uploadAssets(files) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${this.apiBase}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        this.showNotification('Images uploaded successfully!', 'success');
        this.loadAssets();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.showNotification('Failed to upload images', 'error');
    }
  }

  insertImageAtCursor(url) {
    if (this.currentEditElement) {
      document.execCommand('insertImage', false, url);
    }
  }

  // ============================================
  // SEO PANEL
  // ============================================
  
  createSEOPanel() {
    console.log('SEO panel ready');
  }

  showSEOPanel() {
    const modal = this.createModal();
    
    // Get current page metadata
    const currentTitle = document.title;
    const currentMetaDesc = document.querySelector('meta[name="description"]')?.content || '';
    
    modal.innerHTML = `
      <div class="modal-header">
        <h3>🔍 SEO Settings for ${this.currentPage}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Page Title</label>
          <input type="text" id="seoTitle" value="${currentTitle}" class="form-control" placeholder="Enter page title">
          <small class="text-muted">Recommended: 50-60 characters</small>
        </div>
        
        <div class="form-group">
          <label>Meta Description</label>
          <textarea id="seoDescription" class="form-control" rows="3" placeholder="Enter meta description">${currentMetaDesc}</textarea>
          <small class="text-muted">Recommended: 150-160 characters</small>
        </div>
        
        <div class="form-group">
          <label>Meta Keywords</label>
          <input type="text" id="seoKeywords" class="form-control" placeholder="Enter keywords separated by commas">
        </div>
        
        <div class="seo-preview">
          <label>Google Preview</label>
          <div class="google-preview">
            <div class="google-title">${currentTitle}</div>
            <div class="google-url">${window.location.href}</div>
            <div class="google-desc">${currentMetaDesc || 'No description available.'}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-action="saveSEO">Save SEO Settings</button>
        <button class="btn" data-action="close">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.setupSEOListeners();
  }

  setupSEOListeners() {
    const titleInput = document.getElementById('seoTitle');
    const descInput = document.getElementById('seoDescription');
    const googleTitle = document.querySelector('.google-title');
    const googleDesc = document.querySelector('.google-desc');

    const updatePreview = () => {
      if (googleTitle) googleTitle.textContent = titleInput?.value || '';
      if (googleDesc) googleDesc.textContent = descInput?.value || 'No description available.';
    };

    titleInput?.addEventListener('input', updatePreview);
    descInput?.addEventListener('input', updatePreview);
  }

  // ============================================
  // THEME EDITOR
  // ============================================
  
  showThemeEditor() {
    const modal = this.createModal();
    const computedStyles = getComputedStyle(document.documentElement);
    
    const primaryColor = computedStyles.getPropertyValue('--primary-color').trim();
    const accentColor = computedStyles.getPropertyValue('--accent-color').trim();
    const textColor = computedStyles.getPropertyValue('--text-color').trim();
    const bgColor = computedStyles.getPropertyValue('--bg-color').trim();

    modal.innerHTML = `
      <div class="modal-header">
        <h3>🎨 Theme Colors</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Primary Color</label>
          <input type="color" id="themePrimary" value="${primaryColor || '#667eea'}" class="color-picker">
        </div>
        
        <div class="form-group">
          <label>Accent Color</label>
          <input type="color" id="themeAccent" value="${accentColor || '#764ba2'}" class="color-picker">
        </div>
        
        <div class="form-group">
          <label>Text Color</label>
          <input type="color" id="themeText" value="${textColor || '#1a202c'}" class="color-picker">
        </div>
        
        <div class="form-group">
          <label>Background Color</label>
          <input type="color" id="themeBg" value="${bgColor || '#ffffff'}" class="color-picker">
        </div>
        
        <div class="theme-preview">
          <label>Preview</label>
          <div class="preview-box">
            <h3>Sample Heading</h3>
            <p>Sample paragraph text.</p>
            <button class="btn-primary">Sample Button</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-action="saveTheme">Save Theme</button>
        <button class="btn" data-action="close">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.setupThemeListeners();
  }

  setupThemeListeners() {
    const inputs = ['themePrimary', 'themeAccent', 'themeText', 'themeBg'];
    
    inputs.forEach(id => {
      const input = document.getElementById(id);
      input?.addEventListener('input', () => {
        this.updateThemePreview();
      });
    });
  }

  updateThemePreview() {
    const primary = document.getElementById('themePrimary')?.value;
    const accent = document.getElementById('themeAccent')?.value;
    const text = document.getElementById('themeText')?.value;
    const bg = document.getElementById('themeBg')?.value;

    const preview = document.querySelector('.preview-box');
    if (preview) {
      preview.style.setProperty('--primary-color', primary);
      preview.style.setProperty('--accent-color', accent);
      preview.style.color = text;
      preview.style.background = bg;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  createModal() {
    const existing = document.querySelector('.universal-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'universal-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content"></div>
    `;

    // Add modal styles
    if (!document.getElementById('modalStyles')) {
      const styles = document.createElement('style');
      styles.id = 'modalStyles';
      styles.textContent = `
        .universal-modal {
          position: fixed;
          inset: 0;
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          cursor: pointer;
        }
        
        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          width: 600px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #8898aa;
          width: 32px;
          height: 32px;
          line-height: 1;
        }
        
        .modal-close:hover {
          color: #1a202c;
        }
        
        .modal-body {
          padding: 24px;
          max-height: calc(90vh - 180px);
          overflow-y: auto;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8f9fa;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
        }
        
        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .color-picker {
          height: 48px;
          cursor: pointer;
        }
        
        .text-muted {
          color: #8898aa;
          font-size: 12px;
        }
        
        .seo-preview,
        .theme-preview {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        
        .google-preview {
          background: #f8f9fa;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .google-title {
          color: #1a0dab;
          font-size: 18px;
          margin-bottom: 4px;
          font-weight: 400;
        }
        
        .google-url {
          color: #006621;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .google-desc {
          color: #545454;
          font-size: 14px;
        }
        
        .preview-box {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          border: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .loading {
          text-align: center;
          padding: 40px 20px;
          color: #8898aa;
        }
      `;
      document.head.appendChild(styles);
    }

    return modal;
  }

  closeModal() {
    const modal = document.querySelector('.universal-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 14px;
      z-index: 10003;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    const colors = {
      success: '#48bb78',
      error: '#f56565',
      info: '#667eea',
      warning: '#ed8936'
    };
    
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showAdminIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'adminIndicator';
    indicator.innerHTML = '🛡️ Admin Mode';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      animation: slideInLeft 0.3s ease-out;
    `;
    document.body.appendChild(indicator);
  }

  addEditButtonToNavigation() {
    // Find navigation and add edit button
    const nav = document.querySelector('nav');
    if (nav) {
      const editBtn = document.createElement('a');
      editBtn.href = '#';
      editBtn.className = 'nav-edit-btn';
      editBtn.innerHTML = '✏️ Edit';
      editBtn.style.cssText = `
        color: #667eea !important;
        font-weight: 600;
      `;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleEditMode();
      });
      nav.appendChild(editBtn);
    }
  }

  async preloadInitialContent() {
    try {
      const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`);
      
      if (response.ok) {
        const content = await response.json();
        this.lastSavedContent = content;
      }
    } catch (error) {
      console.error('Failed to preload content:', error);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveChanges();
      }
      
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      
      // Ctrl+Y - Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
      
      // Escape - Exit edit mode
      if (e.key === 'Escape' && this.isEditMode) {
        this.toggleEditMode();
      }
    });
  }

  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (this.isEditMode && mutation.type === 'childList') {
          this.hasUnsavedChanges = true;
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // TOOLBAR ACTION HANDLER
  // ============================================
  
  handleToolbarAction(action, btn) {
    switch (action) {
      case 'toggle':
        this.toggleToolbar();
        break;
      case 'toggleEdit':
        this.toggleEditMode();
        break;
      case 'save':
        this.saveChanges();
        break;
      case 'cancel':
        this.cancelChanges();
        break;
      case 'preview':
        this.previewChanges();
        break;
      case 'pageManager':
        this.showPageManager();
        break;
      case 'newPage':
        this.createNewPage();
        break;
      case 'assetLibrary':
        this.showAssetLibrary();
        break;
      case 'uploadImage':
        this.triggerImageUpload();
        break;
      case 'seoPanel':
        this.showSEOPanel();
        break;
      case 'themeEditor':
        this.showThemeEditor();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'close':
        this.closeModal();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  toggleToolbar() {
    const content = this.toolbar.querySelector('.toolbar-content');
    const toggle = this.toolbar.querySelector('.toolbar-toggle');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '−';
    } else {
      content.style.display = 'none';
      toggle.textContent = '+';
    }
  }

  previewChanges() {
    // Toggle preview mode
    this.toggleEditMode();
    this.showNotification('Preview mode - Changes not saved', 'info');
  }

  createNewPage() {
    const pageName = prompt('Enter page name (will be slug):');
    if (pageName) {
      const slug = pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      window.location.href = `/${slug}.html`;
    }
  }

  triggerImageUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.uploadAssets(e.target.files);
      }
    });
    fileInput.click();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.universalAdminEditor = new UniversalAdminEditor();
});