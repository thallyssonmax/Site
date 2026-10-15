import { database } from '../../server/analytics-db.js';
import { validEvent } from '../../server/analytics-model.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const origin = process.env.ANALYTICS_ORIGIN || 'https://thallyssonmax.com';
  if (req.headers.origin !== origin) return res.status(403).end();
  if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).end();
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).end();
  if (/bot|crawler|spider|headless/i.test(req.headers['user-agent'] || '')) return res.status(204).end();
  let e;
  try { e = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).end(); }
  if (!validEvent(e)) return res.status(400).end();
  try {
    const sql = database();
    // Bound writes per visitor; retries are idempotent through the event primary key.
    await sql`INSERT INTO portfolio_events (id, visitor_id, session_id, kind, path, target, source, occurred_at)
      SELECT ${e.id}::uuid, ${e.visitor}::uuid, ${e.session}::uuid, ${e.kind}, ${e.path}, ${e.target}, ${e.source}, ${new Date(e.timestamp).toISOString()}::timestamptz
      WHERE (SELECT count(*) FROM portfolio_events WHERE visitor_id = ${e.visitor}::uuid AND created_at > now() - interval '1 minute') < 60
      ON CONFLICT (id) DO NOTHING`;
    return res.status(204).end();
  } catch { return res.status(503).json({ error: 'Coleta indisponível' }); }
}
