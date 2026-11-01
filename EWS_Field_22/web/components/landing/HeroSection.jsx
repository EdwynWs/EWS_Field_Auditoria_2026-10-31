import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { DashboardVisual, MobileVisual } from "./ProductVisuals";

export default function HeroSection() {
  return (
    <section className="ef5-hero" id="inicio" aria-labelledby="ef5-hero-title">
      <div className="ef5-hero-grid" aria-hidden="true" />
      <div className="ef5-hero-aurora" aria-hidden="true" />
      <div className="ef5-container ef5-hero-shell">
        <div className="ef5-hero-overline">
          <span>
            <i /> EWS TECH / FIELD OPERATIONS
          </span>
          <span>
            CONEXÃO ENTRE GESTÃO E CAMPO{" "}
            <span className="ef5-hero-overline-arrow">↗</span>
          </span>
        </div>
        <div className="ef5-hero-content">
          <div className="ef5-hero-copy">
            <div className="ef5-hero-kicker">
              <Sparkles size={14} /> TECNOLOGIA PARA EQUIPES EXTERNAS{" "}
              <span>2026</span>
            </div>
            <h1 id="ef5-hero-title">
              Toda a sua
              <br />
              operação externa.
              <br />
              <em>
                Em uma só
                <br />
                plataforma<span>.</span>
              </em>
            </h1>
            <p>
              Do escritório ao atendimento: organize ordens de serviço, conecte
              técnicos e registre cada etapa em uma experiência inteligente de
              gestão de campo.
            </p>
            <div className="ef5-hero-actions">
              <a className="ef5-btn ef5-btn-primary" href="#contato">
                Solicitar demonstração <ArrowUpRight size={20} />
              </a>
              <a className="ef5-btn ef5-btn-ghost" href="#plataforma">
                Explorar a plataforma <ArrowDown size={18} />
              </a>
            </div>
            <div className="ef5-hero-benefits">
              <span>
                <CheckCircle2 size={15} /> Ordens organizadas
              </span>
              <span>
                <MapPin size={15} /> GPS e evidências
              </span>
              <span>
                <CheckCircle2 size={15} /> Web + aplicativo
              </span>
            </div>
          </div>
          <div
            className="ef5-hero-showcase"
            aria-label="Mockups ilustrativos do painel de gestão e aplicativo EWS Field"
          >
            <div className="ef5-hero-halo" aria-hidden="true" />
            <div className="ef5-hero-dots" aria-hidden="true" />
            <div className="ef5-hero-dashboard">
              <div className="ef5-hero-window-bar">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <small>PLATAFORMA / PAINEL WEB</small>
                <span>↗</span>
              </div>
              <DashboardVisual compact />
            </div>
            <div className="ef5-hero-phone">
              <MobileVisual compact />
            </div>
            <div className="ef5-hero-floating ef5-hero-floating-top">
              <span className="ef5-floating-icon">
                <CheckCircle2 size={17} />
              </span>
              <span>
                <small>CHECK-IN</small>
                <strong>Visita registrada</strong>
              </span>
            </div>
            <div className="ef5-hero-floating ef5-hero-floating-bottom">
              <span className="ef5-floating-icon blue">
                <MapPin size={18} />
              </span>
              <span>
                <small>ATENDIMENTO</small>
                <strong>Ordem em execução</strong>
              </span>
            </div>
            <div className="ef5-hero-visual-note">
              PAINEL + APP NO EXPO WEB · CAPTURAS REAIS · DADOS FICTÍCIOS
            </div>
          </div>
        </div>
        <div className="ef5-hero-base">
          <span>01 / A PLATAFORMA</span>
          <a href="#indicadores">
            ROLE PARA DESCOBRIR <ArrowDown size={15} />
          </a>
          <span>EWS FIELD / OPERAÇÕES CONECTADAS</span>
        </div>
      </div>
    </section>
  );
}
