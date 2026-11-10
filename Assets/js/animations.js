/* SLB Engineering - scroll-reveal. Vanilla JS, no dependencies. */
(function () {
	'use strict';

	var SELECTOR = [
		'.herotxt .row > [class*="col-"]',
		'.amr-video .container',
		'.highlight',
		'.sectionBox .col-md-6 > .heading',
		'.sectionBox .col-md-6 > p',
		'.sectionBox blockquote',
		'.blockquote-box',
		'.page-header',
		'.maincontent > h3, .maincontent > p',
		'.sidebar .panel, .contact-details',
		'.serviceslist .row > [class*="col-"]',
		'.datasw .lead, .datasw-features li, .datasw-shots > [class*="col-"]',
		'.footer1 .panel'
	].join(',');

	var els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
	if (!els.length) return;

	// No IntersectionObserver (very old browser): just leave everything visible.
	if (!('IntersectionObserver' in window)) {
		document.documentElement.className = document.documentElement.className.replace(/\bjs\b/, '');
		return;
	}

	// Stagger siblings so rows of cards cascade instead of popping in together.
	var seen = new Map();
	els.forEach(function (el) {
		var n = seen.get(el.parentNode) || 0;
		seen.set(el.parentNode, n + 1);
		el.style.setProperty('--d', Math.min(n, 5) * 0.09 + 's');
		el.classList.add('reveal');
	});

	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('in');
			io.unobserve(entry.target);
		});
	}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

	els.forEach(function (el) { io.observe(el); });
})();

/* Click-to-enlarge image viewer for <a class="lightbox" href="big-image">. Works without JS too (link opens the image). */
(function () {
	'use strict';
	var links = Array.prototype.slice.call(document.querySelectorAll('a.lightbox'));
	if (!links.length) return;

	var ov, img, cap, idx = 0, opener = null;

	function build() {
		ov = document.createElement('div');
		ov.className = 'lb-overlay';
		ov.setAttribute('role', 'dialog');
		ov.setAttribute('aria-modal', 'true');
		ov.setAttribute('aria-label', 'Image viewer');
		ov.hidden = true;
		ov.innerHTML =
			'<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
			(links.length > 1 ? '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">&#8249;</button>' +
			                    '<button type="button" class="lb-btn lb-next" aria-label="Next image">&#8250;</button>' : '') +
			'<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>';
		document.body.appendChild(ov);
		img = ov.querySelector('.lb-img');
		cap = ov.querySelector('.lb-cap');

		ov.addEventListener('click', function (e) {
			if (e.target === img) { ov.classList.toggle('zoomed'); return; } // tap image: fit <-> full size
			if (e.target.classList.contains('lb-prev')) { show(idx - 1); return; }
			if (e.target.classList.contains('lb-next')) { show(idx + 1); return; }
			close(); // backdrop or X
		});
		document.addEventListener('keydown', function (e) {
			if (ov.hidden) return;
			if (e.key === 'Escape') close();
			else if (e.key === 'ArrowLeft') show(idx - 1);
			else if (e.key === 'ArrowRight') show(idx + 1);
			else if (e.key === 'Tab') { e.preventDefault(); ov.querySelector('.lb-close').focus(); } // keep focus inside
		});
	}

	function show(i) {
		idx = (i + links.length) % links.length;
		var a = links[idx], thumb = a.querySelector('img');
		ov.classList.remove('zoomed');
		img.src = a.getAttribute('href');
		img.alt = thumb ? thumb.alt : '';
		cap.textContent = a.getAttribute('data-caption') || '';
	}

	function open(i, from) {
		if (!ov) build();
		opener = from;
		show(i);
		ov.hidden = false;
		document.documentElement.classList.add('lb-open');
		ov.querySelector('.lb-close').focus();
	}

	function close() {
		ov.hidden = true;
		img.removeAttribute('src');
		document.documentElement.classList.remove('lb-open');
		if (opener) opener.focus();
	}

	links.forEach(function (a, i) {
		a.addEventListener('click', function (e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
			e.preventDefault();
			open(i, a);
		});
	});
})();

/* YouTube "facade": show a thumbnail and only load the (heavy) player when the visitor clicks play. */
(function () {
	'use strict';
	Array.prototype.forEach.call(document.querySelectorAll('.yt-facade[data-yt]'), function (box) {
		var link = box.querySelector('.yt-link');
		if (!link) return;
		link.addEventListener('click', function (e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // allow open-in-new-tab
			e.preventDefault();
			var f = document.createElement('iframe');
			f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0&modestbranding=1';
			f.title = box.getAttribute('data-title') || 'Video';
			f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
			f.allowFullscreen = true;
			f.referrerPolicy = 'strict-origin-when-cross-origin';
			box.replaceChild(f, link);
			f.focus();
		});
	});
})();

/* Muted looping YouTube clip used like an animated picture. Starts when scrolled into view;
   skipped for visitors who prefer reduced motion or have data saver on (they just see the still frame). */
(function () {
	'use strict';
	var boxes = Array.prototype.slice.call(document.querySelectorAll('.vid-loop[data-yt]'));
	if (!boxes.length) return;
	var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var saver = navigator.connection && navigator.connection.saveData;
	if (calm || saver || !('IntersectionObserver' in window)) return;

	function start(box) {
		var host = box.querySelector('.vid-poster');
		if (!host || host.querySelector('iframe')) return;
		var id = box.getAttribute('data-yt');
		var f = document.createElement('iframe');
		f.src = 'https://www.youtube-nocookie.com/embed/' + id +
			'?autoplay=1&mute=1&loop=1&playlist=' + id +
			'&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0';
		f.title = 'Yaskawa robots on a production line (looping video)';
		f.allow = 'autoplay; encrypted-media; picture-in-picture';
		f.tabIndex = -1;
		f.setAttribute('aria-hidden', 'true');
		f.addEventListener('load', function () {
			setTimeout(function () { box.classList.add('playing'); }, 1200); // let the first frame appear, no black flash
		});
		host.appendChild(f);
	}

	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (e) {
			if (!e.isIntersecting) return;
			start(e.target);
			io.unobserve(e.target);
		});
	}, { threshold: 0.25 });
	boxes.forEach(function (b) { io.observe(b); });
})();
