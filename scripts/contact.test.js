const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test, beforeEach } = require('node:test');
const contact = require('../api/contact');
const contactConfig = require('../api/contact-config');

const validFields = { name: 'Test Visitor', email: 'visitor@example.com', phone: '(817) 555-0123', message: 'A general question.', website: '', captchaToken: 'test-captcha-token' };

beforeEach(context => {
  const keys = ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_ALLOWED_ORIGINS', 'VERCEL_URL', 'RECAPTCHA_SECRET_KEY', 'RECAPTCHA_SITE_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.RESEND_API_KEY = 'test-key-not-a-real-secret';
  process.env.CONTACT_FROM_EMAIL = 'website@mail.peakcognitivelongevity.com';
  process.env.RECAPTCHA_SECRET_KEY = 'test-captcha-secret';
  process.env.RECAPTCHA_SITE_KEY = 'test-public-site-key';
  delete process.env.CONTACT_ALLOWED_ORIGINS;
  delete process.env.VERCEL_URL;
  context.after(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  context.mock.method(console, 'error', () => {});
  context.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected network request in test');
  });
});

function mockEmail(context, send) {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url === 'https://www.google.com/recaptcha/api/siteverify') {
      const params = new URLSearchParams(options.body);
      assert.equal(params.get('secret'), 'test-captcha-secret');
      assert.equal(params.get('response'), validFields.captchaToken);
      return { ok: true, json: async () => ({ success: true, hostname: 'www.peakcognitivelongevity.com' }) };
    }
    return send(url, options);
  });
}

function request(overrides = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://www.peakcognitivelongevity.com', 'content-type': 'application/json' },
    body: { ...validFields },
    ...overrides
  };
}

async function submit(req) {
  const response = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.code = value; return this; },
    json(value) { this.body = value; return this; }
  };
  await contact(req, response);
  return response;
}

test('sends only to the team inbox and uses visitor email for replies', async context => {
  let payload;
  mockEmail(context, async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.headers.Authorization, 'Bearer test-key-not-a-real-secret');
    assert.ok(options.signal instanceof AbortSignal);
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ id: 'test-email-id' }) };
  });
  const res = await submit(request({ body: { ...validFields, to: 'untrusted@example.com', message: 'Question\nwith <markup> & details.' } }));
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { success: true });
  assert.deepEqual(payload.to, ['team@peakcognitivelongevity.com']);
  assert.equal(payload.reply_to, validFields.email);
  assert.equal(payload.from, 'PEAK Website <website@mail.peakcognitivelongevity.com>');
  assert.ok(payload.text.endsWith('Question\nwith <markup> & details.'));
  assert.equal(payload.html, undefined);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('rejects unsupported methods, origins, and media types', async () => {
  const get = await submit(request({ method: 'GET' }));
  assert.equal(get.code, 405);
  assert.equal(get.headers.Allow, 'POST');
  for (const origin of ['https://untrusted.example', undefined]) {
    assert.equal((await submit(request({ headers: { origin, 'content-type': 'application/json' } }))).code, 403);
  }
  assert.equal((await submit(request({ headers: { origin: 'https://www.peakcognitivelongevity.com', 'content-type': 'text/plain' } }))).code, 415);
});

test('allows explicit preview origins and the current Vercel deployment', async context => {
  process.env.CONTACT_ALLOWED_ORIGINS = ' https://peak-preview.vercel.app ';
  process.env.VERCEL_URL = 'peak-deployment.vercel.app';
  mockEmail(context, async () => ({ ok: true, json: async () => ({ id: 'test-id' }) }));
  for (const origin of ['https://peak-preview.vercel.app', 'https://peak-deployment.vercel.app']) {
    assert.equal((await submit(request({ headers: { origin, 'content-type': 'application/json; charset=utf-8' } }))).code, 200);
  }
});

test('rejects malformed data, oversized fields, header injection, and honeypot entries', async () => {
  for (const body of [
    null, [], '{invalid json',
    { ...validFields, name: '  ' },
    { ...validFields, email: 'not-an-email' },
    { ...validFields, email: 'visitor@example.com\r\nBcc:other@example.com' },
    { ...validFields, name: 'Name\nInjected' },
    { ...validFields, message: ' ' },
    { ...validFields, message: 'a'.repeat(5001) },
    { ...validFields, message: '\u0000' },
    { ...validFields, phone: 123 },
    { ...validFields, phone: '' },
    { ...validFields, phone: '   ' },
    { ...validFields, phone: undefined },
    { ...validFields, captchaToken: '' },
    { ...validFields, captchaToken: undefined },
    { ...validFields, website: 'https://spam.example' }
  ]) {
    const res = await submit(request({ body }));
    assert.equal(res.code, 400);
    assert.ok(res.body.error);
    assert.equal(res.body.success, undefined);
  }
  assert.equal((await submit(request({ body: ' '.repeat(32769) }))).code, 413);
});

test('supports JSON strings and an optional honeypot field', async context => {
  mockEmail(context, async () => ({ ok: true, json: async () => ({ id: 'test-id' }) }));
  const { website, ...body } = validFields;
  assert.equal((await submit(request({ body: JSON.stringify(body) }))).code, 200);
});

test('fails explicitly when credentials or sender are missing or invalid', async () => {
  delete process.env.RESEND_API_KEY;
  assert.equal((await submit(request())).code, 503);
  process.env.RESEND_API_KEY = 'test-key-not-a-real-secret';
  for (const from of ['', 'not-an-address', 'sender@example.com\nInjected']) {
    process.env.CONTACT_FROM_EMAIL = from;
    assert.equal((await submit(request())).code, 503);
  }
});

