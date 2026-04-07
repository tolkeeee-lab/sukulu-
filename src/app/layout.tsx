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
  openGraph: {
    type: 'website',
    title: 'Sukulu — Gestion Scolaire',
    description: 'Plateforme de gestion scolaire pour les écoles africaines',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.svg', type: 'image/svg+xml' }],
    apple: '/icons/icon-192.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1B4332',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
