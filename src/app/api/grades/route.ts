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

// POST /api/grades — créer ou mettre à jour une note (upsert)
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    student_id: string
    subject_id: string
    class_id: string
    grade: number
    max_grade?: number
    trimestre: number
    comment?: string | null
  }

  if (!body.student_id || !body.subject_id || !body.class_id || body.grade === undefined || !body.trimestre) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Vérifier si une note existe déjà pour (student_id, subject_id, trimestre, school_id)
  const { data: existing } = await supabase
    .from('grades')
    .select('id')
    .eq('school_id', schoolId)
    .eq('student_id', body.student_id)
    .eq('subject_id', body.subject_id)
    .eq('trimestre', body.trimestre)
    .maybeSingle()

  if (existing?.id) {
    // UPDATE
    const { data, error } = await supabase
      .from('grades')
      .update({
        grade: body.grade,
        max_grade: body.max_grade ?? 20,
        comment: body.comment ?? null,
        teacher_id: userId,
      })
      .eq('id', existing.id)
      .select('id, student_id, subject_id, class_id, teacher_id, grade, max_grade, trimestre, comment, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ grade: data })
  }

  // INSERT
  const { data, error } = await supabase
    .from('grades')
    .insert({
      school_id: schoolId,
      student_id: body.student_id,
      subject_id: body.subject_id,
      class_id: body.class_id,
      teacher_id: userId,
      grade: body.grade,
      max_grade: body.max_grade ?? 20,
      trimestre: body.trimestre,
      comment: body.comment ?? null,
    })
    .select('id, student_id, subject_id, class_id, teacher_id, grade, max_grade, trimestre, comment, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ grade: data }, { status: 201 })
}

// PATCH /api/grades?id=xxx — modifier une note existante
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{ grade: number; comment: string | null }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('grades')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, student_id, subject_id, class_id, teacher_id, grade, max_grade, trimestre, comment, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ grade: data })
}

// DELETE /api/grades?id=xxx — supprimer une note
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
    .from('grades')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
