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

// GET /api/personnel — liste le personnel (hors parent/student)
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const role = req.nextUrl.searchParams.get('role')

  const supabase = getSupabase()
  let query = supabase
    .from('profiles')
    .select('id, full_name, role, phone, momo_phone, avatar_url, is_active, created_at')
    .eq('school_id', schoolId)
    .not('role', 'in', '("parent","student")')
    .order('role')

  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}

// POST /api/personnel — ajouter un membre
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    full_name: string
    role: string
    phone?: string | null
    momo_phone?: string | null
    email?: string | null
  }

  if (!body.full_name || !body.role) {
    return NextResponse.json({ error: 'Nom et rôle obligatoires' }, { status: 400 })
  }

  const validRoles = ['director', 'teacher', 'accountant', 'admin', 'service']
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      school_id: schoolId,
      full_name: body.full_name,
      role: body.role,
      phone: body.phone ?? null,
      momo_phone: body.momo_phone ?? null,
      is_active: true,
    })
    .select('id, full_name, role, phone, momo_phone, avatar_url, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}

// PATCH /api/personnel?id=xxx — modifier un membre
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{
    full_name: string
    role: string
    phone: string | null
    momo_phone: string | null
    is_active: boolean
  }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, full_name, role, phone, momo_phone, avatar_url, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}

// DELETE /api/personnel?id=xxx — soft delete (is_active = false)
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
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
