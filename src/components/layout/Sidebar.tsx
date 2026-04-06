'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getRoleLabel, getRoleIcon, getInitials } from '@/lib/utils/user'

interface SidebarProps {
  fullName: string
  role: string
  schoolName?: string
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  icon: string
  label: string
  href: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [{ icon: '🏠', label: 'Accueil', href: '/dashboard/accueil' }],
  },
  {
    title: 'Académique',
    items: [
      { icon: '👦', label: 'Élèves', href: '/dashboard/eleves' },
      { icon: '🏫', label: 'Classes', href: '/dashboard/classes' },
      { icon: '📝', label: 'Notes & Bulletins', href: '/dashboard/notes' },
      { icon: '📅', label: 'Absences', href: '/dashboard/absences' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { icon: '💰', label: 'Finances', href: '/dashboard/finances' },
      { icon: '👥', label: 'Personnel', href: '/dashboard/personnel' },
      { icon: '💬', label: 'Messages', href: '/dashboard/messages' },
      { icon: '🤝', label: 'Délégation', href: '/dashboard/delegation' },
    ],
  },
]

const bottomItems: NavItem[] = [
  { icon: '📅', label: 'Emploi du temps', href: '/dashboard/emploi-du-temps' },
  { icon: '⚙️', label: 'Paramètres', href: '/dashboard/parametres' },
  { icon: '🚪', label: 'Déconnexion', href: '/auth/signout' },
]

export default function Sidebar({ fullName, role, schoolName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const navItemStyle = (href: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: isMobile ? '10px 12px' : '7px 12px',
    minHeight: isMobile ? 44 : 'auto',
    borderRadius: 7,
    textDecoration: 'none',
    fontSize: 12.5,
    fontWeight: isActive(href) ? 600 : 400,
    color: isActive(href) ? '#1B4332' : '#374151',
    background: isActive(href) ? '#D8F3DC' : 'transparent',
    transition: 'background 0.15s, color 0.15s',
    cursor: 'pointer',
  })

  const sidebarWidth = isMobile ? 280 : 220

  return (
    <>
      {/* Overlay semi-transparent sur mobile quand ouvert */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 149,
          }}
        />
      )}

      <aside
        style={{
          background: '#ffffff',
          width: sidebarWidth,
          minWidth: sidebarWidth,
          borderRight: '1px solid #d1fae5',
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? 0 : 56,
          left: 0,
          height: isMobile ? '100vh' : 'calc(100vh - 56px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: isMobile ? 150 : 'auto',
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: 'transform 0.28s ease',
          boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {/* Bouton fermer sur mobile */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '10px 12px 0',
          }}>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: 'none',
                background: '#f3f4f6',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* User card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1B4332 0%, #40916C 100%)',
            margin: 12,
            borderRadius: 10,
            padding: '14px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: '#F4A261',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            {getInitials(fullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName || '—'}
            </div>
            {role && (
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.70)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 1,
                }}
              >
                <span>{getRoleIcon(role)}</span>
                <span>{getRoleLabel(role)}</span>
              </div>
            )}
            {schoolName && (
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                🏫 {schoolName}
              </div>
            )}
          </div>
        </div>

        {/* Navigation principale */}
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ marginBottom: 8 }}>
              {section.title && (
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '6px 12px 4px',
                  }}
                >
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={navItemStyle(item.href)}
                  onClick={() => { if (isMobile) onClose() }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bas de sidebar */}
        <div style={{ padding: '4px 8px 12px', borderTop: '1px solid #f0faf3' }}>
          {bottomItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                ...navItemStyle(item.href),
                ...(item.href === '/auth/signout' ? { color: '#dc2626' } : {}),
              }}
              onClick={() => { if (isMobile) onClose() }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </aside>
    </>
  )
}
