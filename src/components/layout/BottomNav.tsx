'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const barItems = [
  { icon: '🏠', label: 'Accueil',  href: '/dashboard/accueil' },
  { icon: '👦', label: 'Élèves',   href: '/dashboard/eleves' },
  { icon: '🏫', label: 'Classes',  href: '/dashboard/classes' },
  { icon: '💰', label: 'Finances', href: '/dashboard/finances' },
]

const drawerItems = [
  { icon: '📝', label: 'Notes & Bulletins',  href: '/dashboard/notes',          danger: false },
  { icon: '📅', label: 'Absences',           href: '/dashboard/absences',        danger: false },
  { icon: '👥', label: 'Personnel',          href: '/dashboard/personnel',       danger: false },
  { icon: '💬', label: 'Messages',           href: '/dashboard/messages',        danger: false },
  { icon: '🤝', label: 'Délégation',         href: '/dashboard/delegation',      danger: false },
  { icon: '📅', label: 'Emploi du temps',    href: '/dashboard/emploi-du-temps', danger: false },
  { icon: '⚙️', label: 'Paramètres',         href: '/dashboard/parametres',      danger: false },
  { icon: '🚪', label: 'Déconnexion',        href: '/auth/signout',              danger: true  },
]

// Seuil de déplacement tactile (en px) pour fermer le drawer par swipe vers le bas
const SWIPE_CLOSE_THRESHOLD = 80

export default function BottomNav() {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > SWIPE_CLOSE_THRESHOLD) setDrawerOpen(false)
    touchStartY.current = null
  }

  if (!isMobile) return null

  return (
    <>
      {/* ── Bottom bar ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: '#ffffff',
          borderTop: '1px solid #d1fae5',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 150,
          boxShadow: '0 -2px 12px rgba(27,67,50,0.08)',
        }}
      >
        {barItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textDecoration: 'none',
                color: active ? '#1B4332' : '#6b7280',
                minHeight: 44,
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{
                fontSize: 9,
                fontWeight: active ? 600 : 400,
                fontFamily: "'Source Sans 3', sans-serif",
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 20,
                  height: 3,
                  background: '#1B4332',
                  borderRadius: '3px 3px 0 0',
                }} />
              )}
            </Link>
          )
        })}

        {/* ⋯ Plus — opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: drawerOpen ? '#1B4332' : '#6b7280',
            minHeight: 44,
            fontFamily: "'Source Sans 3', sans-serif",
            padding: 0,
          }}
        >
          <span style={{ fontSize: 20 }}>⋯</span>
          <span style={{ fontSize: 9, fontWeight: drawerOpen ? 600 : 400 }}>Plus</span>
        </button>
      </nav>

      {/* ── Overlay ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 151,
          }}
        />
      )}

      {/* ── Drawer depuis le bas ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          zIndex: 152,
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          padding: 16,
          paddingBottom: 80,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2 }} />
        </div>

        {/* Titre */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 16,
          color: '#1B4332',
          marginBottom: 12,
        }}>
          Navigation
        </div>

        {/* Liens */}
        {drawerItems.map(item => {
          const active = isActive(item.href)
          if (item.href === '/auth/signout') {
            // Utilise <a> pour provoquer un rechargement complet de page (signout serveur)
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                  borderRadius: 8,
                  padding: '0 12px',
                  textDecoration: 'none',
                  color: '#dc2626',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setDrawerOpen(false)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                height: 52,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                borderRadius: 8,
                padding: '0 12px',
                textDecoration: 'none',
                color: active ? '#1B4332' : '#374151',
                background: active ? '#D8F3DC' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setDrawerOpen(false)}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
