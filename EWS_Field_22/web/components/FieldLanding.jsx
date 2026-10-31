'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { n: '01', eyebrow: 'PLANEJAMENTO', title: 'Tudo começa com uma ordem clara.', text: 'Cadastre o cliente, descreva o atendimento e atribua o técnico responsável sem perder informações pelo caminho.', tag: 'OS CRIADA', location: 'Escritório', short: 'Planejar' },
  { n: '02', eyebrow: 'CAMPO', title: 'O técnico sabe exatamente o que fazer.', text: 'A ordem chega ao aplicativo. A equipe pode registrar a chegada e a saída com localização GPS e evidência fotográfica.', tag: 'CHECK-IN REGISTRADO', location: 'Em campo', short: 'Executar' },
  { n: '03', eyebrow: 'REGISTRO', title: 'A execução deixa evidências.', text: 'Fotos, observações e checklist são associados à ordem de serviço. O histórico deixa de depender da memória de cada pessoa.', tag: 'RELATÓRIO ANEXADO', location: 'Atendimento', short: 'Documentar' },
  { n: '04', eyebrow: 'ACOMPANHAMENTO', title: 'A gestão enxerga o que aconteceu.', text: 'O painel reúne ordens, responsáveis e status para que o escritório acompanhe o andamento do trabalho.', tag: 'OS CONCLUÍDA', location: 'Gestão', short: 'Acompanhar' },
];
const FEATURES = [
  { num: '01', icon: 'clipboard', name: 'Ordens de serviço', desc: 'Do chamado à conclusão, cada atendimento com responsável e status definidos.' },
  { num: '02', icon: 'pin', name: 'Presença com GPS', desc: 'Check-in e check-out com localização e fotografia, mediante autorização.' },
  { num: '03', icon: 'camera', name: 'Relatórios de campo', desc: 'Fotos, observações e checklists associados ao atendimento.' },
  { num: '04', icon: 'users', name: 'Gestão de equipes', desc: 'Cadastre técnicos, organize clientes e distribua as demandas.' },
];
const FAQ = [
  ['O EWS Field funciona pelo navegador e pelo celular?', 'Sim. A gestão pode acessar o painel web e os técnicos podem utilizar o aplicativo mobile para consultar ordens e registrar atendimentos.'],
  ['É possível registrar GPS e fotos durante o atendimento?', 'Sim. O registro de chegada e saída pode incluir localização GPS e foto, desde que o dispositivo conceda as permissões necessárias.'],
  ['A plataforma oferece cobrança recorrente automática?', 'Ainda não. Os recursos de pagamento e assinatura automatizada não fazem parte da versão operacional atual. As condições comerciais são combinadas diretamente com a EWS Tech.'],
  ['Quais tipos de empresa podem usar?', 'Equipes de manutenção, instalações, assistência técnica, operação industrial e outros negócios que executem serviços fora do escritório.'],
  ['Posso cadastrar minha equipe?', 'Sim. O gestor pode cadastrar colaboradores, clientes e atribuir ordens a técnicos da mesma empresa.'],
];

function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', className, 'aria-hidden': true };
  const paths = {
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    arrowUp: <><path d="M5 19 19 5M7 5h12v12"/></>,
    menu: <><path d="M3 7h18M3 12h18M3 17h18"/></>,
    x: <><path d="M5 5 19 19M19 5 5 19"/></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clipboard: <><rect x="5" y="5" width="14" height="17" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/></>,
    camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="3"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></>,
    shield: <><path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
    play: <><path d="m8 5 11 7-11 7V5Z"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/></>,
  };
  return <svg {...common}>{paths[name] || paths.arrow}</svg>;
}

