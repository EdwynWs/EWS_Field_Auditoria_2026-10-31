import FieldSignup from '../../components/FieldSignup';
import '../field-v4.css';
export const metadata = {
  title: 'Criar empresa | EWS Field',
  description: 'Cadastre sua empresa e crie a primeira conta de gestor da plataforma EWS Field.',
  robots: { index: false, follow: true },
};
export default function Page() { return <FieldSignup/>; }
