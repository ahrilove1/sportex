// GitHub OAuth initiation for Decap CMS
// Handles: GET /api/auth → redirect to GitHub login
export async function onRequest(context) {
  const { env } = context;
  const redirectUri = 'https://sportexproduction.com/api/callback';
  const githubAuthUrl = 'https://github.com/login/oauth/authorize'
    + `?client_id=${env.GITHUB_CLIENT_ID}`
    + '&scope=repo,user'
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return Response.redirect(githubAuthUrl, 302);
}
