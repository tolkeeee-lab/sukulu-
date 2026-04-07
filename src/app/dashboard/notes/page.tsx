import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import NotesClient from './NotesClient'

export default async function NotesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return <div style={{ padding: 24, color: '#dc2626' }}>Non autorisé</div>

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, full_name')
    .eq('id', userId)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) return <div style={{ padding: 24, color: '#dc2626' }}>École introuvable</div>

  const now = new Date()
  const y = now.getFullYear()
  const schoolYear = now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`

  const [classesRes, subjectsRes, gradesRes, studentsRes] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, teacher_id')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),
    supabase
      .from('subjects')
      .select('id, name, coefficient, class_id, teacher_id')
      .eq('school_id', schoolId),
    supabase
      .from('grades')
      .select('id, student_id, subject_id, class_id, teacher_id, grade, max_grade, trimestre, comment, created_at')
      .eq('school_id', schoolId),
    supabase
      .from('students')
      .select('id, first_name, last_name, matricule, class_id')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .eq('is_archived', false)
      .order('last_name'),
  ])

  return (
    <NotesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      classes={classesRes.data ?? []}
      subjects={subjectsRes.data ?? []}
      grades={gradesRes.data ?? []}
      students={studentsRes.data ?? []}
    />
  )
}
