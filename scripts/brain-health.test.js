const { renderInline } = require('./build-brain-health');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const schedule = [
  ['01-new-dementia-risk-factors-ldl-vision.md', 'new-dementia-risk-factors-ldl-vision', '2026-11-12'],
  ['02-us-pointer-structured-lifestyle-brain-health.md', 'us-pointer-structured-lifestyle-brain-health', '2026-11-14'],
  ['03-hearing-and-brain-achieve-trial.md', 'hearing-and-brain-achieve-trial', '2026-11-17'],
  ['04-walking-steps-brain-health.md', 'walking-steps-brain-health', '2026-11-19'],
  ['05-brain-fog-or-something-more.md', 'brain-fog-or-something-more', '2026-11-21'],
  ['06-sleep-is-brain-maintenance.md', 'sleep-is-brain-maintenance', '2026-11-23'],
  ['07-brain-friendly-thanksgiving-mind-diet.md', 'brain-friendly-thanksgiving-mind-diet', '2026-11-25'],
  ['08-connection-is-brain-care-holidays.md', 'connection-is-brain-care-holidays', '2026-11-27']
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function field(source, name) {
  const match = source.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  assert.ok(match, name);
  const value = match[1].trim();
  return value.startsWith('"') ? JSON.parse(value) : value;
}

test('scheduled Brain Health posts are public only when their markdown is present', () => {
  const index = JSON.parse(read('assets/brain-health-blog-index.json'));
  const sitemap = read('sitemap.xml');
  const llms = read('llms.txt');
  const slugs = new Set(index.map(post => post.slug));
  assert.equal(slugs.size, index.length);

  for (const [file, slug, publishedAt] of schedule) {
    const sourcePath = path.join('content', 'brain-health', file);
    const pagePath = path.join('blog', slug, 'index.html');
    const url = `https://www.peakcognitivelongevity.com/blog/${slug}/`;
    if (exists(sourcePath)) {
      const source = read(sourcePath);
      assert.equal(field(source, 'slug'), slug);
      assert.equal(field(source, 'publishedAt'), publishedAt);
      assert.equal(field(source, 'category'), 'Brain Health');
      assert.ok(slugs.has(slug), slug);
      assert.ok(exists(pagePath), slug);
      assert.equal(sitemap.split(url).length - 1, 1, slug);
      assert.ok(llms.includes(url), slug);
      const post = index.find(item => item.slug === slug);
      assert.equal(post.publishedAt, publishedAt);
      assert.equal(post.category, 'Brain Health');
      assert.equal(post.featuredImage, `/assets/blog/brain-health/${slug}.jpg`);
      assert.equal(post.featuredImageAlt, field(source, 'featuredImageAlt'));
    } else {
      assert.equal(slugs.has(slug), false, slug);
      assert.equal(exists(pagePath), false, slug);
      assert.equal(sitemap.includes(url), false, slug);
      assert.equal(llms.includes(url), false, slug);
    }
  }
});

test('each live Brain Health page matches the article template and stays indexable', () => {
  const index = JSON.parse(read('assets/brain-health-blog-index.json'));
  const home = read('index.html');
  assert.match(home, /fetch\('\/assets\/brain-health-blog-index\.json'\)/);
  assert.match(home, /id="brain-health-grid"/);
  assert.match(home, />Brain Health</);
  assert.match(home, /function renderBrainHealthPosts[\s\S]*?function loadFoodFightPosts/);

  for (const post of index) {
    const html = read(path.join('blog', post.slug, 'index.html'));
    const source = read(path.join('content', 'brain-health', schedule.find(([, slug]) => slug === post.slug)[0]));
    assert.match(html, new RegExp(`<title>${escapeRegExp(post.seoTitle)}</title>`));
    assert.match(html, new RegExp(`name="description" content="${escapeRegExp(post.description)}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://www\\.peakcognitivelongevity\\.com/blog/${post.slug}/"`));
    assert.match(html, /property="og:type" content="article"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, new RegExp(`property="og:url" content="https://www\\.peakcognitivelongevity\\.com/blog/${post.slug}/"`));
    assert.match(html, new RegExp(`property="og:image" content="https://www\\.peakcognitivelongevity\\.com/assets/blog/brain-health/${post.slug}\\.jpg"`));
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="800"/);
    assert.match(html, new RegExp(`property="article:published_time" content="${post.publishedAt}"`));
    assert.match(html, /property="article:author" content="Lori King, MD"/);
    assert.equal(/noindex/i.test(html), false, post.slug);
    assert.equal(/timarron/i.test(html), false, post.slug);
    assert.equal(html.includes('\u2013') || html.includes('\u2014') || html.includes('&ndash;') || html.includes('&mdash;'), false, post.slug);
    assert.match(html, /<h2>Key Takeaways<\/h2>/);
    assert.match(html, /<h2>Your Next Move<\/h2>/);
    assert.match(html, /<h2>Sources<\/h2>/);
    assert.match(html, /<em>This article is for educational purposes/);
    const move = html.match(/<h2>Your Next Move<\/h2>([\s\S]*?)<h2>/)[1];
    assert.equal(/\brevers/i.test(move), false, post.slug);
    assert.match(html, new RegExp(`<img src="/assets/blog/brain-health/${post.slug}\\.jpg" alt="${escapeRegExp(post.featuredImageAlt)}" width="1200" height="800"`));

    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'FAQPage');
    const faqSource = source.split('## Frequently Asked Questions')[1];
    const questions = [...faqSource.matchAll(/^### (.+)$/gm)].map(match => match[1].trim());
    assert.deepEqual(schema.mainEntity.map(item => item.name), questions, post.slug);
    assert.ok(schema.mainEntity.length >= 4, post.slug);
    const details = html.match(/<details class="faq-item" open>/g) || [];
    assert.equal(details.length, schema.mainEntity.length, post.slug);
    for (const question of schema.mainEntity) {
      assert.equal(typeof question.name, 'string');
      assert.equal(question['@type'], 'Question');
      assert.equal(question.acceptedAnswer['@type'], 'Answer');
      assert.ok(question.acceptedAnswer.text.length > 20);
      assert.ok(html.includes(question.name), question.name);
    }

    const article = source.split(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[1].split(/\n## Frequently Asked Questions\s*\n/)[0];
    const visible = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ');
    for (const href of markdownUrls(article)) {
      const normalized = href.startsWith('https://www.peakcognitivelongevity.com')
        ? href.slice('https://www.peakcognitivelongevity.com'.length) || '/'
        : href;
      assert.ok(html.includes(`href="${normalized.replace(/&/g, '&amp;')}"`), `${post.slug} missing href ${normalized}`);
    }
    for (const block of article.trim().split(/\n\n+/)) {
      const prepared = block
        .replace(/^#{2,3} /gm, '')
        .replace(/^- /gm, '')
        .replace(/^\d+\. /gm, '');
      const plain = renderInline(prepared)
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      assert.ok(visible.includes(plain), `${post.slug} missing: ${plain.slice(0, 120)}`);
    }
  }
});

test('new Brain Health files do not add dashes or Timarron links', () => {
  const files = [
    'scripts/build-brain-health.js',
    'scripts/brain-health.test.js',
    'assets/brain-health-blog-index.json',
    'sitemap.xml',
    'llms.txt',
    'robots.txt'
  ];
  for (const file of files) {
    const text = read(file);
    assert.equal(text.includes('\u2013') || text.includes('\u2014'), false, file);
    assert.equal(/timarron\.com/i.test(text), false, file);
  }
  const listing = read('index.html').match(/function renderBrainHealthPosts[\s\S]*?brain-health-blog-index\.json'\)/)[0];
  assert.equal(listing.includes('\u2013') || listing.includes('\u2014'), false);
});

function markdownUrls(text) {
  const urls = [];
  let index = 0;
  while (index < text.length) {
    const marker = text.indexOf('](', index);
    if (marker === -1) break;
    let depth = 1;
    let closed = -1;
    for (let cursor = marker + 2; cursor < text.length; cursor += 1) {
      const character = text[cursor];
      if (character === '(') depth += 1;
      else if (character === ')') {
        depth -= 1;
        if (depth === 0) {
          closed = cursor;
          break;
        }
      } else if (/\s/.test(character)) break;
    }
    if (closed === -1) break;
    urls.push(text.slice(marker + 2, closed));
    index = closed + 1;
  }
  return urls;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
