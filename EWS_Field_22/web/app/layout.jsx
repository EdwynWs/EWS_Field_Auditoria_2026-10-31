import PwaRegistration from './components/PwaRegistration';
export const viewport = { themeColor: '#2563eb' };

export const metadata = {
  ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL) } : {}),
  title: 'EWS Field | Operações em campo',
  description: 'Ordens de serviço, equipes e atendimentos conectados.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0 }}><PwaRegistration />{children}</body>
    </html>
  );
}
