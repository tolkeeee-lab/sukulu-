import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  if (!userId) redirect('/login')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. profile → school_id, role, school info
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, schools(name, school_year)')
    .eq('id', userId)
    .single()

  const schoolId = profile?.school_id
  if (!schoolId) return <div style={{ padding: 24, color: '#dc2626' }}>École introuvable</div>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schoolsData = profile?.schools as any
  const schoolName: string = schoolsData?.name ?? ''
  const schoolYear: string = schoolsData?.school_year ?? (() => {
    const now = new Date()
    const y = now.getFullYear()
    return now.getMonth() + 1 >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })()

  // 2. Parallel fetches — gracefully handle missing messages table
  const [messagesRes, staffRes, classesRes] = await Promise.all([
    supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id,full_name,role), recipient:profiles!recipient_id(id,full_name,role), class:classes(id,name)')
      .eq('school_id', schoolId)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId},type.eq.announcement`)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('school_id', schoolId)
      .neq('id', userId),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId),
  ])

  return (
    <MessagesClient
      schoolId={schoolId}
      schoolYear={schoolYear}
      schoolName={schoolName}
      userId={userId}
      userRole={profile?.role ?? 'teacher'}
      messages={messagesRes.data ?? []}
      staff={staffRes.data ?? []}
      classes={classesRes.data ?? []}
    />
  )
}
