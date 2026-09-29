const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const posts = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'food-fight-blog-index.json'), 'utf8'));
const errors = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

if (posts.length !== 26) errors.push('wrong index count');
posts.forEach((p, i) => {
  const file = path.join(root, 'blog', p.slug, 'index.html');
  if (p.seriesNumber !== i) errors.push('wrong order ' + i);
  if (!fs.existsSync(file)) { errors.push('missing ' + p.slug); return; }
  const html = fs.readFileSync(file, 'utf8');
  const body = html.match(/<article class="article-body">([\s\S]*?)<\/article>/)?.[1] || '';
  const h2FaqCount = (body.match(/<h2>Frequently Asked Questions<\/h2>/g) || []).length;
  if (h2FaqCount !== 0) errors.push('duplicate inline FAQ h2 remains in ' + p.slug + ' (count ' + h2FaqCount + ')');
  if (!html.includes('<title>' + esc(p.seoTitle) + '</title>')) errors.push('SEO ' + p.slug);
  if ((html.match(/<details class="faq-item" open>/g) || []).length !== 5) errors.push('visible FAQs ' + p.slug);
  if (!html.includes('application/ld+json') || !(/educational purposes|medical advice/i.test(body))) errors.push('schema/disclaimer ' + p.slug);
  for (const m of html.matchAll(/href=["']\/blog\/([^/"']+)\/?["']/g)) {
    if (!fs.existsSync(path.join(root, 'blog', m[1], 'index.html'))) errors.push('broken link ' + m[1]);
  }
});
if (fs.readdirSync('content/blog').length !== 26) errors.push('source file count');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('All 26 routes pass: no duplicate inline FAQ, order, SEO, visible FAQ/schema, disclaimer, and links.');
