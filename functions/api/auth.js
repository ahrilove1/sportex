// GitHub OAuth initiation for Decap CMS
// Returns HTML page that completes handshake then redirects to GitHub
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'github';
  const siteId = url.searchParams.get('site_id') || 'sportexproduction.com';
  const scope = url.searchParams.get('scope') || 'repo,user';
  const login = url.searchParams.get('login');
  const betaInvite = url.searchParams.get('beta_invite');
  const inviteCode = url.searchParams.get('invite_code');

  // Build the full GitHub OAuth URL
  const redirectUri = 'https://sportexproduction.com/api/callback';
  let githubUrl = 'https://github.com/login/oauth/authorize'
    + `?client_id=${env.GITHUB_CLIENT_ID}`
    + `&scope=${encodeURIComponent(scope)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  if (login === 'true') githubUrl += '&login=true';
  if (betaInvite) githubUrl += '&beta_invite=' + encodeURIComponent(betaInvite);
  if (inviteCode) githubUrl += '&invite_code=' + encodeURIComponent(inviteCode);

  return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<script>
  // 1. Send handshake to opener
  if (window.opener) {
    window.opener.postMessage({provider:'${provider}',site_id:'${siteId}',scope:'${scope}'}, '*');
  }

  // 2. Wait for handshake response from opener, then redirect to GitHub
  var handshakeDone = false;
  window.addEventListener('message', function onMsg(e) {
    if (handshakeDone) return;
    handshakeDone = true;
    window.removeEventListener('message', onMsg);
    // Redirect to GitHub
    var finalUrl = '${githubUrl}';
    if (e.data && typeof e.data === 'object') {
      // Opener may have sent additional params
      Object.keys(e.data).forEach(function(k) {
        if (k !== 'provider') {
          finalUrl += '&' + k + '=' + encodeURIComponent(e.data[k]);
        }
      });
    }
    window.location.href = finalUrl;
  });

  // Fallback: redirect after 2s even without handshake response
  setTimeout(function() {
    if (!handshakeDone) {
      handshakeDone = true;
      window.location.href = '${githubUrl}';
    }
  }, 2000);
</script>
<p style="text-align:center;font-family:Arial;margin-top:60px;">Connecting to GitHub...</p>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
