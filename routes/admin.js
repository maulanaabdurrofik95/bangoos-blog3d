'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const { db, slugify } = require('../database/db');

const router = express.Router();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// 401 middleware
router.use((req, res, next) => {
  if (!req.session || !req.session.adminId) return fail(res, 401, 'Unauthorized — silakan login');
  next();
});

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'public', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase())
});
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error('Tipe file tidak diizinkan (jpg/png/webp/gif)'));
  }
});

// POST /admin/upload
router.post('/upload', (req, res) => {
  upload.single('cover')(req, res, err => {
    if (err) return fail(res, 400, err.message || 'Upload gagal');
    if (!req.file) return fail(res, 400, 'Tidak ada file');
    ok(res, { url: '/uploads/' + req.file.filename });
  });
});

// GET /admin/stats
router.get('/stats', (req, res) => {
  try {
    const posts = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
    const comments = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c;
    const views = db.prepare('SELECT COALESCE(SUM(views),0) AS s FROM posts').get().s;
    ok(res, { posts, comments, views });
  } catch (e) { fail(res, 500, 'Gagal mengambil stats'); }
});

// GET /admin/posts
router.get('/posts', (req, res) => {
  try { ok(res, db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT 200').all()); }
  catch (e) { fail(res, 500, 'Gagal mengambil posts'); }
});

// GET /admin/posts/:id (single, untuk form edit)
router.get('/posts/:id', (req, res) => {
  try {
    const p = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
    if (!p) return fail(res, 404, 'Post tidak ditemukan');
    ok(res, p);
  } catch (e) { fail(res, 500, 'Gagal mengambil post'); }
});

// POST /admin/posts
router.post('/posts', (req, res) => {
  const { title, excerpt, content, cover, category, tags } = req.body || {};
  if (!String(title || '').trim()) return fail(res, 400, 'Judul wajib diisi');
  let slug = slugify(title);
  try {
    const exists = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
    if (exists) slug = slug + '-' + Date.now().toString(36);
    const r = db.prepare('INSERT INTO posts (title, slug, excerpt, content, cover, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(String(title).trim(), slug, String(excerpt || ''), String(content || ''),
        String(cover || ''), String(category || 'Umum'), String(tags || ''));
    ok(res, { id: Number(r.lastInsertRowid), slug });
  } catch (e) { fail(res, 500, 'Gagal membuat post'); }
});

// PUT /admin/posts/:id
router.put('/posts/:id', (req, res) => {
  const { title, excerpt, content, cover, category, tags } = req.body || {};
  if (!String(title || '').trim()) return fail(res, 400, 'Judul wajib diisi');
  try {
    const cur = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
    if (!cur) return fail(res, 404, 'Post tidak ditemukan');
    let slug = cur.slug;
    if (title !== cur.title) {
      slug = slugify(title);
      const dup = db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, cur.id);
      if (dup) slug = slug + '-' + Date.now().toString(36);
    }
    db.prepare('UPDATE posts SET title=?, slug=?, excerpt=?, content=?, cover=?, category=?, tags=? WHERE id=?')
      .run(String(title).trim(), slug, String(excerpt || ''), String(content || ''),
        String(cover || ''), String(category || 'Umum'), String(tags || ''), cur.id);
    ok(res, { id: cur.id, slug });
  } catch (e) { fail(res, 500, 'Gagal mengupdate post'); }
});

// DELETE /admin/posts/:id
router.delete('/posts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(Number(req.params.id));
    const r = db.prepare('DELETE FROM posts WHERE id = ?').run(Number(req.params.id));
    if (r.changes === 0) return fail(res, 404, 'Post tidak ditemukan');
    ok(res, { deleted: true });
  } catch (e) { fail(res, 500, 'Gagal menghapus post'); }
});

// GET /admin/comments
router.get('/comments', (req, res) => {
  try {
    ok(res, db.prepare('SELECT c.*, p.title AS post_title FROM comments c LEFT JOIN posts p ON p.id = c.post_id ORDER BY c.id DESC LIMIT 200').all());
  } catch (e) { fail(res, 500, 'Gagal mengambil komentar'); }
});

// POST /admin/comments/:id/approve (langsung tampil — moderasi longgar)
router.post('/comments/:id/approve', (req, res) => {
  try { ok(res, { approved: true }); }
  catch (e) { fail(res, 500, 'Gagal approve komentar'); }
});

// DELETE /admin/comments/:id
router.delete('/comments/:id', (req, res) => {
  try {
    const r = db.prepare('DELETE FROM comments WHERE id = ?').run(Number(req.params.id));
    if (r.changes === 0) return fail(res, 404, 'Komentar tidak ditemukan');
    ok(res, { deleted: true });
  } catch (e) { fail(res, 500, 'Gagal menghapus komentar'); }
});

// GET /admin/settings + PUT /admin/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const out = {};
    rows.forEach(r => { out[r.key] = r.value; });
    ok(res, out);
  } catch (e) { fail(res, 500, 'Gagal mengambil settings'); }
});
router.put('/settings', (req, res) => {
  try {
    const put = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    for (const [k, v] of Object.entries(req.body || {})) {
      if (/^[a-z_]{1,40}$/.test(k)) put.run(k, String(v == null ? '' : v).slice(0, 5000));
    }
    ok(res, { saved: true });
  } catch (e) { fail(res, 500, 'Gagal menyimpan settings'); }
});

// PUT /admin/password (ganti password, body: old_password/new_password ATAU old/baru)
router.put('/password', (req, res) => {
  if (!req.session || !req.session.adminId) return fail(res, 401, 'Belum login');
  const b = req.body || {};
  const oldP = b.old_password || b.old, newP = b.new_password || b.baru;
  if (!oldP || !newP || String(newP).length < 6) return fail(res, 400, 'Password baru minimal 6 karakter');
  try {
    const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.adminId);
    if (!admin || !bcrypt.compareSync(String(oldP), admin.password_hash)) return fail(res, 401, 'Password lama salah');
    db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(String(newP), 10), admin.id);
    ok(res, { changed: true });
  } catch (e) { fail(res, 500, 'Gagal mengganti password'); }
});

module.exports = router;
