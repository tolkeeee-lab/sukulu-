import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let fullName = ''
  let role = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    fullName = profile?.full_name ?? ''
    role = profile?.role ?? ''
  }

  return (
    <>
      <Navbar fullName={fullName} role={role} />
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Sidebar fullName={fullName} role={role} />
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
