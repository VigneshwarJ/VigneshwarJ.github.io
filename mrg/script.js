(function () {
    'use strict';

    // ========================================
    //  Countdown Timer (with "today" + "passed" states)
    // ========================================
    var weddingStart = new Date("2026-05-29T04:30:00+05:30").getTime();
    var weddingEnd   = new Date("2026-05-29T23:59:59+05:30").getTime();
    var countdownEl  = document.getElementById('countdown');

    function updateCountdown() {
        var now = Date.now();

        // Already over
        if (now > weddingEnd + 86400000 * 2) {
            countdownEl.className = 'countdown is-today';
            countdownEl.innerHTML = 'Thank you for being part of our journey.';
            return;
        }

        // Wedding day window
        if (now >= weddingStart - 3600000 && now <= weddingEnd) {
            countdownEl.className = 'countdown is-today';
            countdownEl.innerHTML = 'Today is the day — blessings upon us all.';
            return;
        }

        // Upcoming
        var dist = weddingStart - now;
        if (dist < 0) { dist = 0; }

        var d = Math.floor(dist / 86400000);
        var h = Math.floor((dist % 86400000) / 3600000);
        var m = Math.floor((dist % 3600000) / 60000);
        var s = Math.floor((dist % 60000) / 1000);

        var days = document.getElementById('days');
        if (!days) {
            // Container was swapped out; restore grid markup
            countdownEl.className = 'countdown fade-in visible';
            countdownEl.innerHTML =
                '<div class="time-box"><span class="time-value" id="days">00</span><span class="time-label">Days</span></div>' +
                '<div class="time-box"><span class="time-value" id="hours">00</span><span class="time-label">Hours</span></div>' +
                '<div class="time-box"><span class="time-value" id="minutes">00</span><span class="time-label">Mins</span></div>' +
                '<div class="time-box"><span class="time-value" id="seconds">00</span><span class="time-label">Secs</span></div>';
            days = document.getElementById('days');
        }

        days.textContent = d < 10 ? '0' + d : d;
        document.getElementById('hours').textContent   = h < 10 ? '0' + h : h;
        document.getElementById('minutes').textContent = m < 10 ? '0' + m : m;
        document.getElementById('seconds').textContent = s < 10 ? '0' + s : s;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ========================================
    //  Scroll Fade-In Animations
    // ========================================
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) e.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(function (el) {
        obs.observe(el);
    });

    // ========================================
    //  Scroll-to-Top Button
    // ========================================
    var sBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', function () {
        sBtn.classList.toggle('show', window.scrollY > 400);
    });

    // ========================================
    //  Temple Journey - SVG Zoom + Door Open
    // ========================================
    var journey       = document.getElementById('templeJourney');
    var gopuramSvg    = document.getElementById('gopuramSvg');
    var heroOverlay   = document.getElementById('heroOverlay');
    var darkOverlay   = document.getElementById('darkOverlay');
    var doorContainer = document.getElementById('doorContainer');
    var doorLeft      = document.getElementById('doorLeft');
    var doorRight     = document.getElementById('doorRight');
    var doorReveal    = document.getElementById('doorReveal');

    /*
     * Scroll phases (500vh section, 400vh scroll range):
     *
     *   0.00 - 0.18 : Full gopuram SVG visible, hero text overlaid
     *   0.14 - 0.26 : Hero text fades out
     *   0.20 - 0.55 : SVG zooms toward door (scale 1 -> 4.5, origin at door)
     *   0.48 - 0.56 : Dissolve: SVG fades, dark overlay + door panels crossfade in
     *   0.56 - 0.62 : Door panels fully visible
     *   0.62 - 0.92 : Doors rotate open on Y-axis
     *   0.60 - 0.82 : Invite content fades in behind doors
     *   0.92 - 1.00 : Settled, doors fully open
     */

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        var t = (value - inMin) / (inMax - inMin);
        t = Math.max(0, Math.min(1, t));
        return outMin + (outMax - outMin) * t;
    }

    var ticking = false;

    function updateTempleJourney() {
        if (!journey) return;

        var rect = journey.getBoundingClientRect();
        var sectionHeight = journey.offsetHeight;
        var viewportH = window.innerHeight;
        var scrollRange = sectionHeight - viewportH;

        if (scrollRange <= 0) return;

        var scrolledInto = -rect.top;
        var progress = Math.max(0, Math.min(1, scrolledInto / scrollRange));

        // Phase 1: Hero text fade
        var heroOpacity = mapRange(progress, 0.14, 0.26, 1, 0);
        heroOverlay.style.opacity = heroOpacity;
        heroOverlay.style.pointerEvents = heroOpacity < 0.1 ? 'none' : '';

        // Phase 2: SVG zoom toward the door entrance.
        // The door center is at (50%, 82.5%) of the SVG. We pivot zoom on it,
        // then translate up so the door finishes at viewport middle — where
        // the 3D door panels sit — for a seamless crossfade.
        var zoomT = mapRange(progress, 0.18, 0.56, 0, 1);
        var zoomEased = easeInOutCubic(zoomT);
        var scale = 1 + zoomEased * 5.2;           // 1 → 6.2
        var translateYVh = -zoomEased * 31.5;      // 0 → -31.5vh (door-center → viewport-center)
        var svgOpacity = mapRange(progress, 0.50, 0.58, 1, 0);
        gopuramSvg.style.transform = 'translateY(' + translateYVh + 'vh) scale(' + scale + ')';
        gopuramSvg.style.opacity = svgOpacity;

        // Phase 3: Dark (mulberry) overlay — ramps in, then STAYS on so the
        // cream hero never peeks out behind the open doors or before body.
        var darkOpacity = mapRange(progress, 0.48, 0.58, 0, 0.96);
        darkOverlay.style.opacity = darkOpacity;

        // Phase 4: Door panels crossfade in (overlaps with SVG fade)
        var doorAppear = mapRange(progress, 0.50, 0.58, 0, 1);
        doorContainer.style.opacity = doorAppear;

        // Phase 5: Doors rotate open (Y-axis, like hinged temple doors)
        var doorT = mapRange(progress, 0.65, 0.92, 0, 1);
        var doorEased = easeInOutCubic(doorT);
        var doorAngle = doorEased * 82;
        doorLeft.style.transform  = 'rotateY(' + doorAngle + 'deg)';
        doorRight.style.transform = 'rotateY(' + (-doorAngle) + 'deg)';

        // Phase 6: Invite reveal
        var revealOpacity = mapRange(progress, 0.62, 0.82, 0, 1);
        doorReveal.style.opacity = revealOpacity;

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateTempleJourney);
            ticking = true;
        }
    }, { passive: true });

    updateTempleJourney();

    // ========================================
    //  Populate Door Studs & Bands
    // ========================================
    function populateDoorDetails() {
        var panels = document.querySelectorAll('.door-inner');
        panels.forEach(function (panel) {
            var isLeft = panel.closest('.door-panel-left') !== null;
            var rows = 9;
            var cols = 3;

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var stud = document.createElement('div');
                    stud.className = 'door-stud';
                    var topPct = 6 + r * 10.5;
                    var leftPct;
                    if (isLeft) {
                        leftPct = 12 + c * 20;
                    } else {
                        leftPct = 28 + c * 20;
                    }
                    stud.style.top = topPct + '%';
                    stud.style.left = leftPct + '%';
                    panel.appendChild(stud);
                }

                var band = document.createElement('div');
                band.className = 'door-horizontal-band';
                band.style.top = (4.5 + r * 10.5) + '%';
                panel.appendChild(band);
            }

            var moldTop = document.createElement('div');
            moldTop.className = 'door-molding door-molding-top';
            panel.appendChild(moldTop);

            var moldBot = document.createElement('div');
            moldBot.className = 'door-molding door-molding-bottom';
            panel.appendChild(moldBot);
        });
    }

    populateDoorDetails();

    // ========================================
    //  Floating Cup Vilaku (Agal Vilaku)
    // ========================================
    var vContainer = document.getElementById('vellakkuContainer');

    function makeCupVilaku() {
        var el = document.createElement('div');
        el.className = 'vellakku';
        var size = 28 + Math.random() * 22;
        el.style.left = (4 + Math.random() * 92) + '%';
        el.style.bottom = '-80px';
        var dur = 14 + Math.random() * 10;
        var del = Math.random() * 4;
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = del + 's';

        var flickerId = 'fl' + Math.random().toString(36).substr(2, 5);
        var glow1 = 'hsl(' + (30 + Math.random() * 15) + ',95%,60%)';
        var glow2 = 'hsl(' + (35 + Math.random() * 15) + ',90%,50%)';

        el.innerHTML =
            '<svg width="' + size + '" height="' + (size * 1.4) + '" viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                    '<radialGradient id="' + flickerId + '">' +
                        '<stop offset="0%" stop-color="#fffbe6" stop-opacity="0.85"/>' +
                        '<stop offset="40%" stop-color="' + glow1 + '" stop-opacity="0.5"/>' +
                        '<stop offset="100%" stop-color="' + glow2 + '" stop-opacity="0"/>' +
                    '</radialGradient>' +
                '</defs>' +
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

    for (var i = 0; i < 10; i++) makeCupVilaku();
    setInterval(makeCupVilaku, 3000);

    // ========================================
    //  Add-to-Calendar (.ics download)
    // ========================================
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
        }
    };

    function escapeIcs(str) {
        return String(str).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    }

    function downloadIcs(key) {
        var evt = ICS_EVENTS[key];
        if (!evt) return;
        var now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        var uid = key + '-' + Date.now() + '@sharanya-vigneshwar';
        var ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Sharanya & Vigneshwar//Wedding Invite//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' + uid,
            'DTSTAMP:' + now,
            'DTSTART;TZID=Asia/Kolkata:' + evt.start,
            'DTEND;TZID=Asia/Kolkata:' + evt.end,
            'SUMMARY:' + escapeIcs(evt.title),
            'LOCATION:' + escapeIcs(evt.location),
            'DESCRIPTION:' + escapeIcs(evt.description),
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        var url = URL.createObjectURL(blob);
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

    // ========================================
    //  Background Audio Toggle
    // ========================================
    var audioEl = document.getElementById('bgAudio');
    var audioBtn = document.getElementById('audioToggle');
    if (audioEl && audioBtn) {
        audioEl.volume = 0.25;
        audioBtn.addEventListener('click', function () {
            var playing = !audioEl.paused;
            if (playing) {
                audioEl.pause();
                audioBtn.setAttribute('aria-pressed', 'false');
            } else {
                var p = audioEl.play();
                if (p && typeof p.then === 'function') {
                    p.then(function () {
                        audioBtn.setAttribute('aria-pressed', 'true');
                    }).catch(function () {
                        audioBtn.setAttribute('aria-pressed', 'false');
                    });
                } else {
                    audioBtn.setAttribute('aria-pressed', 'true');
                }
            }
        });
    }

    // ========================================
    //  Scroll Progress Bar
    // ========================================
    var progressEl = document.getElementById('scrollProgress');
    if (progressEl) {
        function updateProgress() {
            var h = document.documentElement;
            var scrolled = (h.scrollTop || document.body.scrollTop);
            var height = (h.scrollHeight - h.clientHeight) || 1;
            progressEl.style.width = Math.min(100, (scrolled / height) * 100) + '%';
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // ========================================
    //  Share Button (Web Share API + clipboard fallback)
    // ========================================
    var shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var shareData = {
                title: 'Sharanya weds Vigneshwar',
                text: 'With the blessings of our families — please join us on 29th May 2026 at Velammal Hall, Chennai.',
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData).catch(function () { /* user cancelled */ });
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
