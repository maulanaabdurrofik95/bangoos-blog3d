/* BangoosBlog3D — homepage: fetch posts, search, category chips
   Kontrak API: GET /api/posts?search=&cat= -> { success, data: [...] }
                GET /api/cats -> { success, data: [{ name, count }] } */
(function () {
  'use strict';
  var API = '/api';
  var grid = document.getElementById('grid');
  var state = document.getElementById('state');
  var chipsBox = document.getElementById('chips');
  var moreBtn = document.getElementById('moreBtn');
  var qInput = document.getElementById('q');
  var toast = document.getElementById('toast');

  var posts = [], cats = ['Semua'], activeCat = 'Semua', shown = 0;
  var PER_PAGE = 6;

  document.getElementById('yr').textContent = new Date().getFullYear();
  var navCari = document.getElementById('navCari');
  if (navCari) navCari.addEventListener('click', function (e) {
    e.preventDefault();
    qInput.focus();
    qInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function showToast(msg, isErr) {
    toast.textContent = msg;
    toast.className = 'toast' + (isErr ? ' err' : '');
    toast.style.display = 'block';
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.style.display = 'none'; }, 2500);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(d) {
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function excerpt(p) {
    if (p.excerpt) return p.excerpt;
    var t = String(p.content || '').replace(/<[^>]+>/g, ' ');
    return t.length > 140 ? t.slice(0, 140) + '...' : t;
  }
  function unwrap(d) {
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    if (d && Array.isArray(d.posts)) return d.posts;
    return [];
  }

  function setState(html) { state.innerHTML = html; state.style.display = html ? '' : 'none'; }

  function renderChips() {
    chipsBox.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === activeCat ? ' on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }
  chipsBox.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    activeCat = b.dataset.c; shown = 0; grid.innerHTML = '';
    renderChips(); renderMore();
  });

  function filtered() {
    var q = qInput.value.trim().toLowerCase();
    return posts.filter(function (p) {
      var okCat = activeCat === 'Semua' || p.category === activeCat;
      if (!okCat) return false;
      if (!q) return true;
      return (p.title + ' ' + (p.content || '') + ' ' + (p.excerpt || '') + ' ' + (p.category || '')).toLowerCase().indexOf(q) > -1;
    });
  }

  function card(p) {
    var img = p.cover
      ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">'
      : '<div class="cover-fb cat-' + esc((p.category || 'umum').toLowerCase()) + '"><span>' + esc((p.category || 'U').slice(0, 1).toUpperCase()) + '</span></div>';
    return '<article class="card"><div class="card-in">' + img + '<div class="card-b">' +
      '<span class="cat">' + esc(p.category || 'Umum') + '</span>' +
      '<h2><a href="post.html?slug=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a></h2>' +
      '<p>' + esc(excerpt(p)) + '</p>' +
      '<div class="meta">' + fmtDate(p.created_at || p.createdAt) +
      (p.views != null ? ' · <span class="views">' + Number(p.views) + ' dibaca</span>' : '') + '</div>' +
      '</div></div></article>';
  }

  function renderMore() {
    var list = filtered();
    var next = list.slice(shown, shown + PER_PAGE);
    if (shown === 0 && next.length === 0) { setState('Belum ada artikel yang cocok.'); moreBtn.hidden = true; return; }
    setState('');
    grid.insertAdjacentHTML('beforeend', next.map(card).join(''));
    shown += next.length;
    moreBtn.hidden = shown >= list.length;
    bindTilt();
  }
  /* 3D tilt: sentuh/geser kartu miring ngikutin jari (mobile) + mouse (desktop) */
  function bindTilt() {
    grid.querySelectorAll('.card:not([data-tilt])').forEach(function (el) {
      el.setAttribute('data-tilt', '1');
      var raf = null;
      function tilt(cx, cy) {
        var b = el.getBoundingClientRect();
        var rx = ((cy - b.top) / b.height - 0.5) * -14;
        var ry = ((cx - b.left) / b.width - 0.5) * 14;
        el.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
      }
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        el.classList.add('tilting');
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { tilt(e.clientX, e.clientY); });
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.transform = '';
      });
      el.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        if (t) tilt(t.clientX, t.clientY);
      }, { passive: true });
      el.addEventListener('touchend', function () { el.style.transform = ''; });
    });
  }
  moreBtn.addEventListener('click', renderMore);

  var deb;
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); shown = 0; grid.innerHTML = ''; renderMore();
  });
  qInput.addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(function () { shown = 0; grid.innerHTML = ''; renderMore(); }, 300);
  });

  function setStats() {
    var sp = document.getElementById('statPosts');
    var sc = document.getElementById('statCats');
    if (sp) sp.textContent = String(posts.length);
    if (sc) sc.textContent = String(Math.max(cats.length - 1, 0));
  }

  fetch(API + '/posts')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      posts = unwrap(d);
      var set = {};
      posts.forEach(function (p) { if (p.category) set[p.category] = 1; });
      cats = ['Semua'].concat(Object.keys(set).sort());
      renderChips(); renderMore(); setStats();
      // Sinkron kategori + count dari /api/cats bila tersedia
      return fetch(API + '/cats').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })
    .then(function (d) {
      if (d && Array.isArray(d.data) && d.data.length) {
        cats = ['Semua'].concat(d.data.map(function (c) { return c.name; }));
        renderChips(); setStats();
      }
    })
    .catch(function () { setState('Gagal memuat artikel. Coba muat ulang.'); showToast('Tidak bisa terhubung ke server', true); });
})();