export function Brand({ light = false }) {
  return <Link className={`fd-brand ${light ? 'fd-brand-light' : ''}`} href="/" aria-label="EWS Field — página inicial">
    <span className="fd-brand-symbol"><span /></span>
    <span className="fd-brand-text">EWS<span>FIELD</span><small>FIELD OPERATIONS</small></span>
  </Link>;
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 32);
    handle(); window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const esc = e => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);
  return <header className={`fd-header ${scrolled ? 'is-scrolled' : ''} ${menu ? 'is-open' : ''}`}>
    <div className="fd-container fd-nav-inner">
      <Brand light />
      <nav className={`fd-navigation ${menu ? 'is-open' : ''}`} aria-label="Navegação principal">
        <a href="/#plataforma" onClick={() => setMenu(false)}>A plataforma</a>
        <a href="/#fluxo" onClick={() => setMenu(false)}>Como funciona</a>
        <a href="/#solucoes" onClick={() => setMenu(false)}>Recursos</a>
        <a href="/#perguntas" onClick={() => setMenu(false)}>Perguntas</a>
        <div className="fd-mobile-only"><Link href="/painel">Entrar</Link><a href="/#contato" onClick={() => setMenu(false)}>Solicitar demonstração</a></div>
      </nav>
      <div className="fd-nav-actions"><Link href="/painel" className="fd-nav-login">Entrar <Icon name="arrowUp" size={13}/></Link><a href="/#contato" className="fd-nav-cta">Falar com especialista <Icon name="arrowUp" size={16}/></a></div>
      <button type="button" className="fd-menu-button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(v => !v)}><Icon name={menu ? 'x' : 'menu'} size={23}/></button>
    </div>
  </header>;
}

function RouteMap({ compact = false }) {
  return <div className={`fd-map ${compact ? 'fd-map-compact' : ''}`} aria-label="Ilustração conceitual de uma rota entre equipe e atendimento">
    <div className="fd-map-hairlines" aria-hidden="true" />
    <svg viewBox="0 0 720 560" preserveAspectRatio="xMidYMid meet" className="fd-map-svg" role="img" aria-label="Trajeto ilustrado de uma equipe em campo entre três locais">
      <g fill="none" stroke="#ffffff" strokeOpacity=".045" strokeWidth="1">
        <path d="M0 96H720M0 192H720M0 288H720M0 384H720M0 480H720"/>
        <path d="M96 0V560M192 0V560M288 0V560M384 0V560M480 0V560M576 0V560M672 0V560"/>
        <path d="M30 545 430 20M160 560 560 0M310 560 700 50" strokeOpacity=".025" strokeWidth="38"/>
        <path d="M25 190 190 150 325 240 490 130 720 180M0 420 190 320 400 355 555 260 720 290" strokeOpacity=".11" strokeWidth="2"/>
      </g>
      <circle cx="390" cy="274" r="190" fill="none" stroke="#448cff" strokeOpacity=".10" strokeDasharray="4 11"/>
      <circle cx="390" cy="274" r="135" fill="none" stroke="#448cff" strokeOpacity=".15" strokeDasharray="1 8"/>
      <path d="M121 355 C210 362 235 295 309 299 S395 212 455 221 S560 184 621 121" className="fd-route-under"/>
      <path d="M121 355 C210 362 235 295 309 299 S395 212 455 221 S560 184 621 121" className="fd-route-moving"/>
      <g className="fd-map-point fd-map-point-one"><circle cx="121" cy="355" r="25" className="fd-node-orbit"/><circle cx="121" cy="355" r="8" fill="#397aff" stroke="#a2c3ff" strokeWidth="3"/><circle cx="121" cy="355" r="3" fill="white"/></g>
      <g className="fd-map-point fd-map-point-two"><circle cx="309" cy="299" r="30" className="fd-node-orbit"/><circle cx="309" cy="299" r="10" fill="#397aff" stroke="#a2c3ff" strokeWidth="3"/><circle cx="309" cy="299" r="3" fill="white"/></g>
      <g className="fd-map-point fd-map-point-three"><circle cx="455" cy="221" r="32" className="fd-node-orbit"/><circle cx="455" cy="221" r="12" fill="#4de6c3" stroke="#d2fff5" strokeWidth="3"/><path d="m450 221 3.6 3.8 7-8" fill="none" stroke="#05291e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
      <g className="fd-map-point fd-map-point-four"><circle cx="621" cy="121" r="28" className="fd-node-orbit"/><circle cx="621" cy="121" r="8" fill="#397aff" stroke="#a2c3ff" strokeWidth="3"/><circle cx="621" cy="121" r="3" fill="white"/></g>
      <g fontFamily="Arial, sans-serif" fontSize="10" letterSpacing="2" fill="#80a1c6"><text x="76" y="402">BASE / 01</text><text x="275" y="344">EQUIPE / 02</text><text x="423" y="270">CHECK-IN / 03</text><text x="588" y="81">OS / 04</text></g>
      <g fill="none" stroke="#3679ee" opacity=".38"><path d="M32 30h28M32 30v28M688 30h-28M688 30v28M32 527h28M32 527v-28M688 527h-28M688 527v-28"/></g>
    </svg>
    <div className="fd-map-radar" aria-hidden="true"/>
    <div className="fd-map-status"><span className="fd-online"/> SINAL DE OPERAÇÃO <b>ATIVO</b></div>
    <div className="fd-map-coordinate">22° 04' S <span>/</span> 51° 22' W</div>
    <div className="fd-map-checkin"><span className="fd-checkin-icon"><Icon name="check" size={18}/></span><div><small>ETAPA 03 / CONCLUÍDA</small><strong>Check-in registrado</strong><span>GPS + evidência fotográfica</span></div></div>
    <div className="fd-map-order"><span className="fd-small-label">ORDEM DE SERVIÇO</span><div><strong>#OS-0248</strong><span className="fd-status-pill">EM EXECUÇÃO</span></div><small>Prévia ilustrativa</small></div>
    <div className="fd-map-foot">ROTEAMENTO VISUAL <span>•</span> EXEMPLO CONCEITUAL</div>
  </div>;
}

