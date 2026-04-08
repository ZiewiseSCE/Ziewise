/* ============================================================
   Ziewise - Cyberpunk Enhancement JS
   Scroll-reveal, counter animations, parallax effects
   ============================================================ */
(function () {
    'use strict';

    // -------- 0. Override app.js show/hide nav with continuous scroll --------
    function setupContinuousScroll() {
        // Force all sections visible (app.js may have hidden them)
        document.querySelectorAll('#about, #solutions, #simulator, #technology, #contact').forEach((s) => {
            s.style.display = 'flex';
        });
        // Hero must stay GRID (3-col text/brain/cube), not flex
        const heroEl = document.getElementById('hero');
        if (heroEl) heroEl.style.display = 'grid';
        document.documentElement.style.minHeight = 'auto';
        document.body.style.minHeight = 'auto';

        // Remove any black hole overlay artifact
        const bh = document.getElementById('blackhole-overlay');
        if (bh) bh.remove();
        document.body.classList.remove('warping');

        // ===== SWOOSH-STYLE custom smooth scroll with speed-streak overlay =====
        let streakEl = document.getElementById('scroll-streak');
        if (!streakEl) {
            streakEl = document.createElement('div');
            streakEl.id = 'scroll-streak';
            document.body.appendChild(streakEl);
        }

        // easeInOutQuint - strong acceleration and deceleration ("쓱~~" feel)
        function easeInOutQuint(t) {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
        }

        // Target element for the motion-blur bleed effect (main content)
        const bleedTarget = document.getElementById('main-root') ||
                            document.querySelector('main') ||
                            document.body;

        let scrollAnim = null;
        function smoothScrollTo(targetY, duration) {
            if (scrollAnim) cancelAnimationFrame(scrollAnim);
            const startY = window.pageYOffset;
            const distance = targetY - startY;
            if (Math.abs(distance) < 4) return;
            // Adaptive duration: longer distance = a bit longer, but capped
            const dur = duration || Math.min(1300, Math.max(600, Math.abs(distance) * 0.58));
            const startT = performance.now();

            // Activate speed streak overlay
            streakEl.classList.add('active');
            const dirClass = distance > 0 ? 'down' : 'up';
            streakEl.classList.add(dirClass);

            // Activate blur/bleed class on body for CSS filter blur
            document.body.classList.add('scroll-bleeding', dirClass === 'down' ? 'bleed-down' : 'bleed-up');

            function step(now) {
                const elapsed = now - startT;
                const t = Math.min(1, elapsed / dur);
                const eased = easeInOutQuint(t);

                // Velocity-driven motion bleed — peaks at mid-scroll
                // Smooth bell curve (sin²) for nicer ramp
                const velocity = Math.sin(Math.min(1, t) * Math.PI); // 0→1→0
                const distFactor = Math.min(1, Math.abs(distance) / 600);
                const blurPx = velocity * (22 + 26 * distFactor);   // 22–48px peak
                const hueShift = velocity * (distance > 0 ? 60 : -60);
                const stretch = 1 + velocity * 0.045;                // stronger vertical stretch
                const skewY = velocity * (distance > 0 ? -1.6 : 1.6);
                document.documentElement.style.setProperty('--scroll-blur', blurPx.toFixed(2) + 'px');
                document.documentElement.style.setProperty('--scroll-hue', hueShift.toFixed(1) + 'deg');
                document.documentElement.style.setProperty('--scroll-velocity', velocity.toFixed(3));
                document.documentElement.style.setProperty('--scroll-stretch', stretch.toFixed(4));
                document.documentElement.style.setProperty('--scroll-skew', skewY.toFixed(3) + 'deg');

                window.scrollTo(0, startY + distance * eased);

                if (t < 1) {
                    scrollAnim = requestAnimationFrame(step);
                } else {
                    scrollAnim = null;
                    streakEl.classList.remove('active', 'up', 'down');
                    document.body.classList.remove('scroll-bleeding', 'bleed-down', 'bleed-up');
                    // Reset CSS vars
                    document.documentElement.style.setProperty('--scroll-blur', '0px');
                    document.documentElement.style.setProperty('--scroll-hue', '0deg');
                    document.documentElement.style.setProperty('--scroll-velocity', '0');
                }
            }
            scrollAnim = requestAnimationFrame(step);
        }

        // Replace nav anchor clicks with custom swoosh scroll
        document.querySelectorAll('a[href^="#"]:not(#nav-try)').forEach((anchor) => {
            if (anchor.dataset.swooshBound === '1') return;
            anchor.dataset.swooshBound = '1';
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                smoothScrollTo(top);
            });
        });

        // ===== UNIFIED SCROLL SPY =====
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        const sectionMap = Array.from(navLinks)
            .map((a) => ({ link: a, section: document.querySelector(a.getAttribute('href')) }))
            .filter((x) => x.section);

        document.querySelectorAll('.nav-links a').forEach((a) => {
            a.classList.remove('active-nav', 'is-active');
        });

        let clickLock = 0;
        function setActiveLink(linkEl) {
            navLinks.forEach((a) => {
                const on = (a === linkEl);
                a.classList.toggle('active-nav', on);
                a.classList.toggle('is-active', on);
            });
        }
        function updateActiveNav() {
            if (clickLock > 0) return;
            const y = window.pageYOffset + 120;
            let current = sectionMap[0];
            for (const item of sectionMap) {
                if (item.section.offsetTop <= y) current = item;
            }
            if (current) setActiveLink(current.link);
        }
        navLinks.forEach((a) => {
            a.addEventListener('click', () => {
                clickLock++;
                setActiveLink(a);
                setTimeout(() => { clickLock = Math.max(0, clickLock - 1); }, 1100);
            });
        });
        updateActiveNav();
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => { updateActiveNav(); ticking = false; });
                ticking = true;
            }
        }, { passive: true });

        // ===== Clamp body to actual content (kill bottom whitespace) =====
        function killExtraHeight() {
            document.querySelectorAll('#about, #solutions, #simulator, #technology').forEach((s) => {
                if (s.style.display === 'none' || !s.style.display) s.style.display = 'flex';
                s.style.minHeight = '0';
            });
            const footer = document.getElementById('contact');
            if (footer) {
                if (footer.style.display === 'none' || !footer.style.display) footer.style.display = 'block';
                footer.style.minHeight = '0';
                footer.style.height = 'auto';
                footer.style.maxHeight = 'none';
                footer.style.paddingBottom = '20px';
            }
            const heroElX = document.getElementById('hero');
            if (heroElX) {
                if (heroElX.style.display === 'none' || heroElX.style.display !== 'grid') heroElX.style.display = 'grid';
                heroElX.style.minHeight = '0';
                heroElX.style.height = 'auto';
            }
            document.documentElement.style.minHeight = '0';
            document.body.style.minHeight = '0';
            document.body.style.paddingBottom = '0';
            document.body.style.marginBottom = '0';

            const last = document.getElementById('contact');
            if (last) {
                const rect = last.getBoundingClientRect();
                const contentBottom = Math.ceil(rect.bottom + window.scrollY);
                document.body.style.height = contentBottom + 'px';
                document.body.style.maxHeight = contentBottom + 'px';
                document.body.style.overflowX = 'hidden';
                document.body.style.overflowY = 'clip';
                document.body.style.position = 'relative';
                document.documentElement.style.height = contentBottom + 'px';
                document.documentElement.style.maxHeight = contentBottom + 'px';
                document.documentElement.style.overflowY = 'auto';
            }
        }
        killExtraHeight();
        let killTries = 0;
        const killTimer = setInterval(() => {
            killExtraHeight();
            if (++killTries > 10) clearInterval(killTimer);
        }, 200);
        window.addEventListener('resize', killExtraHeight, { passive: true });
        window.addEventListener('load', killExtraHeight);
        setTimeout(killExtraHeight, 1500);
        setTimeout(killExtraHeight, 3000);
    }
    if (document.readyState === 'loading') {
        window.addEventListener('load', () => setTimeout(setupContinuousScroll, 50));
    } else {
        setTimeout(setupContinuousScroll, 50);
    }

    // -------- 1. Scroll Reveal (IntersectionObserver) --------
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    // Trigger counter animation if applicable
                    const counters = entry.target.querySelectorAll('.stat-counter');
                    counters.forEach(animateCounter);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
        revealEls.forEach((el) => io.observe(el));
    } else {
        // Fallback: just show everything
        revealEls.forEach((el) => el.classList.add('in-view'));
    }

    // -------- 2. Counter Animation (0 → target with glow pulse) --------
    function animateCounter(el, opts) {
        opts = opts || {};
        const force = opts.force === true;
        if (!force && el.dataset.done === '1') return;
        const parent = el.closest('.stat-num');
        const target = parseFloat(parent ? parent.dataset.target : el.dataset.target) || 0;
        const duration = 2800;
        const startTime = performance.now();
        const isFloat = target % 1 !== 0;

        // Reset to zero first so animation is visible
        el.textContent = '0';
        el.dataset.done = '1';

        // Add a "counting" class for CSS pulse/glow during the run
        if (parent) {
            parent.classList.remove('counted');
            parent.classList.add('counting');
        }

        function tick(now) {
            const t = Math.min(1, (now - startTime) / duration);
            // Ease-out-cubic — smooth & visibly ramping
            const eased = 1 - Math.pow(1 - t, 3);
            const value = target * eased;
            el.textContent = isFloat ? value.toFixed(1) : Math.floor(value).toString();
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = isFloat ? target.toFixed(1) : target.toString();
                if (parent) {
                    parent.classList.remove('counting');
                    parent.classList.add('counted');
                }
            }
        }
        requestAnimationFrame(tick);
    }

    // Bulletproof stat-counter trigger:
    //  - Always reset to "0" on load
    //  - Use a scroll/resize listener that fires the first time the
    //    .about-stats container is in viewport (35% from bottom edge)
    //  - Re-fire whenever the user scrolls back into the section so
    //    the user can re-watch the count any time
    (function wireStatCounters() {
        const counters = document.querySelectorAll('.stat-counter');
        const aboutStats = document.querySelector('.about-stats');
        if (!counters.length || !aboutStats) return;

        // Force initial state
        counters.forEach((c) => {
            c.textContent = '0';
            delete c.dataset.done;
            const p = c.closest('.stat-num');
            if (p) { p.classList.remove('counting', 'counted'); }
        });

        let inSection = false;
        let lastFired = 0;
        function check() {
            const rect = aboutStats.getBoundingClientRect();
            const visibleNow = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;
            if (visibleNow && !inSection) {
                inSection = true;
                const now = performance.now();
                if (now - lastFired < 1000) return;
                lastFired = now;
                counters.forEach((c, i) => {
                    setTimeout(() => animateCounter(c, { force: true }), i * 180);
                });
            } else if (!visibleNow && inSection) {
                inSection = false;
            }
        }

        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check, { passive: true });
        // Initial check after a small delay so layout settles
        setTimeout(check, 600);
        setTimeout(check, 1500);
        // Also expose globally for debugging
        window.ZiewCounters = { reset: () => {
            counters.forEach((c) => { delete c.dataset.done; c.textContent = '0'; });
            inSection = false;
            lastFired = 0;
            check();
        }};
    })();

    // -------- 3. (Brain parallax removed - now using individual CSS float animations) --------

    // -------- 3b. 3D Tilt on cards based on cursor position --------
    const tiltSelectors = '.value-card, .uc-card, .perf-card, .solution-card, .tech-card';
    document.querySelectorAll(tiltSelectors).forEach((card) => {
        let raf = null;
        card.addEventListener('mousemove', (e) => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                const rx = (-py * 12).toFixed(2);
                const ry = (px * 14).toFixed(2);
                card.style.transform =
                    `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(20px) scale(1.03)`;
            });
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // -------- 4. Random glitch flash on hero title --------
    const heroH1 = document.querySelector('.hero-section h1');
    if (heroH1) {
        function glitchFlash() {
            heroH1.classList.add('glitching');
            setTimeout(() => heroH1.classList.remove('glitching'), 180);
            setTimeout(glitchFlash, 4000 + Math.random() * 4000);
        }
        setTimeout(glitchFlash, 3000);
    }

    // -------- 4b. Solution Simulator tab switching --------
    const simTabs = document.querySelectorAll('.sim-tab');
    const simScenes = document.querySelectorAll('.sim-scene');
    if (simTabs.length && simScenes.length) {
        simTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.sim;
                simTabs.forEach((t) => t.classList.toggle('active', t === tab));
                simScenes.forEach((s) => s.classList.toggle('active', s.dataset.scene === target));
            });
        });
        // Auto-cycle every 7 seconds (until user interacts)
        let userClicked = false;
        simTabs.forEach((t) => t.addEventListener('click', () => { userClicked = true; }));
        let idx = 0;
        setInterval(() => {
            if (userClicked) return;
            idx = (idx + 1) % simTabs.length;
            simTabs[idx].click();
            userClicked = false;
        }, 7000);
    }

    // -------- 4c. (REMOVED — unified scroll spy is in setupContinuousScroll above) --------

    // -------- 4d. Matrix Rain top mask — DISABLED per request --------
    (function matrixTopMask() {
        // Effect removed: do not create the mask or canvas at all.
        return;
        /* eslint-disable no-unreachable */
        if (document.getElementById('matrix-top-mask')) return;
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mask = document.createElement('div');
        mask.id = 'matrix-top-mask';
        const canvas = document.createElement('canvas');
        mask.appendChild(canvas);
        document.body.appendChild(mask);
        if (reduce) return;

        const ctx = canvas.getContext('2d');
        const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプヱエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポ0123456789ZIEWISEｦｧｨｩｪｫｬｭｮｯ'.split('');
        let columns = 0;
        let drops = [];
        const fontSize = 14;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const rect = mask.getBoundingClientRect();
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            columns = Math.floor(rect.width / fontSize);
            drops = new Array(columns).fill(0).map(() => Math.random() * -20);
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        let last = 0;
        const interval = 60; // ms between frames - controls speed
        function draw(now) {
            requestAnimationFrame(draw);
            if (now - last < interval) return;
            last = now;
            const rect = mask.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            // Transparent clear (no dark trail band)
            ctx.clearRect(0, 0, w, h);
            ctx.font = fontSize + "px 'Courier New', monospace";
            for (let i = 0; i < columns; i++) {
                const ch = chars[(Math.random() * chars.length) | 0];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                // Bright head
                if (Math.random() < 0.04) {
                    ctx.fillStyle = '#d4ffd9';
                    ctx.shadowColor = '#00ff41';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = 'rgba(0, 255, 65, ' + (0.55 + Math.random() * 0.45).toFixed(2) + ')';
                    ctx.shadowBlur = 0;
                }
                ctx.fillText(ch, x, y);
                if (y > h && Math.random() > 0.965) {
                    drops[i] = 0;
                }
                drops[i] += 1;
            }
            ctx.shadowBlur = 0;
        }
        requestAnimationFrame(draw);
    })();

    // -------- 5. Live Status panel - subtle metric jitter --------
    const lsNodes = document.getElementById('ls-nodes');
    const lsInf   = document.getElementById('ls-inf');
    if (lsNodes && lsInf) {
        setInterval(() => {
            // Edge nodes: drift around 1247 +/- 8
            const n = 1247 + Math.floor((Math.random() - 0.5) * 16);
            lsNodes.textContent = n.toLocaleString();
            // Inference latency: 42-49ms
            const ms = 42 + Math.floor(Math.random() * 8);
            lsInf.textContent = ms;
        }, 2200);
    }
})();
