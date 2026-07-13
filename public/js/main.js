function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let allPosts = [];
let activeCategory = 'All';

async function loadPosts() {
  const container = document.getElementById('posts-container');
  const countLabel = document.getElementById('entries-count');
  const filterBar = document.getElementById('category-filter');
  if (!container) return;

  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    allPosts = Array.isArray(posts) ? posts : [];

    if (allPosts.length === 0) {
      container.innerHTML = '<p style="padding:2rem 1.5rem;color:#4a4a46;">No entries yet. Check back soon.</p>';
      if (countLabel) countLabel.textContent = '0 entries';
      if (filterBar) filterBar.innerHTML = '';
      return;
    }

    renderCategoryFilter();
    renderPosts();
  } catch (err) {
    container.innerHTML = '<p style="padding:2rem 1.5rem;color:#7A1F2B;">Could not load entries right now. Please try again later.</p>';
  }
}

function renderCategoryFilter() {
  const filterBar = document.getElementById('category-filter');
  if (!filterBar) return;

  const categories = Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean)));
  const options = ['All', ...categories];

  filterBar.innerHTML = options
    .map(
      (cat) => `<button class="filter-pill${cat === activeCategory ? ' active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
    )
    .join('');

  filterBar.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderCategoryFilter();
      renderPosts();
    });
  });
}

function renderPosts() {
  const container = document.getElementById('posts-container');
  const countLabel = document.getElementById('entries-count');
  if (!container) return;

  const filtered = activeCategory === 'All' ? allPosts : allPosts.filter((p) => p.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="padding:2rem 1.5rem;color:#4a4a46;">No entries in this category yet.</p>';
    if (countLabel) countLabel.textContent = '0 entries';
    return;
  }

  if (countLabel) countLabel.textContent = String(filtered.length).padStart(2, '0') + ' entries';

  container.innerHTML = filtered
    .map((post, i) => `
      <a class="post" href="/post.html?slug=${encodeURIComponent(post.slug)}">
        <span class="no">No. ${String(i + 1).padStart(2, '0')}</span>
        <span class="cat">${escapeHtml(post.category)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <span class="read">Read the entry &rarr;</span>
      </a>
    `)
    .join('');
}

function handleContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('form-status');
    const button = form.querySelector('button[type="submit"]');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      status.textContent = 'Please fill in your name, email, and message.';
      return;
    }
    if (!window.isSecureContext) {
      status.textContent = 'This form needs a secure connection (HTTPS, or localhost while testing) to encrypt your message.';
      return;
    }

    button.disabled = true;
    status.textContent = 'Encrypting your message in your browser...';

    try {
      const keyRes = await fetch('/api/messages/public-key', { cache: 'no-store' });
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.publicKey) {
        throw new Error(keyData.error || 'The site is not yet set up to receive encrypted messages.');
      }

      const encrypted = await encryptPayload(keyData.publicKey, { name, email, message });

      const sendRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encrypted),
      });
      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send your message.');
      }

      status.style.color = '#141414';
      status.textContent = 'Message sent securely. Thank you for writing in.';
      form.reset();
    } catch (err) {
      status.style.color = '#7A1F2B';
      status.textContent = err.message || 'Something went wrong. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  handleContactForm();
  const dateEl = document.getElementById('today-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
});
