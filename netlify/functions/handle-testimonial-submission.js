const https = require('https');

const APPROVE_SECRET = process.env.APPROVE_SECRET;
const SITE_URL = 'https://www.ehssimplified.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const data = payload.data || {};
  const name = data.name || '';
  const company = data.company || '';
  const industry = data.industry || '';
  const rating = data.rating || '5';
  const quote = (data.testimonial || '').replace(/"/g, '&quot;');

  if (!name || !quote) {
    return { statusCode: 200, body: 'Missing fields, skipping' };
  }

  const params = new URLSearchParams({
    secret: APPROVE_SECRET,
    name,
    company,
    industry,
    rating,
    quote
  });

  const approveUrl = `${SITE_URL}/.netlify/functions/approve-testimonial?${params.toString()}`;

  console.log('New testimonial submission from:', name);
  console.log('Approve URL:', approveUrl);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Testimonial received',
      approveUrl
    })
  };
};
