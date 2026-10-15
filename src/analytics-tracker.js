// Analytics never interrupts navigation and never records query strings or contact details.
const allowedHosts = ['thallyssonmax.com', 'www.thallyssonmax.com'];
if (allowedHosts.includes(location.hostname) && !location.pathname.startsWith('/analytics') && navigator.doNotTrack !== '1') {
  try { startTracking(); } catch { /* Storage disabled: do not invent a new unique visitor on every page. */ }
}

function startTracking() {
  if (localStorage.getItem('portfolio-analytics-opt-out') === '1') return;
  const now = Date.now();
  let visitor = JSON.parse(localStorage.getItem('portfolio-visitor') || 'null');
  if (!visitor || visitor.expires < now) {
    visitor = { id: crypto.randomUUID(), expires: now + 90 * 86400000 };
    localStorage.setItem('portfolio-visitor', JSON.stringify(visitor));
  }
  let session = JSON.parse(sessionStorage.getItem('portfolio-session') || 'null');
  function attribution() {
    const utm = new URLSearchParams(location.search).get('utm_source');
    if (utm) return utm.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 80) || 'Direto';
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      return allowedHosts.includes(host) ? 'Direto' : host;
    } catch { return 'Direto'; }
  }
  const page = location.pathname.replace(/\/$/, '') || '/';
  let lastTimestamp = 0;
  function send(kind, target = '') {
    if (!session || Date.now() - session.last > 30 * 60000) {
      session = { id: crypto.randomUUID(), source: attribution(), last: Date.now() };
    }
    session.last = Date.now();
    sessionStorage.setItem('portfolio-session', JSON.stringify(session));
    lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
    const body = JSON.stringify({ id: crypto.randomUUID(), visitor: visitor.id, session: session.id, kind, path: page, target, source: session.source, timestamp: lastTimestamp });
    fetch('/api/analytics/collect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
  send('page');
  const seen = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting || seen.has(target.id) || document.visibilityState !== 'visible') return;
      seen.add(target.id);
      send('section', target.id);
    });
  }, { rootMargin: '0px 0px -25% 0px', threshold: 0.1 });
  document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.hostname === 'wa.me' || url.protocol === 'mailto:') send('contact', url.protocol === 'mailto:' ? 'E-mail' : 'WhatsApp');
    else if (link.matches('.project-link') || url.pathname.startsWith('/projects/')) send('project', url.origin === location.origin ? url.pathname : url.hostname);
    else if (url.origin !== location.origin && url.protocol === 'https:') send('outbound', url.hostname);
  });
  // Keep a visible reading session active; do not mistake a long case read for an exit.
  setInterval(() => { if (document.visibilityState === 'visible') send('heartbeat'); }, 60000);
}
