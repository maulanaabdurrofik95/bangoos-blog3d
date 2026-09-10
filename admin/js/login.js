/* Admin login — session cookie (backend pakai express-session) */
(function () {
  'use strict';
  var form = document.getElementById('loginForm');
  var err = document.getElementById('err');
  var btn = document.getElementById('loginBtn');
  fetch('/auth/check').then(function (r) { if (r.ok) location.href = 'dashboard.html'; }).catch(function () {});
  /* kartu login tilt: mouse (desktop) + sentuhan (HP) */
  var card = document.querySelector('.login-card');
  if (card) {
    var raf = null;
    function tilt(cx, cy) {
      var b = card.getBoundingClientRect();
      var rx = ((cy - b.top) / b.height - 0.5) * -12;
      var ry = ((cx - b.left) / b.width - 0.5) * 12;
      card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    }
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(raf);
      var x = e.clientX, y = e.clientY;
      raf = requestAnimationFrame(function () { tilt(x, y); });
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    card.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (t) tilt(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener('touchend', function () { card.style.transform = ''; });
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
