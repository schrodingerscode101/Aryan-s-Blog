const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUsername || !adminPasswordHash) {
    return res.status(500).json({
      error:
        'No admin account has been configured yet. Set the ADMIN_USERNAME and ADMIN_PASSWORD_HASH environment variables (run "npm run create-admin" locally to generate them).',
    });
  }

  if (username !== adminUsername) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const ok = bcrypt.compareSync(password, adminPasswordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username: adminUsername }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
  });
  res.json({ success: true, username: adminUsername });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.json({ authenticated: false });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true, username: payload.username });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

module.exports = router;
