function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadPost() {
  const container = document.getElementById('post-container');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || params.get('id');

  if (!slug) {
    container.innerHTML = '<p style="text-align:center;padding:3rem 1.5rem;">No entry was specified.</p>';
    return;
  }

  try {
    const res = await fetch('/api/posts/' + encodeURIComponent(slug));
    if (!res.ok) throw new Error('not found');
    const post = await res.json();

    document.title = post.title + " — Aryan's Blog";
    const date = new Date(post.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    container.innerHTML = `
      <a class="back-link" href="/index.html">&larr; Back to all entries</a>
      <span class="cat">${escapeHtml(post.category)}</span>
      <h1 class="title">${escapeHtml(post.title)}</h1>
      <div class="meta">Published ${date}</div>
      ${post.image ? `<img src="${post.image}" alt="${escapeHtml(post.title)}" style="width:100%;height:auto;margin-bottom:2rem;">` : ''}
      <div class="body-content">${post.content}</div>
      <hr class="rule" style="margin:3rem 0 2rem;">
      <div style="font-family:'Fraunces',serif;font-style:italic;font-size:1rem;">Written by Aryan Pratap Singh</div>
      <div style="font-size:0.85rem;color:var(--ink-soft);margin-top:0.3rem;">aryan331975@gmail.com</div>
    `;
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;padding:3rem 1.5rem;">Sorry, that entry could not be found.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadPost);
