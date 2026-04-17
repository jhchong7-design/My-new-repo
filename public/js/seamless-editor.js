/**
 * Seamless Editor - Bible Study Style
 * Ultra-simple, integrated editing that feels native to the page
 * 
 * Features:
 * - No massive toolbars
 * - Click-to-edit with subtle indicators
 * - Floating mini-toolbar on selection
 * - Auto-save with visual feedback
 * - Keyboard shortcuts
 * - Smooth transitions
 */

class SeamlessEditor {
  constructor() {
    this.apiBase = '/api';
    this.isEditing = false;
    this.currentPage = this.getPageName();
    this.editableElements = [];
    this.autoSaveTimer = null;
    this.selectedElement = null;
    
    this.init();
  }

  init() {
    console.log('✨ Seamless Editor initializing...');
    this.checkAuth();
    this.setupKeyboardShortcuts();
  }

  // ============================================
  // SIMPLE AUTHENTICATION
  // ============================================
  
  async checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const user = await response.json();
        if (user.role === 'admin') {
          this.enableEditing();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  getPageName() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index';
  }

  // ============================================
  // ENABLE EDITING - SEAMLESS APPROACH
  // ============================================
  
  enableEditing() {
    // Just add a small, subtle indicator
    this.createIndicator();
    
    // Make elements editable on hover
    this.setupHoverEffects();
    
    // Listen for clicks to enter edit mode
    this.setupClickHandlers();
  }

  createIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'seamless-indicator';
    indicator.innerHTML = '✏️ Edit Mode';
    indicator.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(indicator);
    this.indicator = indicator;
    
