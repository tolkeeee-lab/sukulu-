import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import DashboardDirecteurClient from './DashboardDirecteurClient'

function getTeacherName(profiles: { full_name: string }[] | { full_name: string } | null): string {
  if (!profiles) return '—'
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? '—'
  return profiles.full_name
}

function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 9) return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

export default async function AccueilPage() {
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
  const today = new Date().toISOString().split('T')[0]

  if (!schoolId) return <div>École introuvable</div>

  const [
    studentsRes,
    classesCountRes,
    personnelRes,
    paymentsRes,
    feeTypesRes,
    absencesTodayRes,
    gradesRes,
    activityRes,
    notifRes,
    classesRes,
    inscriptionsRes,
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_archived', false).eq('school_year', schoolYear),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('school_year', schoolYear),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true).in('role', ['teacher', 'accountant']),
    supabase.from('payments').select('amount, status, paid_at').eq('school_id', schoolId),
    supabase.from('fee_types').select('amount').eq('school_id', schoolId).eq('school_year', schoolYear),
    supabase.from('attendances').select('id, status, reason').eq('school_id', schoolId).eq('date', today).in('status', ['absent', 'late']),
    supabase.from('grades').select('grade, max_grade').eq('school_id', schoolId).eq('trimestre', 1),
    supabase.from('audit_logs').select('id, action, entity, entity_id, created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_read', false),
    supabase.from('classes').select('id, name, teacher_id, profiles!classes_teacher_id_fkey(full_name)').eq('school_id', schoolId).eq('school_year', schoolYear),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('school_year', schoolYear).eq('status', 'pending'),
  ])

  const payments = paymentsRes.data ?? []

  const totalEncaisse = payments
    .filter((p: { status: string }) => p.status === 'success' || p.status === 'paid')
    .reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)

  const paiementsImpayes = payments.filter((p: { status: string }) =>
    p.status === 'pending' || p.status === 'unpaid' || p.status === 'overdue' || p.status === 'late'
  )
  const totalImpayes = paiementsImpayes.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
  const nbImpayes = paiementsImpayes.length

  const totalStudents = studentsRes.count ?? 0
  const feeTotal = (feeTypesRes.data ?? []).reduce((s: number, f: { amount: number }) => s + Number(f.amount), 0)
  const totalAttendu = feeTotal > 0 && totalStudents > 0 ? feeTotal * totalStudents : 0
  const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0

  const absencesToday = absencesTodayRes.data ?? []
  const absencesAujourdhui = absencesToday.length
  const absencesNonJustifiees = absencesToday.filter(
    (a: { status: string; reason: string | null }) => a.status === 'absent' && !a.reason
  ).length

  const grades = gradesRes.data ?? []
  const moyenneGenerale: number | null = grades.length > 0
    ? Math.round((grades.reduce((s: number, g: { grade: number; max_grade: number }) =>
        s + (Number(g.grade) / Number(g.max_grade)) * 20, 0) / grades.length) * 10) / 10
    : null

  const moisLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou']
  const moisNums =   [9,     10,    11,    12,    1,     2,     3,     4,     5,     6,     7,     8   ]
  const encaissementsParMois = moisLabels.map((mois, i) => {
    const idx = moisNums[i]
    const montant = payments
      .filter((p: { status: string; paid_at: string | null }) =>
        (p.status === 'success' || p.status === 'paid') && p.paid_at)
      .filter((p: { paid_at: string }) => new Date(p.paid_at).getMonth() + 1 === idx)
      .reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
    return { mois, montant }
  })

  const classesStats = (classesRes.data ?? []).map(
    (c: { id: string; name: string; profiles: { full_name: string }[] | { full_name: string } | null }) => ({
      id: c.id,
      name: c.name,
      totalEleves: 0,
      enseignant: getTeacherName(c.profiles),
      moyenne: null as number | null,
    })
  )

  const activiteRecente = (activityRes.data ?? []).map(
    (a: { id: number | string; action: string; entity: string; entity_id: string | null; created_at: string }) => ({
      id: String(a.id),
      action: a.action,
      entity: a.entity,
      entity_id: a.entity_id ?? null,
      created_at: a.created_at,
    })
  )

  return (
    <DashboardDirecteurClient
      schoolName={school?.name ?? ''}
      totalStudents={totalStudents}
      totalClasses={classesCountRes.count ?? 0}
      totalPersonnel={personnelRes.count ?? 0}
      totalEncaisse={totalEncaisse}
      totalImpayes={totalImpayes}
      nbImpayes={nbImpayes}
      tauxRecouvrement={tauxRecouvrement}
      absencesAujourdhui={absencesAujourdhui}
      absencesNonJustifiees={absencesNonJustifiees}
      moyenneGenerale={moyenneGenerale}
      encaissementsParMois={encaissementsParMois}
      classesStats={classesStats}
      activiteRecente={activiteRecente}
      notificationsNonLues={notifRes.count ?? 0}
      inscriptionsEnAttente={inscriptionsRes.count ?? 0}
    />
  )
}
