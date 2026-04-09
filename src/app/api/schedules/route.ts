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

// GET /api/schedules?class_id=xxx&school_year=xxx
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const classId = req.nextUrl.searchParams.get('class_id')
  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  const schoolYear = req.nextUrl.searchParams.get('school_year')

  const supabase = getSupabase()
  let query = supabase
    .from('schedules')
    .select('id, school_id, class_id, teacher_id, subject, day_of_week, slot_index, room, recurrence, school_year')
    .eq('school_id', schoolId)

  if (classId) query = query.eq('class_id', classId)
  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (schoolYear) query = query.eq('school_year', schoolYear)

  const { data, error } = await query.order('day_of_week').order('slot_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedules: data })
}

// POST /api/schedules — créer un créneau
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    class_id: string
    teacher_id: string
    subject: string
    day_of_week: number
    slot_index: number
    room?: string | null
    recurrence?: 'weekly' | 'once' | 'term'
    school_year: string
  }

  if (!body.class_id || !body.teacher_id || !body.subject || body.day_of_week === undefined || body.slot_index === undefined || !body.school_year) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  if (body.day_of_week < 0 || body.day_of_week > 5) {
    return NextResponse.json({ error: 'day_of_week doit être compris entre 0 et 5' }, { status: 400 })
  }

  if (body.slot_index < 0 || body.slot_index > 11) {
    return NextResponse.json({ error: 'slot_index doit être compris entre 0 et 11' }, { status: 400 })
  }

  const validRecurrences = ['weekly', 'once', 'term']
  if (body.recurrence && !validRecurrences.includes(body.recurrence)) {
    return NextResponse.json({ error: 'Récurrence invalide' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('schedules')
    .insert({
      school_id: schoolId,
      class_id: body.class_id,
      teacher_id: body.teacher_id,
      subject: body.subject,
      day_of_week: body.day_of_week,
      slot_index: body.slot_index,
      room: body.room ?? null,
      recurrence: body.recurrence ?? 'weekly',
      school_year: body.school_year,
    })
    .select('id, school_id, class_id, teacher_id, subject, day_of_week, slot_index, room, recurrence, school_year')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data }, { status: 201 })
}

// PATCH /api/schedules?id=xxx — modifier un créneau
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{
    class_id: string
    teacher_id: string
    subject: string
    day_of_week: number
    slot_index: number
    room: string | null
    recurrence: 'weekly' | 'once' | 'term'
    school_year: string
  }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('schedules')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, school_id, class_id, teacher_id, subject, day_of_week, slot_index, room, recurrence, school_year')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

// DELETE /api/schedules?id=xxx — supprimer un créneau
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
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
