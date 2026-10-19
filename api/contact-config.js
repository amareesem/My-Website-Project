module.exports = function contactConfig(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Only GET requests are supported.' });
  }
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.error('Contact reCAPTCHA site key is not configured.');
    return res.status(503).json({ error: 'Verification is temporarily unavailable. Please call or email the PEAK team.' });
  }
  return res.status(200).json({ siteKey });
};
