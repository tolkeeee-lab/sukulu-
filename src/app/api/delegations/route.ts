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

// GET /api/delegations        → liste les délégations actives de l'école
// GET /api/delegations?logs=true → retourne les 50 derniers logs
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()
  const logsOnly = req.nextUrl.searchParams.get('logs') === 'true'

  if (logsOnly) {
    const { data, error } = await supabase
      .from('delegation_logs')
      .select('id, delegation_id, delegated_to, action, detail, severity, created_at, profiles!delegation_logs_delegated_to_fkey(full_name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const logs = (data ?? []).map((row: Record<string, unknown>) => {
      const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id: row.id,
        delegation_id: row.delegation_id,
        delegated_to: row.delegated_to,
        delegate_name: (profileData as { full_name?: string } | null)?.full_name ?? 'Inconnu',
        action: row.action,
        detail: row.detail,
        severity: row.severity,
        created_at: row.created_at,
      }
    })
    return NextResponse.json({ logs })
  }

  const { data, error } = await supabase
    .from('delegations')
    .select(`
      id, delegated_to, intitule, permissions, classes_scope, note,
      starts_at, expires_at, is_active, created_by, created_at,
      profiles!delegations_delegated_to_fkey(id, full_name, role, email, phone),
      created_by_profile:profiles!delegations_created_by_fkey(id, full_name)
    `)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const delegations = (data ?? []).map((row: Record<string, unknown>) => {
    const delegate = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const creator = Array.isArray(row.created_by_profile) ? row.created_by_profile[0] : row.created_by_profile
    return {
      id: row.id,
      delegated_to: row.delegated_to,
      intitule: row.intitule,
      permissions: row.permissions ?? [],
      classes_scope: row.classes_scope ?? 'all',
      note: row.note ?? null,
      starts_at: row.starts_at,
      expires_at: row.expires_at,
      is_active: row.is_active,
      created_by: row.created_by,
      created_at: row.created_at,
      delegate_name: (delegate as { full_name?: string } | null)?.full_name ?? 'Inconnu',
      delegate_email: (delegate as { email?: string | null } | null)?.email ?? null,
      delegate_phone: (delegate as { phone?: string | null } | null)?.phone ?? null,
      delegate_role: (delegate as { role?: string } | null)?.role ?? '',
      creator_name: (creator as { full_name?: string } | null)?.full_name ?? '',
    }
  })

  return NextResponse.json({ delegations })
}

// POST /api/delegations → créer une délégation
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    delegated_to: string
    intitule: string
    permissions: string[]
    expires_at: string
    starts_at?: string
    classes_scope?: string
    note?: string | null
  }

  if (!body.delegated_to || !body.intitule || !body.permissions || !body.expires_at) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('delegations')
    .insert({
      school_id: schoolId,
      delegated_to: body.delegated_to,
      intitule: body.intitule,
      permissions: body.permissions,
      expires_at: body.expires_at,
      starts_at: body.starts_at ?? new Date().toISOString().split('T')[0],
      classes_scope: body.classes_scope ?? 'all',
      note: body.note ?? null,
      is_active: true,
      created_by: userId,
    })
    .select('id, delegated_to, intitule, permissions, classes_scope, note, starts_at, expires_at, is_active, created_by, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log the creation
  await supabase.from('delegation_logs').insert({
    school_id: schoolId,
    delegation_id: (data as { id: string }).id,
    delegated_to: body.delegated_to,
    action: 'create',
    detail: `Délégation "${body.intitule}" créée`,
    severity: 'ok',
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ delegation: data }, { status: 201 })
}

// PATCH /api/delegations?id=xxx → modifier une délégation
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as Partial<{
    permissions: string[]
    expires_at: string
    intitule: string
    note: string | null
    classes_scope: string
    is_active: boolean
  }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('delegations')
    .update(body)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, delegated_to, intitule, permissions, classes_scope, note, starts_at, expires_at, is_active, created_by, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Determine action for log
  let action = 'update'
  let detail = 'Délégation modifiée'
  let severity: 'ok' | 'warn' | 'danger' = 'ok'
  if (body.is_active === false) {
    action = 'revoke'
    detail = 'Délégation révoquée'
    severity = 'warn'
  } else if (body.is_active === true) {
    action = 'restore'
    detail = 'Délégation restaurée'
    severity = 'ok'
  } else if (body.expires_at) {
    action = 'renew'
    detail = `Date d'expiration mise à jour : ${body.expires_at}`
  }

  await supabase.from('delegation_logs').insert({
    school_id: schoolId,
    delegation_id: id,
    delegated_to: (data as { delegated_to: string }).delegated_to,
    action,
    detail,
    severity,
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ delegation: data })
}

// DELETE /api/delegations?id=xxx → soft delete (is_active = false)
export async function DELETE(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()

  // Get delegation info for log
  const { data: existing } = await supabase
    .from('delegations')
    .select('delegated_to, intitule')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single()

  const { error } = await supabase
    .from('delegations')
    .update({ is_active: false })
    .eq('id', id)
    .eq('school_id', schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (existing) {
    await supabase.from('delegation_logs').insert({
      school_id: schoolId,
      delegation_id: id,
      delegated_to: (existing as { delegated_to: string }).delegated_to,
      action: 'revoke',
      detail: `Délégation "${(existing as { intitule: string }).intitule}" révoquée`,
      severity: 'warn',
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
