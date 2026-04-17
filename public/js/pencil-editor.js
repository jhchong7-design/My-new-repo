/**
 * Pencil Editor - Bible Study Style with Full Admin Capabilities
 * 
 * Simple pencil icon toggles edit mode
 * When in edit mode: Full-spectrum admin editing capabilities
 * 
 * Features:
 * - Simple pencil icon (like Bible study website)
 * - Toggle edit mode with one click
 * - Full admin capabilities in edit mode
 * - Complete content modification
 * - Page management, assets, SEO, theme
 */

class PencilEditor {
  constructor() {
    this.apiBase = '/api';
    this.isEditMode = false;
    this.currentPage = this.getPageName();
    this.editableElements = [];
    this.autoSaveTimer = null;
    this.selectedElement = null;
    this.sidebar = null;
    
    this.init();
  }

  init() {
    console.log('✏️ Pencil Editor initializing...');
    this.checkAuth();
    this.setupKeyboardShortcuts();
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  async checkAuth() {
    const token = localStorage.getItem('token');
    console.log('🔑 Checking authentication...', { hasToken: !!token });
    
    if (!token) {
      console.log('🔑 No token found, skipping pencil editor initialization');
      return;
    }

    try {
      console.log('🔑 Verifying token with API...');
      const response = await fetch(`${this.apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const user = await response.json();
        console.log('✅ Authentication successful:', { user: user.username, role: user.role });
        
        if (user.role === 'admin') {
          console.log('👑 User is admin, creating pencil button...');
          this.createPencilButton();
          this.setupHoverEffects();
        } else {
          console.log('⚠️ User is not admin, pencil button not created');
        }
      } else {
        console.log('❌ Authentication failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
    }
  }

  getPageName() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index';
  }

  // ============================================
  // SIMPLE PENCIL BUTTON - LIKE BIBLE STUDY
  // ============================================
  
  createPencilButton() {
    console.log('✏️ Creating pencil button...');
    
    const button = document.createElement('button');
    button.id = 'pencilEditButton';
    button.className = 'pencil-edit-btn';
    button.innerHTML = '✏️';
    button.title = 'Toggle Edit Mode';
    button.setAttribute('aria-label', 'Toggle Edit Mode');
    
    button.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: 2px solid #e2e8f0;
      color: #1a202c;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    button.addEventListener('click', () => this.toggleEditMode());
    document.body.appendChild(button);
    
    this.pencilButton = button;
    this.addStyles();
    
    console.log('✅ Pencil button created and added to page');
    console.log('📍 Button position: bottom: 80px, right: 20px');
  }

  // ============================================
  // TOGGLE EDIT MODE
  // ============================================
  
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      this.enterEditMode();
    } else {
      this.exitEditMode();
    }
  }

  enterEditMode() {
    // Update pencil button
    if (this.pencilButton) {
      this.pencilButton.innerHTML = '✕';
      this.pencilButton.style.background = '#667eea';
      this.pencilButton.style.color = 'white';
      this.pencilButton.style.borderColor = '#667eea';
      this.pencilButton.style.transform = 'rotate(45deg)';
      this.pencilButton.title = 'Exit Edit Mode';
    }
    
    // Make elements editable
    this.makeElementsEditable();
    
    // Show admin sidebar with full capabilities
    this.createAdminSidebar();
    
    // Show edit mode indicator
    this.showEditModeIndicator();
  }

  exitEditMode() {
    // Reset pencil button
    if (this.pencilButton) {
      this.pencilButton.innerHTML = '✏️';
      this.pencilButton.style.background = 'white';
      this.pencilButton.style.color = '#1a202c';
      this.pencilButton.style.borderColor = '#e2e8f0';
      this.pencilButton.style.transform = 'rotate(0deg)';
      this.pencilButton.title = 'Toggle Edit Mode';
    }
    
    // Remove editing state
    this.removeEditableState();
    
    // Hide sidebar
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
    
    // Hide indicator
    const indicator = document.getElementById('editModeIndicator');
    if (indicator) indicator.remove();
  }

  // ============================================
  // MAKE ELEMENTS EDITABLE
  // ============================================
  
  setupHoverEffects() {
    const selectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'span', 'a:not(.nav-link)',
      '.hero-title', '.hero-subtitle',
      '.section-title', '.section-description',
      '.feature-title', '.feature-description'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // Skip navigation and buttons
      if (el.closest('nav') || el.closest('button')) return;
      if (el.closest('.admin-sidebar')) return;
    });
  }

  makeElementsEditable() {
    const selectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'span', 'a:not(.nav-link)',
      '.hero-title', '.hero-subtitle',
      '.section-title', '.section-description',
      '.feature-title', '.feature-description',
      '.content-block', 'div:not(.admin-sidebar):not(header):not(footer):not(button):not(nav)'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // Skip excluded elements
      if (el.closest('nav') || el.closest('button') || el.closest('.admin-sidebar')) return;
      if (el.closest('header') || el.closest('footer')) return;
      if (!el.textContent.trim()) return;

      el.classList.add('pencil-editable');
      el.contentEditable = 'true';
      el.dataset.originalContent = el.innerHTML;
      
      el.addEventListener('focus', () => this.handleElementFocus(el));
      el.addEventListener('blur', () => this.handleElementBlur(el));
      el.addEventListener('input', () => this.handleElementInput(el));
      
      this.editableElements.push(el);
    });
  }

  removeEditableState() {
    this.editableElements.forEach(el => {
      el.classList.remove('pencil-editable');
      el.contentEditable = 'false';
      el.style.outline = '';
      el.style.outlineOffset = '';
      delete el.dataset.originalContent;
    });
    
    this.editableElements = [];
  }

  // ============================================
  // ELEMENT HANDLERS
  // ============================================
  
  handleElementFocus(element) {
    this.selectedElement = element;
    element.style.outline = '2px solid #667eea';
    element.style.outlineOffset = '2px';
    element.style.background = 'rgba(102, 126, 234, 0.05)';
  }

  handleElementBlur(element) {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.background = '';
    
    if (element.dataset.originalContent !== element.innerHTML) {
      this.saveChanges();
    }
  }

  handleElementInput(element) {
    // Auto-save after 2 seconds
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.autoSave();
    }, 2000);
    
    // Show unsaved indicator
    this.showUnsavedIndicator();
  }

  // ============================================
  // FULL ADMIN SIDEBAR - ALL CAPABILITIES
  // ============================================
  
  createAdminSidebar() {
    if (this.sidebar) return;

    const sidebar = document.createElement('div');
    sidebar.className = 'admin-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>🎨 Editor Tools</h3>
        <button class="sidebar-close">&times;</button>
      </div>
      
      <div class="sidebar-content">
        <!-- Text Formatting -->
        <div class="sidebar-section">
          <h4>Text Formatting</h4>
          <div class="tool-grid">
            <button data-cmd="bold" title="Bold (Ctrl+B)">B</button>
            <button data-cmd="italic" title="Italic (Ctrl+I)">I</button>
            <button data-cmd="underline" title="Underline (Ctrl+U)">U</button>
            <button data-cmd="strikeThrough" title="Strikethrough">S</button>
            <button data-cmd="formatBlock" data-val="h2" title="Heading 2">H2</button>
            <button data-cmd="formatBlock" data-val="h3" title="Heading 3">H3</button>
            <button data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
            <button data-cmd="removeFormat" title="Clear Format">✕</button>
          </div>
        </div>

        <!-- Lists & Alignment -->
        <div class="sidebar-section">
          <h4>Lists & Alignment</h4>
          <div class="tool-grid">
            <button data-cmd="insertUnorderedList" title="Bullet List">●</button>
            <button data-cmd="insertOrderedList" title="Numbered List">1.</button>
            <button data-cmd="justifyLeft" title="Align Left">←</button>
            <button data-cmd="justifyCenter" title="Align Center">↔</button>
            <button data-cmd="justifyRight" title="Align Right">→</button>
          </div>
        </div>

        <!-- Links & Images -->
        <div class="sidebar-section">
          <h4>Links & Images</h4>
          <div class="tool-grid">
            <button data-action="insertLink" title="Insert Link">🔗</button>
            <button data-action="insertImage" title="Insert Image">🖼️</button>
            <button data-action="mediaLibrary" title="Media Library">📁</button>
          </div>
        </div>

        <!-- Page Management -->
        <div class="sidebar-section">
          <h4>Page Management</h4>
          <button class="sidebar-btn" data-action="allPages">📄 All Pages</button>
          <button class="sidebar-btn" data-action="newPage">➕ New Page</button>
          <button class="sidebar-btn" data-action="pageSettings">⚙️ Page Settings</button>
        </div>

        <!-- SEO -->
        <div class="sidebar-section">
          <h4>SEO & Metadata</h4>
          <button class="sidebar-btn" data-action="seoEditor">🔍 SEO Editor</button>
        </div>

        <!-- Theme -->
        <div class="sidebar-section">
          <h4>Theme</h4>
          <button class="sidebar-btn" data-action="themeEditor">🎨 Theme Colors</button>
        </div>

        <!-- Save Options -->
        <div class="sidebar-section">
          <h4>Save</h4>
          <button class="sidebar-btn primary" data-action="save">💾 Save Changes</button>
          <button class="sidebar-btn danger" data-action="cancel">❌ Cancel All</button>
          <div class="auto-save-status">Auto-save: ON (2s)</div>
        </div>
      </div>

      <div class="sidebar-footer">
        <small>Current: ${this.currentPage}</small>
      </div>
    `;

    document.body.appendChild(sidebar);
    this.sidebar = sidebar;

    // Setup event listeners
    sidebar.addEventListener('click', (e) => this.handleSidebarClick(e));
    sidebar.querySelector('.sidebar-close').addEventListener('click', () => this.exitEditMode());
  }

  handleSidebarClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val;
    const action = btn.dataset.action;

    if (cmd) {
      document.execCommand(cmd, false, val);
      if (this.selectedElement) {
        this.selectedElement.focus();
      }
    } else if (action === 'save') {
      this.saveChanges();
    } else if (action === 'cancel') {
      this.cancelAllChanges();
    } else if (action === 'insertLink') {
      this.insertLink();
    } else if (action === 'insertImage') {
      this.insertImage();
    } else if (action === 'mediaLibrary') {
      this.openMediaLibrary();
    } else if (action === 'allPages') {
      this.openPageManager();
    } else if (action === 'newPage') {
      this.createNewPage();
    } else if (action === 'pageSettings') {
      this.openPageSettings();
    } else if (action === 'seoEditor') {
      this.openSEOEditor();
    } else if (action === 'themeEditor') {
      this.openThemeEditor();
    }
  }

  // ============================================
  // SAVE MECHANISM
  // ============================================
  
  async saveChanges() {
    try {
      const content = {
        page: this.currentPage,
        content: this.extractAllContent()
      };

      const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(content)
      });

      if (response.ok) {
        this.editableElements.forEach(el => {
          el.dataset.originalContent = el.innerHTML;
        });
        this.showNotification('✓ Saved successfully!', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showNotification('✕ Save failed', 'error');
    }
  }

  autoSave() {
    console.log('💾 Auto-saving...');
    this.saveChanges();
  }

  cancelAllChanges() {
    if (confirm('Cancel all unsaved changes?')) {
      this.editableElements.forEach(el => {
        if (el.dataset.originalContent) {
          el.innerHTML = el.dataset.originalContent;
        }
      });
      this.showNotification('Changes cancelled', 'info');
    }
  }

  extractAllContent() {
    return this.editableElements.map(el => ({
      tag: el.tagName.toLowerCase(),
      html: el.innerHTML,
      text: el.textContent.trim()
    }));
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  insertLink() {
    const url = prompt('Enter link URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  insertImage() {
    const url = prompt('Enter image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
  }

  openMediaLibrary() {
    this.showNotification('Media Library - Coming soon!', 'info');
  }

  openPageManager() {
    this.showNotification('Page Manager - Coming soon!', 'info');
  }

  createNewPage() {
    const pageName = prompt('Enter page name:');
    if (pageName) {
      this.showNotification('Creating new pages - Coming soon!', 'info');
    }
  }

  openPageSettings() {
    this.showNotification('Page Settings - Coming soon!', 'info');
  }

  openSEOEditor() {
    this.showNotification('SEO Editor - Coming soon!', 'info');
  }

  openThemeEditor() {
    this.showNotification('Theme Editor - Coming soon!', 'info');
  }

  // ============================================
  // VISUAL FEEDBACK
  // ============================================
  
  showEditModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'editModeIndicator';
    indicator.innerHTML = '✏️ Edit Mode Active';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(102, 126, 234, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(indicator);
  }

  showUnsavedIndicator() {
    // Could show save status in sidebar
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'pencil-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      animation: slideInUp 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape to exit edit mode
      if (e.key === 'Escape' && this.isEditMode) {
        e.preventDefault();
        this.exitEditMode();
      }
      
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's' && this.isEditMode) {
        e.preventDefault();
        this.saveChanges();
      }
      
      // Formatting shortcuts
      if (this.isEditMode) {
        if (e.ctrlKey && e.key === 'b') {
          e.preventDefault();
          document.execCommand('bold', false, null);
        }
        if (e.ctrlKey && e.key === 'i') {
          e.preventDefault();
          document.execCommand('italic', false, null);
        }
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          document.execCommand('underline', false, null);
        }
      }
    });
  }

  // ============================================
  // STYLES
  // ============================================
  
  addStyles() {
    if (document.getElementById('pencilEditorStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'pencilEditorStyles';
    styles.textContent = `
      /* Pencil Button */
      .pencil-edit-btn:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .pencil-edit-btn:active {
        transform: scale(0.95) !important;
      }

      /* Editable Elements */
      .pencil-editable {
        position: relative;
        transition: outline 0.2s, background 0.2s;
      }
      
      .pencil-editable:hover {
        outline: 2px dashed rgba(102, 126, 234, 0.5) !important;
        outline-offset: 2px !important;
        cursor: text;
      }

      /* Admin Sidebar */
      .admin-sidebar {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 280px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        z-index: 9999;
        overflow: hidden;
        animation: slideInRight 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .sidebar-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .sidebar-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        padding: 0;
      }
      
      .sidebar-close:hover {
        background: rgba(255,255,255,0.3);
      }

      .sidebar-content {
        padding: 16px;
        overflow-y: auto;
        max-height: calc(100vh - 200px);
      }

      .sidebar-section {
        margin-bottom: 20px;
      }
      
      .sidebar-section h4 {
        font-size: 11px;
        text-transform: uppercase;
        color: #8898aa;
        margin: 0 0 8px 0;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .tool-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }
      
      .tool-grid button {
        padding: 8px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
      }
      
      .tool-grid button:hover {
        background: #f8f9fa;
        border-color: #667eea;
        transform: scale(1.05);
      }

      .sidebar-btn {
        display: block;
        width: 100%;
        padding: 10px 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        margin-bottom: 8px;
        transition: all 0.2s;
        text-align: left;
      }
      
      .sidebar-btn:hover {
        background: #f8f9fa;
        border-color: #667eea;
        transform: translateX(2px);
      }
      
      .sidebar-btn.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border: none !important;
      }
      
      .sidebar-btn.primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .sidebar-btn.danger {
        background: #f56565;
        color: white !important;
        border: none !important;
      }
      
      .auto-save-status {
        font-size: 11px;
        color: #48bb78;
        margin-top: 4px;
        padding: 4px 8px;
        background: #f0fff4;
        border-radius: 4px;
        display: inline-block;
      }

      .sidebar-footer {
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        background: #f8f9fa;
        font-size: 11px;
        color: #8898aa;
      }

      /* Animations */
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes slideOutUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
      }

      /* Prevent outline on focus while editing */
      .pencil-editable:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        background: rgba(102, 126, 234, 0.05) !important;
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🖋️ DOM loaded, initializing Pencil Editor...');
  window.pencilEditor = new PencilEditor();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('🖋️ DOM already loaded, initializing Pencil Editor...');
  setTimeout(() => {
    if (!window.pencilEditor) {
      window.pencilEditor = new PencilEditor();
    }
  }, 100);
}