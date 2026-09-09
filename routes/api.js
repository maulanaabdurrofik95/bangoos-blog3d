'use strict';
const express = require('express');
const { db, esc } = require('../database/db');

const router = express.Router();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// GET /api/posts?search=&cat=
router.get('/posts', (req, res) => {
  const search = (req.query.search || '').trim();
  const cat = (req.query.cat || '').trim();
  let sql = 'SELECT id, title, slug, excerpt, cover, category, tags, views, created_at FROM posts';
  const conds = [], params = [];
  if (search) { conds.push('(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (cat) { conds.push('category = ?'); params.push(cat); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY id DESC LIMIT 100';
  try { ok(res, db.prepare(sql).all(...params)); }
  catch (e) { fail(res, 500, 'Gagal mengambil posts'); }
});

// GET /api/posts/:slug  (views+1 + comments)
router.get('/posts/:slug', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE slug = ?').get(req.params.slug);
    if (!post) return fail(res, 404, 'Post tidak ditemukan');
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
    post.views += 1;
    const comments = db.prepare('SELECT id, name, message, created_at FROM comments WHERE post_id = ? ORDER BY id DESC LIMIT 100').all(post.id);
    comments.forEach(c => { c.name = esc(c.name); c.message = esc(c.message); });
    ok(res, { post, comments });
  } catch (e) { fail(res, 500, 'Gagal mengambil post'); }
});

// POST /api/comments
router.post('/comments', (req, res) => {
  const { post_id, name, message } = req.body || {};
  if (!post_id || !String(name || '').trim() || !String(message || '').trim())
    return fail(res, 400, 'Nama dan pesan wajib diisi');
  if (String(name).length > 60 || String(message).length > 2000)
    return fail(res, 400, 'Nama maksimal 60 karakter, pesan maksimal 2000 karakter');
  try {
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(Number(post_id));
    if (!post) return fail(res, 404, 'Post tidak ditemukan');
    const r = db.prepare('INSERT INTO comments (post_id, name, message) VALUES (?, ?, ?)')
      .run(post.id, String(name).trim(), String(message).trim());
    ok(res, { id: Number(r.lastInsertRowid) });
  } catch (e) { fail(res, 500, 'Gagal menyimpan komentar'); }
});

// GET /api/cats
router.get('/cats', (req, res) => {
  try {
    const rows = db.prepare('SELECT category AS name, COUNT(*) AS count FROM posts GROUP BY category ORDER BY name').all();
    ok(res, rows);
  } catch (e) { fail(res, 500, 'Gagal mengambil kategori'); }
});

// GET /api/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const out = {};
    rows.forEach(r => { out[r.key] = r.value; });
    ok(res, out);
  } catch (e) { fail(res, 500, 'Gagal mengambil settings'); }
});

module.exports = router;
