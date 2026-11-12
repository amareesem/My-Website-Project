const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDirectory = path.join(root, 'content', 'brain-health');
const outputDirectory = path.join(root, 'blog');
const indexPath = path.join(root, 'assets', 'brain-health-blog-index.json');
const sitemapPath = path.join(root, 'sitemap.xml');
const llmsPath = path.join(root, 'llms.txt');
const robotsPath = path.join(root, 'robots.txt');
const siteOrigin = 'https://www.peakcognitivelongevity.com';
const imageWidth = 1200;
const imageHeight = 800;

// Publish order (America/Chicago). This script renders only the markdown files
// that are actually in content/brain-health/, so a post stays off the site,
// the sitemap, llms.txt, and the blog index until its file is added.
// Also copy that post's image: assets/blog/brain-health/<slug>.jpg
// 01 2026-11-12 content/brain-health/01-new-dementia-risk-factors-ldl-vision.md assets/blog/brain-health/new-dementia-risk-factors-ldl-vision.jpg
// 02 2026-11-14 content/brain-health/02-us-pointer-structured-lifestyle-brain-health.md assets/blog/brain-health/us-pointer-structured-lifestyle-brain-health.jpg
// 03 2026-11-17 content/brain-health/03-hearing-and-brain-achieve-trial.md assets/blog/brain-health/hearing-and-brain-achieve-trial.jpg
// 04 2026-11-19 content/brain-health/04-walking-steps-brain-health.md assets/blog/brain-health/walking-steps-brain-health.jpg
// 05 2026-11-21 content/brain-health/05-brain-fog-or-something-more.md assets/blog/brain-health/brain-fog-or-something-more.jpg
// 06 2026-11-23 content/brain-health/06-sleep-is-brain-maintenance.md assets/blog/brain-health/sleep-is-brain-maintenance.jpg
// 07 2026-11-25 content/brain-health/07-brain-friendly-thanksgiving-mind-diet.md assets/blog/brain-health/brain-friendly-thanksgiving-mind-diet.jpg
// 08 2026-11-27 content/brain-health/08-connection-is-brain-care-holidays.md assets/blog/brain-health/connection-is-brain-care-holidays.jpg

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  if (trimmed.startsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed;
}

function parsePost(source, fileName) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: missing YAML frontmatter`);

  const metadata = {};
  let section = '';
  for (const line of match[1].split(/\r?\n/)) {
    const tagMatch = line.match(/^\s+-\s+(.*)$/);
    if (tagMatch && section === 'tags') {
      metadata.tags.push(unquote(tagMatch[1]));
      continue;
    }
    const fieldMatch = line.match(/^([A-Za-z][\w]*):(?:\s*(.*))?$/);
    if (!fieldMatch) continue;
    section = fieldMatch[1];
    if (section === 'tags') metadata.tags = [];
    else if (fieldMatch[2] !== undefined) metadata[section] = unquote(fieldMatch[2]);
  }

  for (const field of ['title', 'seoTitle', 'description', 'slug', 'category', 'excerpt', 'focusKeyword', 'featuredImageAlt', 'publishedAt', 'author']) {
    if (typeof metadata[field] !== 'string' || !metadata[field]) {
      throw new Error(`${fileName}: missing ${field}`);
    }
  }
  if (metadata.category !== 'Brain Health') throw new Error(`${fileName}: category must be Brain Health`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt)) throw new Error(`${fileName}: publishedAt must be YYYY-MM-DD`);
  if (!Number.isInteger(Number(metadata.readingTime)) || Number(metadata.readingTime) < 1) {
    throw new Error(`${fileName}: invalid readingTime`);
  }
  if (!Array.isArray(metadata.tags) || metadata.tags.length === 0) throw new Error(`${fileName}: missing tags`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) throw new Error(`${fileName}: slug contains unsupported characters`);

  const rendered = renderMarkdown(match[2], fileName);
  return {
    ...metadata,
    readingTime: Number(metadata.readingTime),
    featuredImage: `/assets/blog/brain-health/${metadata.slug}.jpg`,
    faqs: rendered.faqs,
    body: rendered.body
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[character]);
}

function normalizeHref(url) {
  for (const origin of [siteOrigin, 'https://peakcognitivelongevity.com']) {
    if (url === origin || url === `${origin}/`) return '/';
    if (url.startsWith(`${origin}/`) || url.startsWith(`${origin}#`)) return url.slice(origin.length);
  }
  return url;
}

