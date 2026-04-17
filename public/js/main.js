// Main JavaScript for 시온산교회 Website
// Handles navigation, modals, authentication, and interactive features

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    Navigation.init();
    Modals.init();
    Auth.init();
    Animations.init();
    MobileMenu.init();
});

// Navigation Module
const Navigation = {
    init() {
        this.setupStickyNav();
        this.setupSmoothScroll();
    },

    setupStickyNav() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll <= 0) {
                nav.classList.remove('nav-hidden');
                nav.classList.add('nav-scrolled');
            } else if (currentScroll > lastScroll && currentScroll > 100) {
                nav.classList.add('nav-hidden');
            } else {
                nav.classList.remove('nav-hidden');
                nav.classList.add('nav-scrolled');
            }
            
            lastScroll = currentScroll;
        });
    },

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

// Mobile Menu Module
const MobileMenu = {
    init() {
        this.toggle = document.getElementById('navToggle');
        this.menu = document.getElementById('navMenu');
        
        if (!this.toggle || !this.menu) return;
        
        this.toggle.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
                if (this.menu.classList.contains('active')) {
                    this.toggleMenu();
                }
            }
        });
        
        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.menu.classList.contains('active')) {
                this.toggleMenu();
            }
        });
    },

    toggleMenu() {
        this.menu.classList.toggle('active');
        this.toggle.classList.toggle('active');
        
        const icon = this.toggle.querySelector('i');
        if (this.menu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
};

// Modals Module
const Modals = {
    init() {
        this.loginModal = document.getElementById('loginModal');
        this.registerModal = document.getElementById('registerModal');
        this.loginBtn = document.getElementById('loginBtn');
        this.showRegisterBtn = document.getElementById('showRegisterModal');
        this.showLoginBtn = document.getElementById('showLoginModal');
        this.closeLoginBtn = document.getElementById('closeLoginModal');
        this.closeRegisterBtn = document.getElementById('closeRegisterModal');
        
        this.setupListeners();
    },

    setupListeners() {
        // Open login modal
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => {
                this.openModal(this.loginModal);
            });
        }
        
        // Navigate between login and register
        if (this.showRegisterBtn) {
            this.showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal(this.loginModal);
                this.openModal(this.registerModal);
            });
        }
        
        if (this.showLoginBtn) {
            this.showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal(this.registerModal);
                this.openModal(this.loginModal);
            });
        }
        
        // Close modals
        if (this.closeLoginBtn) {
            this.closeLoginBtn.addEventListener('click', () => {
                this.closeModal(this.loginModal);
            });
        }
        
        if (this.closeRegisterBtn) {
            this.closeRegisterBtn.addEventListener('click', () => {
                this.closeModal(this.registerModal);
            });
        }
        
        // Close on backdrop click
        [this.loginModal, this.registerModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [this.loginModal, this.registerModal].forEach(modal => {
                    if (modal && modal.classList.contains('active')) {
                        this.closeModal(modal);
                    }
                });
            }
        });
    },

    openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Authentication Module
const Auth = {
    init() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        
        this.setupLogin();
        this.setupRegister();
        this.checkAuthStatus();
    },

    setupLogin() {
        if (!this.loginForm) return;
        
        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.loginForm);
            const email = formData.get('email') || this.loginForm.querySelector('input[type="email"]').value;
            const password = formData.get('password') || this.loginForm.querySelector('input[type="password"]').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.updateAuthUI(data.user);
                    Modals.closeModal(Modals.loginModal);
                    this.showNotification('로그인이 완료되었습니다.', 'success');
                    window.location.reload();
                } else {
                    this.showNotification(data.message || '로그인 실패', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showNotification('로그인 중 오류가 발생했습니다.', 'error');
            }
        });
    },

    setupRegister() {
        if (!this.registerForm) return;
        
        this.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.registerForm);
            const name = formData.get('name') || this.registerForm.querySelectorAll('input[type="text"]')[0].value;
            const email = formData.get('email') || this.registerForm.querySelector('input[type="email"]').value;
            const password = formData.get('password') || this.registerForm.querySelectorAll('input[type="password"]')[0].value;
            const confirmPassword = formData.get('confirmPassword') || this.registerForm.querySelectorAll('input[type="password"]')[1].value;
            
            if (password !== confirmPassword) {
                this.showNotification('비밀번호가 일치하지 않습니다.', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    Modals.closeModal(Modals.registerModal);
                    this.showNotification('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
                    Modals.openModal(Modals.loginModal);
                } else {
                    this.showNotification(data.message || '회원가입 실패', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.showNotification('회원가입 중 오류가 발생했습니다.', 'error');
            }
        });
    },

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (token && user) {
            this.updateAuthUI(user);
        }
    },

    updateAuthUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        if (!loginBtn) return;
        
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${user.name || user.email}</span>
        `;
        loginBtn.classList.remove('btn-primary');
        loginBtn.classList.add('btn-outline-primary');
        
        // Add dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <button class="btn btn-text" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>로그아웃</span>
            </button>
        `;
        
        loginBtn.parentElement.insertBefore(dropdown, loginBtn.nextSibling);
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showNotification('로그아웃되었습니다.', 'success');
        window.location.reload();
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
};

// Animations Module
const Animations = {
    init() {
        this.setupScrollAnimations();
        this.setupHeroAnimations();
    },

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.glass-card, .feature-card, .news-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    },

    setupHeroAnimations() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Parallax effect
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroContent = hero.querySelector('.hero-content');
            
            if (heroContent && scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
            }
        });
    }
};

// Utility Functions
const Utils = {
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
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};