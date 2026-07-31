import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootAttributionTracker } from "@/components/RootAttributionTracker";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPromptProvider } from "@/lib/onboarding/InstallPromptProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timao e Pumba Tips",
  description: "Jogos, analises esportivas e comunidade. Uso exclusivo para maiores de 18 anos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Timao e Pumba",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a5c36",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
          <RootAttributionTracker />
          <ServiceWorkerRegistration />
          {children}
        </InstallPromptProvider>
      </body>
    </html>
  );
}
