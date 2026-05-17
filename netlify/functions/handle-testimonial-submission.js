const APPROVE_SECRET = process.env.APPROVE_SECRET;
const SITE_URL = 'https://www.ehssimplified.com';

exports.handler = async (event) => {
  console.log('Function triggered');
  console.log('Method:', event.httpMethod);
  console.log('Body:', event.body);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'OK' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    console.log('JSON parse error:', e.message);
    console.log('Raw body:', event.body);
    return { statusCode: 200, body: 'OK' };
  }

  console.log('Parsed payload:', JSON.stringify(payload));

  const data = payload.data || payload;
  const name = data.name || '';
  const company = data.company || '';
  const industry = data.industry || '';
  const rating = data.rating || '5';
  const quote = (data.testimonial || '').replace(/"/g, '&quot;');

  console.log('Name:', name);
  console.log('Quote:', quote);

  if (!name || !quote) {
    console.log('Missing fields');
    return { statusCode: 200, body: 'OK' };
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

  console.log('Approve URL:', approveUrl);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK', approveUrl })
  };
};
