// Simple test — no KV dependency
export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "function works", method: context.request.method, path: new URL(context.request.url).pathname }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
