const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://www.ehssimplified.com';
const POSTS_DIR = path.join(__dirname, '_posts');
const OUTPUT = path.join(__dirname, 'sitemap.xml');

const today = new Date().toISOString().split('T')[0];

// Date (YYYY-MM-DD) of the last git commit that touched a file.
// Gives Google an honest <lastmod> instead of stamping every page with the build date.
// Returns null if git history isn't available (e.g. shallow clone).
function lastCommitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${relPath}"`, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch (e) {
    return null;
  }
}

// Static pages — `file` is the source used to work out when the page last changed
const staticPages = [
  { loc: '/',             file: 'index.html',        priority: '1.0', changefreq: 'weekly'  },
  { loc: '/plans',        file: 'plans.html',        priority: '0.9', changefreq: 'monthly' },
  { loc: '/faq',          file: 'faq.html',          priority: '0.9', changefreq: 'monthly' },
  { loc: '/industries',   file: 'industries.html',   priority: '0.8', changefreq: 'monthly' },
  { loc: '/blog',         file: 'blog.html',         priority: '0.8', changefreq: 'weekly'  },
  { loc: '/about',        file: 'about.html',        priority: '0.7', changefreq: 'monthly' },
  { loc: '/testimonials', file: 'testimonials.html', priority: '0.6', changefreq: 'monthly' },
];

// Newest blog post date, so /blog shows as updated whenever a post is added or edited
let newestPostDate = null;

// Read blog posts
const posts = [];
if (fs.existsSync(POSTS_DIR)) {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).sort();
  files.forEach(file => {
    const slug = file.replace(/\.md$/, '');
    // Publish date from filename (format: YYYY-MM-DD-title)
    const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/);
    const published = dateMatch ? dateMatch[1] : today;
    // Use the later of the publish date and the last edit date
    const edited = lastCommitDate(path.join('_posts', file));
    const lastmod = edited && edited > published ? edited : published;
    if (!newestPostDate || lastmod > newestPostDate) newestPostDate = lastmod;
    posts.push({ loc: `/blog/${slug}`, lastmod, changefreq: 'monthly', priority: '0.8' });
  });
}

const staticEntries = staticPages.map(p => {
  let lastmod = lastCommitDate(p.file) || today;
  if (p.loc === '/blog' && newestPostDate && newestPostDate > lastmod) lastmod = newestPostDate;
  return { ...p, lastmod };
});

const toXml = e => `
  <url>
    <loc>${BASE_URL}${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries.map(toXml).join('')}${posts.map(toXml).join('')}
</urlset>
`;

fs.writeFileSync(OUTPUT, sitemap);
console.log(`✅ Sitemap generated with ${staticEntries.length} static pages and ${posts.length} blog posts.`);
