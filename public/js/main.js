/**
 * Bible Glocal - Main JavaScript
 * Handles recent posts loading, authentication, and UI interactions
 */

const API_BASE = (typeof BG_CONFIG !== 'undefined' && BG_CONFIG.API_BASE) ? BG_CONFIG.API_BASE : (window.location.origin + '/api');

// Global state
let currentUser = null;
let recentPosts = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Dismiss preloader immediately (guard against infinite loading)
    hidePreloader();

    loadRecentPosts();
    checkAuthStatus();
    initializeMobileMenu();
    initializeSearch();
    initializeScrollEffects();
});

// Belt-and-suspenders: also dismiss on window load and hard fallback
window.addEventListener('load', hidePreloader);
setTimeout(hidePreloader, 3000); // Hard fallback after 3s no matter what

function hidePreloader() {
    const p = document.getElementById('preloader');
    if (p) {
        p.classList.add('hidden');
        // Remove from DOM after transition completes to prevent any blocking
        setTimeout(() => {
            if (p && p.parentNode) p.parentNode.removeChild(p);
        }, 700);
    }
}

/**
 * Load recent posts from API
 */
async function loadRecentPosts() {
    // Skip API on static deployments
    if (typeof BG_CONFIG !== 'undefined' && BG_CONFIG.isStaticDeploy) {
        displaySamplePosts();
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/posts/recent`);
        const result = await response.json();
        
        if (result.success && result.data) {
            recentPosts = result.data;
            displayRecentPosts(result.data);
        } else {
            displaySamplePosts();
        }
    } catch (error) {
        console.error('Error loading recent posts:', error);
        displaySamplePosts();
    }
}

/**
 * Display recent posts in their respective categories
 */
function displayRecentPosts(posts) {
    console.log('Displaying posts:', posts);
    
    // Handle the API response format
    if (posts.korean_thought) {
        displayCategoryPosts('korean-thought-posts', posts.korean_thought.posts);
    } else {
        displayCategoryPosts('korean-thought-posts', []);
    }
    
    if (posts.world_thought) {
        displayCategoryPosts('world-thought-posts', posts.world_thought.posts);
    } else {
        displayCategoryPosts('world-thought-posts', []);
    }
    
    if (posts.publications) {
        displayCategoryPosts('publications-posts', posts.publications.posts);
    } else {
        displayCategoryPosts('publications-posts', []);
    }
    
    if (posts.forum) {
        displayCategoryPosts('forum-posts', posts.forum.posts);
    } else {
        displayCategoryPosts('forum-posts', []);
    }
    
    if (posts.notices) {
        displayCategoryPosts('notices-posts', posts.notices.posts);
    } else {
        displayCategoryPosts('notices-posts', []);
    }
    
    if (posts.discussion) {
        displayCategoryPosts('board-posts', posts.discussion.posts);
    } else {
        displayCategoryPosts('board-posts', []);
    }
    
    if (posts.media) {
        displayCategoryPosts('media-posts', posts.media.posts);
    } else {
        displayCategoryPosts('media-posts', []);
    }
}

/**
 * Display posts in a specific container
 */
function displayCategoryPosts(containerId, posts) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('Container not found:', containerId);
        return;
    }

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts">
                <p>아직 게시물이 없습니다.</p>
            </div>
        `;
        console.log('No posts for container:', containerId);
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="recent-post">
            <div class="post-meta">
                <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
                <span class="post-author">${post.author_name || '관리자'}</span>
            </div>
            <a href="post.html?id=${post.id}" class="post-title">${post.title}</a>
            <p class="post-excerpt">${truncateText(post.excerpt || post.content, 100)}</p>
        </article>
    `).join('');
    
    console.log(`Displayed ${posts.length} posts in container:`, containerId);
}

/**
 * Display sample posts when API is unavailable
 */
function displaySamplePosts() {
    const samplePosts = [
        { id: 1, title: '한국 성경 수용사 연구', category: 'korean-thought', author: '정중호', created_at: new Date().toISOString(), content: '한국 역사 속에서 성경이 어떻게 수용되고 해석되었는지를 탐구합니다.' },
        { id: 2, title: '세계 사상과 성경의 비교', category: 'world-thought', author: '정중호', created_at: new Date().toISOString(), content: '동서양의 다양한 사상 체계와 성경의 비교 연구입니다.' },
        { id: 3, title: '구약학 연구 방법론', category: 'publications', author: '정중호', created_at: new Date().toISOString(), content: '구약학 연구의 최신 방법론을 소개합니다.' },
        { id: 4, title: '제12차 성경학술대회 개최', category: 'notices', author: '운영진', created_at: new Date().toISOString(), content: '올해 성경학술대회가 다음 달에 개최됩니다.' },
        { id: 5, title: '성경 본문 해석 토론', category: 'board', author: '회원', created_at: new Date().toISOString(), content: '특정 본문에 대한 다양한 해석을 나눕니다.' },
        { id: 6, title: '연구 발표 영상', category: 'media', author: '정중호', created_at: new Date().toISOString(), content: '최근 연구 발표회 영상을 공유합니다.' },
        { id: 7, title: '학술지 논문 게재 안내', category: 'forum', author: '편집부', created_at: new Date().toISOString(), content: '새로운 학술지 논문 게재 안내입니다.' }
    ];

    displayRecentPosts(samplePosts);
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showLoginButton();
            return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            showUserInfo(currentUser);
        } else {
            localStorage.removeItem('auth_token');
            showLoginButton();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLoginButton();
    }
}

/**
 * Show login/register buttons
 */
function showLoginButton() {
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
 * Show user info and logout button
 */
function showUserInfo(user) {
    const authArea = document.querySelector('.auth-area');
    const mobileAuthArea = document.querySelector('.mobile-auth-area');
    
    const authHTML = `
        <div class="user-info">
            <span class="user-name">${user.username || user.email}</span>
            <a href="profile.html" class="btn btn-sm">프로필</a>
            ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-sm btn-primary">관리자</a>' : ''}
            <button class="btn btn-sm" onclick="logout()">로그아웃</button>
        </div>
    `;
    
    if (authArea) authArea.innerHTML = authHTML;
    if (mobileAuthArea) mobileAuthArea.innerHTML = authHTML;
}

/**
 * Logout user
 */
async function logout() {
    try {
        const token = localStorage.getItem('auth_token');
        if (token) {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('auth_token');
    currentUser = null;
    location.reload();
}

/**
 * Initialize mobile menu
 */
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (!menuToggle || !mobileNav) return;

    function toggleMenu() {
        mobileNav.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', toggleMenu);
    mobileNavOverlay.addEventListener('click', toggleMenu);

    // Handle submenu toggles
    const subMenuToggles = document.querySelectorAll('.has-submenu > a');
    subMenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const subMenu = toggle.nextElementSibling;
            toggle.parentElement.classList.toggle('open');
            if (subMenu) {
                subMenu.classList.toggle('active');
            }
        });
    });
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `forum.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    });
}

/**
 * Initialize scroll effects
 */
function initializeScrollEffects() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Expose logout function globally
window.logout = logout;