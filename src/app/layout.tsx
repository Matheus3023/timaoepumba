import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { RootAttributionTracker } from "@/components/RootAttributionTracker";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPromptProvider } from "@/lib/onboarding/InstallPromptProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SHARE_DESCRIPTION, SHARE_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";

/* Tipografia do DESIGN.md (âncora Sports HUD). Arquivos servidos do próprio
   domínio a partir de src/fonts — Google Fonts CDN em produção adiciona um
   terceiro no caminho crítico e vaza IP do usuário. Subset latino, que cobre
   os acentos do português. */

/* Display: o condensado é o que dá cara de transmissão — cabe placar, minuto e
   liga na mesma largura. Usado em título, rótulo de HUD e número de destaque. */
const displayFont = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../fonts/BarlowCondensed-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/BarlowCondensed-Bold.woff2", weight: "700", style: "normal" },
  ],
});

/* Corpo: Barlow normal, mesma família do display, então o par tem parentesco
   sem parecer a mesma fonte repetida. */
const bodyFont = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../fonts/Barlow-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Barlow-SemiBold.woff2", weight: "600", style: "normal" },
  ],
});

/* Dado: todo número passa por aqui, com tabular-nums ligado no globals.css para
   os dígitos não dançarem quando o placar vira. */
const dataFont = localFont({
  variable: "--font-data",
  display: "swap",
  src: [
    { path: "../fonts/JetBrainsMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/JetBrainsMono-Bold.woff2", weight: "700", style: "normal" },
  ],
});

/* As telas antigas referenciam --font-geist-sans/--font-geist-mono direto.
   Reapontar os nomes legados aqui faz as 34 rotas herdarem a tipografia nova
   sem editar componente por componente; conforme cada tela for repaginada, a
   referência legada sai junto. */
const fontVariables = [
  displayFont.variable,
  bodyFont.variable,
  dataFont.variable,
  "[--font-geist-sans:var(--font-body)]",
  "[--font-geist-mono:var(--font-data)]",
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Timão e Pumba Tips | Jogos ao vivo, análises e comunidade",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Acompanhe jogos ao vivo, leia as análises da equipe e participe da comunidade Timão e Pumba. Conteúdo informativo, sem promessa de resultado, para maiores de 18 anos.",
  applicationName: SITE_NAME,
  category: "sports",
  keywords: [
    "jogos ao vivo",
    "placar ao vivo",
    "análises esportivas",
    "estatísticas de futebol",
    "comunidade de torcedores",
    "Timão e Pumba",
  ],
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  /* O card que aparece quando alguem cola o link no WhatsApp. A imagem vem
     do arquivo src/app/opengraph-image.tsx (1200x630), que o Next injeta
     sozinho em og:image e twitter:image, com width/height/type corretos. */
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Timão e Pumba",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  /* Era o verde da marca, que destoava da barra de status em cima de uma
     interface quase preta. Agora acompanha o fundo do app, entao a barra
     do navegador some dentro da tela (mesmo valor do manifest). */
  themeColor: "#080b09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--hud-void)] text-[var(--hud-body)]">
        <InstallPromptProvider>
          <ToastProvider>
            <RootAttributionTracker />
            <ServiceWorkerRegistration />
            {children}
          </ToastProvider>
        </InstallPromptProvider>
      </body>
    </html>
  );
}
