// CAREER COPILOT - PORTFOLIO SCRIPT v1.3 - Last Updated: 2026-07-16
// See CHANGELOG.md for version history.

(function () {
  'use strict';

  var NAV_HEIGHT = 64;
  var CARD_HASH_PREFIX = '#work-';
  var WORK_HASH = '#work';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ============================================================
  // ANALYTICS ADAPTER
  // ============================================================
  function trackPortfolioEvent(name, properties) {
    try {
      if (window.portfolioAnalytics && typeof window.portfolioAnalytics.track === 'function') {
        window.portfolioAnalytics.track(name, properties);
      }
    } catch (e) {
      // Analytics failure must never block interaction.
    }
  }

  // ============================================================
  // CASE STUDY EXPAND / COLLAPSE (single-open accordion)
  // ============================================================
  var cardList = [];

  function getCardById(id) {
    for (var i = 0; i < cardList.length; i++) {
      if (cardList[i].card.id === id) return cardList[i];
    }
    return null;
  }

  function getOpenCard() {
    for (var i = 0; i < cardList.length; i++) {
      if (cardList[i].header.getAttribute('aria-expanded') === 'true') return cardList[i];
    }
    return null;
  }

  function collapseEntry(entry) {
    var header = entry.header;
    var body = entry.body;

    header.setAttribute('aria-expanded', 'false');
    entry.card.classList.remove('expanded');

    if (prefersReducedMotion()) {
      body.hidden = true;
      return;
    }

    body.style.height = body.scrollHeight + 'px';
    body.offsetHeight; // force reflow
    body.style.transition = 'height 0.25s ease';
    body.style.height = '0px';

    body.addEventListener('transitionend', function handler() {
      body.hidden = true;
      body.style.height = '';
      body.style.transition = '';
      body.removeEventListener('transitionend', handler);
    });
  }

  function expandEntry(entry) {
    var header = entry.header;
    var body = entry.body;

    header.setAttribute('aria-expanded', 'true');
    entry.card.classList.add('expanded');

    if (prefersReducedMotion()) {
      body.hidden = false;
      return;
    }

    body.hidden = false;
    var targetHeight = body.scrollHeight + 'px';
    body.style.height = '0px';
    body.style.overflow = 'hidden';
    body.offsetHeight; // force reflow
    body.style.transition = 'height 0.25s ease';
    body.style.height = targetHeight;

    body.addEventListener('transitionend', function handler() {
      body.style.height = '';
      body.style.overflow = '';
      body.style.transition = '';
      body.removeEventListener('transitionend', handler);
    });
  }

  // Opens a card programmatically (deep link / history navigation).
  // Does not push history state and does not fire an analytics event.
  function openCardSilently(id, opts) {
    var entry = getCardById(id);
    if (!entry) return;

    var current = getOpenCard();
    if (current && current.card.id !== id) {
      collapseEntry(current);
    }
    if (entry.header.getAttribute('aria-expanded') !== 'true') {
      expandEntry(entry);
    }

    if (opts && opts.scroll) {
      var top = entry.header.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top: top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function closeAllCardsSilently() {
    var current = getOpenCard();
    if (current) collapseEntry(current);
  }

  function initCaseStudies() {
    var cards = document.querySelectorAll('.cs-card');

    cards.forEach(function (card) {
      var header = card.querySelector('.cs-header');
      var body = card.querySelector('.cs-body');
      if (!header || !body) return;

      cardList.push({ card: card, header: header, body: body });

      header.addEventListener('click', function () {
        var isExpanded = header.getAttribute('aria-expanded') === 'true';
        var entry = { card: card, header: header, body: body };

        if (isExpanded) {
          collapseEntry(entry);
          history.pushState(null, '', WORK_HASH);
          trackPortfolioEvent('portfolio_case_study_close', { case_study: card.id });
        } else {
          var current = getOpenCard();
          if (current && current.card.id !== card.id) {
            collapseEntry(current);
          }
          expandEntry(entry);
          history.pushState(null, '', '#' + card.id);
          trackPortfolioEvent('portfolio_case_study_open', { case_study: card.id });
        }
      });

      // Keyboard: Enter/Space delegates to the click handler above (no duplicate tracking).
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  // ============================================================
  // PROOF REVEAL DISCLOSURES (native <details>)
  // ============================================================
  function initProofReveals() {
    document.querySelectorAll('.cs-reveal').forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (!details.open) return;
        var card = details.closest('.cs-card');
        var summary = details.querySelector('summary');
        trackPortfolioEvent('portfolio_proof_reveal', {
          case_study: card ? card.id : 'unknown',
          reveal: summary ? summary.textContent.trim() : 'unknown',
        });
      });
    });
  }

  // ============================================================
  // WORK FILTERS
  // ============================================================
  var FILTER_TOKENS = {
    all: null,
    ai: ['ai'],
    scale: ['zero-one', 'scale'],
    growth: ['growth'],
  };

  function cardMatchesFilter(card, filterKey) {
    var tokens = FILTER_TOKENS[filterKey];
    if (!tokens) return true; // 'all'
    var categories = (card.dataset.categories || '').split(' ');
    return tokens.some(function (t) { return categories.indexOf(t) !== -1; });
  }

  function initFilters() {
    var chips = document.querySelectorAll('.filter-chip');
    var status = document.getElementById('work-filter-status');
    if (chips.length === 0) return;

    function applyFilter(filterKey, activeChip) {
      var shownCount = 0;

      cardList.forEach(function (entry) {
        var matches = cardMatchesFilter(entry.card, filterKey);
        entry.card.classList.toggle('is-filtered-out', !matches);
        if (matches) shownCount++;

        if (!matches && entry.header.getAttribute('aria-expanded') === 'true') {
          collapseEntry(entry);
          history.replaceState(null, '', WORK_HASH);
        }
      });

      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip === activeChip ? 'true' : 'false');
      });

      if (status) {
        status.textContent = shownCount + (shownCount === 1 ? ' case study shown' : ' case studies shown');
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filterKey = chip.dataset.filter;
        applyFilter(filterKey, chip);
        trackPortfolioEvent('portfolio_work_filter', { filter: filterKey });
        chip.focus();
      });
    });
  }

  // ============================================================
  // HASH ROUTING (deep links + back/forward)
  // ============================================================
  function initHashRouting() {
    function handleHash(hash, opts) {
      if (!hash) return;

      if (hash.indexOf(CARD_HASH_PREFIX) === 0) {
        var entry = getCardById(hash.slice(1));
        if (!entry) return;

        // A case-study deep link always resolves against the "All" filter.
        var allChip = document.querySelector('.filter-chip[data-filter="all"]');
        if (allChip) {
          var status = document.getElementById('work-filter-status');
          cardList.forEach(function (e) { e.card.classList.remove('is-filtered-out'); });
          document.querySelectorAll('.filter-chip').forEach(function (chip) {
            chip.setAttribute('aria-pressed', chip === allChip ? 'true' : 'false');
          });
          if (status) status.textContent = cardList.length + ' case studies shown';
        }

        openCardSilently(entry.card.id, { scroll: opts && opts.scroll });
      } else if (hash === WORK_HASH) {
        closeAllCardsSilently();
      }
    }

    // Initial load.
    if (window.location.hash) {
      handleHash(window.location.hash, { scroll: true });
    }

    // Back / forward.
    window.addEventListener('popstate', function () {
      handleHash(window.location.hash, { scroll: true });
    });
  }

  // ============================================================
  // OUTBOUND LINK TRACKING
  // ============================================================
  function initOutboundTracking() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      link.addEventListener('click', function () {
        var section = link.closest('section[id]');
        trackPortfolioEvent('portfolio_outbound_click', {
          destination: link.href,
          location: section ? section.id : 'unknown',
        });
      });
    });
  }

  // ============================================================
  // INTERSECTION OBSERVER — FADE IN ON SCROLL
  // ============================================================
  function initFadeIn() {
    var elements = document.querySelectorAll('.fade-in, .fade-in-section');

    if (!('IntersectionObserver' in window)) {
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

    function updateNavScrolled() {
      if (window.scrollY > 24) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', updateNavScrolled, { passive: true });
    updateNavScrolled();

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

    // Scrollspy: the active link is whichever section's top has most recently
    // passed just below the nav bar. Recomputed from live layout on every
    // scroll, so it tracks true page order and scroll position directly —
    // no flicker from an intersection band that multiple sections can
    // satisfy at once, and no link is active until scrolled past the Hero.
    function updateActiveSection() {
      var referenceY = NAV_HEIGHT + 1;
      var current = null;

      sections.forEach(function (item) {
        var top = item.section.getBoundingClientRect().top;
        if (top <= referenceY && (!current || top > current.top)) {
          current = { link: item.link, top: top };
        }
      });

      // The last section's top can never cross the nav line if there isn't
      // enough content below it (just a short footer here) to scroll that
      // far — the page simply clamps at max scroll first. Treat "scrolled
      // to the bottom of the page" as "the last section is active".
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        current = sections[sections.length - 1];
      }

      navLinks.forEach(function (l) { l.classList.remove('active'); });
      if (current) current.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    updateActiveSection();
  }

  // ============================================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================================
  function initSmoothScroll() {
    // Excludes .skip-link: it needs its own handler that also moves focus
    // (see initSkipLink), not just a scroll.
    document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (href === '#' || href.indexOf(CARD_HASH_PREFIX) === 0) return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
          window.scrollTo({ top: top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }
      });
    });
  }

  // ============================================================
  // SKIP LINK (scroll + move focus into main content)
  // ============================================================
  function initSkipLink() {
    var skipLink = document.querySelector('.skip-link');
    var mainContent = document.getElementById('main-content');
    if (!skipLink || !mainContent) return;

    skipLink.addEventListener('click', function (e) {
      e.preventDefault();
      var top = mainContent.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      // preventScroll: the scrollTo above already handles positioning;
      // focus() alone would otherwise also jump the page instantly.
      mainContent.focus({ preventScroll: true });
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    initCaseStudies();
    initProofReveals();
    initFilters();
    initHashRouting();
    initOutboundTracking();
    initFadeIn();
    initNav();
    initSmoothScroll();
    initSkipLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
