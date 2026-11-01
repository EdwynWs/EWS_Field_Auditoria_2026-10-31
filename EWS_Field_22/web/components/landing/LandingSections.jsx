"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Camera,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Clock3,
  Factory,
  FileCheck2,
  HardHat,
  Headset,
  LockKeyhole,
  MapPin,
  MonitorSmartphone,
  MousePointer2,
  Navigation2,
  Quote,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
} from "lucide-react";
import { INDUSTRIES, FAQ } from "./data";
import { ConnectVisual } from "./ProductVisuals";
import AnimatedCounter from "./AnimatedCounter";
import LeadForm from "./LeadForm";
import { PremiumLogo } from "./PremiumHeader";

export function TrustSection() {
  return (
    <section
      className="ef5-trust"
      id="indicadores"
      aria-label="Características da plataforma"
    >
      <div className="ef5-container">
        <div className="ef5-trust-title">
          <span className="ef5-overline-dark">
            UMA OPERAÇÃO INTEIRA, CONECTADA
          </span>
          <p>Projetada para oferecer clareza em cada etapa do serviço.</p>
        </div>
        <div className="ef5-trust-metrics">
          <div>
            <strong>
              <AnimatedCounter value={2} />
              <span>.</span>
            </strong>
            <p>interfaces conectadas</p>
            <small>Painel web + aplicativo</small>
          </div>
          <div>
            <strong>
              <AnimatedCounter value={4} />
              <span>.</span>
            </strong>
            <p>etapas no fluxo</p>
            <small>Da abertura à conclusão</small>
          </div>
          <div>
            <strong>
              <AnimatedCounter value={1} />
              <span>.</span>
            </strong>
            <p>histórico centralizado</p>
            <small>Registros por atendimento</small>
          </div>
        </div>
        <div className="ef5-trust-foot">
          <span>
            CARACTERÍSTICAS DA PLATAFORMA • NÃO REPRESENTAM NÚMEROS DE CLIENTES
          </span>
          <span>↗</span>
        </div>
      </div>
    </section>
  );
}

