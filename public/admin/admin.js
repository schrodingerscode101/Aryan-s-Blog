let editingId = null;
let unlockedPrivateKeyPem = null;

document.addEventListener('DOMContentLoaded', async () => {
  const authed = await checkAuth();
  if (!authed) {
    window.location.href = '/admin/login.html';
    return;
  }
  setupTabs();
  setupLogout();
  setupPostForm();
  setupImageUpload();
  setupMessages();
  loadPostsList();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    return !!data.authenticated;
  } catch (err) {
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-posts').style.display = tab === 'posts' ? 'block' : 'none';
      document.getElementById('tab-messages').style.display = tab === 'messages' ? 'block' : 'none';
    });
  });
}

function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login.html';
  });
}

// ---------- Cover image upload ----------
function setupImageUpload() {
  const fileInput = document.getElementById('image-file');
  const preview = document.getElementById('image-preview');

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    preview.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      document.getElementById('image-url').value = data.url;
      preview.innerHTML = `<img src="${data.url}" alt="Cover preview">`;
    } catch (err) {
      preview.textContent = err.message;
    }
  });
}

// ---------- Post create/edit form ----------
function setupPostForm() {
  const form = document.getElementById('post-form');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('post-status');
    status.style.color = '#7A1F2B';

    const payload = {
      title: document.getElementById('title').value.trim(),
      category: document.getElementById('category').value,
      excerpt: document.getElementById('excerpt').value.trim(),
      content: document.getElementById('content').value,
      image: document.getElementById('image-url').value,
    };

    if (!payload.title || !payload.content) {
      status.textContent = 'Title and content are required.';
      return;
    }

    try {
      const url = editingId ? '/api/posts/' + editingId : '/api/posts';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the entry.');

      status.style.color = '#141414';
      status.textContent = editingId ? 'Entry updated.' : 'Entry published.';
      resetForm();
      loadPostsList();
    } catch (err) {
      status.textContent = err.message;
    }
  });

  cancelBtn.addEventListener('click', resetForm);
}

function resetForm() {
  editingId = null;
  document.getElementById('post-form').reset();
  document.getElementById('image-url').value = '';
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('form-heading').textContent = 'New Entry';
  document.getElementById('save-btn').textContent = 'Publish Entry';
  document.getElementById('cancel-edit-btn').style.display = 'none';
}

async function loadPostsList() {
  const list = document.getElementById('posts-list');
  list.textContent = 'Loading...';

  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    if (!posts.length) {
      list.innerHTML = '<p class="admin-hint">No entries yet. Publish your first one on the left.</p>';
      return;
    }

    list.innerHTML = posts
      .map(
        (post) => `
      <div class="admin-list-item">
        <div>
          <strong>${escapeHtml(post.title)}</strong>
          <div class="admin-hint">${escapeHtml(post.category)} &middot; ${new Date(post.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="admin-list-actions">
          <button data-edit="${post.id}">Edit</button>
          <button data-delete="${post.id}" class="danger">Delete</button>
        </div>
      </div>
    `
      )
      .join('');

    list.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => editPost(btn.dataset.edit, posts));
    });
    list.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deletePost(btn.dataset.delete));
    });
  } catch (err) {
    list.textContent = 'Could not load entries.';
  }
}

function editPost(id, posts) {
  const post = posts.find((p) => p.id === id);
  if (!post) return;

  editingId = id;
  document.getElementById('title').value = post.title;
  document.getElementById('category').value = post.category;
  document.getElementById('excerpt').value = post.excerpt || '';
  document.getElementById('content').value = post.content;
  document.getElementById('image-url').value = post.image || '';
  document.getElementById('image-preview').innerHTML = post.image
    ? `<img src="${post.image}" alt="Cover preview">`
    : '';
  document.getElementById('form-heading').textContent = 'Edit Entry';
  document.getElementById('save-btn').textContent = 'Save Changes';
  document.getElementById('cancel-edit-btn').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletePost(id) {
  if (!confirm('Delete this entry? This cannot be undone.')) return;
  try {
    const res = await fetch('/api/posts/' + id, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Could not delete the entry.');
    }
    loadPostsList();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Messages (decrypted only in this browser) ----------
function setupMessages() {
  document.getElementById('unlock-btn').addEventListener('click', () => {
    const pem = document.getElementById('private-key').value.trim();
    const status = document.getElementById('unlock-status');

    if (!pem.includes('BEGIN PRIVATE KEY')) {
      status.style.color = '#7A1F2B';
      status.textContent = 'That does not look like a valid PEM private key.';
      return;
    }

    unlockedPrivateKeyPem = pem;
    status.style.color = '#141414';
    status.textContent = 'Unlocked for this session. Loading messages...';
    loadMessages();
  });
}

async function loadMessages() {
  const list = document.getElementById('messages-list');
  list.textContent = 'Loading...';

  try {
    const res = await fetch('/api/messages', { credentials: 'include' });
    const messages = await res.json();

    if (!messages.length) {
      list.innerHTML = '<p class="admin-hint">No messages yet.</p>';
      return;
    }

    list.innerHTML = '';
    for (const msg of messages) {
      const item = document.createElement('div');
      item.className = 'admin-list-item message-item';
      item.innerHTML = `<div class="admin-hint">Received ${new Date(msg.createdAt).toLocaleString()}</div><div class="decrypted">Decrypting...</div>`;
      list.appendChild(item);

      const target = item.querySelector('.decrypted');
      if (!unlockedPrivateKeyPem) {
        target.textContent = 'Paste your private key above and click Unlock to read this message.';
        continue;
      }
      try {
        const data = await decryptPayload(unlockedPrivateKeyPem, msg);
        target.innerHTML = `<strong>${escapeHtml(data.name)}</strong> (${escapeHtml(data.email)})<p>${escapeHtml(data.message)}</p>`;
      } catch (err) {
        target.textContent = 'Could not decrypt this message with the provided key.';
      }
    }
  } catch (err) {
    list.textContent = 'Could not load messages.';
  }
}
