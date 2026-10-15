export const OWNER = 'thallyssondesigner@gmail.com';
export function isOwner(payload) {
  return payload?.email_verified === true && payload.email === OWNER && Boolean(payload.sub);
}
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const kinds = new Set(['page', 'section', 'project', 'contact', 'outbound', 'heartbeat']);
export function validEvent(e) {
  return e && [e.id, e.visitor, e.session].every(v => typeof v === 'string' && uuid.test(v)) && kinds.has(e.kind)
    && typeof e.path === 'string' && /^\/(?:[a-zA-Z0-9/_-]*)$/.test(e.path) && e.path.length <= 180 && !e.path.startsWith('/analytics')
    && typeof e.target === 'string' && e.target.length <= 120 && typeof e.source === 'string' && e.source.length <= 80
    && Number.isSafeInteger(e.timestamp) && Math.abs(Date.now() - e.timestamp) <= 5 * 60000;
}
export function summarize(events, source = '', now = Date.now()) {
  const ordered = [...events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const people = new Map();
  for (const event of ordered) {
    if (!people.has(event.visitor_id)) people.set(event.visitor_id, []);
    people.get(event.visitor_id).push(event);
  }
  const sources = new Map();
  for (const journey of people.values()) sources.set(journey[0].source, (sources.get(journey[0].source) || 0) + 1);
  const selected = [...people.values()].filter(j => !source || j[0].source === source);
  const funnel = [0, 0, 0, 0], pages = new Map(), exits = new Map(), outbound = new Map(), days = new Map();
  let contacts = 0, active = 0;
  const add = (map, key, visitor) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(visitor); };
  for (const journey of selected) {
    const id = journey[0].visitor_id;
    let maximum = 0;
    const sessions = new Map();
    let contacted = false;
    for (const e of journey) {
      const stage = sessions.get(e.session_id) || 0;
      let next = stage;
      if (e.kind !== 'heartbeat') next = Math.max(next, 1);
      if (next === 1 && ((e.kind === 'section' && e.target !== 'inicio') || e.kind === 'project' || e.path.startsWith('/projects/'))) next = 2;
      if (next === 2 && (e.kind === 'project' || e.path.startsWith('/projects/'))) next = 3;
      if (next === 3 && e.kind === 'contact') next = 4;
      sessions.set(e.session_id, next);
      maximum = Math.max(maximum, next);
      if (e.kind === 'contact') contacted = true;
      if (e.kind === 'page' || e.kind === 'section') add(pages, e.path + (e.kind === 'section' ? '#' + e.target : ''), id);
      if (['outbound', 'contact', 'project'].includes(e.kind) && e.target) add(outbound, e.target, id);
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(e.created_at));
      add(days, day, id);
    }
    for (let i = 0; i < maximum; i++) funnel[i]++;
    if (contacted) contacts++;
    const last = journey.at(-1);
    if (now - new Date(last.created_at).getTime() < 30 * 60000) active++;
    else {
      const action = [...journey].reverse().find(e => e.kind !== 'heartbeat');
      if (action) add(exits, ['contact', 'outbound', 'project'].includes(action.kind) ? `${action.path} → ${action.target}` : action.path + (action.kind === 'section' ? '#' + action.target : ''), id);
    }
  }
  const rows = map => [...map].map(([label, ids]) => ({ label, count: ids.size })).sort((a, b) => b.count - a.count);
  return { total: selected.length, contacts, active, funnel, sources: [...sources].map(([label, count]) => ({ label, count })).sort((a,b) => b.count-a.count), pages: rows(pages), exits: rows(exits), outbound: rows(outbound), daily: rows(days).sort((a,b) => a.label.localeCompare(b.label)), generatedAt: new Date(now).toISOString() };
}
