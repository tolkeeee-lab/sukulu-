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

// PATCH /api/salary?id=xxx — marquer un salaire comme payé
export async function PATCH(req: NextRequest) {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const staffId = req.nextUrl.searchParams.get('id')
  if (!staffId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const schoolId = await getSchoolId(userId)
  if (!schoolId) return NextResponse.json({ error: 'École introuvable' }, { status: 403 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .update({ salary_paid: true })
    .eq('id', staffId)
    .eq('school_id', schoolId)
    .select('id, full_name, role, salary, salary_paid')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}
