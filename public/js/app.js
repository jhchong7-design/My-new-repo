// Mount Zion Church & Empire - Main JavaScript
// 시온산교회 시온산제국

class MZChurchApp {
  constructor() {
    this.apiBase = '/api';
    this.currentUser = null;
    this.currentLang = 'ko';
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupSocialShare();
    this.checkAuthStatus();
    this.setupModals();
  }

  // Navigation
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const page = link.dataset.page;
        if (page) {
          e.preventDefault();
          this.loadPage(page);
        }
      });
    });
  }

  // Mobile Menu
  setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainMenu = document.querySelector('.main-menu');

    if (mobileToggle && mainMenu) {
      mobileToggle.addEventListener('click', () => {
        mainMenu.classList.toggle('active');
      });
    }
  }

  // Social Media Sharing
  setupSocialShare() {
    const shareButtons = document.querySelectorAll('.social-btn');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.shareContent(btn);
      });
    });
  }

  shareContent(btn) {
    const platform = btn.dataset.platform;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    let shareUrl = '';

    switch (platform) {
      case 'naver':
        shareUrl = `https://share.naver.com/web/shareView?url=${url}&title=${title}`;
        break;
      case 'daum':
        shareUrl = `https://share.kakao.com/talk/share?url=${url}`;
        break;
      case 'kakao':
        shareUrl = `https://share.kakao.com/talk/default?url=${url}&title=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
        break;
      case 'youtube':
        window.open('https://www.youtube.com/@sionmount', '_blank');
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  // Authentication
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.apiBase}/auth/me`);
      if (response.ok) {
        this.currentUser = await response.json();
        this.updateUIForLoggedInUser();
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    return false;
  }

  updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('#loginBtn');
    const logoutBtn = document.querySelector('#logoutBtn');
    const userName = document.querySelector('#userName');
    const userRole = document.querySelector('#userRole');

    if (this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (userName) userName.textContent = this.currentUser.username;
      if (userRole) userRole.textContent = this.currentUser.role === 'admin' ? '운영자' : '회원';

      // Show admin link if admin
      if (this.currentUser.role === 'admin') {
        const adminLink = document.querySelector('#adminLink');
        if (adminLink) adminLink.style.display = 'inline-block';
      }
    }
  }

  async login(usernameOrEmail, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.currentUser = data.user;
        localStorage.setItem('token', data.token);
        this.updateUIForLoggedInUser();
        this.showAlert('success', '로그인 성공! 환영합니다.');
        return true;
      } else {
        this.showAlert('error', data.message || '로그인 실패');
        return false;
      }
    } catch (error) {
      this.showAlert('error', '서버 오류가 발생했습니다.');
      return false;
    }
  }

  async logout() {
    try {
      await fetch(`${this.apiBase}/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.currentUser = null;
    localStorage.removeItem('token');
    location.reload();
  }

  // Modals
  setupModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        this.openModal(modalId);
      });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Close modal on close button click
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        this.closeModal(modal.id);
      });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  // API Calls
  async fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        ...options,
        headers,
      });
      return response;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  // Alert Messages
  showAlert(type, message) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  // Page Loading
  async loadPage(pageName) {
    this.showLoading(true);
    try {
      const content = await this.fetchAPI(`/content/page/${pageName}`);
      const pageContent = document.querySelector('#pageContent');
      
      if (content.ok) {
        const data = await content.json();
        pageContent.innerHTML = this.generatePageContent(data, pageName);
      }
    } catch (error) {
      console.error('Page load error:', error);
    }
    this.showLoading(false);
  }

  generatePageContent(data, pageName) {
    if (!data || data.length === 0) {
      return '<p>준비 중입니다.</p>';
    }

    let html = '';
    data.forEach(item => {
      html += `
        <div class="section" data-order="${item.order}">
          <h2 class="section-title">${item.title}</h2>
          <div class="content">${item.content}</div>
          <div class="social-share">
            ${this.generateShareButtons()}
          </div>
        </div>
      `;
    });
    return html;
  }

  generateShareButtons() {
    return `
      <a href="#" class="social-btn social-naver" data-platform="naver">네이버</a>
      <a href="#" class="social-btn social-daum" data-platform="daum">다음</a>
      <a href="#" class="social-btn social-kakao" data-platform="kakao">카카오</a>
      <a href="#" class="social-btn social-facebook" data-platform="facebook">Facebook</a>
      <a href="#" class="social-btn social-twitter" data-platform="twitter">Twitter</a>
    `;
  }

  showLoading(show) {
    const loadingOverlay = document.querySelector('#loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  // Form Validation
  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('error');
        isValid = false;
      } else {
        input.classList.remove('error');
      }
    });

    return isValid;
  }

  // Date Formatting
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Image Upload Preview
  previewImage(input) {
    const file = input.files[0];
    const preview = input.parentElement.querySelector('.image-preview');
    
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  }

  // Utility: Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Smooth scrolling
  scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// Initialize the app
const app = new MZChurchApp();

// Export for use in other files
window.MZChurchApp = MZChurchApp;