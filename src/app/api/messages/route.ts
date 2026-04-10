import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(val: string): boolean {
  return UUID_RE.test(val)
}

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

// GET /api/messages?school_id=xxx  → liste des messages de l'école
export async function GET(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId || !isValidUuid(userId)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('messages')
    .select(
      '*, sender:profiles!sender_id(id,full_name,role), recipient:profiles!recipient_id(id,full_name,role), class:classes(id,name)'
    )
    .eq('school_id', schoolId)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId},type.eq.announcement`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}

// POST /api/messages → envoyer un message
export async function POST(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId || !isValidUuid(userId)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const body = (await req.json()) as {
    recipient_id?: string | null
    class_id?: string | null
    content: string
    type: 'direct' | 'announcement'
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Contenu obligatoire' }, { status: 400 })
  }
  if (!['direct', 'announcement'].includes(body.type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }
  if (body.type === 'direct' && !body.recipient_id) {
    return NextResponse.json({ error: 'Destinataire obligatoire pour un message direct' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      school_id: schoolId,
      sender_id: userId,
      recipient_id: body.recipient_id ?? null,
      class_id: body.class_id ?? null,
      content: body.content.trim(),
      type: body.type,
    })
    .select(
      '*, sender:profiles!sender_id(id,full_name,role), recipient:profiles!recipient_id(id,full_name,role), class:classes(id,name)'
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}

// PATCH /api/messages?id=xxx → marquer comme lu (read_at = now)
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId || !isValidUuid(userId)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('school_id', schoolId)
    .select('id, read_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
