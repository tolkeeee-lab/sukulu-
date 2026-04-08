import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSchoolId(userId: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', userId)
    .single()
  return (data as { school_id: string | null } | null)?.school_id ?? null
}

// POST /api/payments — enregistrer un paiement
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    student_id: string
    amount: number
    payment_method?: string
    reference?: string
    term?: number
  }

  if (!body.student_id || !body.amount) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Get total already paid for this student/term
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('school_id', schoolId)
    .eq('student_id', body.student_id)
    .eq('term', body.term ?? 1)

  const alreadyPaid = (existingPayments ?? []).reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0)
  const newTotal = alreadyPaid + body.amount
  const receiptNumber = `REC-${Date.now()}`

  // Insert a new payment record (each payment is its own record)
  const { data, error } = await supabase
    .from('payments')
    .insert({
      school_id: schoolId,
      student_id: body.student_id,
      amount: body.amount,
      status: 'partial', // individual record status; full status computed client-side
      payment_method: body.payment_method ?? null,
      receipt_number: receiptNumber,
      paid_at: new Date().toISOString(),
      term: body.term ?? 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the new payment + updated total so client can recompute status
  return NextResponse.json({ payment: data, newTotal }, { status: 201 })
}
