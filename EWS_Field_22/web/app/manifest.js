export default function manifest() {
  return {
    name: 'EWS Field — Operações em campo',
    short_name: 'EWS Field',
    description: 'Gestão de ordens de serviço e equipes externas.',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1220',
    theme_color: '#2563eb',
    lang: 'pt-BR',
    icons: [192, 512].map(size => ({ src: `/icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
  };
}
