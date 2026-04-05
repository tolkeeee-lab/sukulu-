import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sukulu — Gestion Scolaire',
  description: 'Plateforme de gestion scolaire intelligente pour les écoles africaines',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