function renderInline(source) {
  let html = '';
  let index = 0;
  while (index < source.length) {
    const linkAt = source.indexOf('[', index);
    const italicAt = source.indexOf('*', index);
    const next = linkAt === -1 ? italicAt : italicAt === -1 ? linkAt : Math.min(linkAt, italicAt);
    if (next === -1) {
      html += escapeHtml(source.slice(index));
      break;
    }
    html += escapeHtml(source.slice(index, next));
    if (next === italicAt && (linkAt === -1 || italicAt < linkAt)) {
      const end = source.indexOf('*', next + 1);
      if (end === -1) {
        html += escapeHtml(source.slice(next));
        break;
      }
      html += `<em>${escapeHtml(source.slice(next + 1, end))}</em>`;
      index = end + 1;
      continue;
    }
    const labelEnd = source.indexOf(']', next + 1);
    if (labelEnd === -1 || source[labelEnd + 1] !== '(') {
      html += escapeHtml(source[next]);
      index = next + 1;
      continue;
    }
    let depth = 0;
    let closed = -1;
    for (let cursor = labelEnd + 1; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      if (character === '(') depth += 1;
      else if (character === ')') {
        depth -= 1;
        if (depth === 0) {
          closed = cursor;
          break;
        }
      } else if (/\s/.test(character)) break;
    }
    if (closed === -1) {
      html += escapeHtml(source[next]);
      index = next + 1;
      continue;
    }
    const label = source.slice(next + 1, labelEnd);
    const href = normalizeHref(source.slice(labelEnd + 2, closed));
    const external = /^https?:\/\//i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    html += `<a href="${escapeHtml(href)}"${attrs}>${escapeHtml(label)}</a>`;
    index = closed + 1;
  }
  return html;
}

