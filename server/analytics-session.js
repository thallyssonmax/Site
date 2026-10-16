import { createHash, randomBytes } from 'node:crypto';
import { database } from './analytics-db.js';

export const COOKIE_NAME = '__Host-portfolio_analytics';
export const SESSION_AGE_SECONDS = 30 * 24 * 60 * 60;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function sessionToken(req) {
  const cookie = req.cookies?.[COOKIE_NAME] || req.headers?.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  return typeof cookie === 'string' && tokenPattern.test(cookie) ? cookie : '';
}

export function sessionHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Max-Age=${SESSION_AGE_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

export function clearedSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

export async function createSession(googleSub) {
  const token = randomBytes(32).toString('base64url');
  const sql = database();
  await sql`DELETE FROM portfolio_analytics_sessions WHERE expires_at <= now()`;
  await sql`INSERT INTO portfolio_analytics_sessions (token_hash, google_sub, expires_at)
    VALUES (${sessionHash(token)}, ${googleSub}, now() + (${SESSION_AGE_SECONDS} * interval '1 second'))`;
  return token;
}

export async function hasSession(req) {
  const token = sessionToken(req);
  if (!token) return false;
  const sql = database();
  const rows = await sql`SELECT 1 FROM portfolio_analytics_sessions WHERE token_hash = ${sessionHash(token)} AND expires_at > now() LIMIT 1`;
  return rows.length > 0;
}

export async function revokeSession(req) {
  const token = sessionToken(req);
  if (!token) return;
  const sql = database();
  await sql`DELETE FROM portfolio_analytics_sessions WHERE token_hash = ${sessionHash(token)}`;
}
