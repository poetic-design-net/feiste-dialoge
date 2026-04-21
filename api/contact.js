function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? 'Feiste Dialoge <onboarding@resend.dev>';

  if (!apiKey || !to) {
    return res.status(500).json({
      error: 'Kontakt-Endpoint nicht konfiguriert (RESEND_API_KEY, CONTACT_TO_EMAIL fehlen).',
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

  // Honeypot
  if (botField) {
    return res.status(200).json({ ok: true });
  }

  if (!name.trim() || !email.trim() || !message.trim() || !privacy) {
    return res.status(400).json({ error: 'Bitte alle Felder ausfüllen und die Datenschutzerklärung bestätigen.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Bitte gültige E-Mail-Adresse angeben.' });
  }

  const subject = `[Feiste Dialoge] ${topic} — ${name}`;
  const text = `Von: ${name} <${email}>
Thema: ${topic}

${message}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1b1c17; max-width: 560px; margin: 0 auto;">
      <h2 style="font-family: 'Courier Prime', monospace; color: #536529; border-bottom: 1px solid #c6c8b8; padding-bottom: 8px;">Neue Anfrage</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Thema:</strong> ${escapeHtml(topic)}</p>
      <hr style="border: 0; border-top: 1px solid #e4e3da; margin: 24px 0;" />
      <p style="white-space: pre-line; line-height: 1.6;">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(502).json({
        error: `E-Mail-Versand fehlgeschlagen (${response.status}).`,
        detail: errorBody.slice(0, 300),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Unbekannter Fehler beim Versand.' });
  }
}
