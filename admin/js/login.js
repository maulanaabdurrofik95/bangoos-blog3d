/* Admin login — session cookie (backend pakai express-session) */
(function () {
  'use strict';
  var form = document.getElementById('loginForm');
  var err = document.getElementById('err');
  var btn = document.getElementById('loginBtn');
  fetch('/auth/check').then(function (r) { if (r.ok) location.href = 'dashboard.html'; }).catch(function () {});
  /* kartu login tilt ngikutin jari/mouse */
  var card = document.querySelector('.login-card');
  if (card) {
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var b = card.getBoundingClientRect();
      var rx = ((e.clientY - b.top) / b.height - 0.5) * -10;
      var ry = ((e.clientX - b.left) / b.width - 0.5) * 10;
      card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }
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