test('never claims success for provider rejections, invalid confirmations, or timeouts', async context => {
  for (const providerResponse of [
    { ok: false, status: 429 },
    { ok: false, status: 500 },
    { ok: true, json: async () => ({}) },
    { ok: true, json: async () => { throw new SyntaxError('Invalid response'); } }
  ]) {
    mockEmail(context, async () => providerResponse);
    const res = await submit(request());
    assert.equal(res.code, 502);
    assert.ok(res.body.error);
    assert.equal(res.body.success, undefined);
  }
  mockEmail(context, async () => { throw new DOMException('Timed out', 'TimeoutError'); });
  assert.equal((await submit(request())).code, 502);
});

const html = readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const handlerSource = html.slice(html.indexOf('  async function handleContactSubmit(e){'), html.indexOf('  (function applyPeakPhotography(){'));
assert.ok(handlerSource.startsWith('  async function handleContactSubmit(e){'));

function client(fetch) {
  const elements = {
    'button[type="submit"]': { disabled: false, textContent: 'Send Message' },
    '#contact-status': { hidden: true, textContent: '' },
    '#c-name': { value: validFields.name },
    '#c-phone': { value: validFields.phone },
    '#c-email': { value: validFields.email },
    '#c-msg': { value: validFields.message },
    '#c-website': { value: '' }
  };
  const form = {
    resets: 0, busy: false, valid: true,
    querySelector: selector => elements[selector],
    reportValidity() { return this.valid; },
    setAttribute() { this.busy = true; },
    removeAttribute() { this.busy = false; },
    reset() { this.resets++; }
  };
  const captcha = { resets: 0, getResponse: () => validFields.captchaToken, reset() { this.resets++; } };
  const context = vm.createContext({ fetch, AbortController, setTimeout, clearTimeout, contactCaptchaId: 0, window: { grecaptcha: captcha } });
  vm.runInContext(handlerSource, context);
  return { elements, form, captcha, submit: () => context.handleContactSubmit({ preventDefault() {}, currentTarget: form }) };
}

test('client posts to the local API and resets only after confirmed success', async () => {
  const app = client(async (url, options) => {
    assert.equal(url, '/api/contact');
    assert.equal(options.method, 'POST');
    assert.equal(app.elements['button[type="submit"]'].disabled, true);
    assert.deepEqual(JSON.parse(options.body), validFields);
    return { ok: true, json: async () => ({ success: true }) };
  });
  await app.submit();
  assert.equal(app.form.resets, 1);
  assert.equal(app.form.busy, false);
  assert.equal(app.captcha.resets, 1);
  assert.equal(app.elements['button[type="submit"]'].disabled, false);
  assert.match(app.elements['#contact-status'].textContent, /submitted to the PEAK team/);
});

test('client blocks submissions with no completed CAPTCHA', async () => {
  const app = client(async () => { throw new Error('Should not fetch'); });
  app.captcha.getResponse = () => '';
  await app.submit();
  assert.equal(app.form.resets, 0);
  assert.match(app.elements['#contact-status'].textContent, /complete the reCAPTCHA/);
});

test('CAPTCHA rejection, wrong host, outage, and missing configuration never send mail', async context => {
  for (const result of [{ success: false }, { success: true, hostname: 'untrusted.example' }]) {
    context.mock.method(globalThis, 'fetch', async url => {
      assert.equal(url, 'https://www.google.com/recaptcha/api/siteverify');
      return { ok: true, json: async () => result };
    });
    assert.equal((await submit(request())).code, 400);
  }
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('Network failure'); });
  assert.equal((await submit(request())).code, 503);
  delete process.env.RECAPTCHA_SECRET_KEY;
  assert.equal((await submit(request())).code, 503);
});

test('CAPTCHA config exposes only the public site key and fails when missing', () => {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  contactConfig({ method: 'GET' }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { siteKey: 'test-public-site-key' });
  delete process.env.RECAPTCHA_SITE_KEY;
  contactConfig({ method: 'GET' }, res);
  assert.equal(res.code, 503);
  contactConfig({ method: 'POST' }, res);
  assert.equal(res.code, 405);
});

test('client preserves entries and presents contact alternatives on failures', async () => {
  for (const fetch of [
    async () => ({ ok: false, json: async () => ({ error: 'Unavailable' }) }),
    async () => ({ ok: true, json: async () => ({}) }),
    async () => ({ ok: false, json: async () => { throw new SyntaxError('HTML instead of JSON'); } }),
    async () => { throw new DOMException('Aborted', 'AbortError'); }
  ]) {
    const app = client(fetch);
    await app.submit();
    assert.equal(app.form.resets, 0);
    assert.equal(app.elements['#c-msg'].value, validFields.message);
    assert.equal(app.elements['button[type="submit"]'].disabled, false);
    assert.equal(app.form.busy, false);
    assert.match(app.elements['#contact-status'].textContent, /could not confirm/);
    assert.match(app.elements['#contact-status'].textContent, /team@peakcognitivelongevity.com/);
  }
});

test('client blocks invalid or duplicate submissions', async () => {
  const app = client(async () => { throw new Error('Should not fetch'); });
  app.form.valid = false;
  await app.submit();
  assert.equal(app.elements['#contact-status'].hidden, true);
  app.form.valid = true;
  app.elements['button[type="submit"]'].disabled = true;
  await app.submit();
  assert.equal(app.elements['#contact-status'].hidden, true);
});
