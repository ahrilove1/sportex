// GitHub OAuth callback for Decap CMS
// GET /api/callback?code=xxx → exchange for token → send to opener
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  let token;
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    const data = await tokenResponse.json();
    if (!data.access_token) {
      return new Response(`Auth failed: ${JSON.stringify(data)}`, { status: 401, headers: { 'Content-Type': 'text/plain' } });
    }
    token = data.access_token;
  } catch(e) {
    return new Response(`Token exchange error: ${e.message}`, { status: 500 });
  }

  // Build the auth message Decap CMS expects
  const authMsg = `authorization:github:success:${JSON.stringify({token, provider: 'github'})}`;

  return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="text-align:center;font-family:Arial;padding-top:80px;">
  <h2 style="color:green;">✅ Authorization Successful</h2>
  <p style="color:#666;">Sending token back to CMS...</p>
  <p style="font-size:12px;color:#999;" id="msg">${authMsg.substring(0, 80)}...</p>
  <script>
    var authMsg = ${JSON.stringify(authMsg)};
    var sent = false;
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage(authMsg, '*');
        sent = true;
      } catch(e) {
        document.body.innerHTML += '<p style="color:red;">postMessage error: ' + e.message + '</p>';
      }
    }
    document.body.innerHTML += '<p><b>opener:</b> ' + (window.opener ? 'yes' : 'NO') + ' | <b>sent:</b> ' + sent + '</p>';
    if (sent) setTimeout(function(){ window.close(); }, 1000);
  </script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