function OperationalPreview({ active }) {
  const item = STEPS[active];
  return <div className="fd-preview" aria-label={`Prévia conceitual da etapa ${item.short}`}>
    <div className="fd-preview-top"><div><span className="fd-preview-dot"/> EWS / FIELD OPS</div><span>INTERFACE ILUSTRATIVA — NÃO É UM DADO REAL</span></div>
    <div className="fd-preview-layout">
      <aside className="fd-preview-rail"><span>EF</span>{STEPS.map((s, i) => <span className={active === i ? 'active' : ''} key={i}>{String(i+1).padStart(2,'0')}</span>)}</aside>
      <div className="fd-preview-main">
        <div className="fd-preview-meta"><span>OPERAÇÃO / VISÃO GERAL</span><span>ETAPA {item.n} / 04</span></div>
        <div className="fd-preview-heading"><h3>{item.short}<span>.</span></h3><span className="fd-preview-live"><i/> FLUXO CONECTADO</span></div>
        <div className="fd-preview-content">
          <div className="fd-preview-info"><span className="fd-preview-micro">ORDEM DE SERVIÇO / EXEMPLO</span><strong>Manutenção preventiva</strong><span>Atendimento técnico programado</span><div className="fd-preview-divider"/><div><span>RESPONSÁVEL</span><b>Equipe técnica</b></div><div><span>LOCAL</span><b>{item.location}</b></div><div><span>STATUS</span><b className="fd-preview-status"><i/>{item.tag}</b></div></div>
          <div className="fd-preview-geo"><div className="fd-preview-geo-lines"/><svg viewBox="0 0 330 250" role="img" aria-label="Rota conceitual do atendimento"><g stroke="#ffffff" strokeOpacity=".07"><path d="M0 50H330M0 100H330M0 150H330M0 200H330M55 0V250M110 0V250M165 0V250M220 0V250M275 0V250"/></g><path d="M50 183C95 150 114 199 165 120S245 145 285 55" fill="none" stroke="#2355da" strokeWidth="2" strokeDasharray="5 9" className="fd-preview-route"/><circle cx="50" cy="183" r="7" fill="#206bf5"/><circle cx="165" cy="120" r="9" fill="#206bf5" stroke="#a8c9ff" strokeWidth="3"/><circle cx="285" cy="55" r="10" fill={active >= 2 ? '#4de4c2' : '#206bf5'} stroke="#e6efff" strokeWidth="3"/></svg><span>CAMPO / TRAJETO CONCEITUAL</span></div>
        </div>
        <div className="fd-preview-track">{STEPS.map((s, i) => <div className={i <= active ? 'passed' : ''} key={s.n}><span>{i < active ? '✓' : s.n}</span><small>{s.short}</small></div>)}</div>
      </div>
    </div>
  </div>;
}

function RevealSetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    document.querySelector('.fd-root')?.classList.add('fd-js-ready');
    const sections = document.querySelectorAll('.fd-reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .09, rootMargin: '0px 0px -30px 0px' });
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return null;
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(100, window.scrollY / max * 100) : 0);
      });
    };
    update(); window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div className="fd-progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true" />;
}

