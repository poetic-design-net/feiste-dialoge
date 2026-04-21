function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function yamlEscape(value) {
  return String(value ?? '').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'anfrage';
}

async function sendEmail({ apiKey, from, to, subject, text, html, replyTo }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text, html }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

async function storeSubmission({ token, repo, branch, path, content, commitMessage }) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'feiste-dialoge-contact',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub store failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? 'Feiste Dialoge <onboarding@resend.dev>';
  const ghToken = process.env.GITHUB_SUBMISSIONS_TOKEN;
  const ghRepo = process.env.GITHUB_SUBMISSIONS_REPO ?? 'poetic-design-net/feiste-dialoge';
  const ghBranch = process.env.GITHUB_SUBMISSIONS_BRANCH ?? 'main';

  const emailConfigured = resendKey && toEmail;
  const storeConfigured = !!ghToken;

  if (!emailConfigured && !storeConfigured) {
    return res.status(500).json({
      error:
        'Kontakt-Endpoint nicht konfiguriert. Setze RESEND_API_KEY + CONTACT_TO_EMAIL (E-Mail) oder GITHUB_SUBMISSIONS_TOKEN (Backend-Speicher) auf Vercel.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  const {
    name = '',
    email = '',
    topic = 'Anfrage',
    message = '',
    privacy,
    'bot-field': botField,
  } = body;

  if (botField) return res.status(200).json({ ok: true });

  if (!name.trim() || !email.trim() || !message.trim() || !privacy) {
    return res.status(400).json({
      error: 'Bitte alle Felder ausfüllen und die Datenschutzerklärung bestätigen.',
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Bitte gültige E-Mail-Adresse angeben.' });
  }

  const errors = [];
  const results = { email: false, stored: false };

  // 1) Email (optional)
  if (emailConfigured) {
    try {
      const subject = `[Feiste Dialoge] ${topic} — ${name}`;
      const text = `Von: ${name} <${email}>\nThema: ${topic}\n\n${message}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1b1c17; max-width: 560px; margin: 0 auto;">
          <h2 style="font-family: 'Courier Prime', monospace; color: #536529; border-bottom: 1px solid #c6c8b8; padding-bottom: 8px;">Neue Anfrage</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Thema:</strong> ${escapeHtml(topic)}</p>
          <hr style="border: 0; border-top: 1px solid #e4e3da; margin: 24px 0;" />
          <p style="white-space: pre-line; line-height: 1.6;">${escapeHtml(message)}</p>
        </div>`;
      await sendEmail({
        apiKey: resendKey,
        from: fromEmail,
        to: toEmail,
        subject,
        text,
        html,
        replyTo: email,
      });
      results.email = true;
    } catch (err) {
      errors.push({ step: 'email', message: err?.message ?? 'Unknown email error' });
    }
  }

  // 2) GitHub backend store (optional)
  if (storeConfigured) {
    try {
      const now = new Date();
      const iso = now.toISOString();
      const fileTimestamp = iso.replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${fileTimestamp}-${slugify(name)}.md`;
      const path = `src/content/submissions/${filename}`;

      const frontmatter = `---
name: "${yamlEscape(name)}"
email: "${yamlEscape(email)}"
topic: "${yamlEscape(topic)}"
date: ${iso}
userAgent: "${yamlEscape(req.headers['user-agent'] ?? '')}"
---

${message.trim()}
`;

      await storeSubmission({
        token: ghToken,
        repo: ghRepo,
        branch: ghBranch,
        path,
        content: frontmatter,
        commitMessage: `Contact: ${topic} — ${name}`,
      });
      results.stored = true;
    } catch (err) {
      errors.push({ step: 'store', message: err?.message ?? 'Unknown store error' });
    }
  }

  // Success if at least one path worked
  if (results.email || results.stored) {
    return res.status(200).json({ ok: true, results, errors });
  }

  return res.status(502).json({
    error: 'Versand und Speicherung fehlgeschlagen.',
    errors,
  });
}
