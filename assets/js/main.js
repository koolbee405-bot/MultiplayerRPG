/* Yardline — interactions
   Mobile nav · sticky header · scroll reveal · stat count-up
   pricing toggle · before/after slider · FAQ accordion · lead form */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (burger && nav) {
    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('nav--open', open);
    };

    burger.addEventListener('click', () => {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Clear the mobile panel state when we grow past the breakpoint.
    window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- sticky header shadow ---------- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  const revealables = document.querySelectorAll('.r');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  }

  /* ---------- stat count-up ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const countUp = (el) => {
      const target = Number(el.dataset.count);
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const statObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          statObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => statObs.observe(el));
  }

  /* ---------- pricing: lot size toggle ---------- */
  const lotStandard = document.getElementById('lotStandard');
  const lotLarge = document.getElementById('lotLarge');
  const prices = document.querySelectorAll('[data-price-standard]');

  if (lotStandard && lotLarge && prices.length) {
    const money = (n) => '$' + Number(n).toLocaleString('en-US');

    const apply = (size) => {
      const isLarge = size === 'large';
      lotStandard.setAttribute('aria-pressed', String(!isLarge));
      lotLarge.setAttribute('aria-pressed', String(isLarge));
      prices.forEach((el) => {
        el.textContent = money(isLarge ? el.dataset.priceLarge : el.dataset.priceStandard);
      });
    };

    lotStandard.addEventListener('click', () => apply('standard'));
    lotLarge.addEventListener('click', () => apply('large'));
    apply('standard');
  }

  /* ---------- before / after slider ---------- */
  const compare = document.getElementById('compare');
  const range = document.getElementById('compareRange');

  if (compare && range) {
    const setSplit = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      compare.style.setProperty('--split', clamped + '%');
    };

    const pointerSplit = (clientX) => {
      const rect = compare.getBoundingClientRect();
      setSplit(((clientX - rect.left) / rect.width) * 100);
    };

    let dragging = false;

    compare.addEventListener('pointerdown', (e) => {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      pointerSplit(e.clientX);
    });
    compare.addEventListener('pointermove', (e) => {
      if (dragging) pointerSplit(e.clientX);
    });
    compare.addEventListener('pointerup', (e) => {
      dragging = false;
      compare.releasePointerCapture(e.pointerId);
      // Keep the (invisible) range input in sync so the keyboard path stays accurate.
      const rect = compare.getBoundingClientRect();
      range.value = String(Math.round(((e.clientX - rect.left) / rect.width) * 100));
    });

    // Hover-to-scrub on pointers that hover, so the interaction is discoverable.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      compare.addEventListener('pointermove', (e) => {
        if (!dragging) pointerSplit(e.clientX);
      });
    }

    range.addEventListener('input', () => setSplit(Number(range.value)));
    setSplit(Number(range.value));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__q').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';

      // One answer open at a time.
      document.querySelectorAll('.faq__q[aria-expanded="true"]').forEach((other) => {
        if (other === btn) return;
        other.setAttribute('aria-expanded', 'false');
        const otherPanel = document.getElementById(other.getAttribute('aria-controls'));
        if (otherPanel) otherPanel.style.height = '0px';
      });

      btn.setAttribute('aria-expanded', String(!open));
      panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ---------- lead form ---------- */
  const form = document.getElementById('leadForm');

  if (form) {
    const done = document.getElementById('formDone');
    const doneText = document.getElementById('formDoneText');

    const showError = (input, message) => {
      const slot = form.querySelector('[data-err-for="' + input.id + '"]');
      input.closest('.field').classList.toggle('field--error', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (slot) slot.textContent = message || '';
    };

    const validate = () => {
      const first = form.firstName;
      const zip = form.zip;
      const email = form.email;
      let firstBad = null;

      const checks = [
        [first, first.value.trim() ? '' : 'Tell us what to call you.'],
        [zip, /^\d{5}$/.test(zip.value.trim()) ? '' : 'Enter a 5-digit ZIP code.'],
        [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Enter an email we can reply to.']
      ];

      checks.forEach(([input, message]) => {
        showError(input, message);
        if (message && !firstBad) firstBad = input;
      });

      return firstBad;
    };

    ['firstName', 'zip', 'email'].forEach((name) => {
      form[name].addEventListener('input', () => showError(form[name], ''));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstBad = validate();

      if (firstBad) {
        firstBad.focus();
        if (done) done.classList.remove('is-visible');
        return;
      }

      if (doneText) {
        doneText.textContent =
          'Thanks, ' + form.firstName.value.trim() + ' — a designer covering ' +
          form.zip.value.trim() + ' will reach out within one business day.';
      }
      if (done) done.classList.add('is-visible');
      form.querySelector('button[type="submit"]').textContent = 'Request received';
    });
  }
})();
