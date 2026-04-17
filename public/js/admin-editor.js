/**
 * Admin Frontend Editor System
 * Enables inline editing of website content for administrators
 */

class AdminEditor {
  constructor() {
    this.apiBase = '/api';
    this.isEditMode = false;
    this.currentEditElement = null;
    this.editableElements = [];
    this.init();
  }

  init() {
    this.checkAdminStatus();
    this.setupEditor();
    this.observeContentChanges();
  }

  // Check if user is admin and enable edit mode
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
          this.enableAdminMode();
        }
      }
    } catch (error) {
      console.error('Admin check failed:', error);
    }
  }

  // Enable admin mode features
  enableAdminMode() {
    this.createEditModeToggle();
    this.setupInlineEditing();
    this.addEditButtonsToSections();
  }

  // Create edit mode toggle button
  createEditModeToggle() {
    const toggle = document.createElement('div');
    toggle.id = 'editModeToggle';
    toggle.innerHTML = `
      <button id="toggleEditMode" class="btn btn-primary edit-toggle-btn">
        ✏️ 편집 모드
      </button>
      <div id="editorToolbar" class="editor-toolbar" style="display: none;">
        <button class="editor-btn" data-action="save" title="저장">
          💾 저장
        </button>
        <button class="editor-btn" data-action="cancel" title="취소">
          ❌ 취소
        </button>
        <button class="editor-btn" data-action="preview" title="미리보기">
          👁️ 미리보기
        </button>
      </div>
    `;

    toggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      gap: 10px;
      flex-direction: column;
      align-items: flex-end;
    `;

    document.body.appendChild(toggle);

    // Setup toggle button
    document.getElementById('toggleEditMode')?.addEventListener('click', () => {
      this.toggleEditMode();
    });

    // Setup toolbar buttons
    document.querySelectorAll('.editor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleEditorAction(action);
      });
    });
  }

  // Toggle edit mode on/off
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const toggleBtn = document.getElementById('toggleEditMode');
    const toolbar = document.getElementById('editorToolbar');

    if (this.isEditMode) {
      toggleBtn.innerHTML = '🚫 편집 종료';
      toggleBtn.style.background = '#dc3545';
      toolbar.style.display = 'flex';
      this.makeContentEditable();
      app.showAlert('success', '편집 모드가 활성화되었습니다. 콘텐츠를 클릭하여 편집하세요.');
    } else {
      toggleBtn.innerHTML = '✏️ 편집 모드';
      toggleBtn.style.background = '';
      toolbar.style.display = 'none';
      this.disableContentEditable();
      app.showAlert('info', '편집 모드가 비활성화되었습니다.');
    }
  }

  // Make content elements editable
  makeContentEditable() {
    // Make titles editable
    document.querySelectorAll('.section-title').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('editable');
      this.setupElementEditor(el, 'title');
    });

    // Make content paragraphs editable
    document.querySelectorAll('.content p, .content h3, .content h4').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('editable');
      this.setupElementEditor(el, 'content');
    });

    // Make nav items editable
    document.querySelectorAll('.nav-link').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('editable');
      this.setupElementEditor(el, 'navigation');
    });

    // Add visual indicators
    this.addEditIndicators();
  }

  // Disable content editing
  disableContentEditable() {
    document.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.classList.remove('editable');
    });

    // Remove edit indicators
    document.querySelectorAll('.edit-indicator').forEach(el => el.remove());
  }

  // Setup rich text editor for an element
  setupElementEditor(element, type) {
    // Create floating toolbar
    const toolbar = this.createRichTextToolbar(element);
    
    element.addEventListener('focus', () => {
      if (this.isEditMode) {
        toolbar.style.display = 'block';
        this.positionToolbar(element, toolbar);
      }
    });

    element.addEventListener('blur', (e) => {
      // Check if we're clicking on the toolbar
      if (!e.relatedTarget?.classList.contains('toolbar-btn')) {
        setTimeout(() => {
          toolbar.style.display = 'none';
        }, 200);
      }
    });

    element.addEventListener('input', () => {
      // Track changes
      element.dataset.hasChanges = 'true';
    });

    // Prevent default enter behavior for headings
    if (element.tagName.match(/^H[1-6]$/)) {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
    }
  }

  // Create rich text toolbar
  createRichTextToolbar(targetElement) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar editor-toolbar';
    toolbar.innerHTML = `
      <button class="toolbar-btn" data-command="bold" title="굵게">
        <strong>B</strong>
      </button>
      <button class="toolbar-btn" data-command="italic" title="기울임">
        <em>I</em>
      </button>
      <button class="toolbar-btn" data-command="underline" title="밑줄">
        <u>U</u>
      </button>
      <button class="toolbar-btn" data-command="createLink" title="링크">
        🔗
      </button>
      <button class="toolbar-btn" data-command="insertUnorderedList" title="목록">
        •
      </button>
      <button class="toolbar-btn" data-command="insertOrderedList" title="번호">
        1.
      </button>
      <button class="toolbar-btn" data-command="removeFormat" title="서식 제거">
        ✕
      </button>
    `;

    toolbar.style.cssText = `
      display: none;
      position: fixed;
      background: #2d3748;
      border-radius: 8px;
      padding: 8px;
      gap: 4px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(toolbar);

    // Setup toolbar buttons
    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.dataset.command;
        this.executeCommand(command, targetElement);
      });
    });

    return toolbar;
  }

  // Execute rich text command
  executeCommand(command, element) {
    if (command === 'createLink') {
      const url = prompt('URL을 입력하세요:', 'https://');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertImage') {
      const url = prompt('이미지 URL을 입력하세요:', 'https://');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else {
      document.execCommand(command, false, null);
    }
    element.focus();
  }

  // Position toolbar near element
  positionToolbar(element, toolbar) {
    const rect = element.getBoundingClientRect();
    toolbar.style.top = `${rect.top - 50}px`;
    toolbar.style.left = `${rect.left}px`;
  }

  // Add visual edit indicators
  addEditIndicators() {
    document.querySelectorAll('.editable').forEach(el => {
      const indicator = document.createElement('div');
      indicator.className = 'edit-indicator';
      indicator.innerHTML = '✎';
      indicator.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        background: var(--accent-color);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        z-index: 1000;
      `;

      el.style.position = 'relative';
      el.appendChild(indicator);
    });
  }

  // Add edit buttons to sections
  addEditButtonsToSections() {
    document.querySelectorAll('.section').forEach(section => {
      const editBtn = document.createElement('button');
      editBtn.className = 'section-edit-btn';
      editBtn.innerHTML = '✏️ 편집';
      editBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.2s;
        display: none;
      `;

      section.style.position = 'relative';
      section.appendChild(editBtn);

      section.addEventListener('mouseenter', () => {
        if (this.isEditMode) {
          editBtn.style.opacity = '1';
        }
      });

      section.addEventListener('mouseleave', () => {
        editBtn.style.opacity = '0';
      });

      editBtn.addEventListener('click', () => {
        this.editSection(section);
      });
    });
  }

  // Edit entire section
  editSection(section) {
    const content = section.querySelector('.content');
    if (content) {
      content.setAttribute('contenteditable', 'true');
      content.focus();
      app.showAlert('info', '섹션 편집 모드입니다. 편집을 마치면 저장을 누르세요.');
    }
  }

  // Setup inline editing
  setupInlineEditing() {
    // Image editing
    document.querySelectorAll('img').forEach(img => {
      this.setupImageEditor(img);
    });

    // Link editing
    document.querySelectorAll('a').forEach(link => {
      this.setupLinkEditor(link);
    });
  }

  // Setup image editor
  setupImageEditor(img) {
    img.addEventListener('click', (e) => {
      if (this.isEditMode) {
        e.preventDefault();
        this.editImage(img);
      }
    });
  }

  // Edit image
  editImage(img) {
    const modal = this.createImageEditModal(img);
    document.body.appendChild(modal);
    modal.classList.add('active');
  }

  // Create image edit modal
  createImageEditModal(img) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>이미지 편집</h2>
          <button class="modal-close">&times;</button>
        </div>
        <form id="imageEditForm">
          <div class="form-group">
            <label class="form-label">이미지 URL</label>
            <input type="url" class="form-control" id="imageUrl" value="${img.src}" required>
          </div>
          <div class="form-group">
            <label class="form-label">대체 텍스트</label>
            <input type="text" class="form-control" id="imageAlt" value="${img.alt}">
          </div>
          <div class="form-group">
            <label class="form-label">너비</label>
            <input type="number" class="form-control" id="imageWidth" value="${img.naturalWidth}">
          </div>
          <div class="form-group">
            <label class="form-label">높이</label>
            <input type="number" class="form-control" id="imageHeight" value="${img.naturalHeight}">
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="submit" class="btn btn-primary">적용</button>
            <button type="button" class="btn btn-outline" id="uploadImage">이미지 업로드</button>
          </div>
        </form>
      </div>
    `;

    // Setup form
    modal.querySelector('#imageEditForm').addEventListener('submit', (e) => {
      e.preventDefault();
      img.src = document.getElementById('imageUrl').value;
      img.alt = document.getElementById('imageAlt').value;
      img.style.width = `${document.getElementById('imageWidth').value}px`;
      img.style.height = `${document.getElementById('imageHeight').value}px`;
      this.closeModal(modal);
    });

    // Setup upload button
    modal.querySelector('#uploadImage').addEventListener('click', () => {
      this.uploadImage(img);
    });

    // Setup close button
    modal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal(modal);
    });

    return modal;
  }

  // Upload image
  async uploadImage(imgElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', 'Uploaded image');

      try {
        app.showLoading(true);
        const response = await fetch(`${this.apiBase}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          imgElement.src = data.url;
          app.showAlert('success', '이미지가 업로드되었습니다.');
        } else {
          app.showAlert('error', '이미지 업로드 실패');
        }
      } catch (error) {
        app.showAlert('error', '이미지 업로드 중 오류 발생');
      } finally {
        app.showLoading(false);
        this.closeModal(document.querySelector('.modal:last-child'));
      }
    };

    input.click();
  }

  // Setup link editor
  setupLinkEditor(link) {
    // Links are handled by the rich text toolbar
  }

  // Handle editor toolbar actions
  async handleEditorAction(action) {
    switch (action) {
      case 'save':
        await this.saveChanges();
        break;
      case 'cancel':
        this.cancelChanges();
        break;
      case 'preview':
        this.previewChanges();
        break;
    }
  }

  // Save all changes
  async saveChanges() {
    try {
      app.showLoading(true);

      // Collect all changes
      const changes = this.collectChanges();

      if (changes.length === 0) {
        app.showAlert('info', '변경사항이 없습니다.');
        return;
      }

      // Save changes to server
      const promises = changes.map(change => this.saveChange(change));
      await Promise.all(promises);

      app.showAlert('success', '모든 변경사항이 저장되었습니다.');
      
      // Clear change markers
      document.querySelectorAll('[data-has-changes]').forEach(el => {
        el.removeAttribute('data-has-changes');
      });

    } catch (error) {
      console.error('Save error:', error);
      app.showAlert('error', '저장 중 오류가 발생했습니다.');
    } finally {
      app.showLoading(false);
    }
  }

  // Collect all changes
  collectChanges() {
    const changes = [];
    
    // Collect changed content
    document.querySelectorAll('[data-has-changes="true"]').forEach(el => {
      changes.push({
        element: el,
        type: el.dataset.editType || 'content',
        content: el.innerHTML,
        page: this.getCurrentPage()
      });
    });

    return changes;
  }

  // Save individual change
  async saveChange(change) {
    const token = localStorage.getItem('token');

    // Determine the content ID based on element
    const section = change.element.closest('.section');
    const contentId = section?.dataset.contentId;

    if (contentId) {
      // Update existing content
      await fetch(`${this.apiBase}/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: change.content
        })
      });
    } else {
      // Create new content
      await fetch(`${this.apiBase}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: section?.querySelector('.section-title')?.textContent || 'Untitled',
          content: change.content,
          page: change.page,
        })
      });
    }
  }

  // Cancel changes
  cancelChanges() {
    if (confirm('모든 변경사항을 취소하시겠습니까?')) {
      location.reload();
    }
  }

  // Preview changes
  previewChanges() {
    // Save local preview
    localStorage.setItem('previewChanges', JSON.stringify(this.collectChanges()));
    
    // Open preview in new tab
    const previewWindow = window.open(window.location.href + '?preview=true', '_blank');
    
    app.showAlert('success', '미리보기가 새 창에서 열립니다.');
  }

  // Get current page name
  getCurrentPage() {
    const path = window.location.pathname;
    
    if (path === '/') return 'home';
    if (path.includes('/operator')) return 'operator';
    if (path.includes('/church')) return 'church';
    if (path.includes('/empire')) return 'empire';
    if (path.includes('/books')) return 'books';
    if (path.includes('/notices')) return 'notices';
    if (path.includes('/board')) return 'board';
    if (path.includes('/gallery')) return 'gallery';
    
    return 'home';
  }

  // Close modal
  closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  // Observe content changes (for dynamic content)
  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // New content added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              if (this.isEditMode) {
                this.makeElementEditable(node);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Make element editable
  makeElementEditable(element) {
    if (element.classList.contains('section-title') || 
        element.classList.contains('content')) {
      element.classList.add('editable');
      this.addEditIndicator(element);
    }
  }

  // Add edit indicator to element
  addEditIndicator(element) {
    const indicator = document.createElement('div');
    indicator.className = 'edit-indicator';
    indicator.innerHTML = '✎';
    element.appendChild(indicator);
  }

  // Setup editor
  setupEditor() {
    // Add editor styles
    this.addEditorStyles();
  }

  // Add editor styles to page
  addEditorStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      /* Editor Styles */
      .editable {
        border: 2px dashed transparent;
        transition: border-color 0.2s;
      }
      
      .editable:hover,
      .editable:focus {
        border-color: var(--accent-color);
        outline: none;
      }
      
      .editable:focus::before {
        content: '편집 중...';
        position: absolute;
        top: -20px;
        left: 0;
        background: var(--accent-color);
        color: white;
        padding: 2px 8px;
        font-size: 12px;
        border-radius: 4px;
      }
      
      .toolbar-btn {
        background: #4a5568;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }
      
      .toolbar-btn:hover {
        background: var(--accent-color);
      }
      
      .rich-text-toolbar {
        display: flex;
        gap: 4px;
      }
      
      .editor-toolbar {
        display: flex;
        gap: 8px;
        padding: 8px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .edit-toggle-btn {
        padding: 12px 20px;
        font-size: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .section-edit-btn:hover {
        background: var(--accent-color);
        transform: scale(1.05);
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.adminEditor = new AdminEditor();
});