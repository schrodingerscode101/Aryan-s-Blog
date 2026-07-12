const express = require('express');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public: the RSA public key visitors' browsers use to encrypt their message.
// Only the matching private key (which never touches this server) can decrypt it.
router.get('/public-key', (req, res) => {
  const publicKey = process.env.PUBLIC_KEY_PEM;
  if (!publicKey) {
    return res.status(500).json({
      error:
        'No encryption key has been configured yet. Set the PUBLIC_KEY_PEM environment variable (run "npm run generate-keys" locally to generate one).',
    });
  }
  res.json({ publicKey });
});

// Public: submit an already-encrypted message. The server only ever stores
// ciphertext - it has no way to read the contents.
router.post('/', async (req, res) => {
  try {
    const { ciphertext, encryptedKey, iv } = req.body || {};
    if (!ciphertext || !encryptedKey || !iv) {
      return res.status(400).json({ error: 'Malformed encrypted message.' });
    }
    const messages = await readJSON('messages', []);
    messages.push({
      id: crypto.randomUUID(),
      ciphertext,
      encryptedKey,
      iv,
      createdAt: new Date().toISOString(),
    });
    await writeJSON('messages', messages);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send your message.' });
  }
});

// Admin only: list encrypted messages. Only readable once decrypted
// client-side in the admin's browser using the private key.
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await readJSON('messages', []);
    const sorted = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

// Admin only: delete a message once read
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const messages = await readJSON('messages', []);
    const idx = messages.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found.' });
    messages.splice(idx, 1);
    await writeJSON('messages', messages);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete the message.' });
  }
});

module.exports = router;