function LeadForm() {
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>setHydrated(true),[]);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', teamSize: '1–5 técnicos', message: '', consent: false, website: '' });
  const [state, setState] = useState({ status: 'idle', message: '' });
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    if (state.status === 'sending') return;
    setState({ status: 'sending', message: '' });
    try {
      const result = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const response = await result.json().catch(() => ({}));
      if (!result.ok) throw Error(response.error || 'Não foi possível enviar. Tente novamente.');
      setState({ status: 'success', message: 'Solicitação recebida. Os dados foram encaminhados para nosso atendimento comercial.' });
      setForm({ name: '', company: '', email: '', phone: '', teamSize: '1–5 técnicos', message: '', consent: false, website: '' });
    } catch (error) {
      setState({ status: 'error', message: error.message || 'Falha ao enviar sua mensagem.' });
    }
  }
  return <form className="fd-form" onSubmit={submit}>
    <div className="fd-form-index"><span>CONTATO COMERCIAL</span><span>01 / 01</span></div>
    <h3>Vamos falar da<br/><em>sua operação?</em></h3>
    <p>Preencha os dados. A conversa começa pelo que sua equipe precisa resolver.</p>
    <div className="fd-form-grid">
      <label>Seu nome <input disabled={!hydrated} type="text" placeholder="Como podemos chamar você?" required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></label>
      <label>Empresa <input disabled={!hydrated} type="text" placeholder="Nome da empresa" required minLength={2} maxLength={150} autoComplete="organization" value={form.company} onChange={e => update('company', e.target.value)} /></label>
      <label>E-mail corporativo <input disabled={!hydrated} type="email" placeholder="voce@empresa.com.br" required maxLength={180} autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
      <label>Telefone / WhatsApp <input disabled={!hydrated} type="tel" placeholder="(00) 00000-0000" maxLength={30} autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
    </div>
    <label>Tamanho da equipe <select disabled={!hydrated} value={form.teamSize} onChange={e => update('teamSize', e.target.value)}><option>1–5 técnicos</option><option>6–15 técnicos</option><option>16–50 técnicos</option><option>Mais de 50 técnicos</option></select></label>
    <label>O que você quer organizar primeiro? <textarea disabled={!hydrated} rows={3} placeholder="Conte um pouco sobre sua operação (opcional)" maxLength={1500} value={form.message} onChange={e => update('message', e.target.value)} /></label>
    <div className="fd-honeypot" aria-hidden="true"><label>Website <input disabled={!hydrated} tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update('website', e.target.value)}/></label></div>
    <label className="fd-consent"><input disabled={!hydrated} type="checkbox" required checked={form.consent} onChange={e => update('consent', e.target.checked)}/><span>Autorizo a EWS Tech a usar meus dados para responder esta solicitação. Li as informações de <Link href="/privacidade">privacidade</Link>.</span></label>
    {state.message && <p className={`fd-form-feedback ${state.status}`} role="status" aria-live="polite">{state.message}</p>}
    <button type="submit" className="fd-submit" disabled={!hydrated || state.status === 'sending'}>{state.status === 'sending' ? 'Enviando...' : 'Solicitar demonstração'}<Icon name="arrowUp" size={19}/></button>
    <small className="fd-form-fineprint">Sem compromisso. Uma conversa para entender sua necessidade.</small>
  </form>;
}

