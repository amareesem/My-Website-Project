const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test, beforeEach } = require('node:test');
const contact = require('../api/contact');

const validFields = { name: 'Test Visitor', email: 'visitor@example.com', phone: '', message: 'A general question.', website: '' };

beforeEach(context => {
  const keys = ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_ALLOWED_ORIGINS', 'VERCEL_URL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.RESEND_API_KEY = 'test-key-not-a-real-secret';
  process.env.CONTACT_FROM_EMAIL = 'website@mail.peakcognitivelongevity.com';
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
  context.mock.method(globalThis, 'fetch', async (url, options) => {
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
  context.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ id: 'test-id' }) }));
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
    { ...validFields, website: 'https://spam.example' }
  ]) {
    const res = await submit(request({ body }));
    assert.equal(res.code, 400);
    assert.ok(res.body.error);
    assert.equal(res.body.success, undefined);
  }
  assert.equal((await submit(request({ body: ' '.repeat(32769) }))).code, 413);
});

test('supports JSON strings and optional phone and honeypot fields', async context => {
  context.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ id: 'test-id' }) }));
  const { phone, website, ...body } = validFields;
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
    context.mock.method(globalThis, 'fetch', async () => providerResponse);
    const res = await submit(request());
    assert.equal(res.code, 502);
    assert.ok(res.body.error);
    assert.equal(res.body.success, undefined);
  }
  context.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Timed out', 'TimeoutError'); });
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
    '#c-phone': { value: '' },
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
  const context = vm.createContext({ fetch, AbortController, setTimeout, clearTimeout });
  vm.runInContext(handlerSource, context);
  return { elements, form, submit: () => context.handleContactSubmit({ preventDefault() {}, currentTarget: form }) };
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
  assert.equal(app.elements['button[type="submit"]'].disabled, false);
  assert.match(app.elements['#contact-status'].textContent, /submitted to the PEAK team/);
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
