import { redirect } from 'next/navigation'
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
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/dashboard/setup')

  return (
    <>
      <Navbar fullName={profile?.full_name ?? ''} role={profile?.role ?? ''} />
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Sidebar fullName={profile?.full_name ?? ''} role={profile?.role ?? ''} />
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
