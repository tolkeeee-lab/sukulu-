'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  fullName: string
  role: string
  schoolName: string
}

const bottomNavItems = [
  { icon: '🏠', label: 'Accueil',  href: '/dashboard/accueil' },
  { icon: '👦', label: 'Élèves',   href: '/dashboard/eleves' },
  { icon: '🏫', label: 'Classes',  href: '/dashboard/classes' },
  { icon: '💰', label: 'Finances', href: '/dashboard/finances' },
  { icon: '💬', label: 'Messages', href: '/dashboard/messages' },
]

export default function DashboardShell({ children, fullName, role, schoolName }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fermer la sidebar quand on change de page sur mobile
  useEffect(() => {
    if (isMobile) setMenuOpen(false)
  }, [pathname, isMobile])

  function toggleMenu() {
    setMenuOpen(prev => !prev)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <Navbar
        fullName={fullName}
        role={role}
        schoolName={schoolName}
        onMenuToggle={toggleMenu}
        menuOpen={menuOpen}
      />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar
          fullName={fullName}
          role={role}
          schoolName={schoolName}
          isOpen={menuOpen}
          onClose={closeMenu}
        />
        <main
          style={{
            flex: 1,
            padding: isMobile ? '12px' : '22px 24px',
            overflowY: 'auto',
            minWidth: 0,
            paddingBottom: isMobile ? 72 : undefined,
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom navigation bar — visible sur mobile uniquement */}
      {isMobile && (
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
            alignItems: 'center',
            zIndex: 120,
            boxShadow: '0 -2px 12px rgba(27,67,50,0.08)',
          }}
        >
          {bottomNavItems.map(item => {
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
                  gap: 3,
                  textDecoration: 'none',
                  color: active ? '#1B4332' : '#9ca3af',
                  minHeight: 60,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'Source Sans 3', sans-serif",
                }}>
                  {item.label}
                </span>
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: 32,
                    height: 3,
                    background: '#1B4332',
                    borderRadius: '3px 3px 0 0',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
