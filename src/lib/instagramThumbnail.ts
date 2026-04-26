import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR = path.resolve('public/uploads/ig-cache');
const PUBLIC_PREFIX = '/uploads/ig-cache';

// Instagram strips og:* meta tags for normal browser User-Agents (returns a
// JS-only shell), but serves them for crawler bots that consume Open Graph
// (Facebook's own scraper, search bots, link preview fetchers).
const CRAWLER_UA = 'facebookexternalhit/1.1';
const IMAGE_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function fetchInstagramThumbnail(postUrl: string): Promise<string | null> {
  const postId = extractPostId(postUrl);
  if (!postId) return null;

  const cacheFile = path.join(CACHE_DIR, `${postId}.jpg`);
  const publicPath = `${PUBLIC_PREFIX}/${postId}.jpg`;

  if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 1024) {
    return publicPath;
  }

  try {
    const pageRes = await fetch(postUrl, { headers: { 'User-Agent': CRAWLER_UA } });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    if (!ogMatch) return null;
    const imageUrl = decodeHtmlEntities(ogMatch[1]);

    const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': IMAGE_UA } });
    if (!imgRes.ok) return null;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.byteLength < 1024) return null;

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, buf);
    return publicPath;
  } catch {
    return null;
  }
}

export async function resolveVideoThumbnails<
  T extends { url?: string; thumbnail?: string }
>(videos: T[]): Promise<T[]> {
  return Promise.all(
    videos.map(async (v) => {
      if (v.thumbnail) return v;
      if (!v.url || !v.url.includes('instagram.com')) return v;
      const auto = await fetchInstagramThumbnail(v.url);
      return auto ? { ...v, thumbnail: auto } : v;
    })
  );
}
