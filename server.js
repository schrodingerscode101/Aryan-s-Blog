require('dotenv').config();
const path = require('path');
const express = require('express');
const createApp = require('./app');

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error(
    '\nERROR: JWT_SECRET is not set.\n' +
      'Copy .env.example to .env and fill in the required values before starting the server.\n'
  );
  process.exit(1);
}

const app = createApp();

// Serve the public/ folder (HTML, CSS, JS) - on Vercel this happens
// automatically instead, so this line only runs for local development.
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Aryan's Blog (local dev) is running at http://localhost:${PORT}`);
});
