import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content OS — Neuro Presencia",
  description: "Calendario de contenido con IA — Supraconciencia, Metacognición, Neuroplasticidad",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-32.png",  sizes: "32x32",   type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon-32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Content OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" sizes="32x32"   href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180"      href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-black text-white antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
