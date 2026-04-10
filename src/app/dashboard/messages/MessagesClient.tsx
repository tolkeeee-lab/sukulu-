'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string
  school_id: string
  sender_id: string
  recipient_id?: string | null
  class_id?: string | null
  content: string
  type: 'direct' | 'announcement'
  created_at: string
  read_at?: string | null
  sender?: { id: string; full_name: string; role: string } | null
  recipient?: { id: string; full_name: string; role: string } | null
  class?: { id: string; name: string } | null
}

type StaffMember = {
  id: string
  full_name: string
  role: string
}

type SchoolClass = {
  id: string
  name: string
}

interface Props {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  messages: Message[]
  staff: StaffMember[]
  classes: SchoolClass[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  '#1B4332', '#40916C', '#1e40af', '#7c3aed',
  '#be185d', '#d97706', '#065f46', '#854d0e', '#0e7490', '#9a3412',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    enseignant: 'Enseignant',
    admin: 'Administration',
    directeur: 'Directeur',
    comptable: 'Comptable',
    teacher: 'Enseignant',
  }
  return map[role] ?? role
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background: '#1B4332',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

const btnOutline: React.CSSProperties = {
  background: '#fff',
  color: '#1B4332',
  border: '1px solid #1B4332',
  borderRadius: 8,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #d1fae5',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Source Sans 3', sans-serif",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getColor(name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

function KpiCard({ icon, label, value, bg = '#D8F3DC', color = '#1B4332' }: {
  icon: string; label: string; value: string | number; bg?: string; color?: string
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
      padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          background: bg, color, fontSize: 18, borderRadius: 8,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </span>
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagesClient({
  schoolId,
  schoolYear,
  schoolName,
  userId,
  userRole,
  messages: initMessages,
  staff,
  classes,
}: Props) {
  const isMobile = useIsMobile()

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'direct' | 'annonces'>('direct')
  const [messages, setMessages] = useState<Message[]>(initMessages)
  const [selectedConvKey, setSelectedConvKey] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // New message modal
  const [modalNewMsg, setModalNewMsg] = useState(false)
  const [newMsgRecipient, setNewMsgRecipient] = useState('')
  const [newMsgContent, setNewMsgContent] = useState('')
  const [newMsgLoading, setNewMsgLoading] = useState(false)

  // New announcement modal
  const [modalNewAnnonce, setModalNewAnnonce] = useState(false)
  const [annonceContent, setAnnonceContent] = useState('')
  const [annonceClassId, setAnnonceClassId] = useState('')
  const [annonceLoading, setAnnonceLoading] = useState(false)

  // Chat input
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Toast timer
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConvKey, messages])

  // ── Computed ──────────────────────────────────────────────────────────────

  const directMessages = useMemo(
    () => messages.filter(m => m.type === 'direct'),
    [messages]
  )

  const announcements = useMemo(
    () => messages.filter(m => m.type === 'announcement'),
    [messages]
  )

  // Build conversations: group by partner id
  const conversations = useMemo(() => {
    const map = new Map<string, { partnerId: string; partnerName: string; partnerRole: string; msgs: Message[] }>()
    for (const m of directMessages) {
      const partnerId = m.sender_id === userId ? (m.recipient_id ?? '') : m.sender_id
      const partnerName = m.sender_id === userId
        ? (m.recipient?.full_name ?? 'Inconnu')
        : (m.sender?.full_name ?? 'Inconnu')
      const partnerRole = m.sender_id === userId
        ? (m.recipient?.role ?? '')
        : (m.sender?.role ?? '')

      if (!partnerId) continue
      if (!map.has(partnerId)) {
        map.set(partnerId, { partnerId, partnerName, partnerRole, msgs: [] })
      }
      map.get(partnerId)!.msgs.push(m)
    }
    // Sort conversations by latest message
    return Array.from(map.values())
      .map(c => ({
        ...c,
        lastMsg: c.msgs.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
        unreadCount: c.msgs.filter(m => m.sender_id !== userId && !m.read_at).length,
      }))
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime())
  }, [directMessages, userId])

  const selectedConv = useMemo(
    () => conversations.find(c => c.partnerId === selectedConvKey) ?? null,
    [conversations, selectedConvKey]
  )

  const chatMessages = useMemo(() => {
    if (!selectedConv) return []
    return selectedConv.msgs.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [selectedConv])

  // Stats
  const totalUnread = useMemo(
    () => messages.filter(m => m.sender_id !== userId && !m.read_at).length,
    [messages, userId]
  )

  const activeConvCount = useMemo(() => conversations.length, [conversations])

  const annoncesMois = useMemo(() => {
    const now = new Date()
    return announcements.filter(m => {
      const d = new Date(m.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
  }, [announcements])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function selectConversation(partnerId: string) {
    setSelectedConvKey(partnerId)
    if (isMobile) setMobileView('chat')

    // Mark unread messages as read
    const unread = directMessages.filter(
      m => m.sender_id === partnerId && m.recipient_id === userId && !m.read_at
    )
    for (const m of unread) {
      fetch(`/api/messages?id=${m.id}`, { method: 'PATCH' }).catch(() => null)
      setMessages(prev =>
        prev.map(x => x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x)
      )
    }
  }

  async function sendDirectMessage() {
    if (!chatInput.trim() || !selectedConvKey) return
    setChatLoading(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      school_id: schoolId,
      sender_id: userId,
      recipient_id: selectedConvKey,
      class_id: null,
      content: chatInput.trim(),
      type: 'direct',
      created_at: new Date().toISOString(),
      read_at: null,
      sender: { id: userId, full_name: 'Moi', role: userRole },
      recipient: selectedConv ? { id: selectedConv.partnerId, full_name: selectedConv.partnerName, role: selectedConv.partnerRole } : null,
    }
    setMessages(prev => [optimistic, ...prev])
    const content = chatInput.trim()
    setChatInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedConvKey, content, type: 'direct' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setMessages(prev => prev.map(m => m.id === optimistic.id ? json.message : m))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      showToast('❌ ' + msg)
    } finally {
      setChatLoading(false)
    }
  }

  async function handleNewMessage() {
    if (!newMsgContent.trim() || !newMsgRecipient) return
    setNewMsgLoading(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: newMsgRecipient, content: newMsgContent.trim(), type: 'direct' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setMessages(prev => [json.message, ...prev])
      setModalNewMsg(false)
      setNewMsgContent('')
      setNewMsgRecipient('')
      setSelectedConvKey(newMsgRecipient)
      if (isMobile) setMobileView('chat')
      showToast('✅ Message envoyé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      showToast('❌ ' + msg)
    } finally {
      setNewMsgLoading(false)
    }
  }

  async function handleNewAnnonce() {
    if (!annonceContent.trim()) return
    setAnnonceLoading(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: annonceContent.trim(),
          class_id: annonceClassId || null,
          type: 'announcement',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setMessages(prev => [json.message, ...prev])
      setModalNewAnnonce(false)
      setAnnonceContent('')
      setAnnonceClassId('')
      showToast('✅ Annonce envoyée')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      showToast('❌ ' + msg)
    } finally {
      setAnnonceLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabBtn = (tab: 'direct' | 'annonces', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '6px 16px',
        borderRadius: 7,
        border: 'none',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        background: activeTab === tab ? '#1B4332' : 'transparent',
        color: activeTab === tab ? '#fff' : '#6b7280',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: '#0d1f16', paddingBottom: isMobile ? 80 : 0 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1B4332', margin: 0 }}>
          Messages
        </h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
          {schoolName} · {schoolYear}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard icon="📬" label="Non lus" value={totalUnread} bg="#fee2e2" color="#dc2626" />
        <KpiCard icon="💬" label="Conversations" value={activeConvCount} />
        <KpiCard icon="📢" label="Annonces ce mois" value={annoncesMois} bg="#fef3c7" color="#d97706" />
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background: '#f9fafb', borderRadius: 11, padding: '4px',
        display: 'inline-flex', gap: 2, marginBottom: 16,
      }}>
        {tabBtn('direct', '💬 Messages')}
        {tabBtn('annonces', '📢 Annonces')}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: MESSAGES DIRECTS
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'direct' && (
        <div>
          {/* Mobile: back + chat title */}
          {isMobile && mobileView === 'chat' && selectedConv && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button
                onClick={() => setMobileView('list')}
                style={{ ...btnOutline, padding: '6px 10px' }}
              >
                ← Retour
              </button>
              <Avatar name={selectedConv.partnerName} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedConv.partnerName}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{getRoleLabel(selectedConv.partnerRole)}</div>
              </div>
            </div>
          )}

          {/* Desktop: 2 columns — Mobile: either list or chat */}
          <div style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 12,
            height: isMobile ? 'auto' : 540,
          }}>

            {/* ── Conversation list ── */}
            {(!isMobile || mobileView === 'list') && (
              <div style={{
                background: '#fff',
                border: '1px solid #d1fae5',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: isMobile ? 'auto' : '100%',
              }}>
                {/* List header */}
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Conversations</span>
                  <button
                    onClick={() => setModalNewMsg(true)}
                    style={{ ...btnPrimary, padding: '5px 10px', fontSize: 11 }}
                  >
                    + Nouveau
                  </button>
                </div>

                {/* Conversation items */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversations.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                      Aucune conversation
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.partnerId}
                        onClick={() => selectConversation(conv.partnerId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: selectedConvKey === conv.partnerId ? '#f0fdf4' : '#fff',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          <Avatar name={conv.partnerName} size={38} />
                          {conv.unreadCount > 0 && (
                            <span style={{
                              position: 'absolute', top: -4, right: -4,
                              background: '#dc2626', color: '#fff',
                              fontSize: 9, fontWeight: 700,
                              width: 16, height: 16, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: conv.unreadCount > 0 ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.partnerName}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.lastMsg.content.slice(0, 40)}{conv.lastMsg.content.length > 40 ? '…' : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                          {timeAgo(conv.lastMsg.created_at)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Chat panel ── */}
            {(!isMobile || mobileView === 'chat') && (
              <div style={{
                background: '#fff',
                border: '1px solid #d1fae5',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: isMobile ? 520 : '100%',
              }}>
                {!selectedConv ? (
                  /* Empty state */
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#9ca3af' }}>
                    <span style={{ fontSize: 40 }}>💬</span>
                    <div style={{ fontSize: 13 }}>Sélectionnez une conversation</div>
                    <button onClick={() => setModalNewMsg(true)} style={btnPrimary}>
                      + Nouveau message
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Chat header (desktop) */}
                    {!isMobile && (
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        <Avatar name={selectedConv.partnerName} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedConv.partnerName}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{getRoleLabel(selectedConv.partnerRole)}</div>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
                      {chatMessages.map((m, i) => {
                        const isMine = m.sender_id === userId
                        const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(chatMessages[i - 1].created_at).toDateString()
                        return (
                          <div key={m.id}>
                            {showDate && (
                              <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', margin: '8px 0' }}>
                                {formatDate(m.created_at)}
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              marginBottom: 6,
                            }}>
                              <div style={{
                                maxWidth: '72%',
                                background: isMine ? '#1B4332' : '#f3f4f6',
                                color: isMine ? '#fff' : '#0d1f16',
                                padding: '8px 12px',
                                borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                fontSize: 13,
                                lineHeight: 1.45,
                              }}>
                                {m.content}
                                <div style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : '#9ca3af', marginTop: 2, textAlign: 'right' }}>
                                  {formatTime(m.created_at)}
                                  {isMine && m.read_at && ' ✓✓'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                      borderTop: '1px solid #f3f4f6',
                      padding: '10px 12px',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-end',
                    }}>
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDirectMessage() } }}
                        placeholder="Écrire un message…"
                        rows={2}
                        style={{
                          ...inputStyle,
                          resize: 'none',
                          flex: 1,
                          lineHeight: 1.4,
                          padding: '8px 10px',
                        }}
                      />
                      <button
                        onClick={sendDirectMessage}
                        disabled={chatLoading || !chatInput.trim()}
                        style={{
                          ...btnPrimary,
                          flexShrink: 0,
                          opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                        }}
                      >
                        {chatLoading ? '…' : '➤'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: ANNONCES
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'annonces' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setModalNewAnnonce(true)} style={btnPrimary}>
              + Nouvelle annonce
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
              padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13,
            }}>
              Aucune annonce pour le moment
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.map(a => (
                <div key={a.id} style={{
                  background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      fontSize: 24, background: '#fef3c7', borderRadius: 8,
                      width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      📢
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {a.sender?.full_name ?? 'Auteur inconnu'}
                        </span>
                        <span style={{
                          background: a.class_id ? '#dbeafe' : '#D8F3DC',
                          color: a.class_id ? '#1e40af' : '#1B4332',
                          fontSize: 10, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 999,
                        }}>
                          {a.class ? a.class.name : 'Toute l\'école'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                          {timeAgo(a.created_at)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                        {a.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: NOUVEAU MESSAGE DIRECT
         ══════════════════════════════════════════════════════════════ */}
      {modalNewMsg && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalNewMsg(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 16 : 24, width: 'min(460px, 96vw)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', marginTop: 0, marginBottom: 16 }}>
              Nouveau message
            </h2>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Destinataire
            </label>
            <select
              value={newMsgRecipient}
              onChange={e => setNewMsgRecipient(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            >
              <option value="">-- Sélectionner un membre --</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} · {getRoleLabel(s.role)}
                </option>
              ))}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Message
            </label>
            <textarea
              value={newMsgContent}
              onChange={e => setNewMsgContent(e.target.value)}
              rows={4}
              placeholder="Votre message…"
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalNewMsg(false)} style={btnOutline}>Annuler</button>
              <button
                onClick={handleNewMessage}
                disabled={newMsgLoading || !newMsgRecipient || !newMsgContent.trim()}
                style={{ ...btnPrimary, opacity: newMsgLoading || !newMsgRecipient || !newMsgContent.trim() ? 0.6 : 1 }}
              >
                {newMsgLoading ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: NOUVELLE ANNONCE
         ══════════════════════════════════════════════════════════════ */}
      {modalNewAnnonce && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalNewAnnonce(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 16 : 24, width: 'min(460px, 96vw)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', marginTop: 0, marginBottom: 16 }}>
              Nouvelle annonce
            </h2>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Destinataires
            </label>
            <select
              value={annonceClassId}
              onChange={e => setAnnonceClassId(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            >
              <option value="">Toute l&apos;école</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Contenu
            </label>
            <textarea
              value={annonceContent}
              onChange={e => setAnnonceContent(e.target.value)}
              rows={5}
              placeholder="Contenu de l'annonce…"
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalNewAnnonce(false)} style={btnOutline}>Annuler</button>
              <button
                onClick={handleNewAnnonce}
                disabled={annonceLoading || !annonceContent.trim()}
                style={{ ...btnPrimary, opacity: annonceLoading || !annonceContent.trim() ? 0.6 : 1 }}
              >
                {annonceLoading ? 'Envoi…' : 'Envoyer l\'annonce'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TOAST
         ══════════════════════════════════════════════════════════════ */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          ...(isMobile
            ? { bottom: 80, left: 24, right: 24 }
            : { bottom: 24, right: 24 }),
          zIndex: 9999,
          background: '#1B4332', color: '#fff',
          fontSize: 12, fontWeight: 500,
          padding: '10px 16px', borderRadius: 10,
          boxShadow: '0 4px 12px rgba(27,67,50,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn .2s ease',
          maxWidth: isMobile ? 'calc(100vw - 48px)' : 'auto',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}
