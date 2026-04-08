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

// GET /api/attendances?class_id=xxx&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const classId = req.nextUrl.searchParams.get('class_id')
  const date = req.nextUrl.searchParams.get('date')

  const supabase = getSupabase()
  let query = supabase
    .from('attendances')
    .select('id, student_id, class_id, date, status, reason, recorded_by')
    .eq('school_id', schoolId)

  if (classId) query = query.eq('class_id', classId)
  if (date) query = query.eq('date', date)

  const { data, error } = await query.order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attendances: data })
}

// POST /api/attendances — créer ou upsert un enregistrement
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    student_id: string
    class_id: string
    date: string
    status: 'present' | 'absent' | 'late' | 'excused'
    reason?: string | null
  }

  if (!body.student_id || !body.class_id || !body.date || !body.status) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const validStatuses = ['present', 'absent', 'late', 'excused']
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Vérifier si un enregistrement existe déjà
  const { data: existing } = await supabase
    .from('attendances')
    .select('id')
    .eq('school_id', schoolId)
    .eq('student_id', body.student_id)
    .eq('class_id', body.class_id)
    .eq('date', body.date)
    .maybeSingle()

  if (existing?.id) {
    // UPDATE
    const { data, error } = await supabase
      .from('attendances')
      .update({
        status: body.status,
        reason: body.reason ?? null,
        recorded_by: userId,
      })
      .eq('id', existing.id)
      .select('id, student_id, class_id, date, status, reason, recorded_by')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ attendance: data })
  }

  // INSERT
  const { data, error } = await supabase
    .from('attendances')
    .insert({
      school_id: schoolId,
      student_id: body.student_id,
      class_id: body.class_id,
      date: body.date,
      status: body.status,
      reason: body.reason ?? null,
      recorded_by: userId,
    })
    .select('id, student_id, class_id, date, status, reason, recorded_by')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attendance: data }, { status: 201 })
}

// PATCH /api/attendances?id=xxx — modifier le status/reason
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{ status: string; reason: string | null }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('attendances')
    .update({ ...body, recorded_by: userId })
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, student_id, class_id, date, status, reason, recorded_by')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attendance: data })
}

// DELETE /api/attendances?id=xxx — supprimer
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
    .from('attendances')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
