const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'EHSSimplified/ehssimplified-website';
const FILE_PATH = 'testimonials.html';
const APPROVE_SECRET = process.env.APPROVE_SECRET;

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'EHSSimplified-Netlify-Function',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function buildTestimonialCard(name, company, industry, rating, quote) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const stars = '★'.repeat(parseInt(rating) || 5);
  const industryTag = industry ? `<span class="testimonial-industry-tag">${industry}</span>` : '';
  return `
        <div class="testimonial-card">
          ${industryTag}
          <div class="testimonial-stars">${stars}</div>
          <p class="testimonial-quote">"${quote}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${initials}</div>
            <div>
              <div class="testimonial-name">${name}</div
