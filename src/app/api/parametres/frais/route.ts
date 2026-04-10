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

// GET /api/parametres/frais — list fee types for school
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const schoolYear = req.nextUrl.searchParams.get('school_year')

  const supabase = getSupabase()
  let query = supabase
    .from('fee_types')
    .select('id, name, amount, due_date, school_year')
    .eq('school_id', schoolId)
    .order('school_year', { ascending: false })

  if (schoolYear) query = query.eq('school_year', schoolYear)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feeTypes: data })
}

// POST /api/parametres/frais — create fee type
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    name: string
    amount: number
    due_date?: string | null
    school_year: string
  }

  if (!body.name || !body.amount || !body.school_year) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fee_types')
    .insert({
      school_id: schoolId,
      name: body.name,
      amount: body.amount,
      due_date: body.due_date ?? null,
      school_year: body.school_year,
    })
    .select('id, name, amount, due_date, school_year')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feeType: data }, { status: 201 })
}

// PATCH /api/parametres/frais?id=xxx — update fee type
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{
    name: string
    amount: number
    due_date: string | null
    school_year: string
  }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fee_types')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, name, amount, due_date, school_year')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feeType: data })
}

// DELETE /api/parametres/frais?id=xxx — delete fee type
export async function DELETE(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()
  const { error } = await supabase
    .from('fee_types')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
