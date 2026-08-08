import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootAttributionTracker } from "@/components/RootAttributionTracker";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPromptProvider } from "@/lib/onboarding/InstallPromptProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SHARE_DESCRIPTION, SHARE_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f0c] text-neutral-100">
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
