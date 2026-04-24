(function () {
    'use strict';

    // ============================================================
    //  Small helpers
    // ============================================================
    function $(id) { return document.getElementById(id); }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        var t = (value - inMin) / (inMax - inMin);
        if (t < 0) t = 0; else if (t > 1) t = 1;
        return outMin + (outMax - outMin) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // schedule non-critical work off the main critical path
    var onIdle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1); };

    var reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================================
    //  Countdown (paused automatically when tab is hidden)
    // ============================================================
    var weddingStart = new Date("2026-05-29T04:30:00+05:30").getTime();
    var weddingEnd   = new Date("2026-05-29T23:59:59+05:30").getTime();
    var countdownEl  = $('countdown');
    var countdownTimer = null;

    function updateCountdown() {
        if (!countdownEl) return;
        var now = Date.now();

        if (now > weddingEnd + 86400000 * 2) {
            countdownEl.className = 'countdown is-today';
            countdownEl.innerHTML = 'Thank you for being part of our journey.';
            stopCountdown();
            return;
        }

        if (now >= weddingStart - 3600000 && now <= weddingEnd) {
            countdownEl.className = 'countdown is-today';
            countdownEl.innerHTML = 'Today is the day — blessings upon us all.';
            return;
        }

        var dist = Math.max(0, weddingStart - now);
        var d = Math.floor(dist / 86400000);
        var h = Math.floor((dist % 86400000) / 3600000);
        var m = Math.floor((dist % 3600000) / 60000);
        var s = Math.floor((dist % 60000) / 1000);

        var days = $('days');
        if (!days) {
            countdownEl.className = 'countdown fade-in visible';
            countdownEl.innerHTML =
                '<div class="time-box"><span class="time-value" id="days">00</span><span class="time-label">Days</span></div>' +
                '<div class="time-box"><span class="time-value" id="hours">00</span><span class="time-label">Hours</span></div>' +
                '<div class="time-box"><span class="time-value" id="minutes">00</span><span class="time-label">Mins</span></div>' +
                '<div class="time-box"><span class="time-value" id="seconds">00</span><span class="time-label">Secs</span></div>';
            days = $('days');
        }

        days.textContent         = d < 10 ? '0' + d : d;
        $('hours').textContent   = h < 10 ? '0' + h : h;
        $('minutes').textContent = m < 10 ? '0' + m : m;
        $('seconds').textContent = s < 10 ? '0' + s : s;
    }

    function startCountdown() {
        if (countdownTimer || !countdownEl) return;
        updateCountdown();
        countdownTimer = setInterval(updateCountdown, 1000);
    }
    function stopCountdown() {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    }

    startCountdown();

    // ============================================================
    //  Fade-in on scroll (IntersectionObserver — cheap, one-shot)
    // ============================================================
    var fadeObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                fadeObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(function (el) {
        fadeObserver.observe(el);
    });

    // ============================================================
    //  Temple Journey — SVG zoom + door open
    //  Coalesced with scroll-top visibility + progress bar into a
    //  single RAF-throttled scroll handler (one listener, one frame).
    // ============================================================
    var journey       = $('templeJourney');
    var gopuramSvg    = $('gopuramSvg');
    var heroOverlay   = $('heroOverlay');
    var darkOverlay   = $('darkOverlay');
    var doorContainer = $('doorContainer');
    var doorLeft      = $('doorLeft');
    var doorRight     = $('doorRight');
    var doorReveal    = $('doorReveal');
    var sBtn          = $('scrollTopBtn');
    var progressEl    = $('scrollProgress');

    var lastJourneyProgress = 0;

    function updateTempleJourney() {
        if (!journey) return 0;

        var rect = journey.getBoundingClientRect();
        var scrollRange = journey.offsetHeight - window.innerHeight;
        if (scrollRange <= 0) return lastJourneyProgress;

        var progress = -rect.top / scrollRange;
        if (progress < 0) progress = 0; else if (progress > 1) progress = 1;
        lastJourneyProgress = progress;

        // Hero text fade
        var heroOpacity = mapRange(progress, 0.14, 0.26, 1, 0);
        heroOverlay.style.opacity = heroOpacity;
        heroOverlay.style.pointerEvents = heroOpacity < 0.1 ? 'none' : '';

        // SVG zoom toward the door (pivot on door, translate up to center).
        var zoomEased   = easeInOutCubic(mapRange(progress, 0.18, 0.56, 0, 1));
        var scale       = 1 + zoomEased * 5.2;
        var translateVh = -zoomEased * 31.5;
        var svgOpacity  = mapRange(progress, 0.50, 0.58, 1, 0);
        gopuramSvg.style.transform = 'translateY(' + translateVh + 'vh) scale(' + scale + ')';
        gopuramSvg.style.opacity = svgOpacity;

        // Mulberry overlay ramps in and stays (hides the cream sky).
        darkOverlay.style.opacity = mapRange(progress, 0.48, 0.58, 0, 0.96);

        // Door panels crossfade in, then rotate open.
        doorContainer.style.opacity = mapRange(progress, 0.50, 0.58, 0, 1);
        var doorAngle = easeInOutCubic(mapRange(progress, 0.65, 0.92, 0, 1)) * 82;
        doorLeft.style.transform  = 'rotateY(' + doorAngle + 'deg)';
        doorRight.style.transform = 'rotateY(' + (-doorAngle) + 'deg)';

        // Invite content fades in only once the doors are mostly swung open
        // (doorAngle hits ~80% of 82deg around progress 0.86) — prevents the
        // half-open wood panels from covering the invite text on narrower
        // viewports.
        doorReveal.style.opacity = mapRange(progress, 0.82, 0.95, 0, 1);

        return progress;
    }

    var ticking = false;
    function onScrollFrame() {
        updateTempleJourney();

        if (sBtn) sBtn.classList.toggle('show', window.scrollY > 400);

        if (progressEl) {
            var h = document.documentElement;
            var height = (h.scrollHeight - h.clientHeight) || 1;
            progressEl.style.width =
                Math.min(100, ((h.scrollTop || document.body.scrollTop) / height) * 100) + '%';
        }

        ticking = false;
    }
    function requestScrollFrame() {
        if (!ticking) {
            requestAnimationFrame(onScrollFrame);
            ticking = true;
        }
    }
    window.addEventListener('scroll', requestScrollFrame, { passive: true });
    onScrollFrame();

    // ============================================================
    //  Door panel stud/band/molding markup
    //  Not visible until ~50% scroll, so defer to idle time.
    // ============================================================
    onIdle(function populateDoorDetails() {
        document.querySelectorAll('.door-inner').forEach(function (panel) {
            var isLeft = panel.closest('.door-panel-left') !== null;
            var rows = 9, cols = 3;

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var stud = document.createElement('div');
                    stud.className = 'door-stud';
                    stud.style.top  = (6 + r * 10.5) + '%';
                    stud.style.left = ((isLeft ? 12 : 28) + c * 20) + '%';
                    panel.appendChild(stud);
                }
                var band = document.createElement('div');
                band.className = 'door-horizontal-band';
                band.style.top = (4.5 + r * 10.5) + '%';
                panel.appendChild(band);
            }

            var mT = document.createElement('div');
            mT.className = 'door-molding door-molding-top';
            panel.appendChild(mT);
            var mB = document.createElement('div');
            mB.className = 'door-molding door-molding-bottom';
            panel.appendChild(mB);
        });
    });

    // ============================================================
    //  Floating cup vilakku (agal vilakku)
    //  – Skipped entirely on prefers-reduced-motion.
    //  – Paused when tab hidden.
    //  – Stops spawning once user has scrolled past the hero
    //    (they only look good over the temple sky anyway).
    // ============================================================
    var vContainer = $('vellakkuContainer');
    var vilakuTimer = null;

    function makeCupVilaku() {
        if (!vContainer) return;
        var el = document.createElement('div');
        el.className = 'vellakku';
        var size = 28 + Math.random() * 22;
        var dur  = 14 + Math.random() * 10;
        var del  = Math.random() * 4;
        el.style.left   = (4 + Math.random() * 92) + '%';
        el.style.bottom = '-80px';
        el.style.animationDuration = dur + 's';
        el.style.animationDelay    = del + 's';

        var flickerId = 'fl' + Math.random().toString(36).substr(2, 5);
        var glow1 = 'hsl(' + (30 + Math.random() * 15) + ',95%,60%)';
        var glow2 = 'hsl(' + (35 + Math.random() * 15) + ',90%,50%)';

        el.innerHTML =
            '<svg width="' + size + '" height="' + (size * 1.4) + '" viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">' +
              '<defs><radialGradient id="' + flickerId + '">' +
                '<stop offset="0%" stop-color="#fffbe6" stop-opacity="0.85"/>' +
                '<stop offset="40%" stop-color="' + glow1 + '" stop-opacity="0.5"/>' +
                '<stop offset="100%" stop-color="' + glow2 + '" stop-opacity="0"/>' +
              '</radialGradient></defs>' +
              '<ellipse cx="25" cy="16" rx="14" ry="16" fill="url(#' + flickerId + ')" opacity="0.5"/>' +
              '<path d="M25,4 C25,4 19,12 19,18 C19,21.3 21.7,24 25,24 C28.3,24 31,21.3 31,18 C31,12 25,4 25,4Z" fill="' + glow1 + '" opacity="0.9" style="animation:flameFlicker 0.6s ease-in-out infinite;transform-origin:25px 24px"/>' +
              '<path d="M25,10 C25,10 22,15 22,18.5 C22,20.2 23.3,21.5 25,21.5 C26.7,21.5 28,20.2 28,18.5 C28,15 25,10 25,10Z" fill="#fff8d6" opacity="0.95" style="animation:flameFlicker 0.4s ease-in-out infinite reverse;transform-origin:25px 21.5px"/>' +
              '<rect x="24" y="23" width="2" height="4" rx="1" fill="#4a3520"/>' +
              '<ellipse cx="25" cy="30" rx="12" ry="4" fill="#c9a84c" opacity="0.85"/>' +
              '<path d="M13,30 C13,30 14,40 19,42 L31,42 C36,40 37,30 37,30 Z" fill="#b8922e" opacity="0.8"/>' +
              '<ellipse cx="25" cy="42" rx="7" ry="2.5" fill="#a07e28" opacity="0.7"/>' +
              '<path d="M12,30 L10,28 L40,28 L38,30 Z" fill="#c9a84c" opacity="0.5"/>' +
              '<ellipse cx="25" cy="44" rx="9" ry="3" fill="#8a6b20" opacity="0.5"/>' +
            '</svg>';

        vContainer.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, (dur + del) * 1000);
    }

    function startVilaku() {
        if (reducedMotion || !vContainer || vilakuTimer) return;
        // Stop spawning once we're well past the hero — old diyas finish
        // their float-out animation and clean themselves up.
        if (lastJourneyProgress > 0.6) return;
        vilakuTimer = setInterval(function () {
            if (lastJourneyProgress > 0.6) { stopVilaku(); return; }
            makeCupVilaku();
        }, 3000);
    }
    function stopVilaku() {
        if (vilakuTimer) { clearInterval(vilakuTimer); vilakuTimer = null; }
    }

    if (!reducedMotion && vContainer) {
        for (var i = 0; i < 10; i++) makeCupVilaku();
        startVilaku();
    }

    // ============================================================
    //  Pause intervals when tab is hidden (battery-friendly)
    // ============================================================
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopCountdown();
            stopVilaku();
        } else {
            startCountdown();
            startVilaku();
        }
    });

    // ============================================================
    //  Add-to-Calendar (.ics download)
    // ============================================================
    var ICS_EVENTS = {
        reception: {
            title: 'Sharanya & Vigneshwar — Wedding Reception',
            start: '20260528T183000',
            end:   '20260528T223000',
            location: 'Velammal Hall, Mogappair West Main Road, Nolambur, Chennai - 600037',
            description: 'Reception — join us for a warm evening of food, music and blessings.'
        },
        wedding: {
            title: 'Sharanya & Vigneshwar — Wedding',
            start: '20260529T043000',
            end:   '20260529T063000',
            location: 'Velammal Hall, Mogappair West Main Road, Nolambur, Chennai - 600037',
            description: 'Muhurtham between 4.30 am and 6.00 am. Breakfast follows.'
        },
        palaniReception: {
            title: 'Sharanya & Vigneshwar — Reception (Palani)',
            start: '20260601T183000',
            end:   '20260601T223000',
            location: 'Raj Mahal, 5, Gounder Iteri Road, Palani - 624601',
            description: 'Post-wedding reception at Palani. Warm & hearty welcome by Selvi. Priyadharshini Jayakumar.'
        }
    };

    function escapeIcs(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,')
                        .replace(/;/g, '\\;').replace(/\n/g, '\\n');
    }

    function downloadIcs(key) {
        var evt = ICS_EVENTS[key];
        if (!evt) return;
        var now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        var ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0',
            'PRODID:-//Sharanya & Vigneshwar//Wedding Invite//EN',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' + key + '-' + Date.now() + '@sharanya-vigneshwar',
            'DTSTAMP:' + now,
            'DTSTART;TZID=Asia/Kolkata:' + evt.start,
            'DTEND;TZID=Asia/Kolkata:' + evt.end,
            'SUMMARY:' + escapeIcs(evt.title),
            'LOCATION:' + escapeIcs(evt.location),
            'DESCRIPTION:' + escapeIcs(evt.description),
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');

        var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sharanya-vigneshwar-' + key + '.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    }

    document.querySelectorAll('[data-calendar]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            downloadIcs(btn.getAttribute('data-calendar'));
        });
    });

    // ============================================================
    //  Background Audio Toggle
    // ============================================================
    var audioEl = $('bgAudio');
    var audioBtn = $('audioToggle');
    if (audioEl && audioBtn) {
        audioEl.volume = 0.25;
        audioBtn.addEventListener('click', function () {
            if (!audioEl.paused) {
                audioEl.pause();
                audioBtn.setAttribute('aria-pressed', 'false');
                return;
            }
            var p = audioEl.play();
            if (p && typeof p.then === 'function') {
                p.then(function () { audioBtn.setAttribute('aria-pressed', 'true'); })
                 .catch(function () { audioBtn.setAttribute('aria-pressed', 'false'); });
            } else {
                audioBtn.setAttribute('aria-pressed', 'true');
            }
        });
    }

    // ============================================================
    //  Share Button (Web Share API + clipboard fallback)
    // ============================================================
    var shareBtn = $('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var shareData = {
                title: 'Sharanya weds Vigneshwar',
                text: 'With the blessings of our families — please join us on 29th May 2026 at Velammal Hall, Chennai.',
                url: window.location.href
            };
            if (navigator.share) {
                navigator.share(shareData).catch(function () {});
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href).then(function () {
                    var original = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<span style="letter-spacing:2px">Link copied</span>';
                    setTimeout(function () { shareBtn.innerHTML = original; }, 1800);
                });
                return;
            }
            window.prompt('Copy this link:', window.location.href);
        });
    }
})();
