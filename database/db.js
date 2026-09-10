'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname);
const DB_FILE = path.join(DB_DIR, 'blog.db');
let db;
try {
  db = new DatabaseSync(DB_FILE);
} catch (e) {
  db = new DatabaseSync(':memory:');
}

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  category TEXT DEFAULT 'Umum',
  tags TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);
`);

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s-]/g, '')
    .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 80) || ('post-' + Date.now());
}

function seed() {
  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin').get().c;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('changeme123', 10);
    db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }
  const postCount = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  if (postCount === 0) {
    const posts = [
      {
        title: 'Selamat Datang di Bangoos Blog 3D',
        category: 'Pengumuman', tags: 'blog,3d,selamat-datang',
        cover: '/uploads/cover-pengumuman.png',
        excerpt: 'Perkenalan blog dengan nuansa 3D yang ringan dan mobile-first.',
        content: '<p>Halo! Ini adalah postingan pertama di <strong>Bangoos Blog 3D</strong>. Blog ini dibangun dengan Node.js, Express, dan SQLite — cepat, ringan, dan mobile-first.</p><p>Efek partikel canvas memberi kesan 3D tanpa membebani HP kentang sekalipun.</p>'
      },
      {
        title: '5 Tips Menulis Artikel yang Enak Dibaca',
        category: 'Tips', tags: 'menulis,tips,blogging',
        cover: '/uploads/cover-tips.png',
        excerpt: 'Judul jelas, paragraf pendek, dan satu ide per tulisan.',
        content: '<p>1. <strong>Satu tulisan, satu ide.</strong> Jangan campur banyak topik.</p><p>2. <strong>Paragraf pendek.</strong> Maksimal 3 baris per paragraf di layar HP.</p><p>3. <strong>Judul yang jujur.</strong> Jangan clickbait.</p><p>4. <strong>Buka dengan cerita.</strong> Pembaca Indonesia suka sapaan hangat.</p><p>5. <strong>Akhiri dengan ajakan.</strong> Minta komentar pembaca.</p>'
      },
      {
        title: 'Resep Nasi Goreng Kampung ala Anak Kos',
        category: 'Kuliner', tags: 'resep,nasi-goreng,kuliner',
        cover: '/uploads/cover-kuliner.png',
        excerpt: 'Murah, cepat, dan dijamin nagih — modal di bawah 15 ribu.',
        content: '<p><strong>Bahan:</strong> nasi sisa semalam, 2 siung bawang putih, 1 butir telur, kecap manis, garam, cabai rawit.</p><p><strong>Cara:</strong> Tumis bawang dan cabai sampai harum, masukkan telur orak-arik, masukkan nasi, tambah kecap dan garam, aduk dengan api besar 3 menit. Sajikan dengan kerupuk.</p>'
      },
      {
        title: 'Jalan-Jalan Hemat ke Yogyakarta 2 Hari 1 Malam',
        category: 'Travel', tags: 'travel,yogyakarta,hemat',
        cover: '/uploads/cover-travel.png',
        excerpt: 'Itinerary lengkap Malioboro, Keraton, hingga Pantai Parangtritis.',
        content: '<p><strong>Hari 1:</strong> Tiba via kereta pagi, titip tas di penginapan Malioboro (100 ribuan/malam), jalan ke Keraton dan Taman Sari, sore ke Alun-alun Kidul, malam kuliner gudeg.</p><p><strong>Hari 2:</strong> Sunrise di Pantai Parangtritis naik bus TransJogja + ojek, siang beli bakpia, sore pulang.</p><p><strong>Budget:</strong> sekitar 500 ribu sudah termasuk makan dan penginapan.</p>'
      }
    ];
    const ins = db.prepare('INSERT INTO posts (title, slug, excerpt, content, cover, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)');
    posts.forEach((p, i) => {
      let slug = slugify(p.title);
      try { ins.run(p.title, slug, p.excerpt, p.content, p.cover || '', p.category, p.tags); }
      catch { ins.run(p.title, slug + '-' + (i + 1), p.excerpt, p.content, p.cover || '', p.category, p.tags); }
    });
  }
  const defaults = {
    site_title: 'Bangoos Blog 3D',
    site_desc: 'Blog ringan bernuansa 3D — cepat di HP.',
    about: 'Bangoos Blog 3D adalah blog pribadi berbahasa Indonesia.'
  };
  const put = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaults)) put.run(k, v);
}
seed();

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = { db, esc, slugify };
