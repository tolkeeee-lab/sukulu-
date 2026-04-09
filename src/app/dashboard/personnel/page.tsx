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
    .select('school_id, role, full_name, schools(name)')
    .eq('id', userId)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const schoolId = profile.school_id
  const schoolsData = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools
  const schoolName = (schoolsData as { name?: string } | null)?.name ?? ''

  const schoolYear = (() => {
    const now = new Date()
    const y = now.getFullYear()
    return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })()

  const [staffRes, classesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, salary, salary_paid, email, phone, created_at')
      .eq('school_id', schoolId)
      .in('role', ['teacher', 'director', 'accountant', 'admin'])
      .order('role'),
    supabase
      .from('classes')
      .select('id, name, teacher_id')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),
  ])

  return (
    <PersonnelClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      schoolName={schoolName}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      staff={staffRes.data ?? []}
      classes={classesRes.data ?? []}
    />
  )
}
