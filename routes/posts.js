const express = require('express');
const crypto = require('crypto');
const { readJSON, writeJSON } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function slugify(title) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'entry'
  );
}

// Public: list all posts, newest first
router.get('/', async (req, res) => {
  try {
    const posts = await readJSON('posts', []);
    const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load entries.' });
  }
});

// Public: get a single post by id or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const posts = await readJSON('posts', []);
    const post = posts.find((p) => p.id === req.params.idOrSlug || p.slug === req.params.idOrSlug);
    if (!post) return res.status(404).json({ error: 'That entry could not be found.' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load that entry.' });
  }
});

// Admin only: create a new post
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, category, excerpt, content, image } = req.body || {};
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const posts = await readJSON('posts', []);
    const now = new Date().toISOString();
    const post = {
      id: crypto.randomUUID(),
      slug: slugify(title) + '-' + Date.now().toString(36),
      title: title.trim(),
      category: (category || 'Life').trim(),
      excerpt: (excerpt || '').trim(),
      content,
      image: image || '',
      createdAt: now,
      updatedAt: now,
    };
    posts.push(post);
    await writeJSON('posts', posts);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save the entry.' });
  }
});

// Admin only: update an existing post (title, content, or its image)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const posts = await readJSON('posts', []);
    const idx = posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'That entry could not be found.' });

    const { title, category, excerpt, content, image } = req.body || {};
    const existing = posts[idx];
    posts[idx] = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      category: category !== undefined ? category.trim() : existing.category,
      excerpt: excerpt !== undefined ? excerpt.trim() : existing.excerpt,
      content: content !== undefined ? content : existing.content,
      image: image !== undefined ? image : existing.image,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON('posts', posts);
    res.json(posts[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update the entry.' });
  }
});

// Admin only: delete a post
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const posts = await readJSON('posts', []);
    const idx = posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'That entry could not be found.' });
    const [removed] = posts.splice(idx, 1);
    await writeJSON('posts', posts);
    res.json({ success: true, removed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete the entry.' });
  }
});

module.exports = router;
