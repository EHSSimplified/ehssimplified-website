const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.ehssimplified.com';
const POSTS_DIR = path.join(__dirname, '_posts');
const BLOG_DIR = path.join(__dirname, 'blog');

// Create /blog directory if it doesn't exist
if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR);

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: text };
  const frontmatter = {};
  // Handle multiline values (lines starting with spaces are continuations)
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentVal = [];
  lines.forEach(line => {
    if (line.match(/^[a-zA-Z]/) && line.includes(':')) {
      if (currentKey) frontmatter[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
      const colonIdx = line.indexOf(':');
      currentKey = line.substring(0, colonIdx).trim();
      currentVal = [line.substring(colonIdx + 1).trim()];
    } else if (line.startsWith('  ') && currentKey) {
      currentVal.push(line.trim());
    }
  });
  if (currentKey) frontmatter[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
  return { frontmatter, body: match[2].trim() };
}

function markdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- \*\*(.+?)\*\* — (.+)$/gm, '<li><strong>$1</strong> — $2</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, (match) => `<ul>${match}</ul>`)
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#0072CE;font-weight:600;">$1</a>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E5E7EB;margin:40px 0;">')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul|li|hr])(.+)$/gm, (line) => line.trim() ? line : '')
    .split('</p><p>')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => p.startsWith('<') ? p : `<p>${p}</p>`)
    .join('\n');
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function generatePostHtml(frontmatter, body, slug) {
  const title = frontmatter.title || 'Untitled';
  const date = frontmatter.date || '';
  const author = frontmatter.author || 'Aaron Leff, CSP';
  const topic = frontmatter.topic || '';
  const summary = frontmatter.summary || '';
  const content = markdownToHtml(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | EHS Simplified</title>
  <meta name="description" content="${summary.replace(/"/g, '&quot;')}" />
  <meta property="og:title" content="${title} | EHS Simplified" />
  <meta property="og:description" content="${summary.replace(/"/g, '&quot;')}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${BASE_URL}/blog/${slug}" />
  <link rel="canonical" href="${BASE_URL}/blog/${slug}" />
  <link rel="llms" type="text/plain" href="/llms.txt" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${title.replace(/"/g, '\\"')}",
    "description": "${summary.replace(/"/g, '\\"')}",
    "author": { "@type": "Person", "name": "${author}" },
    "datePublished": "${date}",
    "publisher": { "@type": "Organization", "name": "EHS Simplified", "url": "${BASE_URL}" },
    "url": "${BASE_URL}/blog/${slug}"
  }
  </script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-HJF1YPC4KT"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-HJF1YPC4KT');</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wr5b1aij5e");</script>
  <style>
    .post-body h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 1.7rem; font-weight: 800; margin: 36px 0 12px; color: #111827; }
    .post-body h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 1.3rem; font-weight: 800; margin: 28px 0 8px; color: #111827; }
    .post-body p { margin-bottom: 18px; line-height: 1.8; color: #374151; font-size: 1rem; }
    .post-body ul { margin: 0 0 18px 24px; }
    .post-body li { margin-bottom: 10px; line-height: 1.7; color: #374151; }
    .post-body strong { color: #111827; }
    .post-body a { color: #0072CE; font-weight: 600; }
    .post-body hr { border: none; border-top: 1px solid #E5E7EB; margin: 40px 0; }
    .post-cta { background: #111827; border-radius: 10px; padding: 40px; margin: 48px 0; text-align: center; }
    .post-cta h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
    .post-cta p { color: #94A3B8; margin-bottom: 20px; }
    .post-cta a { display: inline-block; background: #FF7900; color: #fff; padding: 12px 28px; border-radius: 6px; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>

<nav class="nav">
  <a class="nav-logo" href="/index.html">EHS <span>Simplified</span></a>
  <ul class="nav-links">
    <li><a href="/index.html">Why EHS</a></li>
    <li><a href="/plans.html">Plans</a></li>
    <li><a href="/industries.html">Industries</a></li>
    <li><a href="/testimonials.html">Testimonials</a></li>
    <li><a href="/blog.html" class="active">Blog</a></li>
    <li><a href="/about.html">About</a></li>
    <li><a href="https://calendly.com/aaron-leff-ehssimplified/30min" target="_blank" class="nav-cta">Schedule a Call</a></li>
  </ul>
</nav>

<article style="max-width:760px;margin:0 auto;padding:60px 5%;">
  <a href="/blog.html" style="display:inline-block;color:#0072CE;font-weight:700;font-size:0.9rem;margin-bottom:32px;text-decoration:none;">← Back to Blog</a>
  ${topic ? `<div style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0072CE;margin-bottom:12px;">${topic}</div>` : ''}
  <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;line-height:1.1;margin-bottom:16px;color:#111827;">${title}</h1>
  <p style="font-size:0.9rem;color:#6B7280;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #E5E7EB;">${formatDate(date)} · ${author}</p>
  <div class="post-body">
    ${content}
  </div>
  <div class="post-cta">
    <h3>See EHS Simplified in Action</h3>
    <p>Mobile safety app for small businesses — starting at $99/month.</p>
    <a href="https://app.ehssimplified.com" target="_blank">Launch Free Demo →</a>
  </div>
</article>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-logo">EHS <span>Simplified</span></div>
        <p class="footer-tagline">The mobile safety app for small trade and manufacturing businesses. OSHA-aligned inspections, SDS library, training, and hazard reporting — starting at \$99/month.</p>
        <div class="footer-contact">
          <a href="mailto:Aaron.Leff@EHSSimplified.com">Aaron.Leff@EHSSimplified.com</a>
          <a href="tel:6033977067">(603) 397-7067</a>
          <a>Strafford, NH</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Navigate</h4>
        <a href="/index.html">Why EHS</a>
        <a href="/plans.html">Plans &amp; Pricing</a>
        <a href="/industries.html">Industries</a>
        <a href="/testimonials.html">Testimonials</a>
        <a href="/blog.html">Blog</a>
        <a href="/about.html">About Aaron</a>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <a>Safety Program Management</a>
        <a>OSHA Compliance</a>
        <a>Hazard Communication</a>
        <a>Safety Training</a>
        <a>Incident Investigation</a>
        <a>Risk Assessments</a>
      </div>
      <div class="footer-col">
        <h4>Industries</h4>
        <a href="/industries.html">Construction &amp; Trades</a>
        <a href="/industries.html">Manufacturing</a>
        <a href="/industries.html">Hospitality &amp; Food</a>
        <a href="/industries.html">Retail &amp; Warehousing</a>
        <a href="/industries.html">Cannabis</a>
        <a href="/industries.html">HVAC / Plumbing / Electrical</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 EHS Simplified. All rights reserved.</span>
      <span class="footer-csp">⚠ Aaron Leff, CSP · Founder &amp; Consultant</span>
    </div>
  </div>
</footer>

</body>
</html>`;
}

// Process all posts
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
let count = 0;
files.forEach(file => {
  const slug = file.replace('.md', '');
  const text = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { frontmatter, body } = parseFrontmatter(text);
  const html = generatePostHtml(frontmatter, body, slug);
  fs.writeFileSync(path.join(BLOG_DIR, slug + '.html'), html);
  console.log(`✅ Generated /blog/${slug}.html`);
  count++;
});

console.log(`\n✅ ${count} blog post(s) generated in /blog/`);
