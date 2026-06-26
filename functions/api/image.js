// SPORTEX Image Proxy
// GET /api/image?p=/images/uploads/xxx.jpg
// Fetches from GitHub on Cloudflare backbone, caches at edge (30 days)
//
// This solves the "images loading slow" problem:
// - GitHub Raw (raw.githubusercontent.com) takes 22s+ timeout from China
// - This Worker fetches from GitHub on Cloudflare's backbone (<1s)
// - Response is edge-cached for 30 days — subsequent loads are instant

const GITHUB_RAW = 'https://raw.githubusercontent.com/ahrilove1/sportex/main';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // ═══ Cache check (use URL-only key to avoid header variance) ═══
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cache = caches.default;
  let cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Get image path from query param: /api/image?p=/images/uploads/thumb_xxx.jpg
  const imgPath = url.searchParams.get('p');
  if (!imgPath) {
    return new Response('Missing p parameter', { status: 400 });
  }

  // Security: only allow image file extensions
  if (!/\.(jpg|jpeg|png|webp|svg|gif|ico|bmp)$/i.test(imgPath)) {
    return new Response('Invalid image path', { status: 400 });
  }

  // Sanitize — prevent path traversal (only strip .. as a path segment, not in filenames like ....jpg)
  const safe = imgPath.replace(/(^|\/)\.\.(?=\/|$)/g, '$1').replace(/\/\//g, '/');
  if (!safe.startsWith('/')) {
    return new Response('Path must be absolute', { status: 400 });
  }

  const ghUrl = GITHUB_RAW + safe;

  try {
    const ghResp = await fetch(ghUrl);

    if (!ghResp.ok) {
      return new Response('Image not found', {
        status: ghResp.status,
        headers: { 'Cache-Control': 'public, max-age=60' }
      });
    }

    const body = await ghResp.arrayBuffer();
    const contentType = ghResp.headers.get('Content-Type') || 'image/jpeg';

    const response = new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });

    // Edge-cache for 30 days — subsequent requests skip Worker entirely
    context.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
