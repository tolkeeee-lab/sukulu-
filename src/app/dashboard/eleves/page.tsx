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

  // Récupérer school_id depuis le profil (déjà dispo dans le layout)
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

  // ── Fetch en parallèle ──
  const [
    { data: students },
    { data: classes },
    { data: payments },
    { data: attendances },
    { data: archivedStudents },
  ] = await Promise.all([

    // Élèves actifs avec classe + parent
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

    // Classes
    supabase
      .from('classes')
      .select('id, name, level')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),

    // Paiements
    supabase
      .from('payments')
      .select('student_id, status, amount, paid_at, payment_method, receipt_number')
      .eq('school_id', schoolId),

    // Absences
    supabase
      .from('attendances')
      .select('student_id, status, date, reason')
      .eq('school_id', schoolId),

    // Élèves archivés
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

  return (
    <ElevesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      students={students ?? []}
      classes={classes ?? []}
      payments={payments ?? []}
      attendances={attendances ?? []}
      archivedStudents={archivedStudents ?? []}
    />
  )
}
