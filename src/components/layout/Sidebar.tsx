'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
      { icon: '💰', label: 'Finances', href: '/dashboard/employes' },
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

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const navItemStyle = (href: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 12px',
    borderRadius: 7,
    textDecoration: 'none',
    fontSize: 12.5,
    fontWeight: isActive(href) ? 600 : 400,
    color: isActive(href) ? '#1B4332' : '#374151',
    background: isActive(href) ? '#D8F3DC' : 'transparent',
    transition: 'background 0.15s, color 0.15s',
    cursor: 'pointer',
  })

  return (
    <aside
      style={{
        background: '#ffffff',
        width: 220,
        minWidth: 220,
        borderRight: '1px solid #d1fae5',
        position: 'sticky',
        top: 56,
        height: 'calc(100vh - 56px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Director card */}
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
          KD
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>M. Komlan</div>
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
            <span>👑</span>
            <span>Directeur</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
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
              <Link key={item.href} href={item.href} style={navItemStyle(item.href)}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom items */}
      <div style={{ padding: '4px 8px 12px', borderTop: '1px solid #f0faf3' }}>
        {bottomItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              ...navItemStyle(item.href),
              ...(item.href === '/auth/signout' ? { color: '#dc2626' } : {}),
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}
