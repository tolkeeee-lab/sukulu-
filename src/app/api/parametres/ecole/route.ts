import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getProfile(userId: string): Promise<{ school_id: string | null; role: string | null } | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', userId)
    .single()
  return data as { school_id: string | null; role: string | null } | null
}

// PATCH /api/parametres/ecole — update school info (director only)
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const profile = await getProfile(userId)
  if (!profile?.school_id) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })
  if (profile.role !== 'director') return NextResponse.json({ error: 'Accès réservé au directeur' }, { status: 403 })

  const body = (await req.json()) as Partial<{ name: string; address: string; phone: string }>

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('schools')
    .update(body)
    .eq('id', profile.school_id)
    .select('id, name, address, phone, logo_url, plan, billing_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ school: data })
}
