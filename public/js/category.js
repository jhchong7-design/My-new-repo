/**
 * Bible Glocal - Category Pages JavaScript
 * Handles dynamic content loading for category pages
 */

const API_BASE = window.location.origin + '/api';

// Get current page category
const getPageCategory = () => {
    const path = window.location.pathname;
    if (path.includes('korean-thought')) return 'korean_thought';
    if (path.includes('world-thought')) return 'world_thought';
    if (path.includes('publications')) return 'publications';
    if (path.includes('forum')) return 'forum';
    if (path.includes('notices')) return 'notices';
    if (path.includes('board')) return 'discussion';
    if (path.includes('media')) return 'media';
    return 'forum';
};

// Global state
let currentPage = 1;
let postsPerPage = 10;
let currentCategory = getPageCategory();
let allPosts = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategoryPosts();
    initializePagination();
    initializeFilters();
    initializeSearch();
    checkAuthStatus();
});

/**
 * Load posts for current category
 */
async function loadCategoryPosts() {
    try {
        const response = await fetch(`${API_BASE}/posts/recent`);
        const result = await response.json();
        
        if (result.success && result.data) {
            // Get posts for current category
            const categoryKey = currentCategory;
            if (result.data[categoryKey] && result.data[categoryKey].posts) {
                allPosts = result.data[categoryKey].posts;
                displayPosts(allPosts);
                updatePagination();
            } else {
                // Try to get all posts if category not found
                const allPostsResponse = await fetch(`${API_BASE}/posts`);
                const allPostsResult = await allPostsResponse.json();
                if (allPostsResult.success && allPostsResult.data) {
                    allPosts = allPostsResult.data.filter(post => 
                        post.category === currentCategory || 
                        post.category === categoryKey
                    );
                    displayPosts(allPosts);
                    updatePagination();
                }
            }
        } else {
            displayNoPosts();
        }
    } catch (error) {
        console.error('Error loading category posts:', error);
        displayNoPosts();
    }
}

/**
 * Display posts
 */
function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;

    if (!posts || posts.length === 0) {
        displayNoPosts();
        return;
    }

    // Pagination
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    container.innerHTML = paginatedPosts.map(post => `
        <article class="category-post">
            ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-thumbnail">` : ''}
            <div class="post-content">
                <div class="post-meta">
                    <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
                    <span class="post-author">${post.author_name || '관리자'}</span>
                </div>
                <h3><a href="post.html?id=${post.id}">${post.title}</a></h3>
                <p class="post-excerpt">${truncateText(post.excerpt || post.content, 200)}</p>
                ${post.tags ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
        </article>
    `).join('');
}

/**
 * Display no posts message
 */
function displayNoPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    container.innerHTML = `
        <div class="no-posts-message">
            <h3>아직 게시물이 없습니다</h3>
            <p>이 카테고리에는 아직 게시된 글이 없습니다.</p>
            ${currentUser && currentUser.role === 'admin' ? `
                <a href="admin.html" class="btn btn-primary">
                    <span class="icon">➕</span>
                    새 게시물 작성하기
                </a>
            ` : ''}
        </div>
    `;
}

/**
 * Initialize pagination
 */
function initializePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayPosts(allPosts);
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allPosts.length / postsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayPosts(allPosts);
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

/**
 * Update pagination UI
 */
function updatePagination() {
    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `페이지 ${currentPage} / ${totalPages || 1}`;
}

/**
 * Initialize filters
 */
function initializeFilters() {
    const dateFilter = document.getElementById('date-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

/**
 * Apply filters
 */
function applyFilters() {
    let filteredPosts = [...allPosts];

    const dateFilter = document.getElementById('date-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (dateFilter && dateFilter.value !== 'all') {
        const now = new Date();
        filteredPosts = filteredPosts.filter(post => {
            const postDate = new Date(post.created_at);
            const daysDiff = (now - postDate) / (1000 * 60 * 60 * 24);
            
            switch (dateFilter.value) {
                case '7days': return daysDiff <= 7;
                case '30days': return daysDiff <= 30;
                case '90days': return daysDiff <= 90;
                case '1year': return daysDiff <= 365;
                default: return true;
            }
        });
    }

    if (sortFilter) {
        switch (sortFilter.value) {
            case 'newest':
                filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                filteredPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title':
                filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }

    currentPage = 1;
    allPosts = filteredPosts;
    displayPosts(allPosts);
    updatePagination();
}

/**
 * Initialize search
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) {
                performSearch(searchInput.value);
            }
        });
    }

    // Check URL params for search
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && searchInput) {
        searchInput.value = searchQuery;
        performSearch(searchQuery);
    }
}

/**
 * Perform search
 */
function performSearch(query) {
    if (!query.trim()) {
        loadCategoryPosts();
        return;
    }

    const filteredPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(query.toLowerCase())) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query.toLowerCase()))
    );

    currentPage = 1;
    allPosts = filteredPosts;
    displayPosts(allPosts);
    updatePagination();
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            displayAuthButtons();
            return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            window.currentUser = result.user;
            currentUser = result.user;
            displayUserInfo(result.user);
        } else {
            localStorage.removeItem('auth_token');
            displayAuthButtons();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        displayAuthButtons();
    }
}

/**
 * Display auth buttons
 */
function displayAuthButtons() {
    const authArea = document.querySelector('.auth-area');
    const mobileAuthArea = document.querySelector('.mobile-auth-area');
    
    const authHTML = `
        <div class="auth-buttons">
            <a href="login.html" class="btn btn-sm">로그인</a>
            <a href="register.html" class="btn btn-sm btn-primary">회원가입</a>
        </div>
    `;
    
    if (authArea) authArea.innerHTML = authHTML;
    if (mobileAuthArea) mobileAuthArea.innerHTML = authHTML;
}

/**
 * Display user info
 */
function displayUserInfo(user) {
    const authArea = document.querySelector('.auth-area');
    const mobileAuthArea = document.querySelector('.mobile-auth-area');
    
    const authHTML = `
        <div class="user-info">
            <span class="user-name">${user.username || user.email}</span>
            <a href="profile.html" class="btn btn-sm">프로필</a>
            ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-sm btn-primary">관리자</a>' : ''}
            <button class="btn btn-sm" onclick="window.location.href=\'/api/auth/logout\'">로그아웃</button>
        </div>
    `;
    
    if (authArea) authArea.innerHTML = authHTML;
    if (mobileAuthArea) mobileAuthArea.innerHTML = authHTML;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}