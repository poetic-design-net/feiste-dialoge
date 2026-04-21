import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID not configured');
    return;
  }

  const provider = req.query.provider ?? 'github';
  const scope = req.query.scope ?? 'repo,user';

  if (provider !== 'github') {
    res.status(400).send(`Unsupported provider: ${provider}`);
    return;
  }

  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  const redirectUri = `${proto}://${host}/api/callback`;

  const state = crypto.randomBytes(16).toString('hex');

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  res.writeHead(302, { Location: authUrl.toString() });
  res.end();
}
