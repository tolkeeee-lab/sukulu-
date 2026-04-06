import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import ElevesClient from './ElevesClient'

export default async function ElevesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  if (!userId) return <div style={{ padding: 24, color: '#dc2626' }}>Non autorisé</div>

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', userId)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) return <div style={{ padding: 24, color: '#dc2626' }}>École introuvable</div>

  const schoolYear = (() => {
    const now = new Date()
    const y = now.getFullYear()
    return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })()

  const [
    { data: rawStudents },
    { data: classes },
    { data: payments },
    { data: attendances },
    { data: rawArchivedStudents },
  ] = await Promise.all([

    supabase
      .from('students')
      .select(`
        id, matricule, first_name, last_name,
        birth_date, photo_url, class_id, parent_id,
        is_archived, created_at,
        classes ( id, name, level ),
        profiles!students_parent_id_fkey ( id, full_name, phone )
      `)
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .eq('is_archived', false)
      .order('last_name', { ascending: true }),

    supabase
      .from('classes')
      .select('id, name, level')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),

    supabase
      .from('payments')
      .select('student_id, status, amount, paid_at, payment_method, receipt_number')
      .eq('school_id', schoolId),

    supabase
      .from('attendances')
      .select('student_id, status, date, reason')
      .eq('school_id', schoolId),

    supabase
      .from('students')
      .select(`
        id, matricule, first_name, last_name,
        class_id, created_at,
        classes ( id, name )
      `)
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .eq('is_archived', true)
      .order('last_name', { ascending: true }),
  ])

  // Normaliser les jointures : Supabase retourne des tableaux, on prend le premier élément
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalize = (data: any[] | null) =>
    (data ?? []).map((row) => ({
      ...row,
      classes: Array.isArray(row.classes) ? (row.classes[0] ?? null) : (row.classes ?? null),
      profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    }))

  const students = normalize(rawStudents)
  const archivedStudents = normalize(rawArchivedStudents)

  return (
    <ElevesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      students={students}
      classes={classes ?? []}
      payments={payments ?? []}
      attendances={attendances ?? []}
      archivedStudents={archivedStudents}
    />
  )
}