import crypto from 'node:crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getSecret() {
  return process.env.FORM_TOKEN_SECRET || process.env.OAUTH_CLIENT_SECRET || 'dev-secret-change-me';
}

export function issueToken(formName = 'contact') {
  const timestamp = Date.now();
  const payload = `${formName}:${timestamp}`;
  const hmac = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
  return `${payload}:${hmac}`;
}

export function verifyToken(token, formName = 'contact') {
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'missing' };
  }
  const parts = token.split(':');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [name, tsRaw, hmac] = parts;
  if (name !== formName) return { ok: false, reason: 'form-mismatch' };

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`${name}:${tsRaw}`)
    .digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))) {
      return { ok: false, reason: 'bad-signature' };
    }
  } catch {
    return { ok: false, reason: 'bad-signature' };
  }

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad-timestamp' };

  const age = Date.now() - ts;
  if (age < 0) return { ok: false, reason: 'future-token' };
  if (age > TOKEN_TTL_MS) return { ok: false, reason: 'expired' };
  if (age < 1500) return { ok: false, reason: 'too-fast' };

  return { ok: true, issuedAt: ts };
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const formName = typeof req.query.form === 'string' ? req.query.form : 'contact';
  const token = issueToken(formName);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ token, issuedAt: Date.now() });
}
