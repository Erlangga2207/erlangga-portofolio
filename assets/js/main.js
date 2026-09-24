/* ═══════════════════════════════════════════
   main.js — dijalankan oleh assets/js/include.js
   setelah semua partial
   menyusun partial ke dalam halaman.

   Isi: tema terang/gelap · menu mobile · nav aktif · reveal · filter proyek
        · form kontak · tahun footer
═══════════════════════════════════════════ */

/* ── TEMA TERANG / GELAP ───────────────────── */
(function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    if (meta) meta.content = next === 'dark' ? '#151412' : '#f6f2ea';
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* ── MENU MOBILE ───────────────────────────── */
(function initNav() {
  const nav    = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  if (!nav || !toggle) return;

  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  window.addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 20), { passive: true });
})();

/* ── NAV AKTIF ─────────────────────────────── */
(function initActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach(s => io.observe(s));
})();

/* ── REVEAL SAAT SCROLL ────────────────────── */
(function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ── FILTER PROYEK + JUMLAH DI HERO ────────── */
(function initProjects() {
  const cards = [...document.querySelectorAll('.project')];
  document.querySelectorAll('[data-count-projects]').forEach(el => el.textContent = cards.length);
  cards.forEach((c, i) => {
    const no = c.querySelector('.project-no');
    if (no) no.textContent = String(i + 1).padStart(2, '0');
  });

  const chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach(chip => {
    const f = chip.dataset.filter;
    const n = cards.filter(c => f === 'all' || c.dataset.category === f).length;
    chip.querySelector('span').textContent = n;
    chip.hidden = !n;
  });

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => {
      c.classList.toggle('is-active', c === chip);
      c.setAttribute('aria-pressed', c === chip);
    });
    const f = chip.dataset.filter;
    cards.forEach(card => {
      card.hidden = f !== 'all' && card.dataset.category !== f;
      card.classList.add('is-visible');
    });
  }));
})();

/* ── FORM KONTAK (Web3Forms) ───────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');

  const say = (text, state) => { note.textContent = text; note.dataset.state = state || ''; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    say('Mengirim…');
    btn.disabled = true;
    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      say('Terkirim. Terima kasih, ' + form.elements.name.value.trim() + ' — saya akan balas secepatnya.', 'ok');
      form.reset();
    } catch {
      say('Gagal mengirim. Coba lagi, atau email langsung ke erlanggae844@gmail.com.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ── TAHUN FOOTER ──────────────────────────── */
const fy = document.getElementById('footerYear');
if (fy) fy.textContent = new Date().getFullYear();
