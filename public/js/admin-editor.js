/**
 * Bible Glocal — Admin Content Editor v2.0
 * Complete inline editing for ALL text, images, and layout
 * Only activates for admin users
 */
const ADMIN_EDITOR = (() => {
  let isEditing = false;
  let isDirty = false;
  let currentUser = null;
  let originalContents = {};
  let originalImages = {};
  let currentImgTarget = null;
  let pendingImageUrl = null;
  let editableCount = 0;

  // Elements to NEVER make editable
  const SKIP_SELECTORS = [
    '.admin-toolbar', '.admin-toolbar *',
    '.admin-edit-toggle',
    '.img-upload-modal', '.img-upload-modal *',
    '.save-indicator',
    '.section-control', '.section-control *',
    '.preloader-cross', '#preloader',
    'script', 'style', 'link', 'meta', 'noscript',
    'iframe', 'video', 'audio', 'canvas', 'svg',
    'input', 'textarea', 'select', 'button',
    '.menu-toggle', '.scroll-top',
    '.social-sidebar', '.social-sidebar *',
    '.kakao-chat-btn', '.kakao-chat-btn *',
    '.bg-social-float', '.bg-social-float *'
  ];

  // Container elements whose children should be editable (not themselves)
  const CONTAINER_TAGS = ['DIV', 'SECTION', 'MAIN', 'ARTICLE', 'ASIDE', 'NAV', 'HEADER', 'FOOTER', 'UL', 'OL', 'DL', 'TABLE', 'TBODY', 'THEAD', 'TR', 'FORM', 'FIELDSET'];

  // Elements that should be directly editable (text-bearing)
  const TEXT_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'TD', 'TH', 'LABEL', 'STRONG', 'EM', 'B', 'I', 'SMALL', 'BLOCKQUOTE', 'FIGCAPTION', 'CITE', 'DT', 'DD', 'LEGEND', 'CAPTION'];

  /* ── Check Admin Status ── */
  async function checkAdmin() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        currentUser = data.user;
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ── Initialize ── */
  async function init() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;

    createToggleButton();
    createToolbar();
    createImageModal();
    createSaveIndicator();
    loadSavedContent();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's' && isEditing) {
        e.preventDefault();
        saveAll();
      }
      if (e.key === 'Escape' && isEditing) {
        cancelEditing();
      }
    });

    console.log('[AdminEditor] Initialized for admin user:', currentUser.email);
  }

  /* ── Create Toggle Button ── */
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.className = 'admin-edit-toggle visible';
    btn.title = '편집 모드 시작';
    btn.innerHTML = '✏️';
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isEditing ? cancelEditing() : startEditing();
    };
    document.body.appendChild(btn);
  }

  /* ── Create Toolbar ── */
  function createToolbar() {
    const tb = document.createElement('div');
    tb.className = 'admin-toolbar';
    tb.id = 'adminToolbar';
    tb.innerHTML = `
      <div class="admin-toolbar-inner">
        <div class="admin-toolbar-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>관리자 편집 모드</span>
          <span class="admin-toolbar-status" id="editStatus">준비됨</span>
        </div>
        <div class="admin-toolbar-actions">
          <span class="admin-toolbar-counter" id="editCounter"></span>
          <button class="atb" onclick="ADMIN_EDITOR.uploadImage()" title="이미지 업로드">📷 <span class="atb-label">이미지</span></button>
          <button class="atb atb-success" onclick="ADMIN_EDITOR.saveAll()" title="저장 (Ctrl+S)">💾 <span class="atb-label">저장</span></button>
          <button class="atb atb-warning" onclick="ADMIN_EDITOR.resetContent()" title="원본 복원">↩️ <span class="atb-label">복원</span></button>
          <button class="atb atb-danger" onclick="ADMIN_EDITOR.cancelEditing()" title="편집 종료 (Esc)">✕ <span class="atb-label">종료</span></button>
        </div>
      </div>
    `;
    document.body.appendChild(tb);
  }

  /* ── Create Image Upload Modal ── */
  function createImageModal() {
    const modal = document.createElement('div');
    modal.className = 'img-upload-modal';
    modal.id = 'imgUploadModal';
    modal.innerHTML = `
      <div class="img-upload-box">
        <div class="img-upload-header">
          <h3>📷 이미지 업로드 / 변경</h3>
          <button class="img-upload-close" onclick="ADMIN_EDITOR.closeImageModal()">✕</button>
        </div>
        <div class="img-upload-body">
          <div class="img-drop-zone" id="imgDropZone">
            <div class="drop-icon">📁</div>
            <p>이미지를 드래그하여 놓거나 클릭하세요</p>
            <p class="drop-hint">JPG, PNG, GIF, WebP, SVG (최대 10MB)</p>
            <input type="file" id="imgFileInput" accept="image/*" style="display:none">
          </div>
          <div class="img-url-section">
            <label>또는 이미지 URL 입력:</label>
            <div class="img-url-row">
              <input type="text" id="imgUrlInput" placeholder="https://example.com/image.jpg">
              <button class="atb atb-primary" onclick="ADMIN_EDITOR.applyImageUrl()">적용</button>
            </div>
          </div>
          <div class="img-preview-area" id="imgPreviewArea">
            <img id="imgPreview" src="" alt="Preview">
            <p class="img-preview-info" id="imgPreviewInfo"></p>
          </div>
          <div class="img-gallery-section" id="imgGallerySection">
            <h4>📂 업로드된 이미지</h4>
            <div class="img-gallery-grid" id="imgGalleryGrid"></div>
          </div>
        </div>
        <div class="img-upload-footer">
          <button class="atb" onclick="ADMIN_EDITOR.closeImageModal()">취소</button>
          <button class="atb atb-primary" onclick="ADMIN_EDITOR.confirmImage()" id="imgConfirmBtn" disabled>이미지 적용</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Drop zone events
    const dropZone = document.getElementById('imgDropZone');
    const fileInput = document.getElementById('imgFileInput');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFileSelect(e.target.files[0]);

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
    };
  }

  /* ── Create Save Indicator ── */
  function createSaveIndicator() {
    const ind = document.createElement('div');
    ind.className = 'save-indicator';
    ind.id = 'saveIndicator';
    document.body.appendChild(ind);
  }

  /* ── Should Skip Element ── */
  function shouldSkip(el) {
    if (!el || !el.tagName) return true;
    // Check if inside any skip container
    for (const sel of SKIP_SELECTORS) {
      try {
        if (el.matches(sel) || el.closest(sel.replace(' *', ''))) return true;
      } catch (e) {}
    }
    return false;
  }

  /* ── Check if element has direct text content ── */
  function hasDirectText(el) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  /* ── Get a stable selector path for an element ── */
  function getElementPath(el) {
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${current.id}`);
        break;
      }
      // Use class names for stability
      let cls = '';
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(/\s+/).filter(c =>
          c && !c.startsWith('admin-') && c !== 'visible' && c !== 'active' &&
          c !== 'show' && c !== 'editing' && c !== 'dragover' &&
          !c.startsWith('data-')
        );
        if (classes.length) cls = '.' + classes.join('.');
      }
      // Index among siblings
      let idx = 0;
      let sib = current;
      while (sib = sib.previousElementSibling) {
        if (sib.tagName === current.tagName) idx++;
      }
      parts.unshift(tag + cls + (idx > 0 ? `:nth(${idx})` : ''));
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  /* ── Mark ALL Editable Elements ── */
  function markEditableElements() {
    editableCount = 0;

    // Strategy: Walk the entire DOM and find all text-bearing elements
    const allElements = document.body.querySelectorAll('*');

    allElements.forEach(el => {
      if (shouldSkip(el)) return;
      if (el.hasAttribute('data-editable') || el.hasAttribute('data-editable-img')) return;

      const tag = el.tagName;

      // Mark images
      if (tag === 'IMG') {
        if (el.closest('.admin-toolbar') || el.closest('.img-upload-modal') || el.closest('.social-sidebar') || el.closest('.bg-social-float')) return;
        if (el.width < 20 || el.height < 20) return; // Skip tiny icons
        const imgId = `img-${editableCount++}`;
        el.setAttribute('data-editable-img', imgId);
        return;
      }

      // Check if it's a text-bearing element
      if (TEXT_TAGS.includes(tag)) {
        // Must have some visible text
        const text = el.textContent.trim();
        if (text.length === 0) return;
        // Skip if only contains whitespace
        if (!text.replace(/\s/g, '')) return;
        // Skip very tiny elements (icons, etc.)
        if (text.length <= 1 && !el.querySelector('*')) return;

        const id = `edit-${editableCount++}`;
        el.setAttribute('data-editable', id);

        // Generate a descriptive label
        let label = getEditLabel(el);
        el.setAttribute('data-editable-label', label);
        return;
      }

      // For container-like elements (divs, etc.) that have direct text
      if (CONTAINER_TAGS.includes(tag) || tag === 'FIGURE') return;

      // Other elements with direct text content
      if (hasDirectText(el)) {
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 5000) {
          const id = `edit-${editableCount++}`;
          el.setAttribute('data-editable', id);
          el.setAttribute('data-editable-label', getEditLabel(el));
        }
      }
    });

    // Mark sections for reordering
    let sectionIdx = 0;
    document.querySelectorAll('section, .section, main > div, .page-content > div').forEach(sec => {
      if (shouldSkip(sec)) return;
      if (sec.closest('.admin-toolbar') || sec.closest('.img-upload-modal')) return;
      sec.setAttribute('data-section', `section-${sectionIdx++}`);
    });

    console.log(`[AdminEditor] Marked ${editableCount} editable elements`);
  }

  /* ── Generate label for editable element ── */
  function getEditLabel(el) {
    const tag = el.tagName;
    const cls = el.className && typeof el.className === 'string' ? el.className : '';
    const parent = el.parentElement;
    const parentCls = parent && parent.className && typeof parent.className === 'string' ? parent.className : '';

    // Try class-based labels first
    if (cls.includes('hero-title') || cls.includes('hero-kr-title')) return '히어로 제목';
    if (cls.includes('hero-description') || cls.includes('hero-desc')) return '히어로 설명';
    if (cls.includes('hero-badge')) return '히어로 배지';
    if (cls.includes('hero-verse')) return '성경 구절';
    if (cls.includes('section-title-kr') || cls.includes('section-title')) return '섹션 제목';
    if (cls.includes('subtitle')) return '부제목';
    if (cls.includes('card-title')) return '카드 제목';
    if (cls.includes('card-text') || cls.includes('card-subtitle')) return '카드 내용';
    if (cls.includes('pub-type')) return '출판 유형';
    if (cls.includes('pub-year')) return '출판 연도';
    if (cls.includes('pub-content')) return '출판 내용';
    if (cls.includes('stat-number')) return '통계 숫자';
    if (cls.includes('stat-label') || cls.includes('stat-item')) return '통계 라벨';
    if (cls.includes('footer-brand')) return '푸터 브랜드';
    if (cls.includes('footer-links')) return '푸터 링크';
    if (cls.includes('footer-contact')) return '푸터 연락처';
    if (cls.includes('footer-note') || cls.includes('footer-bottom')) return '푸터 하단';
    if (cls.includes('timeline')) return '타임라인';
    if (cls.includes('breadcrumb')) return '경로';
    if (cls.includes('content-block')) return '콘텐츠 블록';
    if (cls.includes('highlight-box')) return '하이라이트';
    if (cls.includes('notice') || cls.includes('board')) return '게시물';
    if (cls.includes('social-connect')) return '소셜 연결';
    if (cls.includes('app-teaser')) return '앱 안내';
    if (cls.includes('credential')) return '자격/경력';
    if (cls.includes('logo-text')) return '로고 텍스트';
    if (cls.includes('top-bar')) return '상단 바';
    if (cls.includes('more-link')) return '더보기 링크';
    if (cls.includes('category')) return '카테고리';
    if (cls.includes('forum')) return '포럼';
    if (cls.includes('date')) return '날짜';

    // Tag-based labels
    if (tag === 'H1') return '대제목 (H1)';
    if (tag === 'H2') return '제목 (H2)';
    if (tag === 'H3') return '소제목 (H3)';
    if (tag === 'H4') return '소제목 (H4)';
    if (tag === 'H5' || tag === 'H6') return '소제목';
    if (tag === 'P') return '본문';
    if (tag === 'LI') return '목록 항목';
    if (tag === 'A') return '링크';
    if (tag === 'SPAN') return '텍스트';
    if (tag === 'BLOCKQUOTE') return '인용구';
    if (tag === 'FIGCAPTION') return '캡션';
    if (tag === 'LABEL') return '라벨';
    if (tag === 'SMALL') return '작은 텍스트';
    if (tag === 'STRONG' || tag === 'B') return '강조';
    if (tag === 'EM' || tag === 'I') return '이탤릭';
    if (tag === 'TD' || tag === 'TH') return '테이블 셀';

    return '텍스트';
  }

  /* ── Clear All Editable Marks ── */
  function clearEditableMarks() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.removeAttribute('data-editable');
      el.removeAttribute('data-editable-label');
      el.contentEditable = 'false';
      el.removeEventListener('input', onContentChange);
      el.removeEventListener('paste', onPaste);
      el.removeEventListener('focus', onElementFocus);
      el.removeEventListener('blur', onElementBlur);
    });
    document.querySelectorAll('[data-editable-img]').forEach(img => {
      img.removeAttribute('data-editable-img');
      if (img._editClick) {
        img.removeEventListener('click', img._editClick);
        delete img._editClick;
      }
    });
    document.querySelectorAll('[data-section]').forEach(sec => {
      sec.removeAttribute('data-section');
    });
    document.querySelectorAll('.section-control').forEach(c => c.remove());
  }

  /* ── Start Editing Mode ── */
  function startEditing() {
    isEditing = true;

    // First mark elements
    markEditableElements();

    document.body.classList.add('admin-editing');
    document.getElementById('adminToolbar').classList.add('visible');

    // Store original contents and make editable
    originalContents = {};
    originalImages = {};

    document.querySelectorAll('[data-editable]').forEach(el => {
      const id = el.getAttribute('data-editable');
      originalContents[id] = el.innerHTML;
      el.contentEditable = 'true';
      el.addEventListener('input', onContentChange);
      el.addEventListener('paste', onPaste);
      el.addEventListener('focus', onElementFocus);
      el.addEventListener('blur', onElementBlur);
    });

    // Image click handlers
    document.querySelectorAll('[data-editable-img]').forEach(img => {
      const imgId = img.getAttribute('data-editable-img');
      originalImages[imgId] = img.src;
      img._editClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageModal(img);
      };
      img.addEventListener('click', img._editClick);
    });

    // Section controls
    addSectionControls();

    // Update toggle button
    const toggle = document.querySelector('.admin-edit-toggle');
    if (toggle) { toggle.innerHTML = '✕'; toggle.title = '편집 종료'; }

    updateStatus(`편집 모드 활성화 — ${editableCount}개 요소`);
    updateCounter();
  }

  /* ── Cancel Editing ── */
  function cancelEditing() {
    if (isDirty && !confirm('저장하지 않은 변경사항이 있습니다. 정말 종료하시겠습니까?')) return;

    isEditing = false;
    isDirty = false;
    document.body.classList.remove('admin-editing');
    document.getElementById('adminToolbar').classList.remove('visible');

    // Clear all marks and handlers
    clearEditableMarks();

    // Update toggle
    const toggle = document.querySelector('.admin-edit-toggle');
    if (toggle) { toggle.innerHTML = '✏️'; toggle.title = '편집 모드 시작'; }
  }

  /* ── Focus/Blur handlers for better UX ── */
  function onElementFocus(e) {
    const label = e.target.getAttribute('data-editable-label') || '텍스트';
    updateStatus(`편집 중: ${label}`);
  }

  function onElementBlur() {
    if (isDirty) {
      updateStatus('변경사항 있음 (저장 필요)');
    } else {
      updateStatus('편집 모드 활성화');
    }
  }

  /* ── Content Change Handler ── */
  function onContentChange() {
    isDirty = true;
    updateStatus('변경사항 있음 (Ctrl+S로 저장)');
    updateCounter();
  }

  /* ── Clean Paste ── */
  function onPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  /* ── Count changes ── */
  function updateCounter() {
    let changes = 0;
    document.querySelectorAll('[data-editable]').forEach(el => {
      const id = el.getAttribute('data-editable');
      if (originalContents[id] !== undefined && el.innerHTML !== originalContents[id]) {
        changes++;
      }
    });
    document.querySelectorAll('[data-editable-img]').forEach(img => {
      const imgId = img.getAttribute('data-editable-img');
      if (originalImages[imgId] && img.src !== originalImages[imgId]) {
        changes++;
      }
    });
    const counter = document.getElementById('editCounter');
    if (counter) {
      counter.textContent = changes > 0 ? `${changes}개 변경` : '';
      counter.style.display = changes > 0 ? '' : 'none';
    }
  }

  /* ── Save All Changes ── */
  async function saveAll() {
    const pagePath = window.location.pathname;
    const contents = [];

    // Collect text changes
    document.querySelectorAll('[data-editable]').forEach(el => {
      const id = el.getAttribute('data-editable');
      const path = getElementPath(el);
      const original = originalContents[id];
      if (el.innerHTML !== original) {
        contents.push({
          selector: id,
          content: el.innerHTML,
          type: 'html',
          path: path
        });
      }
    });

    // Collect image changes
    document.querySelectorAll('[data-editable-img]').forEach(img => {
      const imgId = img.getAttribute('data-editable-img');
      if (originalImages[imgId] && img.src !== originalImages[imgId]) {
        contents.push({
          selector: imgId,
          content: img.src,
          type: 'image',
          path: getElementPath(img)
        });
      }
    });

    if (contents.length === 0) {
      showSaveIndicator('변경사항이 없습니다', '');
      return;
    }

    updateStatus('저장 중...');

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ page_path: pagePath, contents })
      });
      const data = await res.json();

      if (data.success) {
        isDirty = false;
        // Update originals to current state
        document.querySelectorAll('[data-editable]').forEach(el => {
          originalContents[el.getAttribute('data-editable')] = el.innerHTML;
        });
        document.querySelectorAll('[data-editable-img]').forEach(img => {
          originalImages[img.getAttribute('data-editable-img')] = img.src;
        });
        showSaveIndicator(`✅ ${contents.length}개 항목 저장 완료`, 'success');
        updateStatus('저장 완료');
        updateCounter();
      } else {
        showSaveIndicator('❌ 저장 실패: ' + (data.message || '알 수 없는 오류'), 'error');
        updateStatus('저장 실패');
      }
    } catch (e) {
      showSaveIndicator('❌ 서버 연결 오류', 'error');
      updateStatus('연결 오류');
    }
  }

  /* ── Load Saved Content ── */
  async function loadSavedContent() {
    const pagePath = window.location.pathname;
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(pagePath)}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.contents || data.contents.length === 0) return;

      // We need to mark elements first to find them, then apply saved content
      markEditableElements();

      let applied = 0;
      data.contents.forEach(item => {
        if (item.content_type === 'image' || item.selector.startsWith('img-')) {
          // Find image by data attribute
          const img = document.querySelector(`[data-editable-img="${item.selector}"]`);
          if (img && item.content) {
            img.src = item.content;
            applied++;
          }
        } else {
          // Find text element by data attribute
          const el = document.querySelector(`[data-editable="${item.selector}"]`);
          if (el && item.content) {
            el.innerHTML = item.content;
            applied++;
          }
        }
      });

      // Clear marks since we're not in editing mode
      clearEditableMarks();

      if (applied > 0) {
        console.log(`[AdminEditor] Applied ${applied} saved edits`);
      }
    } catch (e) {
      // Silent fail — show original content
    }
  }

  /* ── Reset Content ── */
  function resetContent() {
    if (!confirm('모든 변경사항을 원본으로 복원하시겠습니까?')) return;

    document.querySelectorAll('[data-editable]').forEach(el => {
      const id = el.getAttribute('data-editable');
      if (originalContents[id] !== undefined) {
        el.innerHTML = originalContents[id];
      }
    });
    document.querySelectorAll('[data-editable-img]').forEach(img => {
      const imgId = img.getAttribute('data-editable-img');
      if (originalImages[imgId]) {
        img.src = originalImages[imgId];
      }
    });

    isDirty = false;
    updateStatus('원본 복원됨');
    updateCounter();
    showSaveIndicator('↩️ 원본으로 복원됨', '');
  }

  /* ── Section Controls ── */
  function addSectionControls() {
    document.querySelectorAll('[data-section]').forEach(sec => {
      if (sec.querySelector(':scope > .section-control')) return;
      const ctrl = document.createElement('div');
      ctrl.className = 'section-control';
      ctrl.innerHTML = `
        <button class="section-ctrl-btn" onclick="event.stopPropagation(); ADMIN_EDITOR.moveSection(this, -1)" title="위로 이동">↑</button>
        <button class="section-ctrl-btn" onclick="event.stopPropagation(); ADMIN_EDITOR.moveSection(this, 1)" title="아래로 이동">↓</button>
        <button class="section-ctrl-btn section-ctrl-danger" onclick="event.stopPropagation(); ADMIN_EDITOR.toggleSection(this)" title="숨기기/보이기">👁</button>
      `;
      sec.style.position = 'relative';
      sec.appendChild(ctrl);
    });
  }

  function moveSection(btn, direction) {
    const section = btn.closest('[data-section]');
    if (!section) return;
    const sibling = direction === -1 ? section.previousElementSibling : section.nextElementSibling;
    if (sibling && sibling.hasAttribute('data-section')) {
      if (direction === -1) section.parentNode.insertBefore(section, sibling);
      else section.parentNode.insertBefore(sibling, section);
      isDirty = true;
      updateStatus('섹션 순서 변경됨');
      showSaveIndicator('섹션 이동 완료', 'success');
    }
  }

  function toggleSection(btn) {
    const section = btn.closest('[data-section]');
    if (!section) return;
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? '' : 'none';
    isDirty = true;
    updateStatus(isHidden ? '섹션 표시' : '섹션 숨김');
  }

  /* ── Image Modal ── */
  function openImageModal(imgElement) {
    currentImgTarget = imgElement;
    pendingImageUrl = null;
    const modal = document.getElementById('imgUploadModal');
    modal.classList.add('active');
    document.getElementById('imgConfirmBtn').disabled = true;
    document.getElementById('imgPreviewArea').classList.remove('active');
    document.getElementById('imgUrlInput').value = imgElement ? (imgElement.src || '') : '';
    document.getElementById('imgFileInput').value = '';
    loadImageGallery();
  }

  function uploadImage() {
    currentImgTarget = null;
    pendingImageUrl = null;
    const modal = document.getElementById('imgUploadModal');
    modal.classList.add('active');
    document.getElementById('imgConfirmBtn').disabled = true;
    document.getElementById('imgPreviewArea').classList.remove('active');
    document.getElementById('imgUrlInput').value = '';
    document.getElementById('imgFileInput').value = '';
    loadImageGallery();
  }

  function closeImageModal() {
    document.getElementById('imgUploadModal').classList.remove('active');
    currentImgTarget = null;
    pendingImageUrl = null;
  }

  async function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      showSaveIndicator('⚠️ 이미지 파일만 업로드 가능합니다', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showSaveIndicator('⚠️ 파일 크기가 10MB를 초과합니다', 'error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('imgPreview').src = e.target.result;
      document.getElementById('imgPreviewInfo').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      document.getElementById('imgPreviewArea').classList.add('active');
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        pendingImageUrl = data.image.url;
        document.getElementById('imgConfirmBtn').disabled = false;
        showSaveIndicator('✅ 이미지 업로드 완료', 'success');
        loadImageGallery();
      } else {
        showSaveIndicator('❌ 업로드 실패: ' + (data.message || ''), 'error');
      }
    } catch (e) {
      showSaveIndicator('❌ 업로드 오류', 'error');
    }
  }

  function applyImageUrl() {
    const url = document.getElementById('imgUrlInput').value.trim();
    if (!url) return;
    pendingImageUrl = url;
    document.getElementById('imgPreview').src = url;
    document.getElementById('imgPreviewInfo').textContent = 'External URL';
    document.getElementById('imgPreviewArea').classList.add('active');
    document.getElementById('imgConfirmBtn').disabled = false;
  }

  function confirmImage() {
    if (!pendingImageUrl) return;

    if (currentImgTarget) {
      currentImgTarget.src = pendingImageUrl;
      isDirty = true;
      updateStatus('이미지 변경됨');
      updateCounter();
    }

    closeImageModal();
    showSaveIndicator('✅ 이미지 적용 완료', 'success');
  }

  async function loadImageGallery() {
    try {
      const res = await fetch('/api/admin/images', { credentials: 'include' });
      const data = await res.json();
      const grid = document.getElementById('imgGalleryGrid');
      if (data.success && data.images && data.images.length > 0) {
        grid.innerHTML = data.images.map(img => `
          <div class="img-gallery-item" onclick="ADMIN_EDITOR.selectGalleryImage('${img.file_path}')" title="${img.original_name}">
            <img src="${img.file_path}" alt="${img.original_name}" loading="lazy">
          </div>
        `).join('');
        document.getElementById('imgGallerySection').style.display = '';
      } else {
        grid.innerHTML = '<p style="font-size:0.8rem;color:#999;grid-column:1/-1;text-align:center;">업로드된 이미지가 없습니다</p>';
      }
    } catch (e) {
      document.getElementById('imgGallerySection').style.display = 'none';
    }
  }

  function selectGalleryImage(url) {
    pendingImageUrl = url;
    document.getElementById('imgPreview').src = url;
    document.getElementById('imgPreviewInfo').textContent = '갤러리 이미지';
    document.getElementById('imgPreviewArea').classList.add('active');
    document.getElementById('imgConfirmBtn').disabled = false;
  }

  /* ── UI Helpers ── */
  function updateStatus(msg) {
    const el = document.getElementById('editStatus');
    if (el) el.textContent = msg;
  }

  function showSaveIndicator(msg, type) {
    const ind = document.getElementById('saveIndicator');
    if (!ind) return;
    ind.textContent = msg;
    ind.className = 'save-indicator show' + (type ? ' ' + type : '');
    clearTimeout(ind._timeout);
    ind._timeout = setTimeout(() => ind.classList.remove('show'), 3500);
  }

  /* ── Auto-init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100); // Small delay to ensure page is fully rendered
  }

  /* ── Public API ── */
  return {
    startEditing,
    cancelEditing,
    saveAll,
    resetContent,
    uploadImage,
    closeImageModal,
    applyImageUrl,
    confirmImage,
    selectGalleryImage,
    moveSection,
    toggleSection
  };
})();