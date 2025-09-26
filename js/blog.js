/* Blog loader for Git-based content (Decap CMS)
   IMPORTANT: Set your GitHub owner/repo below. The site must be deployed from that repo and be public
   for unauthenticated API reads, or you can add a token later.
*/
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME'; // TODO: set
const GITHUB_REPO = 'YOUR_REPO_NAME';        // TODO: set
const BRANCH = 'main';

const POSTS_DIR = 'content/posts';

async function githubListPosts() {
  const api = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${POSTS_DIR}?ref=${BRANCH}`;
  const res = await fetch(api);
  if (!res.ok) throw new Error('Failed to list posts. Set GITHUB_OWNER/REPO in js/blog.js');
  const files = await res.json();
  return files.filter(f => f.name.endsWith('.md'));
}

async function githubReadFile(path) {
  const api = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/${path}`;
  const res = await fetch(api);
  if (!res.ok) throw new Error('Failed to read post file');
  return await res.text();
}

function parseFrontMatter(md) {
  // very small front-matter parser (--- ... --- at top)
  if (!md.startsWith('---')) return { data: {}, body: md };
  const end = md.indexOf('\n---');
  if (end === -1) return { data: {}, body: md };
  const fm = md.substring(3, end).trim();
  const body = md.substring(end + 4).trim();
  const data = {};
  fm.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.substring(0, idx).trim();
      const value = line.substring(idx + 1).trim().replace(/^"|"$/g, '');
      data[key] = value;
    }
  });
  return { data, body };
}

function toSlug(filename) {
  return filename.replace(/\.md$/i, '');
}

async function renderBlogList() {
  const container = document.getElementById('posts');
  if (!container) return; // not on blog page
  try {
    const files = await githubListPosts();
    if (!files.length) {
      container.innerHTML = '<p>No posts yet.</p>';
      return;
    }
    const cards = await Promise.all(files.map(async f => {
      const md = await githubReadFile(`${POSTS_DIR}/${f.name}`);
      const { data, body } = parseFrontMatter(md);
      const title = data.title || toSlug(f.name);
      const slug = data.slug || toSlug(f.name);
      const date = data.date ? new Date(data.date).toLocaleDateString() : '';
      const excerpt = (data.excerpt || body.substring(0, 160) + '...');
      const cover = data.cover || '';
      const coverImg = cover ? `<img src="${cover}" class="card-img-top" alt="${title}">` : '';
      return `
        <div class="col-md-6">
          <div class="card h-100">
            ${coverImg}
            <div class="card-body">
              <h5 class="card-title">${title}</h5>
              <p class="text-muted mb-2">${date}</p>
              <p class="card-text">${excerpt}</p>
              <a class="btn btn-outline-primary" href="post.html?slug=${encodeURIComponent(slug)}">Read</a>
            </div>
          </div>
        </div>`;
    }));
    container.innerHTML = cards.join('');
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="alert alert-warning">Unable to load posts. Configure js/blog.js (owner/repo).</div>';
  }
}

async function renderPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const titleEl = document.getElementById('post-title');
  const metaEl = document.getElementById('post-meta');
  const coverEl = document.getElementById('post-cover');
  const bodyEl = document.getElementById('post-body');
  if (!slug || !titleEl) return; // not on post page
  try {
    // Find matching file by slug
    const files = await githubListPosts();
    const file = files.find(f => toSlug(f.name) === slug) || files.find(async f => {
      const md = await githubReadFile(`${POSTS_DIR}/${f.name}`);
      const { data } = parseFrontMatter(md);
      return (data.slug || toSlug(f.name)) === slug;
    });
    if (!file) throw new Error('Post not found');
    const md = await githubReadFile(`${POSTS_DIR}/${file.name}`);
    const { data, body } = parseFrontMatter(md);
    titleEl.textContent = data.title || slug;
    metaEl.textContent = data.date ? new Date(data.date).toLocaleString() : '';
    if (data.cover) { coverEl.src = data.cover; coverEl.classList.remove('d-none'); }
    bodyEl.innerHTML = marked.parse(body);
  } catch (e) {
    console.error(e);
    if (titleEl) titleEl.textContent = 'Post not found';
  }
}

renderBlogList();
renderPost();
