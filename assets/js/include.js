/* ═══════════════════════════════════════════
   include.js — menyusun halaman dari /partials

   Tiap <div data-include="nama"> ditukar dengan isi
   partials/nama.html, lalu assets/js/main.js dijalankan.

   Memakai fetch(), jadi halaman HARUS dibuka lewat server
   (Laragon: http://erlangga-portofolio.test, atau hosting) —
   bukan double-click file index.html.
═══════════════════════════════════════════ */
(async function () {
  const slots = [...document.querySelectorAll('[data-include]')];

  const results = await Promise.allSettled(slots.map(async slot => {
    const name = slot.dataset.include;
    const res = await fetch('partials/' + name + '.html');
    if (!res.ok) throw new Error(name);
    slot.outerHTML = await res.text();
  }));

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) {
    const box = document.createElement('pre');
    box.textContent = location.protocol === 'file:'
      ? 'Halaman ini perlu dibuka lewat server (Laragon / hosting), bukan double-click file.'
      : 'Gagal memuat partial: ' + failed.map(r => r.reason.message).join(', ');
    box.style.cssText = 'position:fixed;inset:auto 0 0;z-index:999;margin:0;padding:14px 18px;' +
      'background:#3b0d0d;color:#ffd7d7;font:13px/1.6 ui-monospace,monospace;white-space:pre-wrap';
    document.body.appendChild(box);
  }

  const main = document.createElement('script');
  main.src = 'assets/js/main.js';
  document.body.appendChild(main);
})();
