/* ============================================
   정중호 교수의 성경 사랑방 - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

  // --- Preloader ---
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', function() {
      setTimeout(() => preloader.classList.add('hidden'), 600);
    });
    // Fallback
    setTimeout(() => preloader.classList.add('hidden'), 2500);
  }

  // --- Mobile Navigation ---
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');

  function toggleMobileMenu() {
    menuToggle.classList.toggle('active');
    mobileNav.classList.toggle('open');
    mobileOverlay.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileMenu);
  }
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', toggleMobileMenu);
  }

  // Close mobile nav on link click
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', function() {
      if (mobileNav.classList.contains('open')) {
        toggleMobileMenu();
      }
    });
  });

  // --- Mobile Sub-menu Toggles ---
  document.querySelectorAll('.mobile-nav .has-submenu > a').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.parentElement;
      const submenu = parent.querySelector('.sub-menu');
      if (submenu) {
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        this.classList.toggle('expanded');
      }
    });
  });

  // --- Sticky Header Shadow ---
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      } else {
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }
    });
  }

  // --- Scroll to Top ---
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });
    scrollTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });

  // --- Intersection Observer for Animations ---
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const fadeInObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.category-card, .publication-item, .forum-card, .stat-item, .timeline-item, .credential-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInObserver.observe(el);
  });

  // Add CSS for visible state
  const style = document.createElement('style');
  style.textContent = '.fade-in-visible { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);

  // --- Animated Counter for Stats ---
  const counters = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const finalValue = target.getAttribute('data-count');
        const suffix = target.getAttribute('data-suffix') || '';
        const prefix = target.getAttribute('data-prefix') || '';
        let current = 0;
        const increment = Math.ceil(parseInt(finalValue) / 60);
        const timer = setInterval(() => {
          current += increment;
          if (current >= parseInt(finalValue)) {
            current = parseInt(finalValue);
            clearInterval(timer);
          }
          target.textContent = prefix + current + suffix;
        }, 25);
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  // --- Active Navigation Highlight ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPage || (currentPage === '' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  // --- Search Functionality (placeholder) ---
  const searchToggle = document.querySelector('.search-toggle');
  if (searchToggle) {
    searchToggle.addEventListener('click', function() {
      // Future: Open search modal
      alert('검색 기능은 준비 중입니다. / Search feature coming soon.');
    });
  }

});