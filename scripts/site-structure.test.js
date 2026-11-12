const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = [
  ['index.html', '/'],
  ['about/index.html', '/about/'],
  ['program/index.html', '/program/'],
  ['faq/index.html', '/faq/'],
  ['pricing/index.html', '/pricing/'],
  ['contact/index.html', '/contact/'],
  ['ebook/index.html', '/ebook/'],
  ['blog/index.html', '/blog/'],
  ['consultation/index.html', '/consultation/'],
  ['patient-stories/index.html', '/patient-stories/'],
  ['resources/index.html', '/resources/'],
  ['evidence/index.html', '/evidence/']
];

test('marketing pages are real documents with one heading and preview noindex', () => {
  for (const [file, route] of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<html lang="en">/, file);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    assert.match(html, /name="robots" content="noindex, nofollow"/, file);
    assert.match(html, new RegExp(`rel="canonical" href="https://www\\.peakcognitivelongevity\\.com${route.replaceAll('/', '\\/')}"`), file);
    assert.match(html, /property="og:title"/, file);
    assert.match(html, /property="og:description"/, file);
    assert.match(html, /property="og:url"/, file);
    assert.equal(html.includes('data:image'), false, file);
    assert.equal(html.includes('\u2014') || html.includes('\u2013') || html.includes('&mdash;') || html.includes('&ndash;'), false, file);
    const description = html.match(/name="description" content="([^"]*)"/)[1];
    assert.ok(description.length > 40 && description.length <= 155, `${file} description ${description.length}`);
  }
});

test('home page states who PEAK is for and keeps the approved stat', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /Who PEAK is for/);
  assert.match(html, /before memory problems show/);
  assert.match(html, /Of the known risk factors for dementia, more than 80% are modifiable, and the Lancet Commission estimates that addressing just 14 of them could prevent or delay up to 45% of dementia cases worldwide/);
  assert.ok(fs.statSync(path.join(root, 'index.html')).size < 80000);
});

test('contact form still posts to the API with the honeypot and medical warning', () => {
  const html = fs.readFileSync(path.join(root, 'contact', 'index.html'), 'utf8');
  assert.match(html, /id="contact-form"/);
  assert.match(html, /id="c-website"/);
  assert.match(html, /Please do not include medical records or sensitive health information/);
  assert.match(html, /id="contact-captcha"/);
  const script = fs.readFileSync(path.join(root, 'assets', 'site.js'), 'utf8');
  assert.match(script, /fetch\('\/api\/contact'/);
  assert.match(script, /website: form.querySelector\('#c-website'\)\.value/);
  assert.match(script, /fetch\('\/api\/contact-config'\)/);
});

test('resources page does not name supplement vendors', () => {
  const html = fs.readFileSync(path.join(root, 'resources', 'index.html'), 'utf8').toLowerCase();
  assert.equal(html.includes('fullscript'), false);
  assert.equal(html.includes('ortho'), false);
});

test('production crawl files exist and preview header stays noindex', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
  const config = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8');
  assert.match(robots, /Allow: \//);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /\/about\//);
  assert.match(sitemap, /\/blog\/polyphenols-brain-health\//);
  assert.match(llms, /PEAK Cognitive Longevity/);
  assert.match(llms, /Of the known risk factors for dementia, more than 80% are modifiable, and the Lancet Commission estimates that addressing just 14 of them could prevent or delay up to 45% of dementia cases worldwide/);
  assert.match(config, /noindex, nofollow/);
  assert.equal(config.includes('peakcognitivelongevity.com'), false);
});
