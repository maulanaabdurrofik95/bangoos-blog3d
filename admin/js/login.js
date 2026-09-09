/* Admin login — session cookie (backend pakai express-session) */
(function () {
  'use strict';
  var form = document.getElementById('loginForm');
  var err = document.getElementById('err');
  var btn = document.getElementById('loginBtn');
  fetch('/auth/check').then(function (r) { if (r.ok) location.href = 'dashboard.html'; }).catch(function () {});
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Masuk…';
    fetch('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('user').value.trim(),
        password: document.getElementById('pass').value
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) {
          location.href = 'dashboard.html';
        } else {
          err.textContent = (res.d && res.d.message) || 'Username / password salah';
        }
      })
      .catch(function () { err.textContent = 'Tidak bisa terhubung ke server'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Masuk'; });
  });
})();
