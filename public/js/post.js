/* BangoosBlog3D — post page: render article + comments */
(function () {
  'use strict';
  var API = '/api';
  var slug = new URLSearchParams(location.search).get('slug');
  var state = document.getElementById('state');
  var toast = document.getElementById('toast');
  document.getElementById('yr').textContent = new Date().getFullYear();

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
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return ''; }
  }

  if (!slug) { state.textContent = 'Slug artikel tidak ditemukan.'; return; }

  fetch(API + '/posts/' + encodeURIComponent(slug))
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      var p = d.post || d.data || d;
      document.title = p.title + ' — BangoosBlog3D';
      document.getElementById('pCat').textContent = p.category || 'Umum';
      document.getElementById('pTitle').textContent = p.title;
      document.getElementById('pMeta').textContent =
        fmtDate(p.created_at || p.createdAt) + (p.views != null ? ' · ' + p.views + ' dibaca' : '');
      if (p.cover) { var im = document.getElementById('pCover'); im.src = p.cover; im.hidden = false; }
      document.getElementById('pBody').innerHTML = p.content || '';
      state.style.display = 'none';
      document.getElementById('post').hidden = false;
      document.getElementById('csec').hidden = false;
      loadComments();
    })
    .catch(function () { state.textContent = 'Artikel tidak ditemukan.'; });

  function loadComments() {
    fetch(API + '/posts/' + encodeURIComponent(slug) + '/comments')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = d.comments || d.data || d || [];
        document.getElementById('cCount').textContent = list.length;
        document.getElementById('clist').innerHTML = list.length ? list.map(function (c) {
          return '<div class="citem"><span class="who">' + esc(c.name) + '</span>' +
            '<span class="when">' + fmtDate(c.created_at || c.createdAt) + '</span>' +
            '<p>' + esc(c.message || c.comment || '') + '</p></div>';
        }).join('') : '<div class="state">Belum ada komentar. Jadilah yang pertama!</div>';
      })
      .catch(function () {});
  }

  document.getElementById('cform').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('cName').value.trim();
    var message = document.getElementById('cMsg').value.trim();
    if (!name || !message) return;
    var btn = this.querySelector('button'); btn.disabled = true; btn.textContent = 'Mengirim…';
    fetch(API + '/posts/' + encodeURIComponent(slug) + '/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, message: message })
    })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function () {
        document.getElementById('cMsg').value = '';
        showToast('Komentar terkirim, menunggu moderasi admin');
      })
      .catch(function () { showToast('Gagal mengirim komentar'); })
      .finally(function () { btn.disabled = false; btn.textContent = 'Kirim Komentar'; });
  });
})();
