import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PersonnelClient from './PersonnelClient'

export default async function PersonnelPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) redirect('/login')

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, full_name')
    .eq('id', userId)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, momo_phone, avatar_url, is_active, created_at')
    .eq('school_id', profile.school_id)
    .not('role', 'in', '("parent","student")')
    .order('role')

  return (
    <PersonnelClient
      schoolId={profile.school_id}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      staff={staff ?? []}
    />
  )
}
