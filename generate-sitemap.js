const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.ehssimplified.com';
const POSTS_DIR = path.join(__dirname, '_posts');
const OUTPUT = path.join(__dirname, 'sitemap.xml');

// Static pages
const staticPages = [
  { loc: '/',             priority: '1.0', changefreq: 'monthly' },
  { loc: '/blog',         priority: '0.9', changefreq: 'weekly'  },
  { loc: '/plans',        priority: '0.8', changefreq: 'monthly' },
  { loc: '/industries',   priority: '0.7', changefreq: 'monthly' },
  { loc: '/about',        priority: '0.7', changefreq: 'monthly' },
  { loc: '/testimonials', priority: '0.6', changefreq: 'monthly' },
];

const today = new Date().toISOString().split('T')[0];

// Read blog posts
let postEntries = '';
if (fs.existsSync(POSTS_DIR)) {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    const slug = file.replace('.md', '');
    // Extract date from filename (format: YYYY-MM-DD-title)
    const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/);
    const lastmod = dateMatch ? dateMatch[1] : today;
    postEntries += `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
}

// Build static page entries
const staticEntries = staticPages.map(p => `
  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries}${postEntries}
</urlset>`;

fs.writeFileSync(OUTPUT, sitemap);
console.log(`✅ Sitemap generated with ${staticPages.length} static pages and ${(postEntries.match(/<url>/g) || []).length} blog posts.`);