function renderBlock(block, fileName) {
  const lines = block.split('\n');
  if (lines.length === 1 && lines[0].startsWith('### ')) return `<h3>${renderInline(lines[0].slice(4).trim())}</h3>`;
  if (lines.length === 1 && lines[0].startsWith('## ')) return `<h2>${renderInline(lines[0].slice(3).trim())}</h2>`;
  if (lines.every(line => line.startsWith('- '))) {
    return `<ul>\n${lines.map(line => `<li>${renderInline(line.slice(2))}</li>`).join('\n')}\n</ul>`;
  }
  if (lines.every(line => /^\d+\. /.test(line))) {
    return `<ol>\n${lines.map(line => `<li>${renderInline(line.replace(/^\d+\. /, ''))}</li>`).join('\n')}\n</ol>`;
  }
  if (lines.some(line => /^#{2,3} /.test(line) || line.startsWith('- ') || /^\d+\. /.test(line))) {
    throw new Error(`${fileName}: unexpected mixed markdown block: ${block.slice(0, 80)}`);
  }
  return `<p>${renderInline(lines.join(' '))}</p>`;
}

function renderMarkdown(markdown, fileName) {
  const parts = markdown.trim().split(/\n## Frequently Asked Questions\s*\n/);
  if (parts.length !== 2) throw new Error(`${fileName}: expected one Frequently Asked Questions section`);
  const [articleMarkdown, faqMarkdown] = parts;
  for (const heading of ['## Key Takeaways', '## Your Next Move', '## Sources']) {
    if (!articleMarkdown.includes(heading)) throw new Error(`${fileName}: missing ${heading}`);
  }

  const faqs = [];
  for (const part of faqMarkdown.trim().split(/^### /m)) {
    if (!part.trim()) continue;
    const breakAt = part.indexOf('\n');
    const question = (breakAt === -1 ? part : part.slice(0, breakAt)).trim();
    const answer = (breakAt === -1 ? '' : part.slice(breakAt + 1)).trim();
    const paragraphs = answer.split(/\n\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
    if (!question || paragraphs.length === 0) throw new Error(`${fileName}: incomplete FAQ`);
    faqs.push({ question, answer: paragraphs.join(' ') });
  }
  if (faqs.length < 1) throw new Error(`${fileName}: missing FAQs`);

  const body = articleMarkdown.trim().split(/\n\n+/).map(block => renderBlock(block, fileName)).join('\n');
  const move = body.match(/<h2>Your Next Move<\/h2>([\s\S]*?)(?=<h2>|$)/);
  if (!move) throw new Error(`${fileName}: could not isolate Your Next Move`);
  if (/\brevers/i.test(move[1])) throw new Error(`${fileName}: reversal language in the closing CTA`);
  if (/timarron/i.test(body)) throw new Error(`${fileName}: Timarron reference in the article`);
  if (!/<p><em>This article is for educational purposes[\s\S]*<\/em><\/p>/.test(body)) {
    throw new Error(`${fileName}: missing the italic educational disclaimer`);
  }
  return { body, faqs };
}

function assertCopyPreserved(post, fileName) {
  const source = post.bodySource;
  const visible = post.body
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
  const article = source.split(/\n## Frequently Asked Questions\s*\n/)[0];
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
    if (plain && !visible.includes(plain)) {
      throw new Error(`${fileName}: rendered HTML is missing source text: ${plain.slice(0, 140)}`);
    }
  }
}

function renderArticle(post) {
  const canonical = `${siteOrigin}/blog/${post.slug}/`;
  const imageUrl = `${siteOrigin}${post.featuredImage}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };
  const faqs = post.faqs.map(faq => `
        <details class="faq-item" open>
          <summary>${escapeHtml(faq.question)}</summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join('');

  return `<!doctype html>
<html lang="en">
<head><link rel="icon" type="image/png" href="/favicon.png">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(post.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <meta name="author" content="${escapeHtml(post.author)}">
  <meta name="keywords" content="${escapeHtml([post.focusKeyword, ...post.tags].join(', '))}">
  <meta name="article:section" content="${escapeHtml(post.category)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:alt" content="${escapeHtml(post.featuredImageAlt)}">
  <meta property="og:image:width" content="${imageWidth}">
  <meta property="og:image:height" content="${imageHeight}">
  <meta property="article:published_time" content="${escapeHtml(post.publishedAt)}">
  <meta property="article:author" content="${escapeHtml(post.author)}">
  <script type="application/ld+json">${JSON.stringify(faqSchema).replace(/</g, '\\u003c')}</script>
  <style>
    :root{color-scheme:light;--ink:#18332e;--green:#31584d;--gold:#c59654;--muted:#65756f;--paper:#f8f7f2;--line:#e4e6df}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 Georgia,"Times New Roman",serif}
    a{color:var(--green)}.site-header{background:#17372f;color:#fff;padding:18px 24px}.site-header nav{max-width:1100px;margin:auto;display:flex;justify-content:space-between;gap:18px;align-items:center;font:600 14px/1.4 Arial,sans-serif}.site-header a{color:#fff;text-decoration:none}
    .page{max-width:860px;margin:0 auto;padding:54px 24px 80px}.series-label{color:#8b6839;text-transform:uppercase;letter-spacing:.12em;font:700 12px Arial,sans-serif}
    h1{font:700 clamp(32px,5vw,48px)/1.13 Georgia,serif;letter-spacing:-.025em;margin:14px 0 18px}.dek{font-size:19px;line-height:1.6;color:#52645d;margin:0 0 22px}
    .byline{font:14px/1.5 Arial,sans-serif;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:25px;margin-bottom:30px}
    .hero-figure{margin:0 0 28px}.hero-figure img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;border-radius:16px}
    .article-body h2{font:700 28px/1.25 Georgia,serif;margin:42px 0 14px}.article-body h3{font:700 21px/1.35 Georgia,serif;margin:30px 0 12px}
    .article-body p,.article-body ul,.article-body ol,.article-body blockquote{margin:0 0 20px}.article-body ul,.article-body ol{padding-left:25px}.article-body li{margin:0 0 9px}.article-body a{overflow-wrap:anywhere}.article-body table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:25px 0;font:14px/1.5 Arial,sans-serif}.article-body th,.article-body td{padding:10px 12px;border:1px solid var(--line);text-align:left;vertical-align:top}.article-body th,.article-body tr.header{background:#e9eee9}.article-body blockquote{border-left:3px solid var(--gold);padding:8px 20px;color:#50615a}
    .faqs{border-top:1px solid var(--line);margin-top:44px;padding-top:28px}.faqs h2{font:700 26px/1.3 Georgia,serif}.faq-item{border-bottom:1px solid var(--line);padding:14px 0}.faq-item summary{cursor:pointer;font-weight:700}.faq-item p{margin:10px 0 0;color:#465952}
    .back-link{display:inline-block;margin-top:30px;font:600 14px Arial,sans-serif}
    @media(max-width:600px){.page{padding:38px 18px 60px}.site-header nav{align-items:flex-start}}
  </style>
  <script src="/assets/analytics.js" defer></script>
</head>
<body>
  <header class="site-header"><nav><a href="/">PEAK Cognitive Longevity</a><a href="/index.html#blog">All Blog Posts</a></nav></header>
  <main class="page">
    <div class="series-label">Brain Health</div>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="dek">${escapeHtml(post.description)}</p>
    <div class="byline">${escapeHtml(post.author)} \u00b7 ${escapeHtml(post.publishedAt)} \u00b7 ${post.readingTime} min read</div>
    <figure class="hero-figure">
      <img src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.featuredImageAlt)}" width="${imageWidth}" height="${imageHeight}" onerror="this.closest('figure').hidden=true">
    </figure>
    <article class="article-body">${post.body}</article>
    <section class="faqs" aria-labelledby="faq-title"><h2 id="faq-title">Frequently Asked Questions</h2>${faqs}
    </section>
    <a class="back-link" href="/index.html#blog">\u2190 Back to all blog posts</a>
  </main>
</body>
</html>`;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function blogEntries() {
  const entries = [];
  const names = await fs.readdir(outputDirectory);
  for (const name of names) {
    const file = path.join(outputDirectory, name, 'index.html');
    try {
      const html = await fs.readFile(file, 'utf8');
      const loc = html.match(/<link rel="canonical" href="([^"]+)">/);
      const title = html.match(/<h1>([^<]*)<\/h1>/);
      const published = html.match(/property="article:published_time" content="([^"]+)"/);
      if (!loc || !title) continue;
      entries.push({
        loc: loc[1],
        title: decodeEntities(title[1]),
        publishedAt: published ? published[1] : ''
      });
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    }
  }
  entries.sort((a, b) => (a.publishedAt || '9999').localeCompare(b.publishedAt || '9999') || a.loc.localeCompare(b.loc));
  return entries;
}

function xmlEscape(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[character]);
}

async function writeCrawlFiles(entries) {
  const staticPages = [
    `${siteOrigin}/`,
    `${siteOrigin}/faq/`,
    `${siteOrigin}/evidence/`
  ];
  const urls = [
    ...staticPages.map(loc => `  <url><loc>${xmlEscape(loc)}</loc></url>`),
    ...entries.map(entry => `  <url><loc>${xmlEscape(entry.loc)}</loc>${entry.publishedAt ? `<lastmod>${entry.publishedAt}</lastmod>` : ''}</url>`)
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  const blogLines = entries.map(entry => `- ${entry.publishedAt || 'undated'}. ${entry.title}. ${entry.loc}`);
  const llms = `# PEAK Cognitive Longevity

> Physician-led six-month cognitive longevity program based in Southlake, Texas, with video visits nationwide.

PEAK Cognitive Longevity is led by Dr. Lori King, MD, and Dr. Chris King, MD. Patients meet with their own physician. The program uses advanced testing and a personal plan. It does not diagnose, treat, or cure dementia or Alzheimer's disease.

Of the known risk factors for dementia, more than 80% are modifiable, and the Lancet Commission estimates that addressing just 14 of them could prevent or delay up to 45% of dementia cases worldwide.

## Contact

- Phone: (817) 796-5115
- Email: team@peakcognitivelongevity.com
- Office: 200 Pecan Creek Drive, Southlake, TX 76092
- Hours: Mon to Thu, 8:00 AM to 4:30 PM. Fri, 8:00 AM to 12:00 PM

## Pages

- ${siteOrigin}/
- ${siteOrigin}/faq/
- ${siteOrigin}/evidence/

## Blog

${blogLines.join('\n')}
`;
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteOrigin}/sitemap.xml
`;
  await fs.writeFile(sitemapPath, sitemap);
  await fs.writeFile(llmsPath, llms);
  await fs.writeFile(robotsPath, robots);
}

function rejectDashes(label, value) {
  if (value.includes('\u2013') || value.includes('\u2014') || value.includes('&ndash;') || value.includes('&mdash;')) {
    throw new Error(`${label} contains an en dash or em dash`);
  }
}

async function main() {
  await fs.mkdir(sourceDirectory, { recursive: true });
  const files = (await fs.readdir(sourceDirectory)).filter(file => file.endsWith('.md')).sort();
  if (files.length === 0) throw new Error('content/brain-health has no markdown posts');

  const posts = [];
  for (const file of files) {
    const source = await fs.readFile(path.join(sourceDirectory, file), 'utf8');
    rejectDashes(file, source);
    const post = parsePost(source, file);
    post.bodySource = source.split(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[1];
    assertCopyPreserved(post, file);
    posts.push(post);
  }
  posts.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt) || a.slug.localeCompare(b.slug));
  const slugs = new Set(posts.map(post => post.slug));
  if (slugs.size !== posts.length) throw new Error('duplicate Brain Health slugs');

  const existingNames = await fs.readdir(outputDirectory);
  for (const name of existingNames) {
    const file = path.join(outputDirectory, name, 'index.html');
    let html = '';
    try {
      html = await fs.readFile(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') continue;
      throw error;
    }
    if (html.includes('name="article:section" content="Brain Health"') && !slugs.has(name)) {
      await fs.rm(path.join(outputDirectory, name), { recursive: true, force: true });
    }
  }

  for (const post of posts) {
    for (const match of post.body.matchAll(/href="\/blog\/([^"/]+)\/?"/g)) {
      const target = path.join(outputDirectory, match[1], 'index.html');
      const willExist = slugs.has(match[1]);
      try {
        await fs.access(target);
      } catch (error) {
        if (!willExist) throw new Error(`${post.slug}: broken internal blog link to ${match[1]}`);
      }
    }
    const html = renderArticle(post);
    rejectDashes(post.slug, html);
    if (/noindex/i.test(html)) throw new Error(`${post.slug}: page must stay indexable`);
    if (/timarron/i.test(html)) throw new Error(`${post.slug}: Timarron reference`);
    const route = path.join(outputDirectory, post.slug, 'index.html');
    await fs.mkdir(path.dirname(route), { recursive: true });
    await fs.writeFile(route, html);
  }

  const index = posts.map(({ title, seoTitle, description, slug, category, tags, focusKeyword, featuredImage, featuredImageAlt, publishedAt, readingTime, author, excerpt }) => ({
    title, seoTitle, description, slug, category, tags, focusKeyword, featuredImage, featuredImageAlt, publishedAt, readingTime, author, excerpt
  }));
  const indexText = `${JSON.stringify(index, null, 2)}\n`;
  rejectDashes('brain-health-blog-index.json', indexText);
  await fs.writeFile(indexPath, indexText);

  const entries = await blogEntries();
  await writeCrawlFiles(entries);
  const brainEntries = entries.filter(entry => slugs.has(entry.loc.replace(/\/$/, '').split('/').pop()));
  if (brainEntries.length !== posts.length) {
    throw new Error(`sitemap is missing Brain Health posts (${brainEntries.length} of ${posts.length})`);
  }
  console.log(`Generated ${posts.length} Brain Health article page(s), the blog index, sitemap.xml, and llms.txt.`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { parsePost, assertCopyPreserved, renderInline };