    // Show indicator briefly
    setTimeout(() => indicator.style.opacity = '1', 500);
    setTimeout(() => indicator.style.opacity = '0', 3500);
  }

  setupHoverEffects() {
    const selectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'li', 'span', 'a:not(.nav-link)',
      '.hero-title', '.hero-subtitle',
      '.section-title', '.section-description',
      '.feature-title', '.feature-description'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // Skip if in nav or buttons
      if (el.closest('nav') || el.closest('button')) return;
      if (el.closest('.seamless-editor-controls')) return;

      el.classList.add('seamless-editable');
      el.addEventListener('mouseenter', () => this.showHoverHighlight(el));
      el.addEventListener('mouseleave', () => this.hideHoverHighlight(el));
      el.addEventListener('click', (e) => this.handleClick(el, e));
    });

    this.addStyles();
  }

  showHoverHighlight(element) {
    if (this.isEditing) return;
    element.style.outline = '2px solid rgba(102, 126, 234, 0.3)';
    element.style.outlineOffset = '2px';
    element.style.cursor = 'text';
  }

  hideHoverHighlight(element) {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.cursor = '';
  }

  handleClick(element, event) {
    if (this.isEditing && this.selectedElement === element) return;
    
    event.preventDefault();
    this.enterEditMode(element);
  }

  // ============================================
  // ENTER EDIT MODE - FAST AND SMOOTH
  // ============================================
  
  enterEditMode(element) {
    this.isEditing = true;
    this.selectedElement = element;
    
    // Store original content
    element.dataset.originalContent = element.innerHTML;
    
    // Make editable
    element.contentEditable = true;
    element.focus();
    
    // Add editing class
    element.classList.add('seamless-editing');
    
    // Create floating toolbar
    this.createFloatingToolbar(element);
    
    // Listen for changes
    this.setupChangeListeners(element);
    
    // Hide indicator
    if (this.indicator) this.indicator.style.opacity = '0';
  }

  exitEditMode(element) {
    this.isEditing = false;
    
    // Remove floating toolbar
    this.removeFloatingToolbar();
    
    // Save changes
    this.saveChanges(element);
    
    // Remove editing state
    element.contentEditable = false;
    element.classList.remove('seamless-editing');
    element.style.outline = '';
    element.style.outlineOffset = '';
    
    this.selectedElement = null;
  }

  // ============================================
  // FLOATING MINI TOOLBAR - SIMPLE
  // ============================================
  
  createFloatingToolbar(element) {
    const toolbar = document.createElement('div');
    toolbar.className = 'seamless-float-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-row">
        <button data-cmd="bold" title="Bold">B</button>
        <button data-cmd="italic" title="Italic">I</button>
        <button data-cmd="underline" title="Underline">U</button>
        <span class="divider"></span>
        <button data-cmd="formatBlock" data-val="h2" title="Heading">H2</button>
        <button data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
        <span class="divider"></span>
        <button data-action="save" title="Save">✓</button>
        <button data-action="cancel" title="Cancel">✕</button>
      </div>
    `;

    document.body.appendChild(toolbar);
    this.floatingToolbar = toolbar;

    // Position toolbar
    const rect = element.getBoundingClientRect();
    toolbar.style.top = `${rect.top - 50 + window.scrollY}px`;
    toolbar.style.left = `${rect.left + Math.max(0, (rect.width / 2) - 150)}px`;

    // Setup button handlers
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val;
      const action = btn.dataset.action;

      if (cmd) {
        document.execCommand(cmd, false, val);
        element.focus();
      } else if (action === 'save') {
        this.exitEditMode(element);
      } else if (action === 'cancel') {
        this.cancelEdit(element);
      }
    });
  }

  removeFloatingToolbar() {
    if (this.floatingToolbar) {
      this.floatingToolbar.remove();
      this.floatingToolbar = null;
    }
  }

  // ============================================
  // SAVE MECHANISM - AUTO-SAVE
  // ============================================
  
  setupChangeListeners(element) {
    const handleInput = () => {
      // Cancel previous auto-save timer
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      
      // Auto-save after 2 seconds of no changes
      this.autoSaveTimer = setTimeout(() => {
        this.autoSave();
      }, 2000);
      
      // Show unsaved indicator
      this.showUnsavedIndicator();
    };

    element.addEventListener('input', handleInput);
    element.addEventListener('blur', () => {
      if (this.isEditing) {
        this.exitEditMode(element);
      }
    }, { once: true });
  }

  async saveChanges(element) {
    try {
      const content = {
        page: this.currentPage,
        key: this.getElementKey(element),
        html: element.innerHTML
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
        this.showSaveIndicator('✓ Saved');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showSaveIndicator('✕ Error');
    }
  }

  autoSave() {
    if (!this.selectedElement) return;
    
    console.log('💾 Auto-saving...');
    this.saveChanges(this.selectedElement);
  }

  cancelEdit(element) {
    // Restore original content
    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
    }
    
    this.exitEditMode(element);
    this.showSaveIndicator('Cancelled');
  }

  // ============================================
  // VISUAL FEEDBACK - SUBTLE
  // ============================================
  
  showSaveIndicator(message) {
    const indicator = document.createElement('div');
    indicator.className = 'seamless-save-indicator';
    indicator.textContent = message;
    indicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      animation: fadeInOut 2s ease-in-out;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 2000);
  }

  showUnsavedIndicator() {
    if (!this.selectedElement) return;
    
    this.selectedElement.style.outline = '2px dashed #48bb78';
    this.selectedElement.style.outlineOffset = '2px';
  }

  getElementKey(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id || '';
    const classes = Array.from(element.classList).join('.');
    const text = element.textContent.trim().substring(0, 30);
    
    return `${tag}${id ? '#' + id : ''}${classes ? '.' + classes : ''}:${text}`;
  }

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape to exit edit mode
      if (e.key === 'Escape' && this.isEditing && this.selectedElement) {
        e.preventDefault();
        this.exitEditMode(this.selectedElement);
      }
      
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's' && this.isEditing) {
        e.preventDefault();
        this.exitEditMode(this.selectedElement);
      }
      
      // Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)
      if (this.isEditing && this.selectedElement) {
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
  // STYLES - LIGHTWEIGHT
  // ============================================
  
  addStyles() {
    if (document.getElementById('seamlessEditorStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'seamlessEditorStyles';
    styles.textContent = `
      /* Editable hover states */
      .seamless-editable {
        transition: outline 0.2s, outline-offset 0.2s;
      }
      
      .seamless-editable:hover {
        outline: 2px solid rgba(102, 126, 234, 0.3) !important;
        outline-offset: 2px !important;
        cursor: text !important;
      }
      
      /* Active editing state */
      .seamless-editing {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        background: rgba(102, 126, 234, 0.05) !important;
        border-radius: 4px;
      }
      
      /* Floating toolbar */
      .seamless-float-toolbar {
        position: fixed;
        z-index: 10000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 8px;
        animation: slideUp 0.2s ease-out;
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(10px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .toolbar-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .toolbar-row button {
        padding: 6px 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
        min-width: 32px;
      }
      
      .toolbar-row button:hover {
        background: #f8f9fa;
        border-color: #667eea;
      }
      
      .toolbar-row button[data-action="save"] {
        background: #48bb78;
        color: white;
        border-color: #48bb78;
      }
      
      .toolbar-row button[data-action="cancel"] {
        background: #f56565;
        color: white;
        border-color: #f56565;
      }
      
      .divider {
        width: 1px;
        height: 20px;
        background: #e2e8f0;
        margin: 0 4px;
      }
      
      /* Animation for save indicator */
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      }
      
      /* Prevent outline on focus while editing */
      .seamless-editing:focus {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(styles);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.seamlessEditor = new SeamlessEditor();
});