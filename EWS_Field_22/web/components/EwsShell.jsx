'use client';
import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import Icon from './EwsIcons';

export function Brand({inverse=false}) {
  return <Link href="/" className={`mk-brand ${inverse ? 'mk-brand-inverse' : ''}`} aria-label="EWS Field, página inicial">
    <span className="mk-brand-sign" aria-hidden="true"><span/></span>
    <span className="mk-brand-word">EWS<span>FIELD</span><small>by EWS Tech</small></span>
  </Link>;
}
export function Header({light=false}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled,setScrolled] = useState(false);
  useEffect(()=>{
    const check=()=>setScrolled(window.scrollY>24);check();window.addEventListener('scroll',check,{passive:true});
    return ()=>window.removeEventListener('scroll',check);
  },[]);
  useEffect(()=>{if(menuOpen){const close=(e)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',close);return ()=>window.removeEventListener('keydown',close)}},[menuOpen]);
  return <header className={`mk-header ${light?'mk-header-light':''} ${scrolled?'mk-header-scrolled':''}`}>
    <div className="mk-container mk-header-inner">
      <Brand inverse={!light && !scrolled}/>
      <nav className={`mk-nav ${menuOpen?'mk-nav-open':''}`} aria-label="Navegação principal">
        <a href="/#plataforma" onClick={()=>setMenuOpen(false)}>Plataforma</a>
        <a href="/#solucoes" onClick={()=>setMenuOpen(false)}>Soluções</a>
        <a href="/#como-funciona" onClick={()=>setMenuOpen(false)}>Como funciona</a>
        <a href="/#planos" onClick={()=>setMenuOpen(false)}>Planos</a>
        <div className="mk-mobile-nav-extra"><Link href="/painel" onClick={()=>setMenuOpen(false)}>Acessar plataforma</Link><Link className="mk-btn mk-btn-primary" href="/comecar" onClick={()=>setMenuOpen(false)}>Criar minha conta <Icon name="arrow" size={17}/></Link></div>
      </nav>
      <div className="mk-header-actions"><Link href="/painel" className="mk-login">Entrar</Link><Link href="/comecar" className="mk-btn mk-btn-nav">Começar agora <Icon name="arrowUp" size={16}/></Link></div>
      <button type="button" aria-label={menuOpen?'Fechar menu':'Abrir menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)} className="mk-mobile-toggle"><Icon name={menuOpen?'close':'menu'} size={23}/></button>
    </div>
  </header>;
}
export function Footer(){
 return <footer className="mk-footer"><div className="mk-container">
   <div className="mk-footer-top"><div className="mk-footer-brand"><Brand inverse/><p>Mais clareza para quem coordena.<br/>Mais agilidade para quem executa.</p></div>
   <div><h4>Plataforma</h4><a href="/#plataforma">Visão geral</a><a href="/#solucoes">Funcionalidades</a><a href="/#como-funciona">Como funciona</a></div>
   <div><h4>Comece aqui</h4><Link href="/comecar">Criar conta</Link><Link href="/painel">Acessar painel</Link><a href="/#contato">Solicitar demonstração</a></div>
   <div><h4>Informações</h4><Link href="/privacidade">Privacidade</Link><a href="/#perguntas">Perguntas frequentes</a><a href="/#contato">Contato comercial</a></div></div>
   <div className="mk-footer-bottom"><span>© {new Date().getFullYear()} EWS Tech. EWS Field é uma solução para gestão de operações externas.</span><span>Desenvolvido para equipes que fazem acontecer.</span></div>
 </div></footer>
}
