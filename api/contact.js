const RECIPIENT = 'team@peakcognitivelongevity.com';
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

module.exports = async function contact(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Only POST requests are supported.' });
  }

  const origins = [
    'https://peakcognitivelongevity.com',
    'https://www.peakcognitivelongevity.com',
    ...((process.env.CONTACT_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean))
  ];
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
  if (!origins.includes(req.headers.origin)) {
    return res.status(403).json({ error: 'Please submit the form from the PEAK website.' });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
    return res.status(415).json({ error: 'The form must be submitted as JSON.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > 32768) {
      return res.status(413).json({ error: 'The message is too large.' });
    }
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'The form data could not be read.' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'The form data could not be read.' });
  }

  const limits = { name: 120, phone: 40, email: 254, message: 5000, website: 200 };
  const fields = {};
  for (const [field, limit] of Object.entries(limits)) {
    const value = body[field] === undefined && (field === 'phone' || field === 'website') ? '' : body[field];
    if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      return res.status(400).json({ error: 'Please check the form fields and message length.' });
    }
    fields[field] = value.trim();
  }
  if (!fields.name || !fields.message || !EMAIL_PATTERN.test(fields.email) ||
      /[\r\n]/.test(fields.name + fields.phone + fields.email) || fields.website) {
    return res.status(400).json({ error: 'Please provide a name, valid email address, and message.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from || !EMAIL_PATTERN.test(from)) {
    console.error('Contact email delivery is not configured.');
    return res.status(503).json({ error: 'Email delivery is temporarily unavailable. Please call or email the PEAK team.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        from: `PEAK Website <${from}>`,
        to: [RECIPIENT],
        reply_to: fields.email,
        subject: `PEAK website question from ${fields.name}`,
        text: [
          `Name: ${fields.name}`,
          `Email: ${fields.email}`,
          `Phone: ${fields.phone || 'Not provided'}`,
          '',
          fields.message
        ].join('\n')
      })
    });
    if (!response.ok) {
      console.error('Contact email provider rejected the request.', response.status);
      return res.status(502).json({ error: 'Your message could not be submitted. Please try again or contact the PEAK team directly.' });
    }
    const result = await response.json();
    if (typeof result.id !== 'string' || !result.id) {
      console.error('Contact email provider returned an invalid confirmation.');
      return res.status(502).json({ error: 'Your message submission could not be confirmed.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact email delivery failed.', error.name);
    return res.status(502).json({ error: 'Your message submission could not be confirmed. Please contact the PEAK team directly.' });
  }
};
