'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.log('SW error:', err))
    }

    // Détecter si déjà installé (mode standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    // Bannière installation Android
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Afficher la bannière après 3 secondes
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Sur iOS, montrer la bannière si pas installé
    if (ios) {
      setTimeout(() => setShowBanner(true), 4000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    const prompt = installPrompt as any
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
    }
    setInstallPrompt(null)
  }

  if (isInstalled || !showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 72,  // Au-dessus de la bottom nav
      left: 12,
      right: 12,
      background: '#1B4332',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 300,
      boxShadow: '0 8px 32px rgba(27,67,50,0.4)',
      animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      {/* Icône */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: '#F4A261', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1B4332',
      }}>
        S
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
          Installer Sukulu
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
          {isIOS
            ? 'Appuyez sur ⬆️ puis "Sur l\'écran d\'accueil"'
            : 'Accès rapide depuis votre écran d\'accueil'
          }
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 7,
            color: 'rgba(255,255,255,0.7)',
            padding: '6px 10px', fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Plus tard
        </button>
        {!isIOS && (
          <button
            onClick={handleInstall}
            style={{
              background: '#F4A261',
              border: 'none', borderRadius: 7,
              color: '#1B4332', fontWeight: 600,
              padding: '6px 12px', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Installer
          </button>
        )}
      </div>
    </div>
  )
}
