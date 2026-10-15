import { OAuth2Client } from 'google-auth-library';
import { database } from '../../server/analytics-db.js';
import { isOwner, summarize } from '../../server/analytics-model.js';
const google = new OAuth2Client();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'GET') return res.status(405).end();
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Entre com sua conta Google.' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Login Google ainda não configurado.' });
  try {
    const ticket = await google.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    if (!isOwner(ticket.getPayload())) return res.status(403).json({ error: 'Esta conta não tem acesso ao analytics.' });
  } catch { return res.status(401).json({ error: 'Seu acesso expirou. Entre novamente.' }); }
  const period = Number(req.query.period || 30);
  if (![7, 30, 90].includes(period)) return res.status(400).json({ error: 'Período inválido.' });
  const source = typeof req.query.source === 'string' ? req.query.source.slice(0,80) : '';
  try {
    const sql = database();
    const events = await sql`SELECT visitor_id, session_id, kind, path, target, source, occurred_at AS created_at FROM portfolio_events
      WHERE occurred_at >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo') - (${period - 1} * interval '1 day')
      ORDER BY occurred_at LIMIT 100001`;
    if (events.length > 100000) return res.status(422).json({ error: 'Volume alto para este período. Selecione um período menor.' });
    return res.status(200).json(summarize(events, source));
  } catch { return res.status(503).json({ error: 'Não foi possível consultar o banco. Verifique a configuração do analytics.' }); }
}
