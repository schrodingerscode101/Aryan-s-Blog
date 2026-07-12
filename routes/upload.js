const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Hold the uploaded file in memory rather than writing it to disk - the
// serverless filesystem is read-only, so we stream it straight to Vercel
// Blob storage instead.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'));
    }
    cb(null, true);
  },
});

// Admin only: upload or replace a blog post's cover image
router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file was received.' });

    try {
      const extMatch = req.file.originalname.match(/\.[a-zA-Z0-9]+$/);
      const ext = extMatch ? extMatch[0] : '';
      const filename = crypto.randomUUID() + ext;

      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
      });

      res.json({ url: blob.url });
    } catch (uploadErr) {
      console.error(uploadErr);
      res.status(500).json({
        error: 'Could not upload the image. Make sure BLOB_READ_WRITE_TOKEN is configured.',
      });
    }
  });
});

module.exports = router;
