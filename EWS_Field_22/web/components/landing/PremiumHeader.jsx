"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  ["Plataforma", "#plataforma"],
  ["Funcionalidades", "#funcionalidades"],
  ["Como funciona", "#como-funciona"],
  ["Soluções", "#segmentos"],
  ["Segurança", "#seguranca"],
];

export function PremiumLogo({ inverse = false }) {
  return (
    <Link
      className={`ef5-logo${inverse ? " ef5-logo-inverse" : ""}`}
      href="/"
      aria-label="EWSFIELD OPERAÇÕES CONECTADAS — início"
    >
      <span className="ef5-logo-emblem" aria-hidden="true">
        <span className="ef5-logo-dot" />
      </span>
      <span className="ef5-logo-type">
        <strong>
          EWS<span>FIELD</span>
        </strong>
        <small>OPERAÇÕES CONECTADAS</small>
      </span>
    </Link>
  );
}

export default function PremiumHeader() {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);
  return (
    <header
      className={`ef5-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}
    >
      <a href="#conteudo" className="ef5-skip">
        Ir para o conteúdo
      </a>
      <div className="ef5-container ef5-nav">
        <PremiumLogo />
        <nav
          className={`ef5-nav-links${open ? " is-open" : ""}`}
          aria-label="Navegação principal"
          id="ef5-nav-links"
        >
          {links.map(([name, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {name}
            </a>
          ))}
          <Link
            className="ef5-mobile-login"
            href="/painel"
            onClick={() => setOpen(false)}
          >
            Entrar no painel
          </Link>
          <a
            className="ef5-mobile-cta"
            href="#contato"
            onClick={() => setOpen(false)}
          >
            Solicitar demonstração <ArrowUpRight size={17} />
          </a>
        </nav>
        <div className="ef5-nav-actions">
          <Link href="/painel" className="ef5-nav-login">
            Entrar
          </Link>
          <a href="#contato" className="ef5-nav-cta">
            Solicitar demonstração <ArrowUpRight size={16} />
          </a>
        </div>
        <button
          ref={trigger}
          className="ef5-menu-toggle"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="ef5-nav-links"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>
    </header>
  );
}
