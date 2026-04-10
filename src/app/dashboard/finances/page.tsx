import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import FinancesClient from './FinancesClient'

export default async function FinancesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return <div style={{ padding: 24, color: '#dc2626' }}>Non autorisé</div>

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', userId)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) return <div style={{ padding: 24, color: '#dc2626' }}>École introuvable</div>

  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, school_year, annual_fee')
    .eq('id', schoolId)
    .single()

  const now = new Date()
  const y = now.getFullYear()
  const schoolYear = (schoolData?.school_year as string | null | undefined)
    ?? (now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`)

  const annualFee: number = (schoolData as { annual_fee?: number | null } | null)?.annual_fee ?? 150_000

  const [paymentsRes, staffRes] = await Promise.all([
    supabase
      .from('payments')
      .select('id, student_id, amount, status, payment_method, paid_at, receipt_number, term, students(id, first_name, last_name, matricule, classes(id, name))')
      .eq('school_id', schoolId)
      .order('paid_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, role, salary, salary_paid')
      .eq('school_id', schoolId)
      .in('role', ['enseignant', 'admin', 'directeur', 'comptable']),
  ])

  let budgetLines: Parameters<typeof FinancesClient>[0]['budgetLines'] = []
  try {
    const budgetRes = await supabase
      .from('budget_lines')
      .select('id, category, planned, actual, type, color')
      .eq('school_id', schoolId)
    budgetLines = (budgetRes.data ?? []) as typeof budgetLines
  } catch {
    // table may not exist yet
  }

  return (
    <FinancesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      annualFee={annualFee}
      payments={(paymentsRes.data ?? []) as unknown as Parameters<typeof FinancesClient>[0]['payments']}
      staff={staffRes.data ?? []}
      budgetLines={budgetLines}
    />
  )
}
