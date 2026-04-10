import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DelegationClient from './DelegationClient'

export default async function DelegationPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) redirect('/login')

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, full_name, schools(name)')
    .eq('id', userId)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const schoolId = profile.school_id
  const schoolsData = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools
  const schoolName = (schoolsData as { name?: string } | null)?.name ?? ''

  const schoolYear = (() => {
    const now = new Date()
    const y = now.getFullYear()
    return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })()

  const [delegationsRes, staffRes, classesRes, logsRes] = await Promise.all([
    supabase
      .from('delegations')
      .select(`
        id, delegated_to, intitule, permissions, classes_scope, note,
        starts_at, expires_at, is_active, created_by, created_at,
        profiles!delegations_delegated_to_fkey(id, full_name, role, email, phone),
        created_by_profile:profiles!delegations_created_by_fkey(id, full_name)
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, role, email, phone')
      .eq('school_id', schoolId)
      .in('role', ['teacher', 'director', 'accountant', 'admin'])
      .order('full_name'),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('school_year', schoolYear)
      .order('name'),
    supabase
      .from('delegation_logs')
      .select('id, delegation_id, delegated_to, action, detail, severity, created_at, profiles!delegation_logs_delegated_to_fkey(full_name)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const delegations = (delegationsRes.data ?? []).map((row: Record<string, unknown>) => {
    const delegate = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id as string,
      delegated_to: row.delegated_to as string,
      intitule: row.intitule as string,
      permissions: (row.permissions as string[]) ?? [],
      classes_scope: (row.classes_scope as string) ?? 'all',
      note: (row.note as string | null) ?? null,
      starts_at: row.starts_at as string,
      expires_at: row.expires_at as string,
      is_active: row.is_active as boolean,
      created_at: row.created_at as string,
      delegate_name: (delegate as { full_name?: string } | null)?.full_name ?? 'Inconnu',
      delegate_email: (delegate as { email?: string | null } | null)?.email ?? null,
      delegate_phone: (delegate as { phone?: string | null } | null)?.phone ?? null,
      delegate_role: (delegate as { role?: string } | null)?.role ?? '',
    }
  })

  const logs = (logsRes.data ?? []).map((row: Record<string, unknown>) => {
    const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id as string,
      delegation_id: (row.delegation_id as string | null) ?? null,
      delegated_to: row.delegated_to as string,
      delegate_name: (profileData as { full_name?: string } | null)?.full_name ?? 'Inconnu',
      action: row.action as string,
      detail: row.detail as string,
      severity: row.severity as 'ok' | 'warn' | 'danger',
      created_at: row.created_at as string,
    }
  })

  return (
    <DelegationClient
      schoolId={schoolId}
      schoolName={schoolName}
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      delegations={delegations}
      staff={staffRes.data ?? []}
      classes={classesRes.data ?? []}
      logs={logs}
    />
  )
}
