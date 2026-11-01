import {
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  MapPin,
  MoreHorizontal,
  Navigation,
  ShieldCheck,
  Users,
  Wifi,
} from "lucide-react";

// All information below is a visual demonstration, not actual customer data.
const orders = [
  {
    name: "Manutenção preventiva",
    ref: "OS-0248",
    customer: "Unidade demonstrativa A",
    status: "Em andamento",
    statusClass: "working",
  },
  {
    name: "Inspeção de instalação",
    ref: "OS-0249",
    customer: "Unidade demonstrativa B",
    status: "Atribuída",
    statusClass: "assigned",
  },
  {
    name: "Atendimento técnico",
    ref: "OS-0250",
    customer: "Unidade demonstrativa C",
    status: "Concluída",
    statusClass: "done",
  },
];

export function DashboardVisual({ compact = false }) {
  return (
    <img
      className="ef5-real-dashboard"
      src="/landing/painel-gestao.webp"
      width="1440"
      height="960"
      loading={compact ? "eager" : "lazy"}
      alt="Painel real com dados fictícios de demonstração"
    />
  );
}
export function MobileVisual({ compact = false }) {
  return (
    <div className="ef5-phone ef5-real-phone">
      <img
        src={
          compact ? "/landing/mobile-home.webp" : "/landing/mobile-ordem.webp"
        }
        width="780"
        height="1688"
        loading={compact ? "eager" : "lazy"}
        alt="Aplicativo real renderizado no Expo Web com dados fictícios"
      />
    </div>
  );
}
export function ReportVisual() {
  return (
    <img
      className="ef5-real-dashboard"
      src="/landing/painel-relatorio.webp"
      width="1440"
      height="960"
      loading="lazy"
      alt="Captura real de relatório técnico demonstrativo"
    />
  );
}

export function ConnectVisual() {
  return (
    <div className="ef5-connect-visual" aria-hidden="true">
      <div className="ef5-connect-orbit orbit-one" />
      <div className="ef5-connect-orbit orbit-two" />
      <div className="ef5-connect-center">
        <ShieldCheck size={42} />
        <span>EWS FIELD</span>
      </div>
      <div className="ef5-connect-node node-one">
        <Users size={19} />
        <span>Gestão</span>
      </div>
      <div className="ef5-connect-node node-two">
        <MapPin size={19} />
        <span>Campo</span>
      </div>
      <div className="ef5-connect-node node-three">
        <FileCheck2 size={19} />
        <span>Histórico</span>
      </div>
      <div className="ef5-connect-node node-four">
        <Wifi size={19} />
        <span>Integração</span>
      </div>
    </div>
  );
}
