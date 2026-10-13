const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceDirectory = path.join(root, 'content', 'longevity-pearls');
const outputDirectory = path.join(root, 'blog');
const manifestPath = path.join(sourceDirectory, 'manifest.csv');
const indexPath = path.join(root, 'assets', 'longevity-pearls-blog-index.json');

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  if (trimmed.startsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed;
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error('Manifest contains an unterminated quoted field');
  values.push(value);
  return values;
}

function parseManifest(source) {
  const [headerLine, ...rows] = source.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return rows.map(line => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) throw new Error('Manifest row has an unexpected number of columns');
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function parsePost(source, fileName) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: missing YAML frontmatter`);

  const metadata = {};
  const faqs = [];
  let section = '';
  let currentFaq = null;
  for (const line of match[1].split(/\r?\n/)) {
    const faqMatch = line.match(/^\s+-\s+q:\s*(.*)$/);
    if (faqMatch) {
      currentFaq = { question: unquote(faqMatch[1]), answer: '' };
      faqs.push(currentFaq);
      continue;
    }
    const answerMatch = line.match(/^\s+a:\s*(.*)$/);
    if (answerMatch && section === 'faq' && currentFaq) {
      currentFaq.answer = unquote(answerMatch[1]);
      continue;
    }
    const tagMatch = line.match(/^\s+-\s+(.*)$/);
    if (tagMatch && section === 'tags') {
      metadata.tags.push(unquote(tagMatch[1]));
      continue;
    }
    const fieldMatch = line.match(/^([A-Za-z][\w]*):(?:\s*(.*))?$/);
    if (!fieldMatch) continue;
    section = fieldMatch[1];
    if (section === 'tags') {
      metadata.tags = fieldMatch[2] ? JSON.parse(fieldMatch[2]) : [];
    } else if (section === 'faq') {
      currentFaq = null;
    } else if (fieldMatch[2] !== undefined) {
      metadata[section] = unquote(fieldMatch[2]);
    }
  }

  for (const field of ['title', 'seoTitle', 'description', 'slug', 'category', 'publishedAt', 'author']) {
    if (typeof metadata[field] !== 'string' || !metadata[field]) {
      throw new Error(`${fileName}: missing ${field}`);
    }
  }
  if (metadata.category !== 'Longevity Pearls') throw new Error(`${fileName}: unexpected category`);
  if (!Number.isInteger(Number(metadata.readingTime)) || Number(metadata.readingTime) < 1) {
    throw new Error(`${fileName}: invalid readingTime`);
  }
  if (!Array.isArray(metadata.tags) || metadata.tags.length === 0) {
    throw new Error(`${fileName}: missing tags`);
  }
  if (metadata.slug !== path.basename(fileName, '.mdx') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug)) {
    throw new Error(`${fileName}: slug does not match filename or contains unsupported characters`);
  }
  if (faqs.length !== 3 || faqs.some(faq => !faq.question || !faq.answer)) {
    throw new Error(`${fileName}: expected three complete FAQs`);
  }

  let body = match[2]
    .replace(/className=/g, 'class=')
    .replace(/style=\{\{\s*width:\s*"([^"]+)"\s*\}\}/g, 'style="width:$1"')
    .replace(/\\\$/g, '$')
    .replace(/<a\b[^>]*>/gi, function(anchor){
      if(!/\bhref=["']https?:\/\//i.test(anchor)) return anchor;
      if(!/\btarget=/i.test(anchor)) anchor = anchor.replace(/>$/, ' target="_blank">');
      if(!/\brel=/i.test(anchor)) anchor = anchor.replace(/>$/, ' rel="noopener noreferrer">');
      return anchor;
    });
  if (/\{\{|\}\}|<script\b/i.test(body)) throw new Error(`${fileName}: contains unsupported JSX or executable script`);
  const inlineFaqMatch = body.match(/<h2>Frequently Asked Questions<\/h2>[\s\S]*$/);
  if (!inlineFaqMatch) throw new Error(`${fileName}: expected an inline FAQ section to remove`);
  body = body.replace(inlineFaqMatch[0], '').trim();

  const firstParagraph = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const excerpt = firstParagraph
    ? firstParagraph[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : metadata.description;

  return {
    ...metadata,
    readingTime: Number(metadata.readingTime),
    faqs,
    body,
    excerpt
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderArticle(post) {
  const canonical = `https://www.peakcognitivelongevity.com/blog/${post.slug}/`;
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
        <details class="faq-item">
          <summary>${escapeHtml(faq.question)}</summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(post.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <meta name="author" content="${escapeHtml(post.author)}">
  <meta name="keywords" content="${escapeHtml(post.tags.join(', '))}">
  <meta name="article:section" content="${escapeHtml(post.category)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="article:published_time" content="${escapeHtml(post.publishedAt)}">
  <meta property="article:author" content="${escapeHtml(post.author)}">
  <script type="application/ld+json">${JSON.stringify(faqSchema).replace(/</g, '\\u003c')}</script>
  <style>
    :root{color-scheme:light;--ink:#18332e;--green:#31584d;--gold:#c59654;--muted:#65756f;--paper:#f8f7f2;--line:#e4e6df}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 Georgia,"Times New Roman",serif}
    a{color:var(--green)}.site-header{background:#17372f;color:#fff;padding:18px 24px}.site-header nav{max-width:1100px;margin:auto;display:flex;justify-content:space-between;gap:18px;align-items:center;font:600 14px/1.4 Arial,sans-serif}.site-header a{color:#fff;text-decoration:none}
    .page{max-width:860px;margin:0 auto;padding:54px 24px 80px}.series-label{color:#8b6839;text-transform:uppercase;letter-spacing:.12em;font:700 12px Arial,sans-serif}
    h1{font:700 clamp(32px,5vw,48px)/1.13 Georgia,serif;letter-spacing:-.025em;margin:14px 0 18px}.dek{font-size:19px;line-height:1.6;color:#52645d;margin:0 0 22px}
    .byline{font:14px/1.5 Arial,sans-serif;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:25px;margin-bottom:30px}.article-body h2{font:700 28px/1.25 Georgia,serif;margin:42px 0 14px}.article-body h3{font:700 21px/1.35 Georgia,serif;margin:30px 0 12px}
    .article-body p,.article-body ul,.article-body ol,.article-body blockquote{margin:0 0 20px}.article-body ul,.article-body ol{padding-left:25px}.article-body li{margin:0 0 9px}.article-body a{overflow-wrap:anywhere}.article-body table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:25px 0;font:14px/1.5 Arial,sans-serif}.article-body th,.article-body td{padding:10px 12px;border:1px solid var(--line);text-align:left;vertical-align:top}.article-body th,.article-body tr.header{background:#e9eee9}.article-body blockquote{border-left:3px solid var(--gold);padding:8px 20px;color:#50615a}
    .faqs{border-top:1px solid var(--line);margin-top:44px;padding-top:28px}.faqs h2{font:700 26px/1.3 Georgia,serif}.faq-item{border-bottom:1px solid var(--line);padding:14px 0}.faq-item summary{cursor:pointer;font-weight:700}.faq-item p{margin:10px 0 0;color:#465952}
    .back-link{display:inline-block;margin-top:30px;font:600 14px Arial,sans-serif}
    @media(max-width:600px){.page{padding:38px 18px 60px}.site-header nav{align-items:flex-start}.article-body table{font-size:12px}}
  </style>
</head>
<body>
  <header class="site-header"><nav><a href="/">PEAK Cognitive Longevity</a><a href="/index.html#blog">All Blog Posts</a></nav></header>
  <main class="page">
    <div class="series-label">Longevity Pearls</div>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="dek">${escapeHtml(post.description)}</p>
    <div class="byline">${escapeHtml(post.author)} · ${escapeHtml(post.publishedAt)} · ${post.readingTime} min read</div>
    <article class="article-body">${post.body}</article>
    <section class="faqs" aria-labelledby="faq-title"><h2 id="faq-title">Frequently Asked Questions</h2>${faqs}
    </section>
    <a class="back-link" href="/index.html#blog">← Back to all Blog series</a>
  </main>
</body>
</html>`;
}

async function main() {
  const manifest = parseManifest(await fs.readFile(manifestPath, 'utf8'));
  const files = (await fs.readdir(sourceDirectory))
    .filter(file => file.endsWith('.mdx'))
    .sort();
  if (files.length !== manifest.length || files.length !== 5) {
    throw new Error(`Expected five articles matching the manifest, found ${files.length}`);
  }

  const posts = await Promise.all(files.map(async file =>
    parsePost(await fs.readFile(path.join(sourceDirectory, file), 'utf8'), file)
  ));
  const manifestByFile = new Map(manifest.map(row => [row.filename, row]));
  for (const post of posts) {
    const row = manifestByFile.get(`${post.slug}.mdx`);
    if (!row || row.slug !== post.slug || row.title !== post.title ||
        row.category !== post.category || row.publishedAt !== post.publishedAt ||
        Number(row.readingTime) !== post.readingTime) {
      throw new Error(`${post.slug}: article metadata does not match the manifest`);
    }
  }
  if (manifestByFile.size !== posts.length) throw new Error('Manifest contains duplicate or unmatched article rows');

  for (const post of posts) {
    const route = path.join(outputDirectory, post.slug, 'index.html');
    await fs.mkdir(path.dirname(route), { recursive: true });
    await fs.writeFile(route, renderArticle(post));
  }

  const index = posts.map(({ title, seoTitle, description, slug, category, tags, publishedAt, readingTime, author, excerpt }) => ({
    title, seoTitle, description, slug, category, tags, publishedAt, readingTime, author, excerpt
  }));
  await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Generated ${posts.length} Longevity Pearls article pages and the blog index.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
