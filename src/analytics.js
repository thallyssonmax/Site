import './analytics.css';
const $ = id => document.getElementById(id);
const number = value => new Intl.NumberFormat('pt-BR').format(value);
const percent = (value, total) => total ? `${(value / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';
let token = '', demo = false, generation = 0;
const labels = { '/': 'Página inicial', '/#inicio': 'Início', '/#sobre': 'Sobre mim', '/#projetos': 'Projetos', '/#servicos': 'Serviços', '/#processo': 'Processo', '/#depoimentos': 'Depoimentos', '/#contato': 'Contato', '/projects/adminer': 'Case Adminer' };
$('year').textContent = new Date().getFullYear();
function table(id, rows, total) {
  const target = $(id); target.replaceChildren();
  if (!rows.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'Nenhum dado registrado neste período.'; target.append(empty); return; }
  for (const item of rows) {
    const row = document.createElement('div'); row.className = 'data-row';
    const label = document.createElement('span'); label.className = 'data-label'; label.textContent = labels[item.label] || item.label;
    const count = document.createElement('strong'); count.textContent = number(item.count); count.setAttribute('aria-label', `${item.count} usuários únicos`);
    const share = document.createElement('small'); share.textContent = percent(item.count, total);
    row.append(label, count, share); target.append(row);
  }
}
function render(data) {
  $('total').textContent = number(data.total); $('project-total').textContent = number(data.funnel[2]);
  $('contact-total').textContent = number(data.contacts); $('conversion').textContent = percent(data.funnel[3], data.funnel[0]);
  const stages = ['Entraram no site', 'Exploraram o conteúdo', 'Acessaram um projeto', 'Clicaram em contato'];
  $('funnel').replaceChildren();
  data.funnel.forEach((count, i) => {
    const row = document.createElement('div'); row.className = 'funnel-row';
    const title = document.createElement('div');
    const name = document.createElement('span'); name.className = 'stage-title'; name.textContent = `0${i + 1}  ${stages[i]}`;
    const sub = document.createElement('span'); sub.className = 'stage-subtitle'; sub.textContent = i ? `${number(data.funnel[i-1] - count)} não avançaram · ${percent(count, data.funnel[i-1])} de retenção` : 'Base: usuários únicos no período'; title.append(name, sub);
    const track = document.createElement('div'); track.className = 'bar-track'; track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div'); fill.className = 'bar-fill'; fill.style.width = `${data.funnel[0] ? count / data.funnel[0] * 100 : 0}%`; track.append(fill);
    const metric = document.createElement('div'); metric.className = 'stage-number';
    const value = document.createElement('strong'); value.textContent = number(count);
    const share = document.createElement('small'); share.textContent = `${percent(count, data.funnel[0])} do total`; metric.append(value, share);
    row.append(title, track, metric); $('funnel').append(row);
  });
  const selected = $('source').value;
  $('source').replaceChildren(new Option('Todas as origens', ''));
  for (const source of data.sources) $('source').add(new Option(source.label, source.label));
  $('source').value = selected;
  table('sources', data.sources, data.sources.reduce((sum, item) => sum + item.count, 0));
  for (const id of ['pages', 'exits', 'outbound']) table(id, data[id], data.total);
  $('active-note').textContent = `${number(data.active)} usuários com atividade nos últimos 30 minutos, ainda sem saída inferida.`;
  $('updated').textContent = `Atualizado às ${new Date(data.generatedAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`;
}
async function loadReport() {
  const current = ++generation;
  $('report-status').textContent = 'Carregando dados…'; $('report-content').hidden = true; $('refresh').disabled = true;
  try {
    let data;
    if (demo && import.meta.env.DEV) {
      const { demoReport } = await import('./analytics-demo.js');
      data = demoReport(Number($('period').value), $('source').value);
    } else {
      const response = await fetch(`/api/analytics/report?period=${$('period').value}&source=${encodeURIComponent($('source').value)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) logout(data.error);
        throw new Error(data.error || 'Não foi possível carregar os dados.');
      }
    }
    if (current !== generation) return;
    render(data); $('report-status').textContent = data.total ? '' : 'Ainda não há visitas registradas para este período e origem.';
    $('report-content').hidden = false;
  } catch (error) { if (current === generation) $('report-status').textContent = error.message; }
  finally { if (current === generation) $('refresh').disabled = false; }
}
function showDashboard() { $('login').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false; $('demo-notice').hidden = !demo; loadReport(); }
function logout(message = 'Acesso encerrado. Entre novamente para continuar.') {
  generation++; token = ''; demo = false; $('dashboard').hidden = true; $('login').hidden = false; $('logout').hidden = true;
  $('report-content').hidden = true; $('login-status').textContent = message; window.google?.accounts.id.disableAutoSelect();
}
$('logout').addEventListener('click', () => logout());
$('refresh').addEventListener('click', loadReport);
$('period').addEventListener('change', () => { $('source').value = ''; loadReport(); });
$('source').addEventListener('change', loadReport);
document.querySelectorAll('.analytics-tabs a').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.analytics-tabs a').forEach(item => item.classList.toggle('active', item === link));
}));
if (import.meta.env.DEV) { $('demo').hidden = false; $('demo').addEventListener('click', () => { demo = true; showDashboard(); }); }
async function initialize() {
  try {
    const response = await fetch('/api/analytics/config');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('O acesso estará disponível após a configuração do login Google e do banco de dados.');
    const config = await response.json();
    if (!config.clientId || !config.configured) throw new Error('O acesso estará disponível após a configuração do login Google e do banco de dados.');
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = () => reject(new Error('Não foi possível carregar o Google. Recarregue a página para tentar novamente.')); document.head.append(script); });
    google.accounts.id.initialize({ client_id: config.clientId, auto_select: false, callback: async result => { token = result.credential; demo = false; showDashboard(); } });
    google.accounts.id.renderButton($('google-signin'), { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'pt-BR' });
    $('login-status').textContent = 'Acesso restrito à conta Google autorizada.';
  } catch (error) { $('login-status').textContent = error.message; }
}
initialize();
