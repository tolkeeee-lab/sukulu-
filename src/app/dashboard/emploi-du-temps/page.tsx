import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import EmploiDuTempsClient from './EmploiDuTempsClient'

export default async function EmploiDuTempsPage() {
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

  const [classesRes, teachersRes, schedulesRes] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, teacher_id')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('school_id', schoolId)
      .eq('role', 'teacher'),
    supabase
      .from('schedules')
      .select('id, school_id, class_id, teacher_id, subject, day_of_week, slot_index, room, recurrence, school_year')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear),
  ])

  return (
    <EmploiDuTempsClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      schoolName={schoolName}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      classes={classesRes.data ?? []}
      teachers={teachersRes.data ?? []}
      schedules={schedulesRes.data ?? []}
    />
  )
}
