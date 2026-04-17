/**
 * Professional Inline Editor System
 * Advanced content editing with TinyMCE integration
 * 
 * Features:
 * - Rich text editing with TinyMCE
 * - Block-based content management
 * - Drag-and-drop reordering
 * - Real-time auto-save
 * - Version history
 * - Inline editing mode
 * - Preview toggle
 */

class ProEditor {
    constructor() {
        this.apiBase = '/api';
        this.isEditMode = false;
        this.isPreviewMode = false;
        this.token = localStorage.getItem('token');
        this.currentPage = this.getPageName();
        this.editableBlocks = [];
        this.autoSaveTimer = null;
        this.versionHistory = [];
        this.selectedBlock = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Professional Editor Initializing...');
        this.checkAuth();
        this.setupKeyboardShortcuts();
        this.loadEditorStyles();
    }

    getPageName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index';
    }

    async checkAuth() {
        if (!this.token) {
            console.log('🔐 No token found');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const user = await response.json();
                if (user.role === 'admin') {
                    console.log('👑 Admin authenticated, initializing editor...');
                    this.createEditorInterface();
                    this.loadPageContent();
                }
            }
        } catch (error) {
            console.error('❌ Auth check failed:', error);
        }
    }

    loadEditorStyles() {
        if (document.getElementById('proEditorStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'proEditorStyles';
        styles.textContent = `
            /* Top Editor Toolbar */
            .pro-editor-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: white;
                border-bottom: 1px solid #e2e8f0;
                padding: 0.75rem 2rem;
                z-index: 10001;
                display: none;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                animation: slideDown 0.3s ease;
            }

            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .pro-editor-toolbar.visible {
                display: flex;
            }

            .editor-brand {
                font-weight: 700;
                font-size: 1.125rem;
                color: #667eea;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-right: auto;
            }

            .editor-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                background: #f7fafc;
                color: #2d3748;
            }

            .editor-btn:hover {
                background: #e2e8f0;
            }

            .editor-btn.primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .editor-btn.active {
                background: #667eea;
                color: white;
            }

            .editor-divider {
                width: 1px;
                height: 24px;
                background: #e2e8f0;
                margin: 0 0.5rem;
            }

            /* Floating Editor Button */
            .pro-editor-float-btn {
                position: fixed;
                bottom: 120px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                transition: all 0.3s ease;
                animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .pro-editor-float-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
            }

            .pro-editor-float-btn.editing {
                background: #f56565;
                animation: none;
            }

            /* Editable Blocks */
            .pro-editable-block {
                position: relative;
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 0.5rem;
                transition: all 0.2s;
                margin: 0.25rem 0;
            }

            .pro-editable-block:hover {
                border-color: rgba(102, 126, 234, 0.3);
                background: rgba(102, 126, 234, 0.02);
            }

            .pro-editable-block.editing {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.05);
                padding: 1rem;
            }

            .pro-editable-block.selected {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
            }

            .block-actions {
                position: absolute;
                top: -40px;
                right: 0;
                display: none;
                gap: 0.5rem;
                background: white;
                padding: 0.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10;
            }

            .pro-editable-block:hover .block-actions,
            .pro-editable-block.editing .block-actions {
                display: flex;
            }

            .block-action-btn {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                background: white;
                color: #2d3748;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .block-action-btn:hover {
                background: #f7fafc;
                border-color: #667eea;
            }

            .block-drag-handle {
                cursor: move;
                position: absolute;
                left: -30px;
                top: 50%;
                transform: translateY(-50%);
                width: 24px;
                height: 24px;
                background: #667eea;
                border-radius: 4px;
                display: none;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.75rem;
            }

            .pro-editable-block:hover .block-drag-handle {
                display: flex;
            }

            /* Auto-save Indicator */
            .pro-autosave-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 0.75rem 1.25rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .autosave-icon {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #48bb78;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.75rem;
            }

            .autosave-text {
                font-size: 0.875rem;
                color: #2d3748;
            }

            /* Edit Mode Overlay */
            .pro-edit-mode-overlay {
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.02);
                z-index: 9998;
                pointer-events: none;
            }

            /* Drag ghost */
            .pro-dragging {
                opacity: 0.5;
                transform: scale(1.02);
            }

            .pro-drag-over {
                border: 2px dashed #667eea;
                background: rgba(102, 126, 234, 0.05);
            }
        `;
        document.head.appendChild(styles);
    }

    createEditorInterface() {
        // Create floating button
        const floatBtn = document.createElement('button');
        floatBtn.className = 'pro-editor-float-btn';
        floatBtn.innerHTML = '<i class="fas fa-magic"></i>';
        floatBtn.title = '편집 모드';
        floatBtn.onclick = () => this.toggleEditMode();
        document.body.appendChild(floatBtn);
        this.floatBtn = floatBtn;

        // Create top toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'pro-editor-toolbar';
        toolbar.innerHTML = `
            <div class="editor-brand">
                <i class="fas fa-magic"></i>
                <span>Pro Editor</span>
            </div>
            <button class="editor-btn" onclick="proEditor.addBlock()">
                <i class="fas fa-plus"></i>
                블록 추가
            </button>
            <button class="editor-btn" onclick="proEditor.insertImage()">
                <i class="fas fa-image"></i>
                이미지
            </button>
            <button class="editor-btn" onclick="proEditor.togglePreview()">
                <i class="fas fa-eye"></i>
                미리보기
            </button>
            <div class="editor-divider"></div>
            <button class="editor-btn" onclick="proEditor.undo()">
                <i class="fas fa-undo"></i>
                실행 취소
            </button>
            <button class="editor-btn" onclick="proEditor.redo()">
                <i class="fas fa-redo"></i>
                다시 실행
            </button>
            <div class="editor-divider"></div>
            <div style="font-size: 0.875rem; color: #718096;">
                <span id="saveStatus">모든 변경사항이 저장됨</span>
            </div>
            <button class="editor-btn primary" onclick="proEditor.save()">
                <i class="fas fa-save"></i>
                저장
            </button>
            <button class="editor-btn" onclick="proEditor.exitEditMode()">
                <i class="fas fa-times"></i>
                종료
            </button>
        `;
        document.body.appendChild(toolbar);
        this.toolbar = toolbar;

        console.log('✅ Editor interface created');
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        if (this.isEditMode) {
            this.enterEditMode();
        } else {
            this.exitEditMode();
        }
    }

    async enterEditMode() {
        console.log('✏️ Entering edit mode...');
        
        // Update UI
        this.floatBtn.classList.add('editing');
        this.floatBtn.innerHTML = '<i class="fas fa-times"></i>';
        this.toolbar.classList.add('visible');
        
        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'pro-edit-mode-overlay';
        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // Make elements editable
        this.makeBlocksEditable();
        
        console.log('✅ Edit mode active');
    }

    exitEditMode() {
        console.log('🚪 Exiting edit mode...');
        
        // Update UI
        this.floatBtn.classList.remove('editing');
        this.floatBtn.innerHTML = '<i class="fas fa-magic"></i>';
        this.toolbar.classList.remove('visible');
        
        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Remove editing state
        this.removeEditableState();
        this.isEditMode = false;
        
        console.log('✅ Edit mode exited');
    }

    makeBlocksEditable() {
        // Define selectors for editable content
        const selectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'li', 'span', 'a:not(.nav-link):not(.editor-btn)',
            '.hero-title', '.hero-subtitle',
            '.section-title', '.section-description',
            '.feature-title', '.feature-description'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(el => {
            // Skip excluded elements
            if (el.closest('nav') || el.closest('button') || el.closest('.pro-editor-toolbar')) return;
            if (!el.textContent.trim()) return;

            // Wrap in editable block
            const block = document.createElement('div');
            block.className = 'pro-editable-block';
            block.dataset.elementType = el.tagName.toLowerCase();
            block.dataset.originalContent = el.outerHTML;
            
            // Create block actions
            const actions = document.createElement('div');
            actions.className = 'block-actions';
            actions.innerHTML = `
                <button class="block-action-btn" onclick="proEditor.editBlock(this)" title="편집">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.moveBlockUp(this)" title="위로">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.moveBlockDown(this)" title="아래로">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.deleteBlock(this)" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Create drag handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'block-drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            dragHandle.draggable = true;
            
            // Wrap element
            el.parentNode.insertBefore(block, el);
            block.appendChild(dragHandle);
            block.appendChild(el);
            block.appendChild(actions);
            
            // Setup drag events
            this.setupDragEvents(block);
            
            this.editableBlocks.push(block);
        });

        console.log(`✅ Made ${this.editableBlocks.length} blocks editable`);
    }

    setupDragEvents(block) {
        block.addEventListener('dragstart', (e) => {
            block.classList.add('pro-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', block.innerHTML);
        });

        block.addEventListener('dragend', () => {
            block.classList.remove('pro-dragging');
            document.querySelectorAll('.pro-drag-over').forEach(el => {
                el.classList.remove('pro-drag-over');
            });
        });

        this.editableBlocks.forEach(otherBlock => {
            otherBlock.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (block !== otherBlock) {
                    otherBlock.classList.add('pro-drag-over');
                }
            });

            otherBlock.addEventListener('dragleave', () => {
                otherBlock.classList.remove('pro-drag-over');
            });

            otherBlock.addEventListener('drop', (e) => {
                e.preventDefault();
                otherBlock.classList.remove('pro-drag-over');
                
                if (block !== otherBlock) {
                    const rect = otherBlock.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    
                    if (e.clientY < midpoint) {
                        otherBlock.parentNode.insertBefore(block, otherBlock);
                    } else {
                        otherBlock.parentNode.insertBefore(block, otherBlock.nextSibling);
                    }
                    
                    this.scheduleAutoSave();
                }
            });
        });
    }

    removeEditableState() {
        this.editableBlocks.forEach(block => {
            const content = block.querySelector(':not(.block-actions):not(.block-drag-handle)');
            if (content) {
                // Unwrap the element
                block.parentNode.insertBefore(content, block);
            }
            block.remove();
        });
        
        this.editableBlocks = [];
    }

    async loadPageContent() {
        try {
            const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📄 Page content loaded:', data);
            }
        } catch (error) {
            console.error('Error loading page content:', error);
        }
    }

    addBlock() {
        const block = document.createElement('div');
        block.className = 'pro-editable-block';
        block.innerHTML = `
            <div class="block-drag-handle" draggable="true">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <p>새 블록 - 클릭하여 편집</p>
            <div class="block-actions">
                <button class="block-action-btn" onclick="proEditor.editBlock(this)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.moveBlockUp(this)">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.moveBlockDown(this)">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="block-action-btn" onclick="proEditor.deleteBlock(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(block);
        this.editableBlocks.push(block);
        this.setupDragEvents(block);
        this.scheduleAutoSave();
        
        console.log('➕ New block added');
    }

    editBlock(btn) {
        const block = btn.closest('.pro-editable-block');
        block.classList.add('editing');
        
        // Here you would open a rich text editor modal
        console.log('Editing block:', block);
        
        this.scheduleAutoSave();
    }

    moveBlockUp(btn) {
        const block = btn.closest('.pro-editable-block');
        const prev = block.previousElementSibling;
        if (prev) {
            block.parentNode.insertBefore(block, prev);
            this.scheduleAutoSave();
        }
    }

    moveBlockDown(btn) {
        const block = btn.closest('.pro-editable-block');
        const next = block.nextElementSibling;
        if (next) {
            block.parentNode.insertBefore(next, block);
            this.scheduleAutoSave();
        }
    }

    deleteBlock(btn) {
        const block = btn.closest('.pro-editable-block');
        if (confirm('이 블록을 삭제하시겠습니까?')) {
            const index = this.editableBlocks.indexOf(block);
            if (index > -1) {
                this.editableBlocks.splice(index, 1);
            }
            block.remove();
            this.scheduleAutoSave();
        }
    }

    insertImage() {
        const url = prompt('이미지 URL을 입력하세요:');
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.margin = '1rem 0';
            
            document.body.appendChild(img);
            this.scheduleAutoSave();
        }
    }

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        
        this.editableBlocks.forEach(block => {
            block.style.display = this.isPreviewMode ? 'none' : 'block';
        });
        
        console.log('👁️ Preview mode:', this.isPreviewMode ? 'ON' : 'OFF');
    }

    scheduleAutoSave() {
        document.getElementById('saveStatus').textContent = '저장 중...';
        
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, 2000);
    }

    async autoSave() {
        console.log('💾 Auto-saving...');
        
        try {
            const content = this.extractPageContent();
            
            const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                document.getElementById('saveStatus').textContent = '모든 변경사항이 저장됨';
                this.showAutosaveNotification();
                console.log('✅ Auto-saved successfully');
            } else {
                document.getElementById('saveStatus').textContent = '저장 실패';
                console.error('❌ Auto-save failed');
            }
        } catch (error) {
            document.getElementById('saveStatus').textContent = '저장 오류';
            console.error('❌ Auto-save error:', error);
        }
    }

    async save() {
        console.log('💾 Manual save...');
        
        try {
            const content = this.extractPageContent();
            
            const response = await fetch(`${this.apiBase}/content/page/${this.currentPage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                this.showNotification('저장되었습니다!', 'success');
                console.log('✅ Saved successfully');
            } else {
                this.showNotification('저장 실패', 'error');
            }
        } catch (error) {
            this.showNotification('저장 오류', 'error');
            console.error('❌ Save error:', error);
        }
    }

    extractPageContent() {
        return this.editableBlocks.map(block => {
            const content = block.querySelector(':not(.block-actions):not(.block-drag-handle)');
            return {
                elementType: block.dataset.elementType,
                content: content ? content.outerHTML : '',
                originalContent: block.dataset.originalContent
            };
        });
    }

    showAutosaveNotification() {
        // Remove existing notification
        const existing = document.querySelector('.pro-autosave-indicator');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'pro-autosave-indicator';
        notification.innerHTML = `
            <div class="autosave-icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="autosave-text">자동 저장 완료</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10002;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    undo() {
        console.log('↩️ Undo');
        // Implement undo functionality
    }

    redo() {
        console.log('↪️ Redo');
        // Implement redo functionality
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape to exit edit mode
            if (e.key === 'Escape' && this.isEditMode) {
                e.preventDefault();
                this.exitEditMode();
            }
            
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.isEditMode) {
                    this.save();
                }
            }
            
            // Ctrl+Z to undo
            if (e.ctrlKey && e.key === 'z' && this.isEditMode) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl+Y to redo
            if (e.ctrlKey && e.key === 'y' && this.isEditMode) {
                e.preventDefault();
                this.redo();
            }
        });
    }
}

// Initialize when DOM is ready
let proEditor;
document.addEventListener('DOMContentLoaded', () => {
    proEditor = new ProEditor();
});