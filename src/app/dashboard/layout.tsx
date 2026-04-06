import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  let fullName = ''
  let role = ''
  let schoolName = ''

  if (userId) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role, schools(name)')
      .eq('id', userId)
      .single()

    fullName = profile?.full_name ?? ''
    role = profile?.role ?? ''
    schoolName = (profile?.schools as unknown as { name: string } | null)?.name ?? ''
  }

  return (
    <>
      <Navbar fullName={fullName} role={role} schoolName={schoolName} />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar fullName={fullName} role={role} schoolName={schoolName} />
        <main
          style={{
            flex: 1,
            padding: '22px 24px',
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
