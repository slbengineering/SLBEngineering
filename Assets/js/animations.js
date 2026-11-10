/* SLB Engineering - scroll-reveal. Vanilla JS, no dependencies. */
(function () {
	'use strict';

	var SELECTOR = [
		'.herotxt .col-md-9',
		'.highlight',
		'.sectionBox .col-md-6 > .heading',
		'.sectionBox .col-md-6 > p',
		'.sectionBox blockquote',
		'.blockquote-box',
		'.page-header',
		'.maincontent > h3, .maincontent > p',
		'.sidebar .panel, .contact-details',
		'.serviceslist .row > [class*="col-"]',
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
