import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXO ARCADE — Juega sin instalar",
  description:
    "Portal de juegos de código abierto y clásicos retro que se ejecutan directamente en tu navegador. Tus archivos nunca salen de tu dispositivo.",
  keywords: [
    "NEXO ARCADE",
    "juegos código abierto",
    "retro",
    "emulador navegador",
    "EmulatorJS",
    "OpenArena",
    "Freedoom",
  ],
  authors: [{ name: "NEXO STUDIO" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "NEXO ARCADE — Juega sin instalar",
    description:
      "Juegos libres y clásicos retro, directamente en tu navegador. Tus archivos nunca salen de tu dispositivo.",
    siteName: "NEXO ARCADE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXO ARCADE — Juega sin instalar",
    description:
      "Juegos libres y clásicos retro, directamente en tu navegador.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-nexo-bg text-nexo-cream`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
