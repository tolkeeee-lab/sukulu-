'use client'

import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import { useIsMobile } from '@/hooks/useIsMobile'

interface DashboardShellProps {
  children: React.ReactNode
  fullName: string
  role: string
  schoolName: string
}

export default function DashboardShell({ children, fullName, role, schoolName }: DashboardShellProps) {
  const isMobile = useIsMobile()

  return (
    <>
      <Navbar
        fullName={fullName}
        role={role}
        schoolName={schoolName}
      />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar
          fullName={fullName}
          role={role}
          schoolName={schoolName}
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

      <BottomNav />
    </>
  )
}

