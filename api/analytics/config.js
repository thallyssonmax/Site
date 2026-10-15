export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  return res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || '', configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.DATABASE_URL) });
}
