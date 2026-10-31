'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from './FieldLanding';

export default function FieldSignup() {
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>setHydrated(true),[]);
  const [form, setForm] = useState({ company: '', name: '', email: '', password: '', confirm: '' });
  const [state, setState] = useState({ status: 'idle', message: '' });
  const update = (key,value) => setForm(old => ({ ...old, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    if (state.status === 'sending') return;
    if (form.password.length < 12) return setState({status:'error',message:'A senha precisa ter pelo menos 12 caracteres.'});
    if (form.password !== form.confirm) return setState({status:'error',message:'As duas senhas não correspondem.'});
    setState({status:'sending',message:''});
    try {
      const res = await fetch('/api/signup', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:form.company,name:form.name,email:form.email,password:form.password})});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Error(data.error || 'Não foi possível criar o acesso.');
      setState({status:'success',message:'Cadastro criado. Acesse o painel com seu e-mail e senha.'});
      setForm({ company:'',name:'',email:'',password:'',confirm:'' });
    } catch (err) { setState({status:'error',message:err.message || 'Erro ao cadastrar.'}); }
  }
  return <div className="fd-root fd-auth-root">
    <Header />
    <main className="fd-auth-main"><div className="fd-container fd-auth-grid">
      <aside className="fd-auth-message"><div className="fd-auth-code">EWS / FIELD OPS <span>•</span> INÍCIO DA JORNADA</div><h1>UM NOVO<br/>PADRÃO<br/><em>DE OPERAÇÃO.</em></h1><p>Cadastre sua empresa para conhecer o painel que conecta ordens, clientes e técnicos em uma rotina organizada.</p><div className="fd-auth-aside-bottom"><span>01 / CRIAR EMPRESA</span><span>02 / ACESSAR PAINEL</span><span>03 / ORGANIZAR OPERAÇÃO</span></div></aside>
      <div className="fd-auth-form-panel"><div className="fd-auth-form-title"><span>PRIMEIRO ACESSO / GESTOR</span><h2>Crie sua conta<span>.</span></h2><p>O cadastro inicial não ativa cobrança automática.</p></div>
        {state.status === 'success' ? <div className="fd-auth-success"><strong>Conta criada com sucesso.</strong><p>{state.message}</p><Link href="/painel" className="fd-submit">Acessar painel <span>↗</span></Link></div> : <form className="fd-form fd-auth-form" onSubmit={submit}>
          <label>Nome da empresa<input disabled={!hydrated} required minLength={2} maxLength={120} autoComplete="organization" placeholder="Ex.: Minha Empresa" value={form.company} onChange={e => update('company',e.target.value)}/></label>
          <label>Nome do gestor<input disabled={!hydrated} required minLength={2} maxLength={120} autoComplete="name" placeholder="Seu nome" value={form.name} onChange={e => update('name',e.target.value)}/></label>
          <label>E-mail<input disabled={!hydrated} type="email" required maxLength={180} autoComplete="email" placeholder="voce@empresa.com.br" value={form.email} onChange={e => update('email',e.target.value)}/></label>
          <label>Senha<input disabled={!hydrated} type="password" required minLength={12} maxLength={72} autoComplete="new-password" placeholder="Pelo menos 12 caracteres" value={form.password} onChange={e => update('password',e.target.value)}/></label>
          <label>Confirmar senha<input disabled={!hydrated} type="password" required minLength={12} maxLength={72} autoComplete="new-password" placeholder="Repita sua senha" value={form.confirm} onChange={e => update('confirm',e.target.value)}/></label>
          {state.status === 'error' && <p className="fd-form-feedback error" role="alert">{state.message}</p>}
          <button type="submit" className="fd-submit" disabled={!hydrated || state.status === 'sending'}>{state.status === 'sending' ? 'Criando acesso...' : 'Criar conta de gestor'} <span>↗</span></button>
          <small className="fd-form-fineprint">Seus dados serão utilizados para a criação do acesso. Leia nossa <Link href="/privacidade">página de privacidade</Link>.</small>
        </form>}
        <div className="fd-auth-login">Já tem conta? <Link href="/painel">Entrar no painel ↗</Link></div>
      </div>
    </div></main>
    <div className="fd-auth-bottom"><span>© {new Date().getFullYear()} EWS Tech</span><span>FIELD OPERATIONS / CONECTADO AO QUE IMPORTA</span></div>
  </div>;
}
