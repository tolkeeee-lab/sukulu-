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

  // Récupérer les paiements existants pour cet élève et ce trimestre
  const { data: existing } = await supabase
    .from('payments')
    .select('id, amount, status')
    .eq('school_id', schoolId)
    .eq('student_id', body.student_id)
    .eq('term', body.term ?? 1)
    .maybeSingle()

  const receiptNumber = `REC-${Date.now()}`

  if (existing?.id) {
    const newTotal = (existing.amount ?? 0) + body.amount
    const { data, error } = await supabase
      .from('payments')
      .update({
        amount: newTotal,
        payment_method: body.payment_method ?? null,
        receipt_number: receiptNumber,
        paid_at: new Date().toISOString(),
        status: 'partial',
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ payment: data })
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      school_id: schoolId,
      student_id: body.student_id,
      amount: body.amount,
      status: 'partial',
      payment_method: body.payment_method ?? null,
      receipt_number: receiptNumber,
      paid_at: new Date().toISOString(),
      term: body.term ?? 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payment: data }, { status: 201 })
}