const industryIcons = { Wrench, Factory, HardHat, Headset };
export function IndustriesSection() {
  return (
    <section
      className="ef5-industries ef5-section"
      id="segmentos"
      aria-labelledby="ef5-industries-title"
    >
      <div className="ef5-container">
        <div className="ef5-industries-head ef5-reveal">
          <div>
            <span className="ef5-eyebrow">
              <span className="ef5-index">03</span> / SOLUÇÕES POR SEGMENTO
            </span>
            <h2 id="ef5-industries-title">
              Onde existe trabalho em campo,
              <br />
              <em>existe espaço para evoluir.</em>
            </h2>
          </div>
          <p>
            Uma solução para empresas que precisam coordenar atendimentos fora
            do escritório.
          </p>
        </div>
        <div className="ef5-industries-grid">
          {INDUSTRIES.map((item) => {
            const I = industryIcons[item.icon];
            return (
              <article key={item.id} className="ef5-industry-card ef5-reveal">
                <div className="ef5-industry-card-top">
                  <span>{item.id} / 04</span>
                  <ArrowUpRight size={18} />
                </div>
                <div className="ef5-industry-icon">
                  <I size={32} strokeWidth={1.35} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <span className="ef5-industry-card-line" />
              </article>
            );
          })}
        </div>
        <div className="ef5-industries-note">
          <span>
            <CircleCheck size={16} /> Aplicações pensadas para operações reais
          </span>
          <a href="#contato">
            Conhecer para minha empresa <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}

const featureCards = [
  {
    icon: ClipboardList,
    label: "01 / PLANEJAMENTO",
    name: "Ordens de serviço",
    desc: "Crie, atribua e acompanhe cada atendimento com as informações necessárias em um só lugar.",
    kind: "orders",
  },
  {
    icon: MapPin,
    label: "02 / CAMPO",
    name: "Check-in com GPS",
    desc: "Registre chegada e saída em campo, com localização e evidência fotográfica.",
    kind: "map",
  },
  {
    icon: Camera,
    label: "03 / EVIDÊNCIAS",
    name: "Fotos e registros",
    desc: "Documente o que foi executado com observações e arquivos associados à ordem.",
    kind: "photos",
  },
  {
    icon: Users,
    label: "04 / EQUIPE",
    name: "Técnicos e clientes",
    desc: "Organize cadastros, responsáveis e relações com os atendimentos.",
    kind: "team",
  },
  {
    icon: FileCheck2,
    label: "05 / HISTÓRICO",
    name: "Relatórios técnicos",
    desc: "Checklists, observações e registros acessíveis para acompanhar os serviços.",
    kind: "report",
  },
  {
    icon: MonitorSmartphone,
    label: "06 / CONEXÃO",
    name: "Histórico de atendimentos",
    desc: "Consulte visitas, observações e atualizações vinculadas aos atendimentos.",
    kind: "mobile",
  },
];
function FeatureDecor({ kind }) {
  if (kind === "orders")
    return (
      <div className="ef5-feature-ui ef5-feature-orders" aria-hidden="true">
        <div>
          <span>OS-0248</span>
          <b>Manutenção preventiva</b>
          <small>EM EXECUÇÃO</small>
        </div>
        <div>
          <span>OS-0249</span>
          <b>Inspeção técnica</b>
          <small>ATRIBUÍDA</small>
        </div>
        <div>
          <span>OS-0250</span>
          <b>Suporte externo</b>
          <small>CONCLUÍDA</small>
        </div>
      </div>
    );
  if (kind === "map")
    return (
      <div className="ef5-feature-map" aria-hidden="true">
        <span className="ef5-feature-map-ring one" />
        <span className="ef5-feature-map-ring two" />
        <span className="ef5-feature-map-marker">
          <MapPin size={27} />
        </span>
        <span className="ef5-feature-map-tag">
          <span /> LOCALIZAÇÃO REGISTRADA
        </span>
      </div>
    );
  if (kind === "photos")
    return (
      <div className="ef5-feature-photos" aria-hidden="true">
        <div>
          <Camera size={25} />
          <span>EVIDÊNCIA 01</span>
        </div>
        <div>
          <Camera size={25} />
          <span>EVIDÊNCIA 02</span>
        </div>
      </div>
    );
  if (kind === "team")
    return (
      <div className="ef5-feature-team" aria-hidden="true">
        <span>AT</span>
        <span>JM</span>
        <span>RC</span>
        <small>EQUIPE CONECTADA</small>
      </div>
    );
  if (kind === "report")
    return (
      <div className="ef5-feature-report" aria-hidden="true">
        <span>
          <Check size={14} /> Checklist registrado
        </span>
        <span>
          <Check size={14} /> Observações anexadas
        </span>
        <span>
          <Check size={14} /> Histórico disponível
        </span>
      </div>
    );
  return (
    <div className="ef5-feature-devices" aria-hidden="true">
      <MonitorSmartphone size={92} strokeWidth={1} />
    </div>
  );
}
export function FeaturesSection() {
  return (
    <section
      className="ef5-features ef5-section"
      id="funcionalidades"
      aria-labelledby="ef5-features-title"
    >
      <div className="ef5-container">
        <div className="ef5-features-head ef5-reveal">
          <span className="ef5-eyebrow">
            <span className="ef5-index">05</span> / RECURSOS QUE FAZEM DIFERENÇA
          </span>
          <div>
            <h2 id="ef5-features-title">
              Menos informação solta.
              <br />
              <em>Mais operação organizada.</em>
            </h2>
            <p>
              Funcionalidades desenvolvidas para aproximar a equipe de campo da
              gestão.
            </p>
          </div>
        </div>
        <div className="ef5-bento">
          {featureCards.map((item) => {
            const I = item.icon;
            return (
              <article
                key={item.kind}
                className={`ef5-bento-card ef5-bento-${item.kind} ef5-reveal`}
              >
                <div className="ef5-bento-top">
                  <span>{item.label}</span>
                  <I size={22} strokeWidth={1.5} />
                </div>
                <div className="ef5-bento-text">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
                <FeatureDecor kind={item.kind} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const securityCards = [
  {
    icon: MonitorSmartphone,
    title: "Web e mobile integrados",
    text: "Gestão no navegador e execução no aplicativo.",
  },
  {
    icon: FileCheck2,
    title: "Evidências protegidas",
    text: "Autorização para consultar os arquivos e registros da empresa.",
  },
  {
    icon: LockKeyhole,
    title: "Acessos por perfil",
    text: "Gestores e técnicos com permissões adequadas às suas funções.",
  },
  {
    icon: ShieldCheck,
    title: "Dados por empresa",
    text: "Regras de autorização para separar informações de cada organização.",
  },
  {
    icon: Clock3,
    title: "Sessões autenticadas",
    text: "Controle de sessões, validade e revogação de acesso.",
  },
  {
    icon: FileCheck2,
    title: "Histórico documentado",
    text: "Evidências e registros associados aos respectivos atendimentos.",
  },
];
export function SecuritySection() {
  return (
    <section
      className="ef5-security ef5-section"
      id="seguranca"
      aria-labelledby="ef5-security-title"
    >
      <div className="ef5-security-grid" aria-hidden="true" />
      <div className="ef5-container ef5-security-shell">
        <div className="ef5-security-left ef5-reveal">
          <span className="ef5-eyebrow">
            <span className="ef5-index">06</span> / TECNOLOGIA COM
            RESPONSABILIDADE
          </span>
          <h2 id="ef5-security-title">
            Controle que inspira
            <br />
            <em>confiança.</em>
          </h2>
          <p>
            Além de organizar atendimentos, o EWS Field utiliza mecanismos de
            acesso e rastreabilidade para apoiar uma operação mais estruturada.
          </p>
          <a href="#contato" className="ef5-inline-dark">
            Conhecer a plataforma <ArrowUpRight size={17} />
          </a>
          <ConnectVisual />
        </div>
        <div className="ef5-security-list">
          {securityCards.map(({ icon: Icon, title, text }, i) => (
            <div className="ef5-security-item ef5-reveal" key={title}>
              <span>0{i + 1}</span>
              <span className="ef5-security-item-icon">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowUpRight size={19} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  return (
    <section
      className="ef5-cases ef5-section"
      aria-labelledby="ef5-cases-title"
    >
      <div className="ef5-container">
        <div className="ef5-cases-head ef5-reveal">
          <div>
            <span className="ef5-eyebrow">
              <span className="ef5-index">07</span> / APLICAÇÕES NO DIA A DIA
            </span>
            <h2 id="ef5-cases-title">
              Menos ruído na comunicação.
              <br />
              <em>Mais clareza para agir.</em>
            </h2>
          </div>
          <p>
            Exemplos de como a plataforma pode ajudar diferentes operações.
            Cenários ilustrativos, não cases de clientes.
          </p>
        </div>
        <div className="ef5-cases-grid">
          <article className="ef5-case-card ef5-reveal">
            <span>01 / ASSISTÊNCIA TÉCNICA</span>
            <div className="ef5-case-symbol">
              <Wrench size={38} strokeWidth={1.2} />
            </div>
            <h3>O chamado não pode se perder.</h3>
            <p>
              Substitua informações dispersas por ordens com responsável, status
              e registros associados.
            </p>
            <span className="ef5-case-bottom">
              CENÁRIO DE APLICAÇÃO <ArrowUpRight size={16} />
            </span>
          </article>
          <article className="ef5-case-card ef5-reveal">
            <span>02 / MANUTENÇÃO</span>
            <div className="ef5-case-symbol">
              <Factory size={38} strokeWidth={1.2} />
            </div>
            <h3>O que foi feito precisa ficar registrado.</h3>
            <p>
              Documente intervenções com checklists, observações e fotos que
              podem ser consultados depois.
            </p>
            <span className="ef5-case-bottom">
              CENÁRIO DE APLICAÇÃO <ArrowUpRight size={16} />
            </span>
          </article>
          <article className="ef5-case-card ef5-reveal">
            <span>03 / OPERAÇÃO EXTERNA</span>
            <div className="ef5-case-symbol">
              <Navigation2 size={38} strokeWidth={1.2} />
            </div>
            <h3>O campo e o escritório falam a mesma língua.</h3>
            <p>
              Organize a execução e dê à gestão uma visão mais clara do
              andamento dos serviços.
            </p>
            <span className="ef5-case-bottom">
              CENÁRIO DE APLICAÇÃO <ArrowUpRight size={16} />
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <div className="ef5-cta-band">
      <div className="ef5-container ef5-cta-band-inner">
        <span>
          <span className="ef5-cta-star">✳</span> EWS FIELD / SUA PRÓXIMA
          EVOLUÇÃO
        </span>
        <h2>
          Uma operação mais conectada
          <br />
          <em>começa com uma conversa.</em>
        </h2>
        <a className="ef5-btn ef5-btn-white" href="#contato">
          Vamos conversar <ArrowUpRight size={20} />
        </a>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section
      className="ef5-faq ef5-section"
      id="perguntas"
      aria-labelledby="ef5-faq-title"
    >
      <div className="ef5-container ef5-faq-grid">
        <div className="ef5-faq-intro ef5-reveal">
          <span className="ef5-eyebrow">
            <span className="ef5-index">08</span> / PERGUNTAS FREQUENTES
          </span>
          <h2 id="ef5-faq-title">
            Respostas claras.
            <br />
            <em>Sem letras pequenas.</em>
          </h2>
          <p>O que você precisa saber sobre o EWS Field antes de começar.</p>
          <a href="#contato">
            Ainda tem dúvidas? <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="ef5-faq-items">
          {FAQ.map(([q, a], i) => (
            <details className="ef5-faq-item" key={q}>
              <summary>
                <span>0{i + 1}</span>
                <strong>{q}</strong>
                <ChevronDown size={20} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section
      className="ef5-contact ef5-section"
      id="contato"
      aria-labelledby="ef5-contact-title"
    >
      <div className="ef5-contact-backdrop" aria-hidden="true" />
      <div className="ef5-container ef5-contact-grid">
        <div className="ef5-contact-content ef5-reveal">
          <span className="ef5-eyebrow">
            <span className="ef5-index">09</span> / CONTATO COMERCIAL
          </span>
          <h2 id="ef5-contact-title">
            Sua equipe pode
            <br />
            trabalhar <em>melhor.</em>
          </h2>
          <p>
            Conte como funciona a operação da sua empresa. Vamos explorar onde o
            EWS Field pode simplificar atendimentos e tornar as informações mais
            acessíveis.
          </p>
          <div className="ef5-contact-bullets">
            <span>
              <CircleCheck size={18} /> Conheça a plataforma
            </span>
            <span>
              <CircleCheck size={18} /> Converse sobre seu cenário
            </span>
            <span>
              <CircleCheck size={18} /> Sem compromisso
            </span>
          </div>
          <div className="ef5-contact-person">
            <span className="ef5-contact-mark">E</span>
            <div>
              <strong>EWS Tech</strong>
              <small>Tecnologia para negócios que evoluem</small>
            </div>
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

export function PremiumFooter({ signupEnabled = false }) {
  return (
    <footer className="ef5-footer">
      <div className="ef5-container">
        <div className="ef5-footer-main">
          <div className="ef5-footer-about">
            <PremiumLogo inverse />
            <p>
              Uma plataforma para conectar gestores, técnicos e cada etapa do
              trabalho em campo.
            </p>
            <span>UM PRODUTO EWS TECH</span>
          </div>
          <div>
            <strong>PLATAFORMA</strong>
            <a href="#plataforma">Visão geral</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#segmentos">Soluções</a>
          </div>
          <div>
            <strong>COMEÇAR</strong>
            <Link href="/painel">Entrar no painel</Link>
            {signupEnabled && <Link href="/comecar">Criar empresa</Link>}
            <a href="#contato">Solicitar demonstração</a>
          </div>
          <div>
            <strong>INSTITUCIONAL</strong>
            <a href="#seguranca">Segurança</a>
            <Link href="/privacidade">Privacidade</Link>
            <a href="#perguntas">Perguntas</a>
            <a href="#contato">Contato</a>
          </div>
        </div>
        <div className="ef5-footer-bottom">
          <span>
            © {new Date().getFullYear()} EWS Tech. EWS Field — todos os direitos
            reservados.
          </span>
          <span>CRIADO PARA QUEM FAZ ACONTECER.</span>
          <a href="#inicio">
            VOLTAR AO TOPO <ArrowUp size={15} />
          </a>
        </div>
      </div>
    </footer>
  );
}
