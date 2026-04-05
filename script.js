/* ============================================
   Dunit Landing Page — JavaScript
   ============================================ */

(function () {
    'use strict';

    // --- Acquisition source tracking & analytics ---
    var TRACK_API = 'https://telegram-checklist-bot.fly.dev/api/landing/track';
    var BOT_BASE = 'https://t.me/dunitbot';

    // Get source from URL param (e.g., ?src=facebook)
    var urlParams = new URLSearchParams(window.location.search);
    var source = urlParams.get('src') || 'direct';

    // Generate a session ID for this visit (persists across page reloads in same tab)
    var sessionId = sessionStorage.getItem('dunit-sid');
    if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36));
        sessionStorage.setItem('dunit-sid', sessionId);
    }

    // Rewrite all bot links to include source
    if (source !== 'direct') {
        document.querySelectorAll('a[href="' + BOT_BASE + '"]').forEach(function (link) {
            link.href = BOT_BASE + '?start=src_' + encodeURIComponent(source);
        });
    }

    // Send tracking event (fire-and-forget)
    function trackEvent(event) {
        var payload = JSON.stringify({
            event: event,
            source: source,
            session_id: sessionId,
            referrer: document.referrer || ''
        });
        fetch(TRACK_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            mode: 'cors'
        }).catch(function () {
            // Fallback to sendBeacon
            try {
                var blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon(TRACK_API, blob);
            } catch (e) {}
        });
    }

    // Track page view (once per session)
    if (!sessionStorage.getItem('dunit-pv')) {
        trackEvent('page_view');
        sessionStorage.setItem('dunit-pv', '1');
    }

    // Track bot link clicks
    document.querySelectorAll('a[href^="' + BOT_BASE + '"]').forEach(function (link) {
        link.addEventListener('click', function () {
            trackEvent('bot_click');
        });
    });

    // --- Theme toggle ---
    var THEME_KEY = 'dunit-theme';
    var themeToggle = document.getElementById('themeToggle');
    var htmlEl = document.documentElement;

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    var ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    var ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    function updateToggleIcon() {
        var isDark = htmlEl.getAttribute('data-theme') === 'dark';
        themeToggle.innerHTML = isDark ? ICON_SUN : ICON_MOON;
    }

    function applyTheme(theme) {
        htmlEl.setAttribute('data-theme', theme);
        updateToggleIcon();
    }

    // On load: use saved preference, otherwise follow system
    var savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme || getSystemTheme());

    // Toggle button click
    themeToggle.addEventListener('click', function () {
        var current = htmlEl.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
    });

    // Listen for system theme changes (only if user hasn't manually chosen)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // --- Navigation scroll effect ---
    const nav = document.getElementById('nav');

    function updateNav() {
        if (window.scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // --- Mobile menu toggle ---
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // --- FAQ accordion ---
    document.querySelectorAll('.faq-question').forEach(function (button) {
        button.addEventListener('click', function () {
            var item = this.closest('.faq-item');
            var isActive = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.faq-item.active').forEach(function (openItem) {
                openItem.classList.remove('active');
                openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Open clicked (if it wasn't already open)
            if (!isActive) {
                item.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- Scroll animations (Intersection Observer) ---
    var animatedElements = document.querySelectorAll(
        '.step, .use-case, .feature, .pricing-card, .faq-item, .referral-banner'
    );

    animatedElements.forEach(function (el) {
        el.classList.add('fade-in');
    });

    if ('IntersectionObserver' in window) {
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

        animatedElements.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        animatedElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    // --- Smooth scroll for anchor links (fallback for browsers without native support) ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var navHeight = nav.offsetHeight;
                var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });

    // --- Chat mockup animation: simulate checking items ---
    var checklistItems = document.querySelectorAll('.chat-item:not(.chat-item-done)');
    var progressFill = document.querySelector('.chat-progress-fill');
    var progressText = document.querySelector('.chat-progress-text');
    var totalItems = document.querySelectorAll('.chat-item').length;
    var doneCount = document.querySelectorAll('.chat-item-done').length;
    var animationIndex = 0;

    function animateCheckItem() {
        if (animationIndex >= checklistItems.length) {
            // Reset after all checked
            setTimeout(function () {
                checklistItems.forEach(function (item) {
                    item.classList.remove('chat-item-done');
                    var icon = item.querySelector('.chat-item-icon');
                    var text = item.querySelector('.chat-item-text');
                    icon.innerHTML = '\u2611\uFE0F';
                    icon.classList.remove('done');
                    text.classList.remove('checked');
                });
                doneCount = 2; // Reset to original 2 checked
                updateProgress();
                animationIndex = 0;
                setTimeout(animateCheckItem, 3000);
            }, 2000);
            return;
        }

        var item = checklistItems[animationIndex];
        item.classList.add('chat-item-done');
        var icon = item.querySelector('.chat-item-icon');
        var text = item.querySelector('.chat-item-text');
        icon.innerHTML = '\u2705';
        icon.classList.add('done');
        text.classList.add('checked');
        doneCount++;
        updateProgress();
        animationIndex++;

        setTimeout(animateCheckItem, 1200);
    }

    function updateProgress() {
        var pct = Math.round((doneCount / totalItems) * 100);
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressText) progressText.textContent = doneCount + ' of ' + totalItems + ' done';
    }

    // Start animation after a delay
    setTimeout(animateCheckItem, 2500);
})();
