/*
 * Bible Study Website - Main JavaScript
 * Commercial Grade Functionality
 */

// API Base URL - Auto-detect current origin
const API_BASE = `${window.location.origin}/api`;

// State Management
let currentUser = null;
let authToken = null;
let refreshInterval = null;

// Category Mappings
const CATEGORIES = {
  korean_thought: {
    name: '한국사상과성경',
    icon: '📖',
    iconClass: 'korean-thought',
    elementId: 'korean-thought-posts'
  },
  world_thought: {
    name: '세계사상과성경',
    icon: '🌍',
    iconClass: 'world-thought',
    elementId: 'world-thought-posts'
  },
  publications: {
    name: '책과논문',
    icon: '📚',
    iconClass: 'books',
    elementId: 'publications-posts'
  },
  forum: {
    name: '열린마당',
    icon: '💬',
    iconClass: 'forum',
    elementId: 'forum-posts'
  },
  announcements: {
    name: '공지사항',
    icon: '📢',
    iconClass: 'announcements',
    elementId: 'announcements-posts'
  },
  general: {
    name: '게시판',
    icon: '📋',
    iconClass: 'general',
    elementId: 'general-posts'
  },
  media: {
    name: '이미지&동영상',
    icon: '🎬',
    iconClass: 'media',
    elementId: 'media-posts'
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initializeMobileMenu();
  initializeScrollToTop();
  initializeSmoothScroll();
  checkAuthStatus();
  loadRecentPosts();
  
  // Auto-refresh every 5 minutes
  refreshInterval = setInterval(loadRecentPosts, 300000);
});

// Initialize App
function initializeApp() {
  console.log('Bible Website initialized');
}

// Mobile Menu Toggle
function initializeMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navbarNav = document.getElementById('navbarNav');
  
  if (menuToggle && navbarNav) {
    menuToggle.addEventListener('click', () => {
      navbarNav.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navbarNav.contains(e.target) && !menuToggle.contains(e.target)) {
        navbarNav.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }
}

// Scroll to Top Button
function initializeScrollToTop() {
  const scrollTopBtn = document.getElementById('scrollTop');
  
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });
    
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// Smooth Scroll
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Check Authentication Status
function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  
  if (token && user) {
    authToken = token;
    currentUser = JSON.parse(user);
    updateUIForLoggedInUser();
    
    // Verify token with server
    verifyToken();
  }
}

// Verify Token
async function verifyToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      handleLogout();
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    handleLogout();
  }
}

// Update UI for Logged In User
function updateUIForLoggedInUser() {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const adminDashboard = document.getElementById('adminDashboard');
  
  if (loginBtn) {
    loginBtn.textContent = currentUser.display_name || currentUser.username;
    loginBtn.onclick = openUserProfileModal;
    loginBtn.className = 'btn btn-primary';
    loginBtn.style.marginLeft = '8px';
  }
  
  if (registerBtn) {
    registerBtn.textContent = '로그아웃';
    registerBtn.onclick = handleLogout;
    registerBtn.className = 'btn btn-ghost';
    registerBtn.style.color = 'white';
    registerBtn.style.marginLeft = '8px';
  }
  
  // Show admin dashboard if user is admin
  if (adminDashboard && currentUser.role === 'admin') {
    adminDashboard.style.display = 'block';
    loadAdminStats();
  }
}

// Load Recent Posts
async function loadRecentPosts() {
  try {
    const response = await fetch(`${API_BASE}/posts/recent`);
    const result = await response.json();
    
    if (result.success && result.data) {
      displayRecentPosts(result.data);
    }
  } catch (error) {
    console.error('Failed to load recent posts:', error);
  }
}

// Display Recent Posts
function displayRecentPosts(categoriesData) {
  const postsGrid = document.getElementById('postsGrid');
  
  if (!postsGrid) return;
  
  postsGrid.innerHTML = '';
  
  Object.keys(CATEGORIES).forEach(categoryKey => {
    const category = CATEGORIES[categoryKey];
    const categoryData = categoriesData[categoryKey] || { posts: [] };
    
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.dataset.category = categoryKey;
    
    categoryCard.innerHTML = `
      <div class="category-header">
        <div class="category-icon ${category.iconClass}">${category.icon}</div>
        <h3 class="category-title">${category.name}</h3>
      </div>
      <div class="category-posts">
        ${categoryData.posts && categoryData.posts.length > 0 
          ? categoryData.posts.map(post => createPostItemHTML(post)).join('')
          : '<div class="empty-state">아직 게시글이 없습니다</div>'
        }
      </div>
    `;
    
    postsGrid.appendChild(categoryCard);
  });
}

