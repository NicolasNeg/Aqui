import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Aquí — Navegación, información y acceso por QR',
  description:
    'El sistema que guía, informa y controla acceso en cualquier espacio. Sin apps. Sin instalaciones. Solo QR.',
  keywords: ['wayfinding', 'navegación', 'eventos', 'tickets', 'QR', 'mapa'],
  authors: [{ name: 'Aquí' }],
  openGraph: {
    title: 'Aquí — Navegación por QR',
    description: 'Guía, informa y controla acceso en cualquier espacio.',
    type: 'website',
    locale: 'es_MX'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1B2E',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
