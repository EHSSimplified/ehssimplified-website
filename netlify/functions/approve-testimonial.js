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
              <div class="testimonial-name">${name}</div>
              <div class="testimonial-company">${company}</div>
            </div>
          </div>
        </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const params = event.queryStringParameters || {};

  if (!APPROVE_SECRET || params.secret !== APPROVE_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { name, company, industry, rating, quote } = params;

  if (!name || !quote) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  try {
    const fileRes = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${FILE_PATH}`);
    if (fileRes.status !== 200) {
      return { statusCode: 500, body: 'Could not fetch testimonials.html from GitHub' };
    }

    const sha = fileRes.body.sha;
    const currentContent = Buffer.from(fileRes.body.content, 'base64').toString('utf8');

    const newCard = buildTestimonialCard(name, company, industry, rating, quote);

    const marker = '<!-- Testimonials will appear here as customers submit them -->';
    let updatedContent;

    if (currentContent.includes(marker)) {
      updatedContent = currentContent.replace(marker, newCard);
    } else {
      updatedContent = currentContent.replace(
        /(<\/div>\s*<\/div>\s*<\/section>\s*<!-- Submit Testimonial -->)/,
        `${newCard}\n      $1`
      );
    }

    const commitRes = await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      message: `Add testimonial from ${name}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha
    });

    if (commitRes.status !== 200 && commitRes.status !== 201) {
      return { statusCode: 500, body: 'Failed to commit to GitHub' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center;">
          <h2 style="color:#0072CE;">✅ Testimonial Published!</h2>
          <p><strong>${name}</strong> from <em>${company}</em> is now live on the site.</p>
          <p style="color:#888;">Netlify will redeploy automatically — the testimonial will appear within 1–2 minutes.</p>
          <a href="https://www.ehssimplified.com/testimonials.html" style="color:#FF7900;font-weight:bold;">View Testimonials Page →</a>
        </body></html>
      `
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal server error: ' + err.message };
  }
};
