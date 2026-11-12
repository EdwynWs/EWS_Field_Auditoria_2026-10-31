"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function Recover() {
  const [token,setToken]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  useEffect(()=>{const readToken=()=>{setToken(location.hash.slice(1));history.replaceState(null,'',location.pathname);};readToken();window.addEventListener('hashchange',readToken);return ()=>window.removeEventListener('hashchange',readToken);},[]);
  async function submit(e) {
    e.preventDefault();
    if(password!==confirmation){setMessage('As senhas precisam ser iguais.');return;}
    setBusy(true);setMessage('');
    try {
      const r=await fetch('/api/panel/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,new_password:password})});
      const data=await r.json();if(!r.ok)throw Error(data.error || 'Não foi possível alterar a senha.');
      setDone(true);setPassword('');setConfirmation('');setToken('');setMessage('Senha alterada. Entre novamente com a nova senha.');
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <main style={{maxWidth:480,margin:'64px auto',padding:24,fontFamily:'system-ui'}}><Link href="/">EWS Field</Link><h1>Recuperar acesso</h1>{done?<Link href="/painel">Entrar no painel</Link>:token?<form onSubmit={submit} style={{display:'grid',gap:16}}><label>Nova senha (12 a 72 caracteres)<input style={{display:'block',width:'100%'}} type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirme a nova senha<input style={{display:'block',width:'100%'}} type="password" autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button disabled={busy}>{busy?'Salvando…':'Salvar nova senha'}</button></form>:<p>Solicite um link temporário ao responsável pela contratação ou ao canal de suporte acordado com a EWS Tech. A identidade do titular será verificada antes da emissão.</p>}<p role="status">{message}</p></main>;
}
