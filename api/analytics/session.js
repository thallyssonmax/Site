import { OAuth2Client } from 'google-auth-library';
import { isOwner } from '../../server/analytics-model.js';
import { clearedSessionCookie, createSession, hasSession, revokeSession, sessionCookie } from '../../server/analytics-session.js';

const google = new OAuth2Client();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie, Origin');
  if (req.method === 'GET') {
    try {
      return (await hasSession(req)) ? res.status(200).json({ authenticated: true }) : res.status(401).json({ authenticated: false });
    } catch { return res.status(503).json({ error: 'Não foi possível verificar sua sessão.' }); }
  }
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).end();
  if (req.headers.origin !== (process.env.ANALYTICS_ORIGIN || 'https://thallyssonmax.com')) return res.status(403).json({ error: 'Origem não autorizada.' });
  if (req.method === 'DELETE') {
    try {
      await revokeSession(req);
      res.setHeader('Set-Cookie', clearedSessionCookie());
      return res.status(204).end();
    } catch { return res.status(503).json({ error: 'Não foi possível encerrar sua sessão.' }); }
  }
  if (!req.headers['content-type']?.includes('application/json') || typeof req.body?.credential !== 'string' || req.body.credential.length > 4096) {
    return res.status(400).json({ error: 'Credencial inválida.' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Login Google ainda não configurado.' });
  let payload;
  try {
    const ticket = await google.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch { return res.status(401).json({ error: 'Não foi possível validar sua conta Google.' }); }
  if (!isOwner(payload)) return res.status(403).json({ error: 'Esta conta não tem acesso ao analytics.' });
  try {
    const token = await createSession(payload.sub);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({ authenticated: true });
  } catch { return res.status(503).json({ error: 'Não foi possível iniciar sua sessão.' }); }
}
