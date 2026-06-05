// KV Data API — instant read/write for CMS data
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.pathname.replace('/api/data/', '');
  if (!key) return new Response(JSON.stringify({ error: 'Missing key' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  if (request.method === 'PUT') {
    const secret = request.headers.get('X-KV-Secret') || '';
    if (secret !== env.KV_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    try {
      const body = await request.text();
      await env.DATA_KV.put(key, body);
      return new Response(JSON.stringify({ ok: true, key: key }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (request.method === 'GET') {
    try {
      const value = await env.DATA_KV.get(key);
      return new Response(value || '{}', { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=10' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET,PUT' } });
}
