// Included only by the development build. These are explicitly fictional visitors.
import { summarize } from '../server/analytics-model.js';
export function demoReport(period, source) {
  const events = [];
  const now = Date.now();
  for (let i = 0; i < period * 12; i++) {
    const origin = ['linkedin.com', 'google.com', 'Direto', 'instagram.com'][i % 4];
    const base = now - (i + 1) * 600000;
    const event = (kind, target, offset = 0) => events.push({ visitor_id: `demo-${i}`, session_id: `visit-${i}`, source: origin, path: '/', kind, target, created_at: new Date(base + offset).toISOString() });
    event('page', '');
    if (i % 5 !== 0) event('section', 'sobre', 1000);
    if (i % 3 === 0) event('project', '/projects/adminer', 2000);
    if (i % 9 === 0) event('contact', 'WhatsApp', 3000);
  }
  return summarize(events, source, now);
}
