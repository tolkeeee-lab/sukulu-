'use client'

import { getRoleLabel, getRoleIcon, getInitials } from '@/lib/utils/user'

interface NavbarProps {
  fullName: string
  role: string
}

export default function Navbar({ fullName, role }: NavbarProps) {
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
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        <span
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#ffffff',
            letterSpacing: '-0.3px',
          }}
        >
          Sukulu
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {role && (
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

        {fullName && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
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
      </div>
    </header>
  )
}
