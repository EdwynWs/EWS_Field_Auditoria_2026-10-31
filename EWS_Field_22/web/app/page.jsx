import FieldLandingPremium from "../components/landing/FieldLandingPremium";
import "./field-premium.css";

export const metadata = {
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: "EWS Field | Gestão de equipes e operações em campo",
  description:
    "Ordens de serviço, técnicos, visitas com GPS e relatórios em uma plataforma para conectar escritório e operação externa. Conheça o EWS Field.",
  keywords: [
    "gestão de equipes externas",
    "ordem de serviço",
    "assistência técnica",
    "sistema para técnicos",
    "gestão de campo",
    "EWS Field",
  ],
  openGraph: {
    title: "EWS Field — Sua operação inteira, conectada.",
    description:
      "Uma plataforma para organizar ordens, conectar técnicos e acompanhar atendimentos em campo.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/landing/og-field.png",
        width: 1200,
        height: 630,
        alt: "EWS Field — Operação conectada",
      },
    ],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/ews-field-mark.svg" },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "EWS Field",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, Android",
            publisher: { "@type": "Organization", name: "EWS Tech" },
          }),
        }}
      />
      <FieldLandingPremium
        signupEnabled={process.env.PUBLIC_SIGNUP_LINK_ENABLED === "true"}
      />
    </>
  );
}
