import fetch from 'node-fetch';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const LARAVEL = process.env.LARAVEL_API_BASE || 'http://127.0.0.1:8000';
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const RESULTS = parseInt(process.env.RESULTS || '2', 10);

async function fetchJson(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${path}`);
  return res.json();
}

function pickLatest(articles) {
  if (!articles || !articles.length) return null;
  return articles.reduce((a, b) => {
    const da = a.published_at ? new Date(a.published_at) : new Date(0);
    const db = b.published_at ? new Date(b.published_at) : new Date(0);
    return db > da ? b : a;
  });
}

async function googleSearch(title) {
  const q = encodeURIComponent(title + ' blog');
  const url = `https://www.google.com/search?q=${q}&hl=en`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Google search failed: ' + res.status);
  const text = await res.text();
  const $ = cheerio.load(text);

  const links = new Set();
  // Try multiple selectors to be resilient
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    // Google wraps result links like /url?q=ACTUAL_URL
    const m = href.match(/\/url\?q=([^&]+)/);
    const link = m ? decodeURIComponent(m[1]) : href;
    if (link.startsWith('http') && !link.includes('google.com')) {
      links.add(link);
    }
  });

  // Filter out beyondchats domain and pick the first RESULTS
  const filtered = Array.from(links).filter(u => !u.includes('beyondchats.com')).slice(0, RESULTS);
  return filtered;
}

async function scrapeArticleHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Look for article tag first
  let content = '';
  if ($('article').length) content = $('article').first().html();
  else if ($('main').length) content = $('main').first().html();
  else {
    // common content container classes
    const selectors = ['.post', '.article', '.entry-content', '.content', '.blog-post'];
    for (const s of selectors) {
      if ($(s).length) { content = $(s).first().html(); break; }
    }
  }
  if (!content) content = $('body').html() || '';
  return content;
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('OpenAI error: ' + res.status + ' ' + txt);
  }
  const j = await res.json();
  const out = j.choices?.[0]?.message?.content || '';
  return out;
}

async function updateArticle(article) {
  console.log('Searching web for:', article.title);
  const links = await googleSearch(article.title);
  console.log('Found links:', links);

  const scraped = [];
  for (const l of links) {
    try {
      const html = await scrapeArticleHtml(l);
      scraped.push({ url: l, html });
    } catch (e) {
      console.warn('Scrape failed for', l, e.message);
    }
  }

  const refsText = scraped.map(s => `Source: ${s.url}\n\n${s.html}`).join('\n\n');

  const system = 'You are an assistant that rewrites and improves article content to match tone and formatting of provided reference articles while preserving facts and adding a references section at the bottom.';
  const userPrompt = `Original article title:\n${article.title}\n\nOriginal content:\n${article.body}\n\nReference articles:\n${refsText}\n\nPlease rewrite the original article to more closely match the tone, formatting and structure of the reference articles while preserving the original meaning. Include a "References" section at the bottom listing the URLs used.`;

  console.log('Calling LLM to generate updated article...');
  const updated = await callOpenAI(system, userPrompt);

  // Send updated article back to Laravel API
  const updateUrl = `${LARAVEL.replace(/\/$/, '')}/api/articles/${article.id}`;
  const patchRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: updated, references: [...(article.references||[]), ...links] })
  });
  if (!patchRes.ok) {
    const t = await patchRes.text();
    throw new Error('Failed to update article: ' + patchRes.status + ' ' + t);
  }
  const updatedArticle = await patchRes.json();
  console.log('Article updated:', updatedArticle.id);
}

async function main() {
  try {
    console.log('Fetching articles from', LARAVEL + '/api/articles');
    const articles = await fetchJson(LARAVEL + '/api/articles');
    const latest = pickLatest(articles);
    if (!latest) { console.log('No articles found.'); return; }
    console.log('Latest article:', latest.title || latest.slug);
    await updateArticle(latest);
    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (process.argv.includes('--once')) {
  main();
} else if (import.meta.url === `file://${process.argv[1]}`) {
  // default run once
  main();
}
