import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('=== DASHBOARD LAYOUT ===')
  console.log('USER ID:', user?.id ?? 'NULL')
  console.log('USER ERROR:', userError?.message ?? 'none')

  let fullName = ''
  let role = ''

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    console.log('PROFILE:', JSON.stringify(profile))
    console.log('PROFILE ERROR:', profileError?.message ?? 'none')

    fullName = profile?.full_name ?? ''
    role = profile?.role ?? ''
  }

  return (
    <>
      <Navbar fullName={fullName} role={role} />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        <Sidebar fullName={fullName} role={role} />
        <main style={{ flex: 1, padding: '22px 24px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </>
  )
}
