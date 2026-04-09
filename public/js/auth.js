/* ============================================
   Bible Glocal — Authentication Module
   ============================================ */

const BG_AUTH = {
  user: null,
  token: null,

  // Get base path for links
  getBasePath() {
    const p = window.location.pathname;
    if (p.includes('/en/')) return '../';
    return '';
  },

  // Initialize auth state
  async init() {
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
    } catch (e) { /* Not logged in */ }
    this.user = null;
    this.updateUI();
    return false;
  },

  // Login
  async login(email, password) {
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
    }
    return data;
  },

  // Register
  async register(email, password, username, display_name) {
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
  },

  // Social login (stub - shows info alert)
  async socialLogin(provider) {
    const isEn = this.isEnglish();
    const names = { google: 'Google', naver: isEn ? 'Naver' : '네이버', kakao: isEn ? 'Kakao' : '카카오' };
    alert(isEn
      ? `${names[provider]} login will be available soon. Please use email login for now.`
      : `${names[provider]} 로그인은 곧 제공될 예정입니다. 현재는 이메일 로그인을 이용해주세요.`
    );
  },

  // Logout
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch(e) {}
    this.user = null;
    this.token = null;
    this.updateUI();
    const base = this.getBasePath();
    window.location.href = this.isEnglish() ? base + 'en/index.html' : base + 'index.html';
  },

  // Update profile
  async updateProfile(data) {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.user) {
      this.user = { ...this.user, ...result.user };
      this.updateUI();
    }
    return result;
  },

  // Change password
  async changePassword(current_password, new_password) {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ current_password, new_password })
    });
    return await res.json();
  },

  // Check if admin
  isAdmin() {
    return this.user && this.user.role === 'admin';
  },

  // Check if logged in
  isLoggedIn() {
    return !!this.user;
  },

  // Detect language
  isEnglish() {
    return window.location.pathname.includes('/en/');
  },

  // Initialize dropdown click-toggle
  initDropdowns() {
    document.addEventListener('click', (e) => {
      // Close all dropdowns if clicking outside
      if (!e.target.closest('.auth-user-dropdown')) {
        document.querySelectorAll('.auth-dropdown-menu').forEach(m => m.classList.remove('show'));
      }
    });
    document.querySelectorAll('.auth-user-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        if (menu) menu.classList.toggle('show');
      });
    });
  },

  // Update all UI elements based on auth state
  updateUI() {
    const isEn = this.isEnglish();
    const base = this.getBasePath();
    const loginUrl = isEn ? base + 'en/login.html' : base + 'login.html';
    const profileUrl = isEn ? base + 'en/profile.html' : base + 'profile.html';
    const adminUrl = base + 'admin.html';

    // Desktop auth area
    document.querySelectorAll('.auth-area').forEach(el => {
      if (this.user) {
        const initial = (this.user.display_name || this.user.username || '?').charAt(0).toUpperCase();
        const displayName = this.user.display_name || this.user.username;
        const adminBadge = this.isAdmin()
          ? `<span class="auth-badge-admin">${isEn ? 'Admin' : '관리자'}</span>` : '';
        const adminLink = this.isAdmin()
          ? `<a href="${adminUrl}">${isEn ? '⚙️ Admin Dashboard' : '⚙️ 관리자 대시보드'}</a>` : '';
        const adminGear = this.isAdmin()
          ? `<a href="${adminUrl}" class="auth-admin-link" title="${isEn ? 'Admin' : '관리자'}">⚙️</a>` : '';

        el.innerHTML = `
          <div class="auth-user-info">
            ${adminGear}
            <div class="auth-user-dropdown">
              <button class="auth-user-btn" type="button">
                <span class="auth-avatar">${initial}</span>
                <span class="auth-name">${displayName}</span>
                <span class="auth-arrow">▾</span>
              </button>
              <div class="auth-dropdown-menu">
                <div class="auth-dropdown-header">
                  <strong>${displayName}</strong>
                  <span>${this.user.email}</span>
                  ${adminBadge}
                </div>
                <a href="${profileUrl}">${isEn ? '👤 My Profile' : '👤 내 프로필'}</a>
                ${adminLink}
                <button onclick="BG_AUTH.logout()" class="auth-logout-btn">${isEn ? '🚪 Logout' : '🚪 로그아웃'}</button>
              </div>
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <a href="${loginUrl}" class="auth-login-link">${isEn ? 'Login' : '로그인'}</a>
        `;
      }
    });

    // Mobile auth area
    document.querySelectorAll('.mobile-auth-area').forEach(el => {
      if (this.user) {
        const initial = (this.user.display_name || this.user.username || '?').charAt(0).toUpperCase();
        const displayName = this.user.display_name || this.user.username;
        const adminBadgeSm = this.isAdmin()
          ? `<span class="auth-badge-admin-sm">${isEn ? 'Admin' : '관리자'}</span>` : '';
        const adminLink = this.isAdmin()
          ? `<a href="${adminUrl}">${isEn ? '⚙️ Admin' : '⚙️ 관리자'}</a>` : '';

        el.innerHTML = `
          <div class="mobile-auth-user">
            <div class="mobile-auth-info">
              <span class="auth-avatar-mobile">${initial}</span>
              <div>
                <strong>${displayName}</strong>
                ${adminBadgeSm}
              </div>
            </div>
            <a href="${profileUrl}">${isEn ? '👤 My Profile' : '👤 내 프로필'}</a>
            ${adminLink}
            <button onclick="BG_AUTH.logout()" class="mobile-logout-btn">${isEn ? '🚪 Logout' : '🚪 로그아웃'}</button>
          </div>
        `;
      } else {
        el.innerHTML = `
          <a href="${loginUrl}" class="mobile-login-link">
            🔐 ${isEn ? 'Login / Register' : '로그인 / 회원가입'}
          </a>
        `;
      }
    });

    // Toggle visibility for auth-dependent elements
    document.querySelectorAll('[data-auth="user"]').forEach(el => {
      el.style.display = this.isLoggedIn() ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="guest"]').forEach(el => {
      el.style.display = this.isLoggedIn() ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="admin"]').forEach(el => {
      el.style.display = this.isAdmin() ? '' : 'none';
    });

    // Re-bind dropdown toggles after UI update
    setTimeout(() => this.initDropdowns(), 50);
  }
};

// Auto-init on page load
document.addEventListener('DOMContentLoaded', () => BG_AUTH.init());