export default function FieldLanding() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const stepRefs = useRef([]);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveStep(Number(visible[0].target.dataset.step));
    }, { rootMargin: '-20% 0px -32% 0px', threshold: [.1, .45, .75] });
    stepRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <div className="fd-root" id="inicio">
    <RevealSetup/><ScrollProgress/><Header/>
    <main>
      <section className="fd-hero" aria-labelledby="fd-hero-title">
        <div className="fd-container fd-hero-container">
          <div className="fd-hero-topline"><span><i/> SOLUÇÃO PARA OPERAÇÕES EXTERNAS</span><span>PORTFÓLIO EWS TECH / 2026</span></div>
          <div className="fd-hero-grid">
            <div className="fd-hero-text">
              <div className="fd-section-code">01 <span/> CONECTE ESCRITÓRIO E CAMPO</div>
              <h1 id="fd-hero-title">A OPERAÇÃO<br/>ACONTECE<br/><em>LÁ FORA<span>.</span></em></h1>
              <div className="fd-hero-message"><span className="fd-message-rule"/><div><h2>O controle fica aqui.</h2><p>Ordens de serviço, técnicos, check-ins e relatórios em um fluxo mais claro — do planejamento à execução.</p></div></div>
              <div className="fd-hero-ctas"><a className="fd-button fd-button-blue" href="#contato">Solicitar demonstração <Icon name="arrowUp" size={20}/></a><a className="fd-button fd-button-text" href="#plataforma">Explorar a plataforma <span>↓</span></a></div>
            </div>
            <div className="fd-hero-right"><div className="fd-visual-ghost">FIELD<br/>OPS</div><RouteMap/><div className="fd-hero-right-label"><span>OPERAÇÃO CONECTADA</span><span>01 / 04</span></div></div>
          </div>
          <div className="fd-hero-bottom"><span>PROJETO EWS FIELD</span><span className="fd-scroll-hint">ROLE PARA EXPLORAR <span>↓</span></span><span>PLANEJAR · EXECUTAR · REGISTRAR</span></div>
        </div>
      </section>

      <div className="fd-marquee" aria-label="Planeje. Execute. Registre. Acompanhe."><div className="fd-marquee-track">{Array.from({length: 4}, (_,i) => <span key={i} aria-hidden={i > 0}>PLANEJE <b>↗</b> EXECUTE <b>↗</b> REGISTRE <b>↗</b> ACOMPANHE <b>↗</b></span>)}</div></div>

      <section className="fd-manifesto" id="plataforma">
        <div className="fd-container fd-manifesto-layout">
          <div className="fd-sticky-caption fd-reveal"><span className="fd-side-label">01 / O PROBLEMA</span><span className="fd-circle-arrow">↘</span></div>
          <div className="fd-manifesto-body"><p className="fd-overline fd-reveal">QUEM ESTÁ NO CAMPO NÃO PODE TRABALHAR NO ESCURO.</p><h2 className="fd-reveal">O serviço acontece.<br/><span>A informação</span><br/>não chega.</h2><p className="fd-manifesto-p fd-reveal">Uma visita concluída, uma foto perdida no WhatsApp, uma ordem sem atualização. O EWS Field organiza esse caminho para que cada atendimento deixe um registro.</p><div className="fd-manifesto-bottom fd-reveal"><span>MENOS RUÍDO ENTRE EQUIPES.</span><strong>MAIS CLAREZA PARA AGIR.</strong></div></div>
        </div>
      </section>

      <section className="fd-process" id="fluxo">
        <div className="fd-container"><div className="fd-section-heading fd-reveal"><span className="fd-overline">02 / O SISTEMA EM MOVIMENTO</span><h2>UM FLUXO.<br/><em>DO INÍCIO AO FIM.</em></h2><p>Selecione uma etapa ou acompanhe a rolagem para visualizar a jornada de uma ordem de serviço.</p></div>
          <div className="fd-process-grid"><div className="fd-step-list">{STEPS.map((step, i) => <button type="button" ref={el => { stepRefs.current[i] = el; }} data-step={i} className={`fd-step ${activeStep === i ? 'is-active' : ''}`} key={step.n} onClick={() => setActiveStep(i)} aria-pressed={activeStep === i}><span className="fd-step-number">{step.n} / 04</span><span className="fd-step-content"><small>{step.eyebrow}</small><strong>{step.title}</strong><span>{step.text}</span></span><span className="fd-step-arrow">↗</span></button>)}</div><div className="fd-process-visual"><OperationalPreview active={activeStep}/><div className="fd-preview-caption"><span>PRÉVIA CONCEITUAL</span><span>DADOS EXCLUSIVAMENTE DEMONSTRATIVOS</span></div></div></div>
        </div>
      </section>

      <section className="fd-command" id="solucoes">
        <div className="fd-container fd-command-inner"><div className="fd-command-lead fd-reveal"><span className="fd-overline">03 / A PLATAFORMA</span><h2>SOFTWARE QUE<br/><em>ACOMPANHA</em><br/>QUEM FAZ.</h2><p>Uma ferramenta para transformar tarefas dispersas em uma operação acompanhável.</p><Link className="fd-inline-link" href="/comecar">Conhecer o acesso da plataforma <Icon name="arrowUp" size={18}/></Link></div><div className="fd-feature-list">{FEATURES.map(item => <article className="fd-feature fd-reveal" key={item.num}><span className="fd-feature-num">{item.num}</span><div className="fd-feature-icon"><Icon name={item.icon} size={26}/></div><div className="fd-feature-copy"><h3>{item.name}</h3><p>{item.desc}</p></div><span className="fd-feature-arrow">↗</span></article>)}</div></div>
      </section>

      <section className="fd-field-statement" aria-label="Tecnologia para a execução em campo"><div className="fd-container fd-field-content"><div className="fd-field-top"><span>FIELD OPERATIONS</span><span>EWS / FIELD SYSTEM</span></div><h2 className="fd-reveal">A DISTÂNCIA ENTRE<br/>O ESCRITÓRIO E O CAMPO<br/><em>NÃO PRECISA SER UM PROBLEMA.</em></h2><div className="fd-field-bottom"><p>Uma plataforma para reduzir a fragmentação das informações em serviços externos.</p><a href="#contato">Conversar sobre minha operação <Icon name="arrowUp" size={19}/></a></div></div><div className="fd-field-cross fd-field-cross-a">+</div><div className="fd-field-cross fd-field-cross-b">+</div></section>

      <section className="fd-industries" id="segmentos"><div className="fd-container"><div className="fd-industries-head fd-reveal"><div><span className="fd-overline">04 / FEITO PARA OPERAÇÕES REAIS</span><h2>O TRABALHO MUDA.<br/><em>A NECESSIDADE DE CONTROLE, NÃO.</em></h2></div><p>Se sua equipe presta serviços fora do escritório, existe um fluxo que pode ser mais organizado.</p></div><div className="fd-industries-list">{[['01','ASSISTÊNCIA TÉCNICA','Visitas, chamados e suporte externo.'],['02','MANUTENÇÃO INDUSTRIAL','Serviços programados e corretivos.'],['03','INSTALAÇÕES','Equipes, entregas e evidências de execução.'],['04','EQUIPES EXTERNAS','Atendimentos distribuídos por cliente e região.']].map(([n,t,d]) => <div className="fd-industry" key={n}><span>{n}</span><strong>{t}</strong><small>{d}</small><i>↗</i></div>)}</div></div></section>

      <section className="fd-cta-band"><div className="fd-container fd-cta-band-inner"><div><span className="fd-overline">05 / SEU PRÓXIMO PASSO</span><h2>CONHEÇA A OPERAÇÃO<br/><em>POR OUTRO ÂNGULO.</em></h2></div><div><p>Veja como ordens, equipes e registros podem conversar entre si.</p><a className="fd-button fd-button-light" href="#contato">Agendar uma conversa <Icon name="arrowUp" size={20}/></a></div></div></section>

      <section className="fd-faq" id="perguntas"><div className="fd-container fd-faq-grid"><div className="fd-faq-title fd-reveal"><span className="fd-overline">06 / RESPOSTAS DIRETAS</span><h2>ANTES DE<br/><em>COMEÇAR.</em></h2><p>Sem promessas vagas. O que você precisa saber sobre a versão atual.</p></div><div className="fd-faq-rows">{FAQ.map(([q,a],i) => <div className="fd-faq-row" key={q}><button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}><span>{String(i+1).padStart(2,'0')}</span><strong>{q}</strong><span className="fd-faq-sign">{openFaq === i ? '−' : '+'}</span></button>{openFaq === i && <p>{a}</p>}</div>)}</div></div></section>

      <section className="fd-contact" id="contato"><div className="fd-container fd-contact-grid"><div className="fd-contact-copy fd-reveal"><span className="fd-overline">07 / COMEÇAMOS POR UMA CONVERSA</span><h2>SUA EQUIPE<br/><em>PODE OPERAR</em><br/>MELHOR.</h2><p>Conte como funciona o atendimento da sua empresa. Vamos avaliar onde o EWS Field pode entrar na rotina.</p><div className="fd-contact-sign"><span className="fd-online"/> EWS TECH <span className="fd-contact-line"/> FIELD OPERATIONS</div><Link href="/comecar" className="fd-contact-alt">Já quer conhecer o acesso inicial? <Icon name="arrowUp" size={17}/></Link></div><LeadForm/></div></section>
    </main>
    <footer className="fd-footer"><div className="fd-container"><div className="fd-footer-main"><div><Brand light/><p>Mais clareza para quem coordena.<br/>Mais agilidade para quem executa.</p></div><div><strong>EXPLORAR</strong><a href="#plataforma">A plataforma</a><a href="#fluxo">Como funciona</a><a href="#solucoes">Funcionalidades</a></div><div><strong>COMEÇAR</strong><Link href="/comecar">Criar empresa</Link><Link href="/painel">Acessar painel</Link><a href="#contato">Solicitar demonstração</a></div><div><strong>INFORMAÇÕES</strong><Link href="/privacidade">Privacidade</Link><a href="#perguntas">Perguntas frequentes</a><a href="#contato">Falar com a EWS Tech</a></div></div><div className="fd-footer-bottom"><span>© {new Date().getFullYear()} EWS Tech — EWS Field.</span><span>DESENVOLVIDO PARA QUEM FAZ ACONTECER.</span><a href="#inicio">VOLTAR AO TOPO ↑</a></div></div></footer>
  </div>;
}
