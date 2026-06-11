// SPORTEX API — KV-backed data gateway
// GET  /api/data/:key  → read from KV, fallback 404
// PUT  /api/data/:key  → write to KV (requires X-KV-Secret)

const KV_SECRET = 'spex_kv_2026'; // must match CMS KV_SECRET

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // Determine key from path: /api/data/products → "products"
  const path = url.pathname.replace(/^\/api\/data\/?/, '');
  if (!path) {
    return new Response(JSON.stringify({ error: 'missing key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ═══ PUT: Write to KV ═══
  if (method === 'PUT') {
    const secret = request.headers.get('X-KV-Secret') || '';
    if (secret !== KV_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    try {
      const body = await request.json();
      // env.SPORTEX_DATA is the KV namespace binding
      await env.SPORTEX_DATA.put(path, JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ═══ GET: Read from KV ═══
  if (method === 'GET') {
    try {
      const raw = await env.SPORTEX_DATA.get(path);
      if (raw) {
        return new Response(raw, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
        });
      }
      // Not in KV — let client fallback to static JSON
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Other methods
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
