// EWS_FIELD_AFTERSALES_V4 | Site de apresentação; preserva /painel e /comecar.
import FieldLanding from '../components/FieldLanding';
import './field-v4.css';

export const metadata = {
  title: 'EWS Field | O controle de toda operação em campo',
  description: 'Gerencie ordens de serviço, equipes técnicas e atendimentos externos. Check-ins com GPS, registros fotográficos e relatórios em uma plataforma conectada.',
  openGraph: {
    title: 'EWS Field — A operação acontece lá fora. O controle fica aqui.',
    description: 'Do escritório ao atendimento: transforme execução em informação.',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/ews-field-mark.svg' },
};

export default function Page() { return <FieldLanding />; }
