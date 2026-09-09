/* BangoosBlog3D — homepage: fetch posts, search, category chips */
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
  document.getElementById('navCari').addEventListener('click', function (e) {
    e.preventDefault(); qInput.focus(); qInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function showToast(msg) {
    toast.textContent = msg; toast.style.display = 'block';
    clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.style.display = 'none'; }, 2500);
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
    return t.length > 140 ? t.slice(0, 140) + '…' : t;
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
      return (p.title + ' ' + (p.content || '') + ' ' + (p.category || '')).toLowerCase().indexOf(q) > -1;
    });
  }

  function card(p) {
    var img = p.cover ? '<img src="' + esc(p.cover) + '" alt="" loading="lazy">' : '';
    return '<article class="card">' + img + '<div class="card-b">' +
      '<span class="cat">' + esc(p.category || 'Umum') + '</span>' +
      '<h2><a href="post.html?slug=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a></h2>' +
      '<p>' + esc(excerpt(p)) + '</p>' +
      '<div class="meta">' + fmtDate(p.created_at || p.createdAt) + (p.views != null ? ' · ' + p.views + ' dibaca' : '') + '</div>' +
      '</div></article>';
  }

  function renderMore() {
    var list = filtered();
    var next = list.slice(shown, shown + PER_PAGE);
    if (shown === 0 && next.length === 0) { setState('Belum ada artikel yang cocok.'); moreBtn.hidden = true; return; }
    setState('');
    grid.insertAdjacentHTML('beforeend', next.map(card).join(''));
    shown += next.length;
    moreBtn.hidden = shown >= list.length;
  }
  moreBtn.addEventListener('click', renderMore);

  var deb;
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault(); shown = 0; grid.innerHTML = ''; renderMore();
  });
  qInput.addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(function () { shown = 0; grid.innerHTML = ''; renderMore(); }, 300);
  });

  fetch(API + '/posts')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      posts = d.posts || d.data || d || [];
      var set = {};
      posts.forEach(function (p) { if (p.category) set[p.category] = 1; });
      cats = ['Semua'].concat(Object.keys(set).sort());
      renderChips(); renderMore();
    })
    .catch(function () { setState('Gagal memuat artikel. Coba muat ulang.'); showToast('Tidak bisa terhubung ke server'); });
})();
