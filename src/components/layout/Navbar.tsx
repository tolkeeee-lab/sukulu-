'use client'

import { getRoleLabel, getRoleIcon, getInitials } from '@/lib/utils/user'
import { useIsMobile } from '@/hooks/useIsMobile'

interface NavbarProps {
  fullName: string
  role: string
  schoolName?: string
  onMenuToggle: () => void
  menuOpen: boolean
}

export default function Navbar({ fullName, role, schoolName, onMenuToggle, menuOpen }: NavbarProps) {
  const isMobile = useIsMobile()

  return (
    <header
      style={{
        background: '#1B4332',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo + nom école */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: '#F4A261',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          S
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: 17,
              color: '#ffffff',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            Sukulu
          </div>
          {schoolName && (
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1,
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? 140 : 'none',
              }}
            >
              {schoolName}
            </div>
          )}
        </div>
      </div>

      {/* Droite : cloche + (badge rôle + nom sur desktop) + avatar + hamburger sur mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
        {/* Cloche notifications */}
        <div
          style={{
            width: 32,
            height: 32,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: 15,
            position: 'relative',
          }}
        >
          🔔
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              background: '#F4A261',
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Badge rôle — masqué sur mobile */}
        {!isMobile && role && (
          <div
            style={{
              background: 'rgba(244,162,97,0.18)',
              border: '1px solid rgba(244,162,97,0.35)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              color: '#F4A261',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{getRoleIcon(role)}</span>
            <span>{getRoleLabel(role)}</span>
          </div>
        )}

        {/* Nom — masqué sur mobile */}
        {!isMobile && fullName && (
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              fontWeight: 400,
            }}
          >
            {fullName}
          </span>
        )}

        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            background: '#F4A261',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {getInitials(fullName)}
        </div>

        {/* Bouton hamburger — visible sur mobile uniquement */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{
              width: 36,
              height: 36,
              background: menuOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
      </div>
    </header>
  )
}
