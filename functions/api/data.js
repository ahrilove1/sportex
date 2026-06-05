// KV Data API — instant read/write for CMS data
// GET  /api/data/products  /api/data/company  /api/data/images  /api/data/settings
// PUT  /api/data/*  (with secret token)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Extract key name from path: /api/data/products → products
  const key = path.replace('/api/data/', '');
  if (!key) return new Response('Missing key', { status: 400 });

  // GET — read from KV
  if (method === 'GET') {
    try {
      const value = await env.DATA_KV.get(key);
      if (!value) return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response(value, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=10' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // PUT — write to KV (needs secret)
  if (method === 'PUT') {
    const secret = request.headers.get('X-KV-Secret') || '';
    if (secret !== env.KV_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    try {
      const body = await request.text();
      await env.DATA_KV.put(key, body);
      return new Response(JSON.stringify({ ok: true, key }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
