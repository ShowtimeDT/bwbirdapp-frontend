document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.getElementById('site-header');
  if (!mount) return;
  try {
    const res = await fetch('/partials/header.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('header fetch ' + res.status);
    mount.innerHTML = await res.text();

    // mark active link for /, /capture(.html), /collection(.html)
    const path = location.pathname
      .replace(/\/index\.html$/, '/')
      .replace(/\/capture$/, '/capture.html')
      .replace(/\/collection$/, '/collection.html');

    mount.querySelectorAll('a[href]').forEach(a => {
      let href = a.getAttribute('href');
      if (href === '/index.html') href = '/';
      const abs = new URL(href, location.origin).pathname;
      if (abs === path) a.classList.add('active');
    });
  } catch (e) {
    console.error('header load failed', e);
  }
});