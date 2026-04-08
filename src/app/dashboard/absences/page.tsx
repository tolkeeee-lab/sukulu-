import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AbsencesClient from './AbsencesClient'

export default async function AbsencesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) redirect('/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, full_name, schools(name, school_year)')
    .eq('id', userId)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const schoolId = profile.school_id
  const schoolsData = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools
  const schoolYear =
    (schoolsData as { school_year?: string } | null)?.school_year ??
    (() => {
      const now = new Date()
      const y = now.getFullYear()
      return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
    })()
  const schoolName = (schoolsData as { name?: string } | null)?.name ?? ''

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]

  const [classesRes, studentsRes, attendancesRes, teachersRes] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, teacher_id')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),
    supabase
      .from('students')
      .select('id, first_name, last_name, matricule, class_id, photo_url')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .eq('is_archived', false)
      .order('last_name'),
    supabase
      .from('attendances')
      .select('id, student_id, class_id, date, status, reason, recorded_by')
      .eq('school_id', schoolId)
      .gte('date', cutoffDate)
      .order('date', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('school_id', schoolId)
      .eq('role', 'teacher'),
  ])

  return (
    <AbsencesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      schoolName={schoolName}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      classes={classesRes.data ?? []}
      students={studentsRes.data ?? []}
      attendances={attendancesRes.data ?? []}
      teachers={teachersRes.data ?? []}
    />
  )
}
