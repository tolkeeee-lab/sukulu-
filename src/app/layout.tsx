import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'Sukulu — Gestion Scolaire',
  description: 'Plateforme de gestion scolaire intelligente pour les écoles africaines',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sukulu',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sukulu" />
        {/* Classic : icône principale blanche */}
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Mono : favicon browser vert clair */}
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <meta name="msapplication-TileColor" content="#1B4332" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