// Create Post Item HTML
function createPostItemHTML(post) {
  const createdAt = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <div class="post-item" onclick="viewPost(${post.id})">
      <h4 class="post-title">${escapeHTML(post.title)}</h4>
      <div class="post-meta">
        <span>👤 ${escapeHTML(post.author_name)}</span>
        <span>📅 ${createdAt}</span>
      </div>
    </div>
  `;
}

// View Post
function viewPost(postId) {
  // Navigate to post detail page
  window.location.href = `post.html?id=${postId}`;
}

// Load Admin Statistics
async function loadAdminStats() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      document.getElementById('totalPosts').textContent = result.data.posts || 0;
      document.getElementById('totalUsers').textContent = result.data.users || 0;
      document.getElementById('totalVisits').textContent = result.data.visits || 0;
    }
  } catch (error) {
    console.error('Failed to load admin stats:', error);
  }
}

// Authentication Modals
function openLoginModal() {
  document.getElementById('authModal').classList.add('active');
  switchAuthTab('login');
}

function openRegistrationModal() {
  document.getElementById('authModal').classList.add('active');
  switchAuthTab('register');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');
  
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    tabs[0].classList.add('active');
  } else {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    tabs[1].classList.add('active');
  }
}

// Handle Login
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!email || !password) {
    errorDiv.textContent = '이메일과 비밀번호를 입력해주세요.';
    return;
  }
  
  errorDiv.textContent = '로그인 중...';
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      authToken = result.token;
      currentUser = result.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      closeAuthModal();
      updateUIForLoggedInUser();
      loadRecentPosts();
      
      errorDiv.textContent = '';
      alert('로그인 성공!');
    } else {
      errorDiv.textContent = result.error_kr || result.error || '로그인에 실패했습니다.';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = '로그인 중 오류가 발생했습니다.';
  }
}

// Handle Registration
async function handleRegister() {
  const email = document.getElementById('registerEmail').value.trim();
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const errorDiv = document.getElementById('registerError');
  
  if (!email || !name || !password || !passwordConfirm) {
    errorDiv.textContent = '모든 필드를 입력해주세요.';
    return;
  }
  
  if (password !== passwordConfirm) {
    errorDiv.textContent = '비밀번호가 일치하지 않습니다.';
    return;
  }
  
  if (password.length < 6) {
    errorDiv.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
    return;
  }
  
  errorDiv.textContent = '회원가입 중...';
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        username: name,
        password,
        display_name: name
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Auto-login after registration
      authToken = result.token;
      currentUser = result.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      closeAuthModal();
      updateUIForLoggedInUser();
      
      errorDiv.textContent = '';
      alert('회원가입 성공! 환영합니다!');
    } else {
      errorDiv.textContent = result.error_kr || result.error || '회원가입에 실패했습니다.';
    }
  } catch (error) {
    console.error('Registration error:', error);
    errorDiv.textContent = '회원가입 중 오류가 발생했습니다.';
  }
}

// Handle Logout
function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  
  location.reload();
}

// User Profile Modal
function openUserProfileModal() {
  alert(`사용자: ${currentUser.display_name}\n이메일: ${currentUser.email}\n역할: ${currentUser.role === 'admin' ? '관리자' : '회원'}`);
}

// Quick Post Modal
function openQuickPostModal() {
  document.getElementById('quickPostModal').classList.add('active');
}

function closeQuickPostModal() {
  document.getElementById('quickPostModal').classList.remove('active');
}

// Handle Quick Post
async function handleQuickPost() {
  const category = document.getElementById('quickPostCategory').value;
  const title = document.getElementById('quickPostTitle').value.trim();
  const content = document.getElementById('quickPostContent').value.trim();
  
  if (!category || !title || !content) {
    alert('모든 필드를 입력해주세요.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        content,
        category,
        is_published: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      closeQuickPostModal();
      loadRecentPosts();
      
      // Clear form
      document.getElementById('quickPostTitle').value = '';
      document.getElementById('quickPostContent').value = '';
      
      alert('게시글이 등록되었습니다!');
    } else {
      alert(result.error_kr || result.error || '게시글 등록에 실패했습니다.');
    }
  } catch (error) {
    console.error('Quick post error:', error);
    alert('게시글 등록 중 오류가 발생했습니다.');
  }
}

// Utility Functions
function escapeHTML(str) {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

// Load Categories
function loadCategories() {
  // Navigation link handlers are already in HTML
  // Additional category-specific logic can be added here
}

// Initialize category page if needed
if (window.location.pathname.includes('index-completed')) {
  // This is the homepage
  loadRecentPosts();
}

// Event Listeners for Auth Buttons
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  
  if (loginBtn && !currentUser) {
    loginBtn.addEventListener('click', openLoginModal);
  }
  
  if (registerBtn && !currentUser) {
    registerBtn.addEventListener('click', openRegistrationModal);
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Close modal on Escape
  if (e.key === 'Escape') {
    closeAuthModal();
    closeQuickPostModal();
  }
});

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});