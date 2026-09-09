'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('node:path');

require('./database/db');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'bangoos-blog3d-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 }
}));

app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/admin/api', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.listen(PORT, () => console.log(`Bangoos Blog 3D running on http://localhost:${PORT}`));
