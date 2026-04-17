/**
 * Premium Interactions & Animations
 * 시온산교회 - Industrial/Commercial Grade
 */

class PremiumInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupScrollReveal();
    this.setupMouseFollower();
    this.setupParallax();
    this.setupVantaBackground();
    this.setupSmoothScroll();
    this.setupCounterAnimation();
    this.setupTextReveal();
    this.setupImageParallax();
    this.setupMobileOptimizations();
  }

  /* ===========================================
     SCROLL REVEAL ANIMATIONS
     =========================================== */
  setupScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Add stagger effect for child elements
          const children = entry.target.querySelectorAll('[data-stagger]');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('revealed');
            }, index * 100);
          });
          
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all reveal elements
    document.querySelectorAll('.reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      observer.observe(el);
    });
  }

  /* ===========================================
     MOUSE FOLLOWER
     =========================================== */
  setupMouseFollower() {
    // Skip on mobile devices
    if (window.innerWidth < 768) return;

    const follower = document.createElement('div');
    follower.className = 'mouse-follower';
    document.body.appendChild(follower);

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth follow animation
    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.1;
      followerY += (mouseY - followerY) * 0.1;
      
      follower.style.left = `${followerX - 10}px`;
      follower.style.top = `${followerY - 10}px`;
      
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    // Hover effect on interactive elements
    document.querySelectorAll('a, button, .glass-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        follower.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        follower.classList.remove('hovering');
      });
    });
  }

  /* ===========================================
     PARALLAX EFFECTS
     =========================================== */
  setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(el => {
        const speed = el.dataset.parallax || 0.5;
        const offset = scrolled * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    });
  }

  /* ===========================================
     VANTA.JS BACKGROUND
     =========================================== */
  setupVantaBackground() {
    // Check if Vanta is loaded
    if (typeof VANTA === 'undefined') {
      console.log('Vanta.js not loaded, skipping background animation');
      return;
    }

    try {
      VANTA.NET({
        el: '#vanta-bg',
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x1a237e,
        backgroundColor: 0x0d1445,
        points: 8.00,
        maxDistance: 22.00,
        spacing: 18.00
      });
    } catch (error) {
      console.error('Vanta.js initialization failed:', error);
      // Fallback to gradient background
      document.getElementById('vanta-bg')?.classList.add('background-fallback');
    }
  }

  /* ===========================================
     SMOOTH SCROLL
     =========================================== */
  setupSmoothScroll() {
    // Smooth scroll for anchor links
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

    // Smooth scroll back to top
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const backToTop = document.querySelector('.back-to-top');
      
      if (backToTop) {
        if (scrollTop > 500) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }
    });
  }

  /* ===========================================
     COUNTER ANIMATION
     =========================================== */
  setupCounterAnimation() {
    const counters = document.querySelectorAll('[data-counter]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.counter);
          const duration = parseInt(counter.dataset.duration) || 2000;
          const increment = target / (duration / 16);
          
          let current = 0;
          const animateCounter = () => {
            current += increment;
            if (current < target) {
              counter.textContent = Math.floor(current).toLocaleString();
              requestAnimationFrame(animateCounter);
            } else {
              counter.textContent = target.toLocaleString();
            }
          };
          
          animateCounter();
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  /* ===========================================
     TEXT REVEAL ANIMATION
     =========================================== */
  setupTextReveal() {
    const textElements = document.querySelectorAll('.text-reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Reveal each line with stagger
          const lines = entry.target.querySelectorAll('span');
          lines.forEach((line, index) => {
            setTimeout(() => {
              line.style.transform = 'translateY(0)';
            }, index * 100);
          });
          
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    textElements.forEach(el => {
      // Split text into lines
      const text = el.textContent;
      el.innerHTML = text.split('').map(char => 
        `<span style="display: inline-block; transform: translateY(100%); transition: transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');
      
      observer.observe(el);
    });
  }

  /* ===========================================
     IMAGE PARALLAX
     =========================================== */
  setupImageParallax() {
    const images = document.querySelectorAll('.img-parallax');

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        const speed = 0.2;
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = (window.innerHeight - rect.top) * speed;
          img.style.transform = `translateY(${offset}px)`;
        }
      });
    });
  }

  /* ===========================================
     MOBILE OPTIMIZATIONS
     =========================================== */
  setupMobileOptimizations() {
    // Reduce animations on mobile
    if (window.innerWidth < 768) {
      document.body.classList.add('mobile-optimized');
    }

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-initialize on significant resize
        if (window.innerWidth >= 768 && document.body.classList.contains('mobile-optimized')) {
          document.body.classList.remove('mobile-optimized');
        }
      }, 250);
    });

    // Handle reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }
  }

  /* ===========================================
     UTILITY METHODS
     =========================================== */
  
  // Debounce function
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

  // Throttle function
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

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

/* ===========================================
   LOADER CLASS
   =========================================== */
class PageLoader {
  constructor() {
    this.loader = document.querySelector('.page-loader');
    this.init();
  }

  init() {
    if (!this.loader) {
      // Create loader if it doesn't exist
      this.createLoader();
    }

    // Hide loader when page is ready
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.hideLoader();
      }, 1000);
    });

    // Ensure loader hides after timeout (fallback)
    setTimeout(() => {
      this.hideLoader();
    }, 5000);
  }

  createLoader() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-cross"></div>';
    document.body.appendChild(loader);
    this.loader = loader;
  }

  hideLoader() {
    if (this.loader) {
      this.loader.classList.add('hidden');
      setTimeout(() => {
        this.loader.style.display = 'none';
      }, 500);
    }
  }
}

/* ===========================================
   SCROLL PROGRESS INDICATOR
   =========================================== */
class ScrollProgress {
  constructor() {
    this.progressBar = this.createProgressBar();
    this.init();
  }

  createProgressBar() {
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.innerHTML = '<div class="scroll-progress-bar"></div>';
    document.body.appendChild(progress);
    return progress;
  }

  init() {
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      this.progressBar.querySelector('.scroll-progress-bar').style.width = `${progress}%`;
    });
  }
}

/* ===========================================
   INITIALIZE
   =========================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize premium interactions
  const premiumInteractions = new PremiumInteractions();
  
  // Initialize page loader
  const pageLoader = new PageLoader();
  
  // Initialize scroll progress
  const scrollProgress = new ScrollProgress();
  
  // Store in global scope for debugging
  window.PremiumInteractions = premiumInteractions;
  window.PageLoader = pageLoader;
  window.ScrollProgress = scrollProgress;
});

/* ===========================================
   CSS INJECTION (For Scroll Progress)
   =========================================== */
const style = document.createElement('style');
style.textContent = `
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(212, 175, 55, 0.2);
    z-index: 10000;
  }

  .scroll-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-gold), var(--color-primary));
    box-shadow: 0 0 10px var(--color-gold);
    transition: width 0.1s ease;
  }

  .back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-gold), #b8952e);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
  }

  .back-to-top.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .back-to-top:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(212, 175, 55, 0.6);
  }
`;
document.head.appendChild(style);