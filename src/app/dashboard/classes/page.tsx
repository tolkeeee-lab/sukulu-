import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import ClassesClient from './ClassesClient'

export type Classe = {
  id: string
  name: string
  level: string | null
  teacher_id: string | null
  school_year: string
  teacherName: string | null
  eleveCount: number
}

export type Enseignant = {
  id: string
  full_name: string
}

function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 9) return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

export default async function ClassesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  if (!userId) return <div>Non autorisé</div>

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('id', userId)
    .single()

  const schoolId = profile?.school_id as string | undefined
  const school = profile?.schools as { name: string } | null
  const schoolYear = getCurrentSchoolYear()

  if (!schoolId) return <div>École introuvable</div>

  const [classesRes, studentsCountRes, enseignantsRes, classesSansMaitreRes, studentsPerClassRes] =
    await Promise.all([
      supabase
        .from('classes')
        .select('id, name, level, teacher_id, school_year, profiles!classes_teacher_id_fkey(full_name)')
        .eq('school_id', schoolId)
        .eq('school_year', schoolYear),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('school_year', schoolYear)
        .eq('is_archived', false),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .eq('is_active', true),
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('school_year', schoolYear)
        .is('teacher_id', null),
      supabase
        .from('students')
        .select('class_id')
        .eq('school_id', schoolId)
        .eq('school_year', schoolYear)
        .eq('is_archived', false),
    ])

  // Count students per class
  const studentCountByClass: Record<string, number> = {}
  for (const s of studentsPerClassRes.data ?? []) {
    const cid = (s as { class_id: string | null }).class_id
    if (cid) {
      studentCountByClass[cid] = (studentCountByClass[cid] ?? 0) + 1
    }
  }

  const classes: Classe[] = (classesRes.data ?? []).map(
    (c: {
      id: string
      name: string
      level: string | null
      teacher_id: string | null
      school_year: string
      profiles: { full_name: string }[] | { full_name: string } | null
    }) => {
      let teacherName: string | null = null
      if (Array.isArray(c.profiles)) {
        teacherName = c.profiles[0]?.full_name ?? null
      } else if (c.profiles) {
        teacherName = (c.profiles as { full_name: string }).full_name
      }
      return {
        id: c.id,
        name: c.name,
        level: c.level,
        teacher_id: c.teacher_id,
        school_year: c.school_year,
        teacherName,
        eleveCount: studentCountByClass[c.id] ?? 0,
      }
    }
  )

  const enseignants: Enseignant[] = (enseignantsRes.data ?? []).map(
    (e: { id: string; full_name: string }) => ({ id: e.id, full_name: e.full_name })
  )

  return (
    <ClassesClient
      classes={classes}
      enseignants={enseignants}
      totalEleves={studentsCountRes.count ?? 0}
      classesSansMaitre={classesSansMaitreRes.count ?? 0}
      schoolYear={schoolYear}
      schoolName={school?.name ?? ''}
    />
  )
}
