/**
 * BibleGlocal — Advanced Admin Editor v3.0
 * Features: Rich Text Editor, Preview Mode, Revision History, Image Gallery
 * Integration with Quill.js for WYSIWYG editing
 */

const ADVANCED_ADMIN = (() => {
  let currentPage = null;
  let currentSection = null;
  let isPreviewMode = false;
  let editHistory = [];
  let currentRevision = -1;
  let quillEditor = null;
  let currentUser = null;

  // Page configurations
  const PAGE_CONFIG = {
    'index.html': { name: '메인 페이지', nameEn: 'Home' },
    'about.html': { name: '운영자소개', nameEn: 'About' },
    'korean-thought.html': { name: '한국사상과 성경', nameEn: 'Korean Thought' },
    'world-thought.html': { name: '세계사상과 성경', nameEn: 'World Thought' },
    'publications.html': { name: '책과 논문', nameEn: 'Publications' },
    'forum.html': { name: '열린마당', nameEn: 'Forum' }
  };

  // Section configurations for each page
  const SECTION_CONFIG = {
    'index.html': [
      { id: 'hero', name: '히어로 섹션', icon: '🖼️' },
      { id: 'intro', name: '소개 섹션', icon: '📝' },
      { id: 'featured', name: '주요 콘텐츠', icon: '⭐' }
    ]
  };

  /* ─────────────── Initialization ─────────────── */
  async function init() {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      window.location.href = '/login.html';
      return;
    }

    loadPageList();
    setupEventListeners();
    checkForUnsavedChanges();
    
    console.log('[AdvancedAdmin] Initialized');
  }

  /* ─────────────── Admin Status Check ─────────────── */
  async function checkAdminStatus() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        currentUser = data.user;
        return true;
      }
    } catch (e) {
      console.error('[AdvancedAdmin] Admin check failed:', e);
    }
    return false;
  }

  /* ─────────────── Page Management ─────────────── */
  function loadPageList() {
    const pageList = document.getElementById('pageList');
    if (!pageList) return;

    pageList.innerHTML = '';
    
    Object.entries(PAGE_CONFIG).forEach(([path, config]) => {
      const item = document.createElement('div');
      item.className = 'page-list-item';
      item.innerHTML = `
        <div class="page-item-icon">📄</div>
        <div class="page-item-info">
          <div class="page-item-name">${config.name}</div>
          <div class="page-item-name-en">${config.nameEn}</div>
        </div>
        <div class="page-item-actions">
          <button class="btn btn-sm btn-primary" onclick="ADVANCED_ADMIN.editPage('${path}')">
            ✏️ 편집
          </button>
          <button class="btn btn-sm btn-secondary" onclick="ADVANCED_ADMIN.previewPage('${path}')">
            👁️ 미리보기
          </button>
        </div>
      `;
      pageList.appendChild(item);
    });
  }

  /* ─────────────── Edit Page ─────────────── */
  async function editPage(pagePath) {
    currentPage = pagePath;
    isPreviewMode = false;
    
    showLoadingOverlay();
    
    try {
      // Load page content
      const res = await fetch(`/api/admin/content/${pagePath}`, {
        credentials: 'include'
      });
      
      const data = await res.json();
      loadSections(data.contents || []);
      
      // Update UI
      document.getElementById('pageTitle').textContent = 
        PAGE_CONFIG[pagePath]?.name || pagePath;
      
      showEditorPanel();
      hideLoadingOverlay();
      
      // Initialize Quill editor for rich text
      initQuillEditor();
      
    } catch (e) {
      console.error('[AdvancedAdmin] Failed to load page:', e);
      showError('페이지 로드에 실패했습니다');
      hideLoadingOverlay();
    }
  }

  /* ─────────────── Load Sections ─────────────── */
  function loadSections(contents) {
    const sections = document.getElementById('sectionList');
    if (!sections) return;

    sections.innerHTML = '';
    const pageSections = SECTION_CONFIG[currentPage] || getSectionsFromContents(contents);

    pageSections.forEach(section => {
      const content = contents.find(c => c.selector === section.id) || {};
      const sectionEl = document.createElement('div');
      sectionEl.className = 'section-item';
      sectionEl.dataset.sectionId = section.id;
      sectionEl.innerHTML = `
        <div class="section-header">
          <div class="section-icon">${section.icon}</div>
          <div class="section-title">${section.name}</div>
          <div class="section-status">
            ${content.content ? '<span class="status-badge status-filled">✓</span>' : '<span class="status-badge status-empty">빈</span>'}
          </div>
        </div>
        <div class="section-preview">
          ${content.content ? content.content.substring(0, 200) + '...' : '<em>콘텐츠가 없습니다</em>'}
        </div>
        <div class="section-actions">
          <button class="btn btn-sm btn-accent" onclick="ADVANCED_ADMIN.editSection('${section.id}')">
            편집하기
          </button>
        </div>
      `;
      sections.appendChild(sectionEl);
      
      // Store content for editing
      section.content = content.content || '';
      section.contentType = content.content_type || 'html';
    });
  }

  /* ─────────────── Get Sections from Contents ─────────────── */
  function getSectionsFromContents(contents) {
    const sections = [];
    const seen = new Set();
    
    contents.forEach(item => {
      if (!seen.has(item.selector)) {
        seen.add(item.selector);
        sections.push({
          id: item.selector,
          name: item.selector.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          icon: '📝'
        });
      }
    });
    
    return sections.length > 0 ? sections : [{ id: 'main', name: '메인 섹션', icon: '📝' }];
  }

  /* ─────────────── Edit Section ─────────────── */
  function editSection(sectionId) {
    currentSection = sectionId;
    
    const sectionEl = document.querySelector(`[data-section-id="${sectionId}"]`);
    const sectionConfig = SECTION_CONFIG[currentPage]?.find(s => s.id === sectionId);
    
    document.getElementById('sectionEditorTitle').textContent = 
      sectionConfig?.name || sectionId;
    
    // Load content into Quill
    const content = sectionEl.querySelector('.section-content')?.value || '';
    if (quillEditor) {
      quillEditor.root.innerHTML = content;
    }
    
    // Show editor modal
    showModal('sectionEditorModal');
    
    // Save initial state for revision
    saveRevision();
  }

  /* ─────────────── Initialize Quill Editor ─────────────── */
  function initQuillEditor() {
    if (quillEditor) return;

    if (typeof Quill === 'undefined') {
      console.warn('[AdvancedAdmin] Quill.js not loaded');
      return;
    }

    quillEditor = new Quill('#richEditor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      },
      placeholder: '콘텐츠를 입력하세요...'
    });

    // Auto-save on change
    quillEditor.on('text-change', () => {
      saveRevision();
    });
  }

  /* ─────────────── Save Revision ─────────────── */
  function saveRevision() {
    if (!quillEditor) return;
    
    const content = quillEditor.root.innerHTML;
    
    // Remove future revisions if we're in the middle of history
    if (currentRevision < editHistory.length - 1) {
      editHistory = editHistory.slice(0, currentRevision + 1);
    }
    
    editHistory.push({
      timestamp: new Date().toISOString(),
      content: content,
      author: currentUser?.display_name || 'Unknown'
    });
    
    currentRevision = editHistory.length - 1;
    
    // Limit history to 50 revisions
    if (editHistory.length > 50) {
      editHistory.shift();
      currentRevision--;
    }
    
    updateRevisionUI();
    markAsDirty();
  }

  /* ─────────────── Update Revision UI ─────────────── */
  function updateRevisionUI() {
    const revisionList = document.getElementById('revisionList');
    if (!revisionList) return;

    revisionList.innerHTML = '';
    
    editHistory.forEach((rev, index) => {
      const revEl = document.createElement('div');
      revEl.className = `revision-item ${index === currentRevision ? 'active' : ''}`;
      revEl.innerHTML = `
        <div class="revision-info">
          <span class="revision-time">${new Date(rev.timestamp).toLocaleString('ko-KR')}</span>
          <span class="revision-author">${rev.author}</span>
        </div>
        <button class="btn btn-sm ${index === currentRevision ? 'btn-primary' : ''}" 
                onclick="ADVANCED_ADMIN.restoreRevision(${index})"
                ${index === currentRevision ? 'disabled' : ''}>
          ${index === currentRevision ? '현재' : '복원'}
        </button>
      `;
      revisionList.appendChild(revEl);
    });
  }

  /* ─────────────── Restore Revision ─────────────── */
  function restoreRevision(index) {
    if (index < 0 || index >= editHistory.length) return;
    
    if (quillEditor) {
      quillEditor.root.innerHTML = editHistory[index].content;
      currentRevision = index;
      updateRevisionUI();
      markAsDirty();
    }
  }

  /* ─────────────── Save Section Content ─────────────── */
  async function saveSection() {
    if (!quillEditor || !currentSection) return;

    const content = quillEditor.root.innerHTML;
    const contentType = 'html';

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          page_path: currentPage,
          contents: [{
            selector: currentSection,
            content: content,
            type: contentType
          }]
        })
      });

      const data = await res.json();
      
      if (data.success) {
        showNotification('저장되었습니다! ✅', 'success');
        markAsClean();
        closeModal('sectionEditorModal');
        editPage(currentPage); // Reload page to show updated content
      } else {
        showError(data.error || '저장에 실패했습니다');
      }
      
    } catch (e) {
      console.error('[AdvancedAdmin] Save failed:', e);
      showError('저장 중 오류가 발생했습니다');
    }
  }

  /* ─────────────── Preview Page ─────────────── */
  function previewPage(pagePath) {
    window.open(`/${pagePath}`, '_blank');
  }

  /* ─────────────── UI Helpers ─────────────── */
  function showEditorPanel() {
    document.getElementById('pageDashboard').style.display = 'none';
    document.getElementById('editorPanel').style.display = 'block';
  }

  function hideEditorPanel() {
    document.getElementById('pageDashboard').style.display = 'block';
    document.getElementById('editorPanel').style.display = 'none';
    currentPage = null;
    currentSection = null;
  }

  function showModal(modalId) {
    document.getElementById(modalId).classList.add('visible');
  }

  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('visible');
  }

  function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('visible');
  }

  function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('visible');
  }

  function markAsDirty() {
    document.body.classList.add('has-unsaved-changes');
  }

  function markAsClean() {
    document.body.classList.remove('has-unsaved-changes');
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100001;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function showError(message) {
    showNotification(message, 'error');
  }

  function checkForUnsavedChanges() {
    window.addEventListener('beforeunload', (e) => {
      if (document.body.classList.contains('has-unsaved-changes')) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /* ─────────────── Event Listeners ─────────────── */
  function setupEventListeners() {
    // Back button
    document.getElementById('backToDashboard')?.addEventListener('click', hideEditorPanel);
    
    // Save button in section editor
    document.getElementById('saveSectionBtn')?.addEventListener('click', saveSection);
    
    // Cancel button in section editor
    document.getElementById('cancelSectionBtn')?.addEventListener('click', () => {
      closeModal('sectionEditorModal');
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) closeModal(modal.id);
      });
    });
    
    // Close modal on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's' && document.getElementById('sectionEditorModal').classList.contains('visible')) {
        e.preventDefault();
        saveSection();
      }
      if (e.key === 'Escape') {
        closeModal('sectionEditorModal');
      }
    });
  }

  /* ─────────────── Public API ─────────────── */
  return {
    init,
    editPage,
    editSection,
    previewPage,
    saveSection,
    restoreRevision,
    showModal,
    closeModal
  };

})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('admin.html')) {
    ADVANCED_ADMIN.init();
  }
});