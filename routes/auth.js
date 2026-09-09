'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/db');

const router = express.Router();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, 400, 'Username dan password wajib diisi');
  try {
    const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(String(username));
    if (!admin || !bcrypt.compareSync(String(password), admin.password_hash))
      return fail(res, 401, 'Username atau password salah');
    req.session.adminId = admin.id;
    req.session.username = admin.username;
    ok(res, { username: admin.username });
  } catch (e) { fail(res, 500, 'Login gagal'); }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => ok(res, { logout: true }));
});

// GET /auth/check
router.get('/check', (req, res) => {
  if (req.session && req.session.adminId) return ok(res, { username: req.session.username });
  fail(res, 401, 'Belum login');
});

// POST /auth/change-password
router.post('/change-password', (req, res) => {
  if (!req.session || !req.session.adminId) return fail(res, 401, 'Belum login');
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || String(newPassword).length < 6)
    return fail(res, 400, 'Password baru minimal 6 karakter');
  try {
    const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.adminId);
    if (!admin || !bcrypt.compareSync(String(oldPassword), admin.password_hash))
      return fail(res, 401, 'Password lama salah');
    const hash = bcrypt.hashSync(String(newPassword), 10);
    db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(hash, admin.id);
    ok(res, { changed: true });
  } catch (e) { fail(res, 500, 'Gagal mengganti password'); }
});

module.exports = router;
