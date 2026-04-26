#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const PROJECTS_DIR = path.resolve('src/content/projects');
const CACHE_DIR = path.resolve('public/uploads/ig-cache');
const CRAWLER_UA = 'facebookexternalhit/1.1';
const IMAGE_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractPostId(url) {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractInstagramUrlsFromMd(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const fmEnd = text.indexOf('\n---', 3);
  if (!text.startsWith('---') || fmEnd < 0) return [];
  const fm = text.slice(3, fmEnd);
  return Array.from(fm.matchAll(/url:\s*(https:\/\/www\.instagram\.com\/[^\s'"]+)/g)).map(
    (m) => m[1]
  );
}

async function fetchOne(postUrl) {
  const postId = extractPostId(postUrl);
  if (!postId) return { postUrl, status: 'skip-no-id' };

  const cacheFile = path.join(CACHE_DIR, `${postId}.jpg`);
  if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 1024) {
    return { postUrl, status: 'cached', size: fs.statSync(cacheFile).size };
  }

  try {
    const pageRes = await fetch(postUrl, {
      headers: { 'User-Agent': CRAWLER_UA },
    });
    if (!pageRes.ok) return { postUrl, status: `page-${pageRes.status}` };
    const html = await pageRes.text();
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    if (!ogMatch) return { postUrl, status: 'no-og-image' };
    const imageUrl = decodeHtmlEntities(ogMatch[1]);

    const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': IMAGE_UA } });
    if (!imgRes.ok) return { postUrl, status: `img-${imgRes.status}` };
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.byteLength < 1024) return { postUrl, status: 'too-small' };

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, buf);
    return { postUrl, status: 'fetched', size: buf.byteLength };
  } catch (err) {
    return { postUrl, status: `error: ${err.message}` };
  }
}

async function main() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('[ig-prefetch] no projects directory, skipping');
    return;
  }
  const urls = new Set();
  for (const file of fs.readdirSync(PROJECTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    for (const url of extractInstagramUrlsFromMd(path.join(PROJECTS_DIR, file))) {
      urls.add(url);
    }
  }
  if (urls.size === 0) {
    console.log('[ig-prefetch] no instagram urls found');
    return;
  }
  console.log(`[ig-prefetch] checking ${urls.size} instagram url(s)`);
  const results = await Promise.all([...urls].map(fetchOne));
  for (const r of results) {
    console.log(`  ${r.status.padEnd(14)} ${r.postUrl}${r.size ? ` (${r.size}b)` : ''}`);
  }
}

main().catch((err) => {
  console.error('[ig-prefetch] fatal:', err);
  // Don't fail the build — fallback gradient still works.
  process.exit(0);
});
