/* Admin dashboard: session cookie (backend pakai express-session) */
(function () {
  'use strict';
  fetch('/auth/check').then(function (r) { if (!r.ok) location.href = 'index.html'; })
    .catch(function () { location.href = 'index.html'; });

  var toast = document.getElementById('toast');
  function showToast(m) {
    toast.textContent = m; toast.style.display = 'block';
    clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.style.display = 'none'; }, 2500);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch('/admin/api' + path, opts).then(function (r) {
      if (r.status === 401) { location.href = 'index.html'; throw new Error('auth'); }
      if (!r.ok) throw new Error('http ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }

  /* tabs */
  var tabBtns = document.querySelectorAll('.topbar nav button[data-tab]');
  tabBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      tabBtns.forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('on'); });
      document.getElementById(b.dataset.tab).classList.add('on');
    });
  });
  document.getElementById('logoutBtn').addEventListener('click', function () {
    fetch('/auth/logout', { method: 'POST' }).finally(function () { location.href = 'index.html'; });
  });

  /* dashboard stats */
  function loadStats() {
    api('/stats').then(function (d) {
      var s = d.stats || d || {};
      document.getElementById('sPosts').textContent = s.posts != null ? s.posts : '–';
      document.getElementById('sViews').textContent = s.views != null ? s.views : '–';
      document.getElementById('sComments').textContent = s.comments != null ? s.comments : '–';
      document.getElementById('sPending').textContent = s.pending != null ? s.pending : '–';
      document.getElementById('cBadge').textContent = s.pending ? '(' + s.pending + ')' : '';
      var rec = s.recent || [];
      document.getElementById('recentBody').innerHTML = rec.length ? rec.map(function (p) {
        return '<tr><td>' + esc(p.title) + '</td><td>' +
          (p.status === 'published' ? '<span class="badge pub">Published</span>' : '<span class="badge draft">Draft</span>') +
          '</td><td>' + (p.views || 0) + '</td></tr>';
      }).join('') : '<tr><td colspan="3" class="empty">Belum ada posting</td></tr>';
    }).catch(function () {});
  }

  /* posts CRUD */
  function slugify(s) {
    return String(s || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  }
  document.getElementById('fTitle').addEventListener('input', function () {
    if (!document.getElementById('fId').value && !document.getElementById('fSlug').dataset.touched) {
      document.getElementById('fSlug').value = slugify(this.value);
    }
  });
  document.getElementById('fSlug').addEventListener('input', function () { this.dataset.touched = '1'; });

  function loadPosts() {
    api('/posts').then(function (d) {
      var list = d.posts || d.data || d || [];
      document.getElementById('postsBody').innerHTML = list.length ? list.map(function (p) {
        return '<tr><td>' + esc(p.title) + '</td><td>' + esc(p.category || '-') + '</td><td>' +
          (p.status === 'published' ? '<span class="badge pub">Published</span>' : '<span class="badge draft">Draft</span>') +
          '</td><td><div class="acts"><button class="ghost small" data-edit="' + p.id + '">Edit</button>' +
          '<button class="danger small" data-del="' + p.id + '">Hapus</button></div></td></tr>';
      }).join('') : '<tr><td colspan="4" class="empty">Belum ada posting</td></tr>';
    }).catch(function () {});
  }

  document.getElementById('resetBtn').addEventListener('click', function () {
    document.getElementById('postForm').reset();
    document.getElementById('fId').value = '';
    document.getElementById('fSlug').dataset.touched = '';
    document.getElementById('formTitle').textContent = 'Tulis Posting Baru';
  });

  document.getElementById('postForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('fId').value;
    var body = {
      title: document.getElementById('fTitle').value.trim(),
      slug: document.getElementById('fSlug').value.trim() || slugify(document.getElementById('fTitle').value),
      category: document.getElementById('fCat').value.trim() || 'Umum',
      cover: document.getElementById('fCover').value.trim(),
      status: document.getElementById('fStatus').value,
      excerpt: document.getElementById('fExcerpt').value.trim(),
      content: document.getElementById('fContent').value
    };
    var btn = document.getElementById('saveBtn'); btn.disabled = true;
    api(id ? '/posts/' + id : '/posts', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) })
      .then(function () {
        showToast(id ? 'Posting diperbarui' : 'Posting dibuat');
        document.getElementById('resetBtn').click();
        loadPosts(); loadStats();
      })
      .catch(function () { showToast('Gagal menyimpan'); })
      .finally(function () { btn.disabled = false; });
  });

  document.getElementById('postsBody').addEventListener('click', function (e) {
    var eb = e.target.closest('[data-edit]'), db = e.target.closest('[data-del]');
    if (eb) {
      api('/posts/' + eb.dataset.edit).then(function (d) {
        var p = d.post || d || {};
        document.getElementById('fId').value = p.id || '';
        document.getElementById('fTitle').value = p.title || '';
        document.getElementById('fSlug').value = p.slug || '';
        document.getElementById('fSlug').dataset.touched = '1';
        document.getElementById('fCat').value = p.category || '';
        document.getElementById('fCover').value = p.cover || '';
        document.getElementById('fStatus').value = p.status || 'published';
        document.getElementById('fExcerpt').value = p.excerpt || '';
        document.getElementById('fContent').value = p.content || '';
        document.getElementById('formTitle').textContent = 'Edit Posting';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }).catch(function () { showToast('Gagal memuat posting'); });
    }
    if (db) {
      if (!confirm('Hapus posting ini?')) return;
      api('/posts/' + db.dataset.del, { method: 'DELETE' })
        .then(function () { showToast('Posting dihapus'); loadPosts(); loadStats(); })
        .catch(function () { showToast('Gagal menghapus'); });
    }
  });

  /* comments */
  function loadComments() {
    api('/comments').then(function (d) {
      var list = d.comments || d.data || d || [];
      document.getElementById('commentsBody').innerHTML = list.length ? list.map(function (c) {
        var approved = c.status === 'approved' || c.approved;
        return '<tr><td>' + esc(c.name) + '</td><td>' + esc(c.message || c.comment || '') + '</td>' +
          '<td>' + esc(c.post_title || c.slug || '-') + '</td><td>' +
          (approved ? '<span class="badge pub">Tampil</span>' : '<span class="badge pend">Pending</span>') +
          '</td><td><div class="acts">' +
          (approved ? '' : '<button class="ghost small" data-appr="' + c.id + '">Setujui</button>') +
          '<button class="danger small" data-cdel="' + c.id + '">Hapus</button></div></td></tr>';
      }).join('') : '<tr><td colspan="5" class="empty">Belum ada komentar</td></tr>';
    }).catch(function () {});
  }
  document.getElementById('commentsBody').addEventListener('click', function (e) {
    var ab = e.target.closest('[data-appr]'), db = e.target.closest('[data-cdel]');
    if (ab) {
      api('/comments/' + ab.dataset.appr + '/approve', { method: 'POST' })
        .then(function () { showToast('Komentar disetujui'); loadComments(); loadStats(); })
        .catch(function () { showToast('Gagal'); });
    }
    if (db) {
      if (!confirm('Hapus komentar ini?')) return;
      api('/comments/' + db.dataset.cdel, { method: 'DELETE' })
        .then(function () { showToast('Komentar dihapus'); loadComments(); loadStats(); })
        .catch(function () { showToast('Gagal'); });
    }
  });

  /* settings */
  function loadSettings() {
    api('/settings').then(function (d) {
      var s = d.settings || d || {};
      document.getElementById('sTitle').value = s.title || s.blog_title || '';
      document.getElementById('sDesc').value = s.description || s.blog_desc || '';
      document.getElementById('sAuthor').value = s.author || '';
    }).catch(function () {});
  }
  document.getElementById('settingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    api('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        title: document.getElementById('sTitle').value,
        description: document.getElementById('sDesc').value,
        author: document.getElementById('sAuthor').value
      })
    }).then(function () { showToast('Settings disimpan'); })
      .catch(function () { showToast('Gagal menyimpan'); });
  });

  /* password */
  document.getElementById('passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    api('/password', {
      method: 'PUT',
      body: JSON.stringify({
        old_password: document.getElementById('pOld').value,
        new_password: document.getElementById('pNew').value
      })
    }).then(function () { showToast('Password diganti'); e.target.reset(); })
      .catch(function () { showToast('Gagal — cek password lama'); });
  });

  loadStats(); loadPosts(); loadComments(); loadSettings();
})();
