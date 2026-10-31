'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardList, Clock3,
  FileText, LayoutDashboard, Loader2, LogOut, MapPin, Menu, Plus,
  RefreshCcw, Search, ShieldCheck, Smartphone, UserRound, Users, X,
} from 'lucide-react';
import './painel.css';

const STATUS = {
  open: { text: 'Aberta', tone: 'slate' },
  assigned: { text: 'Atribuída', tone: 'violet' },
  in_progress: { text: 'Em andamento', tone: 'blue' },
  completed: { text: 'Concluída', tone: 'green' },
  cancelled: { text: 'Cancelada', tone: 'red' },
};
const NAV = [
  { id: 'overview', text: 'Visão geral', icon: LayoutDashboard },
  { id: 'orders', text: 'Ordens de serviço', icon: ClipboardList },
  { id: 'customers', text: 'Clientes', icon: BriefcaseBusiness },
  { id: 'team', text: 'Equipe', icon: Users, manager: true },
];
const STORAGE_KEY = 'ews_field_panel_token';
const formatDate = value => value
  ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  : 'Sem data definida';
const initials = str => String(str || 'EW').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();

async function request(path, { method = 'GET', data, token } = {}) {
  const response = await fetch(`/api/panel${path}`, {
    method,
    cache: 'no-store',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(20000),
    headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),  },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if(response.status===401 && typeof window!=='undefined')window.dispatchEvent(new Event('ews-session-expired'));
    const error = new Error(payload.error || (response.status === 503 ? 'API indisponível. Confira se o backend está ligado.' : `Erro HTTP ${response.status}`));
    error.status = response.status;
    throw error;
  }
  if (Array.isArray(payload)) Object.defineProperty(payload, 'nextOffset', {value:response.headers.get('X-Next-Offset')});
  return payload;
}
function Logo({ compact = false }) {
  return <Link href="/" className="ep-logo" aria-label="EWS Field — voltar para o site">
    <span className="ep-logo-mark"><span /></span>
    {!compact && <span>EWS <strong>FIELD</strong><small>FIELD OPERATIONS</small></span>}
  </Link>;
}
function Status({ status }) {
  const item = STATUS[status] || { text: status || 'Indefinido', tone: 'slate' };
  return <span className={`ep-status ep-${item.tone}`}><span className="ep-status-dot" />{item.text}</span>;
}
function Empty({ icon: Icon = ClipboardList, title, detail, action }) {
  return <div className="ep-empty"><span className="ep-empty-icon"><Icon size={25} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
function Field({ label, children, required }) {
  return <label className="ep-field"><span>{label}{required ? ' *' : ''}</span>{children}</label>;
}
function Toast({ message, onDismiss }) {
  if (!message) return null;
  return <div className={`ep-toast ${message.type === 'error' ? 'ep-toast-error' : ''}`} role="status">
    {message.type === 'error' ? <X size={18} /> : <Check size={18} />}
    <span>{message.text}</span><button onClick={onDismiss} aria-label="Fechar aviso"><X size={15} /></button>
  </div>;
}
function Login({ onLogin, pending, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <div className="ep-login-page">
    <div className="ep-login-top"><Logo /><Link href="/" className="ep-back"><ArrowLeft size={15} /> Voltar ao site</Link></div>
    <main className="ep-login-layout">
      <div className="ep-login-card">
        <span className="ep-eyebrow ep-eyebrow-blue"><span className="ep-live-dot" /> ACESSO À PLATAFORMA</span>
        <h1>O controle da sua operação <em>começa aqui.</em></h1>
        <p className="ep-login-description">Entre para acompanhar ordens, equipes e atendimentos em uma única plataforma.</p>
        <form onSubmit={e => { e.preventDefault(); onLogin(email.trim(), password); }} className="ep-login-form">
          <Field label="E-mail corporativo" required><input type="email" autoComplete="username" placeholder="voce@suaempresa.com.br" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label="Senha" required><input type="password" autoComplete="current-password" placeholder="Digite sua senha" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></Field>
          {error && <p className="ep-form-error" role="alert">{error}</p>}
          <button type="submit" className="ep-btn ep-btn-primary ep-btn-wide" disabled={pending}>{pending ? <Loader2 className="ep-spin" size={18} /> : <>Acessar painel <ArrowRight size={17} /></>}</button>
        </form>
        <p className="ep-login-foot">Ainda não tem uma empresa cadastrada? <Link href="/comecar">Criar conta <ArrowUpRight size={13} /></Link></p>
      </div>
      <section className="ep-login-art" aria-label="Visualização de operações em campo">
        <div className="ep-map-grid" aria-hidden="true" />
        <div className="ep-art-top"><span className="ep-live"><span className="ep-live-dot" /> EWS FIELD / OPERAÇÕES</span><span>01 — 04</span></div>
        <div className="ep-map-network" aria-hidden="true">
          <svg viewBox="0 0 610 540" fill="none" preserveAspectRatio="xMidYMid meet">
            <path className="ep-path ep-path-muted" d="M-20 318C113 234 143 381 264 283S455 179 622 232"/>
            <path className="ep-path ep-path-muted" d="M60 50C183 159 166 175 310 210S489 383 575 505"/>
            <path className="ep-path ep-path-active" d="M105 414C190 330 236 376 310 288S421 116 525 166"/>
            <circle cx="105" cy="414" r="10" className="ep-node-outline"/><circle cx="105" cy="414" r="4" className="ep-node-inner"/>
            <circle cx="310" cy="288" r="15" className="ep-node-outline"/><circle cx="310" cy="288" r="5" className="ep-node-inner"/>
            <circle cx="525" cy="166" r="10" className="ep-node-outline"/><circle cx="525" cy="166" r="4" className="ep-node-inner"/>
          </svg>
        </div>
        <div className="ep-glass ep-glass-status"><span className="ep-glass-icon"><MapPin size={18}/></span><div><b>Equipe em campo</b><small>Localização vinculada à OS</small></div><CheckCircle2 size={18} color="#7ddcae" /></div>
        <div className="ep-art-copy"><span>TECNOLOGIA PARA QUEM FAZ ACONTECER</span><h2>O trabalho acontece lá fora.<br/>A gestão acontece <em>aqui.</em></h2></div>
        <div className="ep-art-bottom"><span>EWS FIELD / FIELD SERVICE MANAGEMENT</span><span>CONTROLE • EVIDÊNCIA • RESULTADO</span></div>
      </section>
    </main>
  </div>;
}

export default function PainelPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');
  const [me, setMe] = useState(null);
  const [dashboard, setDashboard] = useState({ total: 0, byStatus: [] });
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [visits, setVisits] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({});

  const sessionEpoch=useRef(0);
  const detailRequest=useRef(0);
  const manager = me?.role === 'manager';
  const filteredOrders = useMemo(() => orders.filter(o => (filter === 'all' || o.status === filter) && (!search || [o.title, o.customer_name, o.technician_name].some(v => String(v || '').toLowerCase().includes(search.toLowerCase())))), [orders, filter, search]);
  const totals = useMemo(() => {
    const counts = Object.fromEntries(Object.keys(STATUS).map(s => [s, 0]));
    for (const row of dashboard.byStatus) counts[row.status] = row.total;
    return counts;
  }, [dashboard]);

  useEffect(()=>{
    if(!modal)return;
    const previous=document.activeElement;
    const dialog=document.querySelector('.ep-modal');
    const controls=()=>Array.from(dialog?.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]')||[]);
    controls()[0]?.focus();
    const key=e=>{if(e.key==='Escape'&&!busy)setModal('');if(e.key==='Tab'){const items=controls();const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',key);return ()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[modal,busy]);
  function inform(text, type = 'success') { setToast({ text, type }); }
  function clearAuth() { sessionEpoch.current++;detailRequest.current++;setVisits([]);setReports([]);setForm({});setModal('');setDashboard({total:0,byStatus:[]});setToast(null);sessionStorage.removeItem(STORAGE_KEY); setToken(''); setMe(null); setOrders([]); setCustomers([]); setTeam([]); setSelected(null); setTab('overview'); }
  useEffect(()=>{window.addEventListener('ews-session-expired',clearAuth);return ()=>window.removeEventListener('ews-session-expired',clearAuth);},[]);
  async function loadAll(authToken, { silent = false } = {}) {
    const epoch=sessionEpoch.current;
    if (!silent) setBusy(true);
    try {
      const user = await request('/me', { token: authToken });
      const [stats, os, clients, users] = await Promise.all([
        request('/dashboard', { token: authToken }), request('/orders', { token: authToken }),
        request('/customers', { token: authToken }),
        user.role === 'manager' ? request('/users', { token: authToken }) : Promise.resolve([]),
      ]);
      if(epoch!==sessionEpoch.current)return;
      setMe(user); setDashboard(stats); setOrders(os); setCustomers(clients); setTeam(users);
    } catch (e) {
      if (e.status === 401) clearAuth();
      throw e;
    } finally { if (!silent) setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    sessionStorage.removeItem(STORAGE_KEY);
    const saved = 'cookie';
    setToken(saved);
    loadAll(saved).catch(e => { if (active && e.status !== 401) inform(e.message, 'error'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  // Executado uma vez para restaurar sessão da aba.
  }, []);

  async function onLogin(email, password) {
    setBusy(true); setLoginError('');
    try {
      const result = await request('/auth/login', { method: 'POST', data: { email, password } });
      setToken('cookie');
      await loadAll('cookie', { silent: true });
      inform('Acesso realizado com sucesso.');
    } catch (e) { setLoginError(e.message); }
    finally { setBusy(false); }
  }
  async function refresh() {
    try { await loadAll(token); inform('Dados atualizados.'); }
    catch (e) { inform(e.message, 'error'); }
  }
  async function openOrder(order) {
    const detailId=++detailRequest.current;
    setSelected(order); setVisits([]); setReports([]); setLoadingDetail(true);
    try {
      const [v, r] = await Promise.all([
        request(`/orders/${order.id}/visits`, { token }),
        request(`/orders/${order.id}/reports`, { token }),
      ]);
      if(detailId!==detailRequest.current)return;
      setVisits(v); setReports(r);
    } catch (e) { inform(e.message, 'error'); }
    finally { setLoadingDetail(false); }
  }
  async function updateStatus(id, status) {
    const reason=status==='cancelled'?window.prompt('Motivo do cancelamento (mínimo 10 caracteres; preserva todo o histórico):')?.trim():undefined;
    if(status==='cancelled' && (!reason || reason.length<10)){inform('Informe um motivo com pelo menos 10 caracteres.','error');return;}
    setBusy(true);
    try {
      await request(`/orders/${id}/status`, { method: 'PATCH', data: { status, ...(reason?{reason}:{}) }, token });
      await loadAll(token, { silent: true });
      setSelected(o => o?.id === id ? { ...o, status } : o);
      inform('Status atualizado.');
    } catch (e) { inform(e.message, 'error'); }
    finally { setBusy(false); }
  }
  async function submit(e) {
    e.preventDefault(); if (!manager || busy) return;
    setBusy(true);
    try {
      let endpoint; let data;
      if (modal === 'customer') { endpoint = '/customers'; data = { name: form.name?.trim(), phone: form.phone?.trim() || undefined, address: form.address?.trim() || undefined }; }
      else if (modal === 'team') { endpoint = '/users'; data = { name: form.name?.trim(), email: form.email?.trim(), password: form.password, role: form.role || 'technician' }; }
      else if (modal === 'order') {
        endpoint = '/orders';
        data = { title: form.title?.trim(), description: form.description?.trim() || undefined, customer_id: form.customer_id, technician_id: form.technician_id || null, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null };
      } else return;
      await request(endpoint, { method: 'POST', data, token });
      await loadAll(token, { silent: true });
      setModal(''); setForm({}); inform('Registro criado com sucesso.');
    } catch (err) { inform(err.message, 'error'); }
    finally { setBusy(false); }
  }
  async function moreList(path, current, setter) {
    setBusy(true);try {const page=await request(`${path}?offset=${current.nextOffset}`);const joined=[...current,...page];Object.defineProperty(joined,'nextOffset',{value:page.nextOffset});setter(joined);}catch(e){inform(e.message,'error');}finally{setBusy(false);}
  }
  function openModal(kind) { setForm({ role: 'technician' }); setModal(kind); }
  function navigate(next) { setTab(next); setSelected(null); setSidebarOpen(false); setSearch(''); setFilter('all'); }
  function renderOrderCard(o) { return <button className="ep-order" type="button" key={o.id} onClick={() => openOrder(o)}>
    <span className="ep-order-icon"><ClipboardList size={21}/></span><span className="ep-order-info"><strong>{o.title}</strong><small>{o.customer_name || 'Cliente não informado'} • {o.technician_name || 'Sem técnico atribuído'}</small></span><span className="ep-order-meta"><Status status={o.status}/><small>{formatDate(o.scheduled_at || o.created_at)}</small></span><ChevronRight className="ep-order-arrow" size={18}/>
  </button>; }

  if (!ready) return <div className="ep-boot"><Loader2 className="ep-spin" size={34}/><span>Carregando EWS Field...</span></div>;
  if (!me) return <><Login onLogin={onLogin} pending={busy} error={loginError}/><Toast message={toast} onDismiss={() => setToast(null)}/></>;
  return <div className="ep-app">
    {sidebarOpen && <button className="ep-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}/>}
    <aside className={`ep-sidebar ${sidebarOpen ? 'ep-sidebar-open' : ''}`}>
      <div className="ep-sidebar-top"><Logo/><button className="ep-mobile-close" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}><X size={20}/></button></div>
      <div className="ep-workspace"><span className="ep-workspace-initial">{initials(me.name)}</span><div><small>ESPAÇO DE TRABALHO</small><strong>{me.role === 'manager' ? 'Painel do gestor' : 'Painel do técnico'}</strong></div><ChevronRight size={15}/></div>
      <div className="ep-sidebar-label">MENU PRINCIPAL</div>
      <nav className="ep-side-nav" aria-label="Menu do painel">{NAV.filter(n => !n.manager || manager).map(n => { const Icon = n.icon; return <button key={n.id} className={tab === n.id ? 'ep-active' : ''} onClick={() => navigate(n.id)}><Icon size={19}/>{n.text}{tab === n.id && <span className="ep-active-indicator" />}</button>; })}</nav>
      <div className="ep-side-bottom"><div className="ep-side-tip"><span><Smartphone size={20}/></span><strong>Sua operação, onde estiver.</strong><p>O aplicativo mobile conecta a equipe em campo ao gestor.</p></div><Link href="/" className="ep-side-link"><ArrowUpRight size={17}/> Visitar site</Link><button className="ep-side-link" onClick={async () => { try { await request('/auth/logout', {method:'POST',data:{}}); clearAuth(); } catch(e) { inform(e.message,'error'); } }}><LogOut size={17}/> Sair da conta</button></div>
    </aside>
    <div className="ep-body">
      <header className="ep-topbar"><div className="ep-top-left"><button className="ep-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><span className="ep-breadcrumb">EWS FIELD</span><ChevronRight size={14} className="ep-breadcrumb-arrow"/><strong>{NAV.find(n => n.id === tab)?.text || 'Painel'}</strong></div><div className="ep-top-right"><span className="ep-top-status"><span className="ep-live-dot"/> Sistema conectado</span><button className="ep-icon-btn" title="Atualizar dados" aria-label="Atualizar dados" onClick={refresh} disabled={busy}><RefreshCcw size={18} className={busy ? 'ep-spin' : ''}/></button><span className="ep-avatar" title={me.email}>{initials(me.name)}</span></div></header>
      <main className="ep-main">
        {tab === 'overview' && <>
          <div className="ep-pagehead"><div><span className="ep-eyebrow ep-eyebrow-blue">VISÃO GERAL / OPERAÇÃO</span><h1>Olá, {me.name.split(' ')[0]}. <span>Vamos ao trabalho.</span></h1><p>Uma visão clara de tudo o que acontece na sua operação.</p></div>{manager && <button className="ep-btn ep-btn-primary" onClick={() => openModal('order')}><Plus size={17}/> Nova ordem</button>}</div>
          <section className="ep-hero"><div className="ep-hero-content"><span className="ep-hero-kicker"><Activity size={16}/> CENTRAL DE OPERAÇÕES</span><h2>Do planejamento<br/>à <em>entrega em campo.</em></h2><p>Acompanhe cada atendimento com clareza, organização e histórico.</p><button onClick={() => navigate('orders')} className="ep-btn ep-btn-light">Ver ordens de serviço <ArrowUpRight size={18}/></button></div><div className="ep-hero-art" aria-hidden="true"><span className="ep-hero-ring ep-hero-ring-one"/><span className="ep-hero-ring ep-hero-ring-two"/><span className="ep-hero-center"><MapPin size={31}/></span><span className="ep-hero-orbit ep-orbit-a"/><span className="ep-hero-orbit ep-orbit-b"/><span className="ep-hero-orbit ep-orbit-c"/></div></section>
          <div className="ep-statgrid">
            <div className="ep-stat"><span className="ep-stat-label">Total de ordens <ClipboardList size={17}/></span><strong>{dashboard.total}</strong><small>Registradas na operação</small></div>
            <div className="ep-stat"><span className="ep-stat-label">Em andamento <Clock3 size={17}/></span><strong>{totals.in_progress || 0}</strong><small>Atendimentos em execução</small></div>
            <div className="ep-stat"><span className="ep-stat-label">Concluídas <CheckCircle2 size={17}/></span><strong>{totals.completed || 0}</strong><small>Finalizadas pela equipe</small></div>
            <div className="ep-stat"><span className="ep-stat-label">{manager ? 'Técnicos cadastrados' : 'Minhas atribuições'} <Users size={17}/></span><strong>{manager ? team.filter(u => u.role === 'technician' && u.active).length : orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}</strong><small>{manager ? 'Profissionais ativos' : 'Ordens não finalizadas'}</small></div>
          </div>
          <div className="ep-main-grid"><section className="ep-panel"><div className="ep-panel-head"><div><span className="ep-eyebrow">ACOMPANHAMENTO</span><h2>Ordens recentes</h2></div><button className="ep-text-btn" onClick={() => navigate('orders')}>Ver todas <ArrowUpRight size={16}/></button></div><div className="ep-orders-list">{orders.length ? orders.slice(0, 5).map(renderOrderCard) : <Empty title="Nenhuma ordem por enquanto" detail="As ordens cadastradas vão aparecer aqui." action={manager ? <button className="ep-btn ep-btn-outline" onClick={() => openModal('order')}><Plus size={16}/> Criar primeira ordem</button> : null}/>}</div></section>
            <section className="ep-panel"><div className="ep-panel-head"><div><span className="ep-eyebrow">STATUS DAS ORDENS</span><h2>Resumo operacional</h2></div><Activity size={20}/></div><div className="ep-status-chart">{Object.entries(STATUS).map(([key, value]) => <div key={key} className="ep-chart-row"><div><span>{value.text}</span><strong>{totals[key] || 0}</strong></div><span className="ep-track"><span className={`ep-bar ep-bar-${value.tone}`} style={{ width: `${dashboard.total ? Math.round((totals[key] || 0) / dashboard.total * 100) : 0}%` }}/></span></div>)}</div><div className="ep-chart-foot"><ShieldCheck size={17}/> Informações atualizadas diretamente do sistema.</div></section></div>
        </>}
        {tab === 'orders' && <><div className="ep-pagehead"><div><span className="ep-eyebrow ep-eyebrow-blue">ATENDIMENTOS / ORDENS</span><h1>Ordens de <span>serviço.</span></h1><p>Consulte a situação e o histórico de cada atendimento.</p></div>{manager && <button className="ep-btn ep-btn-primary" onClick={() => openModal('order')}><Plus size={17}/> Nova ordem</button>}</div>
          {selected ? <section className="ep-panel ep-detail"><button className="ep-text-btn" onClick={() => setSelected(null)}><ArrowLeft size={16}/> Voltar para ordens</button><div className="ep-detail-top"><div><span className="ep-eyebrow">DETALHES DO ATENDIMENTO</span><h2>{selected.title}</h2><p>{selected.description || 'Nenhuma descrição fornecida.'}</p></div><Status status={selected.status}/></div><div className="ep-detail-grid"><div><small>CLIENTE</small><strong>{selected.customer_name}</strong></div><div><small>TÉCNICO</small><strong>{selected.technician_name || 'Não atribuído'}</strong></div><div><small>AGENDAMENTO</small><strong>{formatDate(selected.scheduled_at)}</strong></div><div><small>CRIAÇÃO</small><strong>{formatDate(selected.created_at)}</strong></div></div>{manager && ['open','assigned'].includes(selected.status) && <div className="ep-detail-action"><span>Atribuir técnico</span><select aria-label="Atribuir técnico" value={selected.technician_id || ''} disabled={busy} onChange={async e => {setBusy(true);try{const updated=await request(`/orders/${selected.id}/assignment`,{method:'PATCH',data:{technician_id:e.target.value||null}});await loadAll(token,{silent:true});setSelected({...selected,...updated,technician_name:team.find(u=>u.id===updated.technician_id)?.name});inform('Atribuição atualizada.');}catch(e){inform(e.message,'error');}finally{setBusy(false);}}}><option value="">Sem técnico</option>{team.filter(u=>u.role==='technician'&&u.active).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}<div className="ep-detail-action"><span>Atualizar status</span><select aria-label="Atualizar status da ordem" value={selected.status} disabled={busy} onChange={e => updateStatus(selected.id, e.target.value)}>{Object.entries(STATUS).filter(([key]) => key === selected.status || (!['completed','cancelled'].includes(selected.status) && (key === 'completed' || (manager && key === 'cancelled')))).map(([key, v]) => <option value={key} key={key}>{v.text}</option>)}</select></div><div className="ep-detail-history"><h3><MapPin size={19}/> Registros de campo</h3>{loadingDetail ? <p>Carregando...</p> : visits.length ? visits.map(v => <div className="ep-history-item" key={v.id}><span className="ep-history-point"/><div><strong>{v.kind === 'checkin' ? 'Chegada registrada' : 'Saída registrada'}</strong><p>{formatDate(v.created_at)} • GPS: {Number(v.latitude).toFixed(5)}, {Number(v.longitude).toFixed(5)}{v.has_photo ? ' • Com foto' : ''}</p>{v.has_photo && <a href={`/api/panel/orders/${selected.id}/visits/${v.id}/photo`} target="_blank" rel="noreferrer">Ver foto</a>}</div></div>) : <p className="ep-muted">Ainda não há registros de check-in ou check-out.</p>}<h3><FileText size={19}/> Relatórios técnicos</h3>{loadingDetail ? <p>Carregando...</p> : reports.length ? reports.map(r => <div className="ep-history-item" key={r.id}><span className="ep-history-point"/><div><strong>{formatDate(r.created_at)}</strong><p>{r.notes}</p>{(r.media_ids || []).map(id=><a key={id} style={{marginRight:12}} href={`/api/panel/orders/${selected.id}/media/${id}`} target="_blank" rel="noreferrer">Ver foto</a>)}{Array.from({length:r.legacy_photo_count || 0},(_,i)=><a key={i} style={{marginRight:12}} href={`/api/panel/orders/${selected.id}/reports/${r.id}/photos/${i}`} target="_blank" rel="noreferrer">Ver foto antiga {i+1}</a>)}{Array.isArray(r.checklist) && r.checklist.length > 0 && <small>{r.checklist.filter(c => c.done).length}/{r.checklist.length} itens concluídos</small>}</div></div>) : <p className="ep-muted">Nenhum relatório enviado para esta ordem.</p>}</div></section> : <section className="ep-panel ep-list-panel"><div className="ep-filters"><div className="ep-search"><Search size={18}/><input placeholder="Buscar por ordem, cliente ou técnico" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar ordens"/></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filtrar por status"><option value="all">Todos os status</option>{Object.entries(STATUS).map(([key, value]) => <option key={key} value={key}>{value.text}</option>)}</select></div><div className="ep-orders-list">{filteredOrders.length ? filteredOrders.map(renderOrderCard) : <Empty title="Nenhuma ordem encontrada" detail={orders.length ? 'Altere os filtros para encontrar outros atendimentos.' : 'Comece cadastrando uma ordem de serviço.'} action={manager && !orders.length ? <button className="ep-btn ep-btn-outline" onClick={() => openModal('order')}><Plus size={16}/> Criar ordem</button> : null}/>}</div></section>}</>}
        {tab === 'customers' && <><div className="ep-pagehead"><div><span className="ep-eyebrow ep-eyebrow-blue">RELACIONAMENTO / CLIENTES</span><h1>Seus <span>clientes.</span></h1><p>Informações organizadas para cada atendimento.</p></div>{manager && <button className="ep-btn ep-btn-primary" onClick={() => openModal('customer')}><Plus size={17}/> Novo cliente</button>}</div><section className="ep-panel"><div className="ep-panel-head"><h2>Clientes cadastrados <span className="ep-count">{customers.length}</span></h2></div>{customers.length ? <div className="ep-table-wrap"><table className="ep-table"><thead><tr><th>CLIENTE</th><th>CONTATO</th><th>ENDEREÇO</th><th>CADASTRO</th></tr></thead><tbody>{customers.map(c => <tr key={c.id}><td><span className="ep-identity"><span className="ep-monogram">{initials(c.name)}</span><strong>{c.name}</strong></span></td><td>{c.phone || '—'}</td><td>{c.address || '—'}</td><td>{formatDate(c.created_at)}</td></tr>)}</tbody></table></div> : <Empty icon={BriefcaseBusiness} title="Nenhum cliente cadastrado" detail="Cadastre seus clientes para começar a criar atendimentos." action={manager && <button className="ep-btn ep-btn-outline" onClick={() => openModal('customer')}><Plus size={16}/> Cadastrar cliente</button>}/>}</section></>}
        {tab === 'team' && manager && <><div className="ep-pagehead"><div><span className="ep-eyebrow ep-eyebrow-blue">GESTÃO / PESSOAS</span><h1>Quem faz <span>acontecer.</span></h1><p>Gerencie os acessos de gestores e técnicos da empresa.</p></div><button className="ep-btn ep-btn-primary" onClick={() => openModal('team')}><Plus size={17}/> Novo colaborador</button></div><section className="ep-panel"><div className="ep-panel-head"><h2>Equipe cadastrada <span className="ep-count">{team.length}</span></h2></div>{team.length ? <div className="ep-table-wrap"><table className="ep-table"><thead><tr><th>PROFISSIONAL</th><th>E-MAIL</th><th>FUNÇÃO</th><th>ACESSO</th></tr></thead><tbody>{team.map(u => <tr key={u.id}><td><span className="ep-identity"><span className="ep-monogram">{initials(u.name)}</span><strong>{u.name}</strong></span></td><td>{u.email}</td><td>{u.role === 'manager' ? 'Gestor' : 'Técnico'}</td><td><span className={`ep-status ${u.active ? 'ep-green' : 'ep-red'}`}><span className="ep-status-dot"/>{u.active ? 'Ativo' : 'Inativo'}</span>{u.id!==me.id && <button className="ep-text-btn" disabled={busy} onClick={async()=>{setBusy(true);try{await request(`/users/${u.id}/active`,{method:'PATCH',data:{active:!u.active}});await loadAll(token,{silent:true});}catch(e){inform(e.message,'error');}finally{setBusy(false);}}}>{u.active?'Desativar':'Ativar'}</button>}</td></tr>)}</tbody></table></div> : <Empty icon={Users} title="Nenhum colaborador encontrado" detail="Cadastre a equipe para distribuir as ordens de serviço."/>}</section></>}
        {selected && visits.nextOffset && <button className="ep-btn ep-btn-outline" disabled={busy} onClick={()=>moreList(`/orders/${selected.id}/visits`,visits,setVisits)}>Carregar mais visitas</button>}
        {selected && reports.nextOffset && <button className="ep-btn ep-btn-outline" disabled={busy} onClick={()=>moreList(`/orders/${selected.id}/reports`,reports,setReports)}>Carregar mais relatórios</button>}
        {tab==='orders' && !selected && orders.nextOffset && <button className="ep-btn ep-btn-outline" disabled={busy} onClick={()=>moreList('/orders',orders,setOrders)}>Carregar mais ordens</button>}
        {tab==='customers' && customers.nextOffset && <button className="ep-btn ep-btn-outline" disabled={busy} onClick={()=>moreList('/customers',customers,setCustomers)}>Carregar mais clientes</button>}
        {tab==='team' && team.nextOffset && <button className="ep-btn ep-btn-outline" disabled={busy} onClick={()=>moreList('/users',team,setTeam)}>Carregar mais colaboradores</button>}
      </main>
      <footer className="ep-footer"><span>© {new Date().getFullYear()} EWS FIELD — FIELD OPERATIONS</span><span>Plataforma de gestão em campo</span></footer>
    </div>
    {modal && <div className="ep-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(''); }}><section className="ep-modal" role="dialog" aria-modal="true" aria-labelledby="ep-modal-title"><div className="ep-modal-head"><div><span className="ep-eyebrow ep-eyebrow-blue">NOVO REGISTRO</span><h2 id="ep-modal-title">{modal === 'customer' ? 'Cadastrar cliente' : modal === 'team' ? 'Adicionar colaborador' : 'Criar ordem de serviço'}</h2></div><button aria-label="Fechar formulário" onClick={() => setModal('')} disabled={busy}><X size={20}/></button></div><form onSubmit={submit} className="ep-modal-form">
      {modal === 'customer' && <><Field label="Nome do cliente" required><input minLength={2} maxLength={150} required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}/></Field><Field label="Telefone"><input maxLength={40} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })}/></Field><Field label="Endereço"><input maxLength={220} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })}/></Field></>}
      {modal === 'team' && <><Field label="Nome" required><input required minLength={2} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}/></Field><Field label="E-mail" required><input required type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}/></Field><Field label="Senha inicial (mínimo 12 caracteres)" required><input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}/></Field><Field label="Permissão"><select value={form.role || 'technician'} onChange={e => setForm({ ...form, role: e.target.value })}><option value="technician">Técnico</option><option value="manager">Gestor</option></select></Field></>}
      {modal === 'order' && <><Field label="Título da ordem" required><input required minLength={3} maxLength={150} placeholder="Ex: Manutenção preventiva" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}/></Field><Field label="Descrição"><textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/></Field><Field label="Cliente" required><select required value={form.customer_id || ''} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">Selecione um cliente</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Técnico responsável"><select value={form.technician_id || ''} onChange={e => setForm({ ...form, technician_id: e.target.value })}><option value="">Atribuir depois</option>{team.filter(u => u.role === 'technician' && u.active).map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field><Field label="Agendamento (opcional)"><input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm({ ...form, scheduled_at: e.target.value })}/></Field>{customers.length === 0 && <p className="ep-form-error">Cadastre um cliente antes de criar uma ordem.</p>}</>}
      {modal==='order' && customers.nextOffset && <button type="button" className="ep-text-btn" disabled={busy} onClick={()=>moreList('/customers',customers,setCustomers)}>Carregar mais clientes</button>}
      {modal==='order' && team.nextOffset && <button type="button" className="ep-text-btn" disabled={busy} onClick={()=>moreList('/users',team,setTeam)}>Carregar mais técnicos</button>}
      <div className="ep-modal-actions"><button type="button" className="ep-btn ep-btn-outline" disabled={busy} onClick={() => setModal('')}>Cancelar</button><button className="ep-btn ep-btn-primary" type="submit" disabled={busy || (modal === 'order' && customers.length === 0)}>{busy ? <Loader2 size={17} className="ep-spin"/> : <Plus size={17}/>} Salvar</button></div>
    </form></section></div>}
    <Toast message={toast} onDismiss={() => setToast(null)}/>
  </div>;
}
