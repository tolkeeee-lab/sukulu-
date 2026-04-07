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
        .catch((err) => console.error('SW registration error:', err))
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
      bottom: 80,
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
    }}>
      {/* Icône Classic */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: '#1B4332', border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="36" height="36" viewBox="0 0 512 512">
          <rect width="512" height="512" rx="96" fill="#1B4332"/>
          <text x="256" y="348" fontFamily="Georgia,serif" fontSize="320" fontWeight="700" textAnchor="middle" fill="#ffffff">S</text>
        </svg>
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
          Installer Sukulu
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
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
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 7,
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
              background: '#ffffff',
              border: 'none', borderRadius: 7,
              color: '#1B4332', fontWeight: 700,
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
