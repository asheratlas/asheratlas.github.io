// CAREER COPILOT - PORTFOLIO SCRIPT v1.0 - Last Updated: 2026-03-24
// See CHANGELOG.md for version history.

(function () {
  'use strict';

  // ============================================================
  // CASE STUDY EXPAND / COLLAPSE
  // ============================================================
  function initCaseStudies() {
    const cards = document.querySelectorAll('.cs-card');

    cards.forEach(function (card) {
      const header = card.querySelector('.cs-header');
      const body = card.querySelector('.cs-body');

      if (!header || !body) return;

      header.addEventListener('click', function () {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          // Collapse
          header.setAttribute('aria-expanded', 'false');
          card.classList.remove('expanded');

          // Animate collapse
          body.style.height = body.scrollHeight + 'px';
          body.offsetHeight; // force reflow
          body.style.transition = 'height 0.3s ease';
          body.style.height = '0px';

          body.addEventListener('transitionend', function handler() {
            body.hidden = true;
            body.style.height = '';
            body.style.transition = '';
            body.removeEventListener('transitionend', handler);
          });
        } else {
          // Expand
          header.setAttribute('aria-expanded', 'true');
          card.classList.add('expanded');

          body.hidden = false;
          const targetHeight = body.scrollHeight + 'px';
          body.style.height = '0px';
          body.style.overflow = 'hidden';
          body.offsetHeight; // force reflow
          body.style.transition = 'height 0.3s ease';
          body.style.height = targetHeight;

          body.addEventListener('transitionend', function handler() {
            body.style.height = '';
            body.style.overflow = '';
            body.style.transition = '';
            body.removeEventListener('transitionend', handler);
          });
        }
      });

      // Keyboard: allow Enter and Space to toggle
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  // ============================================================
  // INTERSECTION OBSERVER — FADE IN ON SCROLL
  // ============================================================
  function initFadeIn() {
    var elements = document.querySelectorAll('.fade-in, .fade-in-section');

    if (!('IntersectionObserver' in window)) {
      // Fallback: make everything visible immediately
      elements.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ============================================================
  // NAV — SCROLLED STATE & ACTIVE LINK HIGHLIGHT
  // ============================================================
  function initNav() {
    var nav = document.getElementById('nav');
    var navLinks = document.querySelectorAll('.nav-link');

    if (!nav) return;

    // Scrolled state (show background when not at top)
    function updateNavScrolled() {
      if (window.scrollY > 24) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', updateNavScrolled, { passive: true });
    updateNavScrolled();

    // Active section highlight
    var sections = [];
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var section = document.getElementById(href.slice(1));
        if (section) {
          sections.push({ link: link, section: section });
        }
      }
    });

    if (sections.length === 0) return;

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Find and mark matching nav link
            sections.forEach(function (item) {
              if (item.section === entry.target) {
                navLinks.forEach(function (l) { l.classList.remove('active'); });
                item.link.classList.add('active');
              }
            });
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-' + (window.innerHeight * 0.4) + 'px 0px -50% 0px',
      }
    );

    sections.forEach(function (item) {
      sectionObserver.observe(item.section);
    });
  }

  // ============================================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // (CSS handles it, but this ensures it works for older browsers)
  // ============================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var navHeight = 64;
          var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    initCaseStudies();
    initFadeIn();
    initNav();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
