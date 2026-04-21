function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf('=');
        return idx === -1 ? [c, ''] : [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      })
  );
}

function renderScript(status, content) {
  const payload = JSON.stringify(content).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Authentifizierung</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fbfaf1; color: #1b1c17; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
    main { max-width: 420px; }
    h1 { font-family: 'Courier Prime', monospace; color: #536529; font-size: 1.5rem; margin: 0 0 0.5rem; }
    p { color: #45483c; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <h1>${status === 'success' ? 'Angemeldet' : 'Fehler'}</h1>
    <p>${status === 'success' ? 'Das Fenster schließt sich automatisch.' : 'Die Anmeldung ist fehlgeschlagen. Dieses Fenster kann geschlossen werden.'}</p>
  </main>
  <script>
  (function() {
    var payload = ${payload};
    var message = 'authorization:github:' + (${JSON.stringify(status)}) + ':' + JSON.stringify(payload);
    function receive(e) {
      if (!e.data || typeof e.data !== 'string' || e.data.indexOf('authorizing:github') !== 0) return;
      window.opener && window.opener.postMessage(message, e.origin);
      window.removeEventListener('message', receive, false);
      setTimeout(function() { window.close(); }, 800);
    }
    window.addEventListener('message', receive, false);
    window.opener && window.opener.postMessage('authorizing:github', '*');
  })();
  </script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('OAuth is not configured on the server.');
    return;
  }

  const { code, state, error: providerError } = req.query;
  const cookies = parseCookies(req.headers.cookie ?? '');
  const cookieState = cookies.oauth_state;

  // Clear state cookie regardless of outcome
  const clearCookie = 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

  if (providerError) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Set-Cookie', clearCookie);
    res.end(renderScript('error', { message: String(providerError) }));
    return;
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Set-Cookie', clearCookie);
    res.status(400).end(renderScript('error', { message: 'Invalid or missing state token.' }));
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'feiste-dialoge-oauth',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Set-Cookie', clearCookie);
      res.end(
        renderScript('error', {
          message: data.error_description ?? data.error ?? 'Token exchange failed',
        })
      );
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Set-Cookie', clearCookie);
    res.end(
      renderScript('success', {
        token: data.access_token,
        provider: 'github',
      })
    );
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Set-Cookie', clearCookie);
    res.end(renderScript('error', { message: err?.message ?? 'Unknown error' }));
  }
}
