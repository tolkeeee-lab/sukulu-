import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ParametresClient from './ParametresClient'

export default async function ParametresPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) redirect('/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, full_name, phone, momo_phone, avatar_url, schools(id, name, address, phone, logo_url, plan, billing_status)')
    .eq('id', userId)
    .single()

  if (!profile?.school_id) redirect('/dashboard')

  const schoolId = profile.school_id as string
  const schoolsRaw = profile.schools
  const sd = Array.isArray(schoolsRaw) ? schoolsRaw[0] : schoolsRaw

  const schoolYear = (() => {
    const now = new Date()
    const y = now.getFullYear()
    return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })()

  const [classesRes, subjectsRes, staffRes, feeTypesRes, auditRes, notifRes] =
    await Promise.all([
      supabase
        .from('classes')
        .select('id, name, level, teacher_id, school_year, profiles!classes_teacher_id_fkey(full_name)')
        .eq('school_id', schoolId)
        .eq('school_year', schoolYear)
        .order('name'),
      supabase.from('subjects').select('id, name, coefficient, class_id, teacher_id').eq('school_id', schoolId),
      supabase
        .from('profiles')
        .select('id, full_name, role, phone, momo_phone, avatar_url, is_active, created_at')
        .eq('school_id', schoolId)
        .not('role', 'in', '("parent","student")')
        .order('role'),
      supabase
        .from('fee_types')
        .select('id, name, amount, due_date, school_year')
        .eq('school_id', schoolId)
        .order('school_year', { ascending: false }),
      supabase
        .from('audit_logs')
        .select('id, action, entity, entity_id, user_id, created_at')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_read', false),
    ])

  type ClassRow = {
    id: string; name: string; level: string | null; teacher_id: string | null; school_year: string;
    profiles: { full_name: string }[] | { full_name: string } | null
  }

  const classes = ((classesRes.data ?? []) as ClassRow[]).map((c) => {
    const teacherName = Array.isArray(c.profiles)
      ? c.profiles[0]?.full_name ?? null
      : (c.profiles as { full_name: string } | null)?.full_name ?? null
    return { id: c.id, name: c.name, level: c.level, teacher_id: c.teacher_id, school_year: c.school_year, teacherName }
  })

  return (
    <ParametresClient
      userId={userId}
      userRole={profile.role ?? 'teacher'}
      userProfile={{
        full_name: profile.full_name ?? '',
        phone: (profile.phone as string | null) ?? '',
        momo_phone: (profile.momo_phone as string | null) ?? '',
        avatar_url: (profile.avatar_url as string | null) ?? '',
      }}
      school={{
        id: schoolId,
        name: (sd as { name?: string } | null)?.name ?? '',
        address: (sd as { address?: string } | null)?.address ?? '',
        phone: (sd as { phone?: string } | null)?.phone ?? '',
        logo_url: (sd as { logo_url?: string } | null)?.logo_url ?? '',
        plan: (sd as { plan?: string } | null)?.plan ?? 'standard',
        billing_status: (sd as { billing_status?: string } | null)?.billing_status ?? 'active',
      }}
      schoolYear={schoolYear}
      classes={classes}
      subjects={(subjectsRes.data ?? []) as Array<{ id: string; name: string; coefficient: number; class_id: string | null; teacher_id: string | null }>}
      staff={(staffRes.data ?? []) as Array<{ id: string; full_name: string; role: string; phone: string | null; momo_phone: string | null; avatar_url: string | null; is_active: boolean; created_at: string }>}
      feeTypes={(feeTypesRes.data ?? []) as Array<{ id: string; name: string; amount: number; due_date: string | null; school_year: string }>}
      auditLogs={(auditRes.data ?? []) as Array<{ id: number; action: string; entity: string; entity_id: string | null; user_id: string | null; created_at: string }>}
      unreadNotifCount={notifRes.count ?? 0}
    />
  )
}

