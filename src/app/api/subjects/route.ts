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

// POST /api/subjects — créer une matière
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    name: string
    coefficient: number
    class_id: string | null
  }

  if (!body.name || !body.coefficient) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      school_id: schoolId,
      name: body.name,
      coefficient: body.coefficient,
      class_id: body.class_id ?? null,
      teacher_id: userId,
    })
    .select('id, name, coefficient, class_id, teacher_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subject: data }, { status: 201 })
}

// PATCH /api/subjects?id=xxx — modifier une matière
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{ name: string; coefficient: number }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('subjects')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, name, coefficient, class_id, teacher_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subject: data })
}

// DELETE /api/subjects?id=xxx — supprimer une matière
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
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
