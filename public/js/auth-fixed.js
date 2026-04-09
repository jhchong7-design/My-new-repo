/* ============================================
   Bible Glocal — Authentication Module (FIXED)
   Works with both local server and static preview
   ============================================ */

const BG_AUTH = {
  user: null,
  token: null,

  // Detect if running on static preview or local server
  isLocalServer() {
    // Check if we're on localhost
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  },

  // Get API base URL
  getApiBase() {
    if (this.isLocalServer()) {
      return '';
    }
    return ''; // For static preview, no backend available
  },

  // Check if API is available
  isApiAvailable() {
    return this.isLocalServer();
  },

  // Get base path for links
  getBasePath() {
    const p = window.location.pathname;
    if (p.includes('/en/')) return '../';
    return '';
  },

  // Show error message
  showError(message) {
    if (typeof showNotification === 'function') {
      showNotification(message, 'error');
    } else {
      alert(message);
    }
  },

  // Show success message
  showSuccess(message) {
    if (typeof showNotification === 'function') {
      showNotification(message, 'success');
    } else {
      alert(message);
    }
  },

  // Initialize auth state
  async init() {
    if (!this.isApiAvailable()) {
      // Static preview - show message
      console.log('Running in static preview mode - authentication disabled');
      this.updateUI();
      return false;
    }

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          this.user = data.user;
          this.updateUI();
          this.initDropdowns();
          return true;
        }
      }
    } catch (e) {
      console.log('Not logged in', e);
    }
    this.user = null;
    this.updateUI();
    return false;
  },

  // Login
  async login(email, password) {
    // Check if API is available
    if (!this.isApiAvailable()) {
      const isEn = this.isEnglish();
      const msg = isEn
        ? 'Login is not available in static preview mode. Please use the local server for testing.\n\nFor full functionality, access the site at: http://localhost:3000'
        : '로그인은 정적 미리보기 모드에서 사용할 수 없습니다. 테스트를 위해 로컬 서버를 사용해주세요.\n\n전체 기능을 위해 다음 주소에 접속하세요: http://localhost:3000';
      return { success: false, error: 'Static preview mode', error_kr: '정적 미리보기 모드' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (data.success) {
        this.user = data.user;
        this.token = data.token;
        this.updateUI();
        return { success: true, user: data.user };
      } else {
        return data;
      }
    } catch (e) {
      const isEn = this.isEnglish();
      return {
        success: false,
        error: 'Server connection error. Please try again.',
        error_kr: '서버 연결 오류입니다. 잠시 후 다시 시도해주세요.'
      };
    }
  },

  // Register
  async register(email, password, username, display_name) {
    if (!this.isApiAvailable()) {
      const isEn = this.isEnglish();
      return {
        success: false,
        error: 'Registration is not available in static preview mode',
        error_kr: '회원가입은 정적 미리보기 모드에서 사용할 수 없습니다'
      };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, username, display_name })
      });

      const data = await res.json();
      if (data.success) {
        this.user = data.user;
        this.token = data.token;
        this.updateUI();
      }
      return data;
    } catch (e) {
      const isEn = this.isEnglish();
      return {
        success: false,
        error: 'Server connection error. Please try again.',
        error_kr: '서버 연결 오류입니다. 잠시 후 다시 시도해주세요.'
      };
    }
  },

  // Social login
  async socialLogin(provider) {
    if (!this.isApiAvailable()) {
      const isEn = this.isEnglish();
      const names = { google: 'Google', naver: isEn ? 'Naver' : '네이버', kakao: isEn ? 'Kakao' : '카카오' };
      alert(isEn
        ? `${names[provider]} login is not available in static preview mode.\n\nPlease use the local server at: http://localhost:3000`
        : `${names[provider]} 로그인은 정적 미리보기 모드에서 사용할 수 없습니다.\n\n로컬 서버에서 이용해주세요: http://localhost:3000`);
      return;
    }

    const isEn = this.isEnglish();
    const names = { google: 'Google', naver: isEn ? 'Naver' : '네이버', kakao: isEn ? 'Kakao' : '카카오' };
    alert(isEn
      ? `${names[provider]} login will be available soon. Please use email login for now.`
      : `${names[provider]} 로그인은 곧 제공될 예정입니다. 현재는 이메일 로그인을 이용해주세요.`);
  },

  // Logout
  async logout() {
    if (this.isApiAvailable()) {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch(e) {}
    }
    this.user = null;
    this.token = null;
    this.updateUI();
    const base = this.getBasePath();
    window.location.href = this.isEnglish() ? base + 'en/index.html' : base + 'index.html';
  },

  // Update profile
  async updateProfile(data) {
    if (!this.isApiAvailable()) {
      return { success: false, error: 'API not available' };
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.user) {
      this.user = result.user;
      this.updateUI();
    }
    return result;
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    if (!this.isApiAvailable()) {
      return { success: false, error: 'API not available' };
    }

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    return await res.json();
  },

  // Check if logged in
  isLoggedIn() {
    return this.user !== null;
  },

  // Check if admin
  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  // Get user display name
  getDisplayName() {
    return this.user ? (this.user.display_name || this.user.username || this.user.email) : '';
  },

  // Determine if English version
  isEnglish() {
    return window.location.pathname.includes('/en/');
  },

  // Update UI based on auth state
  updateUI() {
    this.updateAuthButtons();
    this.updateAuthSections();
  },

  // Update auth buttons in header
  updateAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    if (this.isLoggedIn()) {
      authButtons.innerHTML = `
        <span class="user-greeting">${this.getDisplayName()}</span>
        <a href="${this.getBasePath()}profile.html" class="btn btn-small">프로필</a>
        <button onclick="BG_AUTH.logout()" class="btn btn-small btn-outline">로그아웃</button>
      `;
    } else {
      authButtons.innerHTML = `
        <a href="${this.getBasePath()}login.html" class="btn btn-small">로그인</a>
        <a href="${this.getBasePath()}register.html" class="btn btn-small btn-primary">회원가입</a>
      `;
    }
  },

  // Update auth sections (forms, etc.)
  updateAuthSections() {
    // Update login form if it exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm && this.isLoggedIn()) {
      // Hide login form and show redirect message
      loginForm.style.display = 'none';
      const container = loginForm.parentElement;
      const msg = document.createElement('div');
      msg.className = 'auth-success';
      msg.innerHTML = `<p>이미 로그인되어 있습니다.</p><a href="${this.getBasePath()}index.html" class="btn">홈으로</a>`;
      container.appendChild(msg);
    }

    // Update register form if it exists
    const registerForm = document.getElementById('registerForm');
    if (registerForm && this.isLoggedIn()) {
      registerForm.style.display = 'none';
      const container = registerForm.parentElement;
      const msg = document.createElement('div');
      msg.className = 'auth-success';
      msg.innerHTML = `<p>이미 로그인되어 있습니다.</p><a href="${this.getBasePath()}index.html" class="btn">홈으로</a>`;
      container.appendChild(msg);
    }

    // Update profile page
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
      if (this.isLoggedIn()) {
        profileSection.style.display = 'block';
        this.fillProfileForm();
      } else {
        profileSection.style.display = 'none';
        const guestMsg = document.getElementById('guest-message');
        if (guestMsg) guestMsg.style.display = 'block';
      }
    }
  },

  // Fill profile form with user data
  fillProfileForm() {
    if (!this.user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const bioInput = document.getElementById('profile-bio');

    if (nameInput) nameInput.value = this.user.display_name || '';
    if (emailInput) emailInput.value = this.user.email || '';
    if (bioInput) bioInput.value = this.user.bio || '';

    // Show admin panel link if admin
    if (this.isAdmin()) {
      const adminLink = document.getElementById('admin-panel-link');
      if (adminLink) adminLink.style.display = 'block';
    }
  },

  // Initialize dropdowns
  initDropdowns() {
    // Mobile auth dropdown
    const mobileAuthArea = document.querySelector('.mobile-auth-area');
    if (mobileAuthArea) {
      if (this.isLoggedIn()) {
        mobileAuthArea.innerHTML = `
          <div class="mobile-user-info">
            <p>${this.getDisplayName()}</p>
            <a href="${this.getBasePath()}profile.html">프로필</a>
            <button onclick="BG_AUTH.logout()">로그아웃</button>
          </div>
        `;
      } else {
        mobileAuthArea.innerHTML = `
          <a href="${this.getBasePath()}login.html">로그인</a>
          <a href="${this.getBasePath()}register.html">회원가입</a>
        `;
      }
    }
  }
};

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  BG_AUTH.init();
});