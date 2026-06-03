// GitHub OAuth callback for Decap CMS
// Handles: GET /api/callback?code=xxx → exchange for token → send back
// Supports both popup (postMessage) and redirect (URL hash) flows
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const data = await tokenResponse.json();

  if (!data.access_token) {
    return new Response(
      `Auth failed: ${JSON.stringify(data)}`,
      { status: 401, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const token = data.access_token;

  return new Response(`<!DOCTYPE html>
<html><body>
<script>
  // Try popup flow first
  if (window.opener && window.opener !== window) {
    try {
      window.opener.postMessage({token: '${token}', provider: 'github'}, '*');
      window.close();
    } catch(e) {
      // Fall through to redirect
    }
  }
  // Popup blocked or failed — redirect back to admin page with token
  window.location.href = '/admin/#access_token=${token}';
</script>
<p>Authorization successful — redirecting...</p>
</body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
