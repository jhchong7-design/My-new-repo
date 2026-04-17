/**
 * 시온산교회 Admin Dashboard - Unified JS
 * Commercial Grade CRUD Management System
 */
(function() {
    'use strict';

    const API_BASE = '/api';

    const BOARD_TYPES = {
        notice: { name: '공지사항', icon: 'fa-bell', color: 'blue' },
        korean_bible: { name: '한국사상과성경', icon: 'fa-book', color: 'green' },
        world_bible: { name: '세계사상과성경', icon: 'fa-globe', color: 'purple' },
        books_papers: { name: '책과논문', icon: 'fa-file-alt', color: 'pink' },
        openforum: { name: '열린마당', icon: 'fa-comments', color: 'cyan' },
        board: { name: '게시판', icon: 'fa-list', color: 'indigo' }
    };

    // ============================================
    // STATE
    // ============================================
    let state = {
        token: localStorage.getItem('admin_token') || null,
        user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
        currentPanel: 'dashboard',
        currentBoardType: null,
        posts: [],
        media: [],
        pagination: { currentPage: 1, totalPages: 1, totalPosts: 0 },
        selectedPosts: new Set(),
        editingPost: null,
        stats: {},
        deleteCallback: null,
        searchTimer: null
    };

    // ============================================
    // AUTH
    // ============================================
    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
        };
    }

    async function login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');

        if (!username || !password) {
            errorEl.textContent = '아이디와 비밀번호를 입력해 주세요.';
            errorEl.classList.add('visible');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success && data.token) {
                state.token = data.token;
                state.user = data.user;
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                errorEl.classList.remove('visible');
                showDashboard();
            } else {
                errorEl.textContent = data.message || '로그인에 실패했습니다.';
                errorEl.classList.add('visible');
            }
        } catch (err) {
            errorEl.textContent = '서버 연결에 실패했습니다.';
            errorEl.classList.add('visible');
        }
    }

    function logout() {
        state.token = null;
        state.user = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        showLoginScreen();
    }

    function isLoggedIn() {
        return state.token && state.user;
    }

    // ============================================
    // API FUNCTIONS
    // ============================================
    async function fetchStats() {
        try {
            const res = await fetch(`${API_BASE}/admin/stats`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                state.stats = data.stats;
                renderStats();
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    }

    async function fetchPosts(boardType, page = 1, search = '') {
        try {
            const params = new URLSearchParams({
                boardType: boardType || '',
                page: page,
                limit: 10,
                search: search
            });
            const res = await fetch(`${API_BASE}/posts?${params}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                state.posts = data.posts;
                state.pagination = data.pagination;
                renderPostsTable();
            }
        } catch (err) {
            console.error('Posts fetch error:', err);
        }
    }

    async function fetchPost(postId) {
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) return data.post;
            return null;
        } catch (err) {
            console.error('Post fetch error:', err);
            return null;
        }
    }

    async function createPost(postData) {
        try {
            const res = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(postData)
            });
            const data = await res.json();
            if (data.success) {
                toast('게시글이 작성되었습니다.', 'success');
                fetchPosts(state.currentBoardType, state.pagination.currentPage);
                fetchStats();
                return true;
            } else {
                toast(data.message || '작성에 실패했습니다.', 'error');
                return false;
            }
        } catch (err) {
            toast('서버 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    async function updatePost(postId, postData) {
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(postData)
            });
            const data = await res.json();
            if (data.success) {
                toast('게시글이 수정되었습니다.', 'success');
                fetchPosts(state.currentBoardType, state.pagination.currentPage);
                fetchStats();
                return true;
            } else {
                toast(data.message || '수정에 실패했습니다.', 'error');
                return false;
            }
        } catch (err) {
            toast('서버 오류가 발생했습니다.', 'error');
            return false;
        }
    }

    async function deletePost(postId) {
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                toast('게시글이 삭제되었습니다.', 'success');
                fetchPosts(state.currentBoardType, state.pagination.currentPage);
                fetchStats();
            } else {
                toast(data.message || '삭제에 실패했습니다.', 'error');
            }
        } catch (err) {
            toast('서버 오류가 발생했습니다.', 'error');
        }
    }

    async function bulkDeletePosts() {
        const ids = Array.from(state.selectedPosts);
        let successCount = 0;
        for (const id of ids) {
            try {
                const res = await fetch(`${API_BASE}/posts/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                if (data.success) successCount++;
            } catch (e) { /* skip */ }
        }
        state.selectedPosts.clear();
        toast(`${successCount}개 게시글이 삭제되었습니다.`, 'success');
        fetchPosts(state.currentBoardType, state.pagination.currentPage);
        fetchStats();
        updateBulkActions();
    }

    async function fetchMedia(page = 1) {
        try {
            const res = await fetch(`${API_BASE}/media?page=${page}&limit=20`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                state.media = data.media;
                renderMediaGrid();
            }
        } catch (err) {
            console.error('Media fetch error:', err);
        }
    }

    async function uploadMedia(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const res = await fetch(`${API_BASE}/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast('파일이 업로드되었습니다.', 'success');
                fetchMedia();
                fetchStats();
            } else {
                toast(data.message || '업로드에 실패했습니다.', 'error');
            }
        } catch (err) {
            toast('업로드 중 오류가 발생했습니다.', 'error');
        }
    }

    async function deleteMedia(mediaId) {
        try {
            const res = await fetch(`${API_BASE}/media/${mediaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                toast('미디어가 삭제되었습니다.', 'success');
                fetchMedia();
                fetchStats();
            } else {
                toast(data.message || '삭제에 실패했습니다.', 'error');
            }
        } catch (err) {
            toast('서버 오류가 발생했습니다.', 'error');
        }
    }

    // ============================================
    // UI - SCREENS
    // ============================================
    function showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminLayout').classList.remove('visible');
    }

    function showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminLayout').classList.add('visible');

        if (state.user) {
            document.getElementById('adminUserName').textContent = state.user.name || state.user.username || '관리자';
        }

        fetchStats();
        navigateTo('dashboard');
    }

    function navigateTo(panel, boardType) {
        state.currentPanel = panel;
        state.selectedPosts.clear();
        updateBulkActions();

        // Update active nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        // Hide all panels
        document.querySelectorAll('.panel').forEach(el => el.classList.remove('active'));

        let title = '대시보드';
        let breadcrumb = '관리자 > 대시보드';

        if (panel === 'dashboard') {
            document.getElementById('panelDashboard').classList.add('active');
            document.querySelector('[data-panel="dashboard"]').classList.add('active');
        } else if (panel === 'board' && boardType && BOARD_TYPES[boardType]) {
            state.currentBoardType = boardType;
            document.getElementById('panelBoard').classList.add('active');
            title = BOARD_TYPES[boardType].name + ' 관리';
            breadcrumb = `관리자 > 게시판 > ${BOARD_TYPES[boardType].name}`;
            const navItem = document.querySelector(`[data-board="${boardType}"]`);
            if (navItem) navItem.classList.add('active');
            document.getElementById('boardSearch').value = '';
            fetchPosts(boardType);
        } else if (panel === 'media') {
            document.getElementById('panelMedia').classList.add('active');
            title = '미디어 관리';
            breadcrumb = '관리자 > 미디어';
            document.querySelector('[data-panel="media"]').classList.add('active');
            fetchMedia();
        }

        document.getElementById('topbarTitle').textContent = title;
        document.getElementById('topbarBreadcrumb').textContent = breadcrumb;

        // Close sidebar on mobile
        closeSidebar();
    }

    // ============================================
    // UI - RENDER
    // ============================================
    function renderStats() {
        const s = state.stats;
        setStatValue('statTotalPosts', s.totalPosts || 0);
        setStatValue('statTotalUsers', s.totalUsers || 0);
        setStatValue('statTotalMedia', s.totalMedia || 0);
        setStatValue('statNotice', s.noticeCount || 0);
        setStatValue('statKoreanBible', s.koreanBibleCount || 0);
        setStatValue('statWorldBible', s.worldBibleCount || 0);
        setStatValue('statBooksPapers', s.booksPapersCount || 0);
        setStatValue('statOpenForum', s.openForumCount || 0);

        // Update sidebar badges
        Object.entries(BOARD_TYPES).forEach(([type, info]) => {
            const badge = document.querySelector(`[data-board="${type}"] .nav-badge`);
            if (badge) {
                const countMap = {
                    notice: s.noticeCount,
                    korean_bible: s.koreanBibleCount,
                    world_bible: s.worldBibleCount,
                    books_papers: s.booksPapersCount,
                    openforum: s.openForumCount,
                    board: s.boardCount
                };
                badge.textContent = countMap[type] || 0;
            }
        });
    }

    function setStatValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function renderPostsTable() {
        const tbody = document.getElementById('postsTableBody');
        if (!tbody) return;

        if (state.posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>게시글이 없습니다</h3>
                <p>새 게시글을 작성해 보세요</p>
            </div></td></tr>`;
            renderPagination();
            return;
        }

        tbody.innerHTML = state.posts.map(post => {
            const bt = BOARD_TYPES[post.boardType] || { name: post.boardType, color: 'blue' };
            const checked = state.selectedPosts.has(post._id) ? 'checked' : '';
            const pinnedBadge = post.isPinned ? `<span class="badge badge-pinned"><i class="fas fa-thumbtack"></i></span>` : '';
            return `<tr>
                <td><input type="checkbox" class="table-checkbox" value="${post._id}" ${checked} onchange="AdminApp.togglePostSelect('${post._id}', this.checked)"></td>
                <td><span class="table-title" onclick="AdminApp.openViewModal('${post._id}')">${escapeHtml(post.title)}</span> ${pinnedBadge}</td>
                <td><span class="badge badge-${bt.color}">${escapeHtml(post.category || bt.name)}</span></td>
                <td>${escapeHtml(post.author || '-')}</td>
                <td>${post.views || 0}</td>
                <td>${formatDate(post.createdAt)}</td>
                <td><div class="action-btns">
                    <button class="action-btn view" title="보기" onclick="AdminApp.openViewModal('${post._id}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="수정" onclick="AdminApp.openEditModal('${post._id}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="삭제" onclick="AdminApp.showConfirmDelete('${post._id}')"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`;
        }).join('');

        renderPagination();
    }

    function renderPagination() {
        const container = document.getElementById('boardPagination');
        if (!container) return;

        const { currentPage, totalPages, totalPosts } = state.pagination;
        if (totalPages <= 1) {
            container.innerHTML = totalPosts > 0 ? `<span class="page-info">총 ${totalPosts}개</span>` : '';
            return;
        }

        let html = `<button class="page-btn" onclick="AdminApp.goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="AdminApp.goToPage(${i})">${i}</button>`;
        }

        html += `<button class="page-btn" onclick="AdminApp.goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        html += `<span class="page-info">총 ${totalPosts}개</span>`;

        container.innerHTML = html;
    }

    function renderMediaGrid() {
        const grid = document.getElementById('mediaGrid');
        if (!grid) return;

        if (state.media.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-images"></i>
                <h3>미디어가 없습니다</h3>
                <p>파일을 업로드해 보세요</p>
            </div>`;
            return;
        }

        grid.innerHTML = state.media.map(m => `
            <div class="media-card">
                <img src="${m.url}" alt="${escapeHtml(m.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22><rect fill=%22%23f0f2f5%22 width=%22200%22 height=%22150%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2394a3b8%22 font-size=%2214%22>${m.mediaType}</text></svg>'">
                <div class="media-card-info">
                    <h4>${escapeHtml(m.title)}</h4>
                    <p>${formatDate(m.createdAt)} · ${m.mediaType}</p>
                </div>
                <div class="media-card-actions">
                    <button class="action-btn delete" title="삭제" onclick="AdminApp.showConfirmDeleteMedia('${m._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // MODALS
    // ============================================
    function openCreateModal() {
        state.editingPost = null;
        document.getElementById('modalTitle').textContent = '새 게시글 작성';
        document.getElementById('postId').value = '';
        document.getElementById('postBoardType').value = state.currentBoardType || 'notice';
        document.getElementById('postCategory').value = '';
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('postVideoUrl').value = '';
        document.getElementById('postPinned').checked = false;
        clearTags();
        document.getElementById('postModal').classList.add('visible');
    }

    async function openEditModal(postId) {
        const post = await fetchPost(postId);
        if (!post) {
            toast('게시글을 불러올 수 없습니다.', 'error');
            return;
        }

        state.editingPost = post;
        document.getElementById('modalTitle').textContent = '게시글 수정';
        document.getElementById('postId').value = post._id;
        document.getElementById('postBoardType').value = post.boardType || 'notice';
        document.getElementById('postCategory').value = post.category || '';
        document.getElementById('postTitle').value = post.title || '';
        document.getElementById('postContent').value = post.content || '';
        document.getElementById('postVideoUrl').value = post.videoUrl || '';
        document.getElementById('postPinned').checked = post.isPinned || false;

        clearTags();
        if (post.tags && post.tags.length) {
            post.tags.forEach(tag => addTagElement(tag));
        }

        document.getElementById('postModal').classList.add('visible');
    }

    async function openViewModal(postId) {
        const post = await fetchPost(postId);
        if (!post) {
            toast('게시글을 불러올 수 없습니다.', 'error');
            return;
        }

        document.getElementById('viewTitle').textContent = post.title;
        document.getElementById('viewMeta').innerHTML = `
            <span><i class="fas fa-user"></i> ${escapeHtml(post.author || '-')}</span>
            <span><i class="fas fa-folder"></i> ${escapeHtml(post.category || '-')}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
            <span><i class="fas fa-eye"></i> ${post.views || 0}회</span>
            ${post.isPinned ? '<span><i class="fas fa-thumbtack"></i> 고정됨</span>' : ''}
        `;
        document.getElementById('viewContent').textContent = post.content || '';

        const tagsHtml = (post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
        document.getElementById('viewTags').innerHTML = tagsHtml;

        document.getElementById('viewEditBtn').onclick = function() {
            closeViewModal();
            openEditModal(postId);
        };

        document.getElementById('viewModal').classList.add('visible');
    }

    function closeModal() {
        document.getElementById('postModal').classList.remove('visible');
        state.editingPost = null;
    }

    function closeViewModal() {
        document.getElementById('viewModal').classList.remove('visible');
    }

    // ============================================
    // FORM HANDLING
    // ============================================
    async function handlePostSubmit() {
        const postData = {
            boardType: document.getElementById('postBoardType').value,
            category: document.getElementById('postCategory').value || '일반',
            title: document.getElementById('postTitle').value.trim(),
            content: document.getElementById('postContent').value.trim(),
            videoUrl: document.getElementById('postVideoUrl').value.trim(),
            isPinned: document.getElementById('postPinned').checked,
            tags: getTagsFromContainer()
        };

        if (!postData.title || !postData.content) {
            toast('제목과 내용을 입력해 주세요.', 'error');
            return;
        }

        const postId = document.getElementById('postId').value;
        let success;

        if (postId) {
            success = await updatePost(postId, postData);
        } else {
            success = await createPost(postData);
        }

        if (success) {
            closeModal();
        }
    }

    // ============================================
    // TAGS
    // ============================================
    function getTagsFromContainer() {
        const tags = [];
        document.querySelectorAll('#tagsContainer .tag-item').forEach(el => {
            const text = el.querySelector('span').textContent.trim();
            if (text) tags.push(text);
        });
        return tags;
    }

    function handleTagKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = event.target;
            const tag = input.value.trim();
            if (tag) {
                addTagElement(tag);
                input.value = '';
            }
        }
    }

    function addTagElement(tag) {
        const container = document.getElementById('tagsContainer');
        const input = document.getElementById('tagInput');
        const el = document.createElement('span');
        el.className = 'tag-item';
        el.innerHTML = `<span>${escapeHtml(tag)}</span><span class="tag-remove" onclick="this.parentElement.remove()">×</span>`;
        container.insertBefore(el, input);
    }

    function clearTags() {
        document.querySelectorAll('#tagsContainer .tag-item').forEach(el => el.remove());
    }

    // ============================================
    // SELECTION & BULK
    // ============================================
    function togglePostSelect(postId, checked) {
        if (checked) {
            state.selectedPosts.add(postId);
        } else {
            state.selectedPosts.delete(postId);
        }
        updateBulkActions();
    }

    function toggleSelectAll(checkbox) {
        state.posts.forEach(post => {
            if (checkbox.checked) {
                state.selectedPosts.add(post._id);
            } else {
                state.selectedPosts.delete(post._id);
            }
        });
        renderPostsTable();
        updateBulkActions();
    }

    function updateBulkActions() {
        const el = document.getElementById('bulkActions');
        const countEl = document.getElementById('selectedCount');
        if (state.selectedPosts.size > 0) {
            el.classList.add('visible');
            countEl.textContent = `${state.selectedPosts.size}개 선택됨`;
        } else {
            el.classList.remove('visible');
        }
    }

    function bulkDelete() {
        if (state.selectedPosts.size === 0) return;
        showConfirmDialog(`${state.selectedPosts.size}개의 게시글을 삭제하시겠습니까?`, () => {
            bulkDeletePosts();
        });
    }

    // ============================================
    // CONFIRM DIALOG
    // ============================================
    function showConfirmDelete(postId) {
        showConfirmDialog('이 게시글을 삭제하시겠습니까?', () => {
            deletePost(postId);
        });
    }

    function showConfirmDeleteMedia(mediaId) {
        showConfirmDialog('이 미디어를 삭제하시겠습니까?', () => {
            deleteMedia(mediaId);
        });
    }

    function showConfirmDialog(message, callback) {
        state.deleteCallback = callback;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmOverlay').classList.add('visible');
    }

    function confirmDeleteAction() {
        document.getElementById('confirmOverlay').classList.remove('visible');
        if (state.deleteCallback) {
            state.deleteCallback();
            state.deleteCallback = null;
        }
    }

    function cancelDelete() {
        document.getElementById('confirmOverlay').classList.remove('visible');
        state.deleteCallback = null;
    }

    // ============================================
    // MEDIA UPLOAD
    // ============================================
    function handleFileUpload(input) {
        if (input.files && input.files[0]) {
            uploadMedia(input.files[0]);
            input.value = '';
        }
    }

    function setupDragDrop() {
        const zone = document.getElementById('uploadZone');
        if (!zone) return;

        ['dragenter', 'dragover'].forEach(event => {
            zone.addEventListener(event, (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(event => {
            zone.addEventListener(event, (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
            });
        });

        zone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                uploadMedia(e.dataTransfer.files[0]);
            }
        });
    }

    // ============================================
    // SEARCH
    // ============================================
    function handleSearch(value) {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => {
            fetchPosts(state.currentBoardType, 1, value);
        }, 400);
    }

    // ============================================
    // PAGINATION
    // ============================================
    function goToPage(page) {
        if (page < 1 || page > state.pagination.totalPages) return;
        const search = document.getElementById('boardSearch').value;
        fetchPosts(state.currentBoardType, page, search);
    }

    // ============================================
    // SIDEBAR (MOBILE)
    // ============================================
    function toggleSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
    }

    // ============================================
    // UTILITIES
    // ============================================
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;
        container.appendChild(el);

        setTimeout(() => {
            el.classList.add('removing');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Login form
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                login();
            });
        }

        // Sidebar overlay click
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        // Drag and drop
        setupDragDrop();

        // Check if already logged in
        if (isLoggedIn()) {
            showDashboard();
        } else {
            showLoginScreen();
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================
    // PUBLIC API
    // ============================================
    window.AdminApp = {
        navigateTo,
        logout,
        openCreateModal,
        openEditModal,
        openViewModal,
        closeModal,
        closeViewModal,
        handlePostSubmit,
        handleTagKey,
        togglePostSelect,
        toggleSelectAll,
        bulkDelete,
        showConfirmDelete,
        showConfirmDeleteMedia,
        confirmDeleteAction,
        cancelDelete,
        handleSearch,
        goToPage,
        handleFileUpload,
        toggleSidebar
    };

})();