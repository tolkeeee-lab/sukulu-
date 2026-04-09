'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Teacher = { id: string; full_name: string }
type Schedule = {
  id: string
  school_id: string
  class_id: string
  teacher_id: string | null
  subject: string
  day_of_week: number
  slot_index: number
  room: string | null
  recurrence: string | null
  school_year: string
}

interface EmploiDuTempsClientProps {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  classes: Classe[]
  teachers: Teacher[]
  schedules: Schedule[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const SLOTS: { label: string; index: number }[] = [
  { label: '7h30\u20138h30', index: 0 },
  { label: '8h30\u20139h30', index: 1 },
  { label: '9h30\u201310h30', index: 2 },
  { label: '10h30\u201311h30', index: 3 },
  { label: '11h30\u201312h30', index: 4 },
  { label: '13h30\u201314h30', index: 5 },
  { label: '14h30\u201315h30', index: 6 },
  { label: '15h30\u201316h30', index: 7 },
]

const SUBJECT_COLORS = [
  '#1B4332', '#40916C', '#1e40af', '#7c3aed',
  '#be185d', '#d97706', '#065f46', '#b45309',
]

function subjectColor(subject: string): { bg: string; color: string; border: string } {
  let hash = 0
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash)
  const base = SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
  return { bg: `${base}18`, color: base, border: base }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1B4332', color: '#fff', borderRadius: 10,
      padding: '10px 20px', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>\u00d7</button>
    </div>
  )
}

// ─── Grille EDT ────────────────────────────────────────────────────────────────

function EdtGrid({
  classId,
  className,
  schedules,
  teachers,
  isMobile,
  onCellClick,
  onDeleteCourse,
}: {
  classId: string
  className: string
  schedules: Schedule[]
  teachers: Teacher[]
  isMobile: boolean
  onCellClick: (dayOfWeek: number, slotIndex: number) => void
  onDeleteCourse: (s: Schedule) => void
}) {
  const [mobileDay, setMobileDay] = useState(0)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const grid = useMemo(() => {
    const map = new Map<string, Schedule>()
    for (const s of schedules) {
      if (s.class_id === classId) {
        map.set(`${s.day_of_week}-${s.slot_index}`, s)
      }
    }
    return map
  }, [schedules, classId])

  if (isMobile) {
    const daySchedules = SLOTS.map(slot => ({
      slot,
      entry: grid.get(`${mobileDay}-${slot.index}`) ?? null,
    }))
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={() => setMobileDay(d => Math.max(0, d - 1))}
            disabled={mobileDay === 0}
            style={{
              border: '1px solid #d1fae5', borderRadius: 6, padding: '6px 14px',
              background: '#fff', color: '#1B4332', cursor: mobileDay === 0 ? 'not-allowed' : 'pointer',
              opacity: mobileDay === 0 ? 0.4 : 1, fontSize: 16,
            }}
          >&#8249;</button>
          <span style={{ fontWeight: 700, color: '#1B4332', fontSize: 14 }}>{JOURS[mobileDay]}</span>
          <button
            onClick={() => setMobileDay(d => Math.min(4, d + 1))}
            disabled={mobileDay === 4}
            style={{
              border: '1px solid #d1fae5', borderRadius: 6, padding: '6px 14px',
              background: '#fff', color: '#1B4332', cursor: mobileDay === 4 ? 'not-allowed' : 'pointer',
              opacity: mobileDay === 4 ? 0.4 : 1, fontSize: 16,
            }}
          >&#8250;</button>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
          {JOURS.map((j, idx) => (
            <button
              key={j}
              onClick={() => setMobileDay(idx)}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 11,
                background: idx === mobileDay ? '#1B4332' : '#e5e7eb',
                color: idx === mobileDay ? '#fff' : '#6b7280', fontWeight: 600,
              }}
            >
              {j[0]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {daySchedules.map(({ slot, entry }) => {
            const c = entry ? subjectColor(entry.subject) : null
            const prof = entry ? (teachers.find(t => t.id === entry.teacher_id)?.full_name ?? '\u2014') : null
            return (
              <div
                key={slot.index}
                onClick={() => entry ? onDeleteCourse(entry) : onCellClick(mobileDay, slot.index)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: entry ? c!.bg : '#f9fafb',
                  border: entry ? `1px solid ${c!.border}` : '1px dashed #e5e7eb',
                }}
              >
                <div style={{
                  fontSize: 10, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace",
                  width: 70, flexShrink: 0,
                }}>{slot.label}</div>
                {entry ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c!.color }}>{entry.subject}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{prof}{entry.room ? ` \u00b7 \ud83d\udccd ${entry.room}` : ''}</div>
                  </div>
                ) : (
                  <div style={{ flex: 1, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Libre \u2014 toucher pour ajouter</div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 6 }}>
          \u2014 Pause d\u00e9jeuner 12h30\u201313h30 \u2014
        </div>
      </div>
    )
  }

  // Desktop grid
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', minWidth: 560 }}>
        <div style={{ background: '#f0faf3', border: '1px solid #e5e7eb', padding: '8px 6px', fontSize: 11, color: '#9ca3af', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
          Cr\u00e9neau
        </div>
        {JOURS.map((jour, j) => (
          <div key={j} style={{
            background: '#1B4332', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600,
          }}>
            {jour}
          </div>
        ))}
        {SLOTS.map((slot, rowIdx) => (
          <React.Fragment key={slot.index}>
            {rowIdx === 5 && (
              <div style={{
                gridColumn: '1 / -1', background: '#fef3c7', border: '1px solid #fcd34d',
                padding: '4px 8px', textAlign: 'center', fontSize: 11, color: '#92400e', fontStyle: 'italic',
              }}>
                \ud83c\udf7d Pause d\u00e9jeuner 12h30\u201313h30
              </div>
            )}
            <div style={{
              background: '#f0faf3', border: '1px solid #e5e7eb', padding: '6px 4px',
              textAlign: 'center', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#6b7280',
            }}>
              {slot.label}
            </div>
            {JOURS.map((_, j) => {
              const cellKey = `${j}-${slot.index}`
              const entry = grid.get(cellKey)
              const c = entry ? subjectColor(entry.subject) : null
              const prof = entry ? (teachers.find(t => t.id === entry.teacher_id)?.full_name ?? '\u2014') : null
              return (
                <div
                  key={cellKey}
                  onMouseEnter={() => setHoveredCell(cellKey)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => entry ? onDeleteCourse(entry) : onCellClick(j, slot.index)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderLeft: entry ? `3px solid ${c!.border}` : '1px solid #e5e7eb',
                    background: entry ? c!.bg : (hoveredCell === cellKey ? '#f0fdf4' : 'transparent'),
                    padding: '4px 6px', cursor: 'pointer', minHeight: 42,
                    transition: 'background 0.1s', position: 'relative',
                  }}
                >
                  {entry ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c!.color }}>{entry.subject}</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{prof}</div>
                      {entry.room && <div style={{ fontSize: 9, color: '#9ca3af' }}>\ud83d\udccd {entry.room}</div>}
                      {hoveredCell === cellKey && (
                        <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 10, color: '#dc2626', opacity: 0.7 }}>\u2715</span>
                      )}
                    </>
                  ) : hoveredCell === cellKey ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#1B4332', opacity: 0.4, fontSize: 18, fontWeight: 700 }}>+</div>
                  ) : null}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      {grid.size === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12 }}>
          Aucun cours pour {className} \u2014 cliquez sur une cellule pour en ajouter
        </div>
      )}
    </div>
  )
}

// ─── Add Course Form ───────────────────────────────────────────────────────────

function AddCourseForm({
  classes, teachers, isMobile, loading,
  initialClassId, initialDay, initialSlot,
  onCancel, onSubmit,
}: {
  classes: Classe[]
  teachers: Teacher[]
  isMobile: boolean
  loading: boolean
  initialClassId?: string
  initialDay?: number
  initialSlot?: number
  onCancel?: () => void
  onSubmit: (data: { subject: string; classId: string; teacherId: string; dayOfWeek: number; slotIndex: number; room: string }) => void
}) {
  const [subject, setSubject] = useState('')
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? '')
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(String(initialDay ?? 0))
  const [slotIndex, setSlotIndex] = useState(String(initialSlot ?? 0))
  const [room, setRoom] = useState('')

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid #d1fae5', borderRadius: 7, padding: '8px 12px',
    fontSize: 13, width: '100%', background: '#fff', boxSizing: 'border-box', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
  const fieldStyle: React.CSSProperties = { marginBottom: 14 }

  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Mati\u00e8re *</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="ex\u00a0: Math\u00e9matiques" style={inputStyle} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Classe *</label>
        <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
          {classes.length === 0 && <option value="">\u2014 Aucune classe \u2014</option>}
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Enseignant *</label>
        <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
          {teachers.length === 0 && <option value="">\u2014 Aucun enseignant \u2014</option>}
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Jour</label>
          <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} style={inputStyle}>
            {JOURS.map((j, i) => <option key={i} value={i}>{j}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Cr\u00e9neau</label>
          <select value={slotIndex} onChange={e => setSlotIndex(e.target.value)} style={inputStyle}>
            {SLOTS.map(s => <option key={s.index} value={s.index}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Salle (optionnel)</label>
        <input value={room} onChange={e => setRoom(e.target.value)} placeholder="ex\u00a0: Salle A12" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        {onCancel && (
          <button onClick={onCancel} disabled={loading} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>
            Annuler
          </button>
        )}
        <button
          disabled={loading || !subject.trim() || !classId || !teacherId}
          onClick={() => onSubmit({ subject, classId, teacherId, dayOfWeek: Number(dayOfWeek), slotIndex: Number(slotIndex), room })}
          style={{
            background: loading || !subject.trim() || !classId || !teacherId ? '#9ca3af' : '#1B4332',
            color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 600, cursor: loading || !subject.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Ajout\u2026' : 'Ajouter le cours'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

type TabId = 'grille' | 'liste' | 'ajouter'

export default function EmploiDuTempsClient({
  schoolId,
  schoolName,
  schoolYear,
  classes,
  teachers,
  schedules: initialSchedules,
}: EmploiDuTempsClientProps) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<TabId>('grille')
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(initialSchedules)

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Add Course modal (from grid click / header button) ──
  const [addModal, setAddModal] = useState<{ open: boolean; classId?: string; day?: number; slot?: number }>({ open: false })
  const [addLoading, setAddLoading] = useState(false)

  const openAddModal = useCallback((classId?: string, day?: number, slot?: number) => {
    setAddModal({ open: true, classId, day, slot })
  }, [])

  const handleAddCourse = useCallback(async (data: { subject: string; classId: string; teacherId: string; dayOfWeek: number; slotIndex: number; room: string }) => {
    setAddLoading(true)
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Schedule = {
      id: optimisticId, school_id: schoolId,
      class_id: data.classId, teacher_id: data.teacherId,
      subject: data.subject, day_of_week: data.dayOfWeek, slot_index: data.slotIndex,
      room: data.room || null, recurrence: 'weekly', school_year: schoolYear,
    }
    setLocalSchedules(prev => [...prev, optimistic])
    setAddModal({ open: false })
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: data.classId, teacher_id: data.teacherId, subject: data.subject,
          day_of_week: data.dayOfWeek, slot_index: data.slotIndex,
          room: data.room || null, recurrence: 'weekly', school_year: schoolYear,
        }),
      })
      const json = await res.json() as { schedule?: Schedule; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setLocalSchedules(prev => prev.map(s => s.id === optimisticId ? json.schedule! : s))
      showToast('\u2705 Cours ajout\u00e9')
      setActiveTab('grille')
    } catch (err) {
      setLocalSchedules(prev => prev.filter(s => s.id !== optimisticId))
      showToast(`\u274c ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setAddLoading(false)
    }
  }, [schoolId, schoolYear, showToast])

  // ── Delete Course modal ──
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; schedule?: Schedule }>({ open: false })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteCourse = useCallback(async () => {
    if (!deleteModal.schedule) return
    const id = deleteModal.schedule.id
    const saved = deleteModal.schedule
    setDeleteLoading(true)
    setLocalSchedules(prev => prev.filter(s => s.id !== id))
    setDeleteModal({ open: false })
    try {
      const res = await fetch(`/api/schedules?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Erreur serveur')
      }
      showToast('\ud83d\uddd1 Cours supprim\u00e9')
    } catch (err) {
      setLocalSchedules(prev => [...prev, saved])
      showToast(`\u274c ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteModal, showToast])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAddModal({ open: false }); setDeleteModal({ open: false }) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Stats ──
  const stats = useMemo(() => ({
    coursTotal: localSchedules.length,
    uniqueTeachers: new Set(localSchedules.map(s => s.teacher_id)).size,
    uniqueClasses: new Set(localSchedules.map(s => s.class_id)).size,
  }), [localSchedules])

  // ── Selected class for grille tab ──
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '')
  useEffect(() => {
    if (!selectedClassId && classes[0]?.id) setSelectedClassId(classes[0].id)
  }, [classes, selectedClassId])

  // ── Search for liste tab ──
  const [search, setSearch] = useState('')
  const filteredSchedules = useMemo(() => {
    if (!search.trim()) return localSchedules
    const q = search.toLowerCase()
    return localSchedules.filter(s => {
      const cls = classes.find(c => c.id === s.class_id)?.name ?? ''
      const prof = teachers.find(t => t.id === s.teacher_id)?.full_name ?? ''
      return s.subject.toLowerCase().includes(q) || cls.toLowerCase().includes(q) || prof.toLowerCase().includes(q)
    })
  }, [localSchedules, search, classes, teachers])

  // ── Styles ──
  const TABS: { id: TabId; label: string }[] = [
    { id: 'grille', label: '\ud83d\udcc5 Grille' },
    { id: 'liste', label: '\ud83d\udccb Liste des cours' },
    { id: 'ajouter', label: '\u2795 Ajouter' },
  ]

  const tabBtn = (id: TabId): React.CSSProperties => ({
    flex: isMobile ? '0 0 auto' : '1 1 auto',
    padding: isMobile ? '7px 12px' : '8px 14px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: isMobile ? 12 : 13, fontWeight: 600,
    background: activeTab === id ? '#1B4332' : 'transparent',
    color: activeTab === id ? '#fff' : '#6b7280',
    whiteSpace: 'nowrap', transition: 'background 0.15s',
  })

  return (
    <div style={{
      fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: '#0d1f16',
      paddingBottom: isMobile ? 80 : 40, overflowX: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            \ud83d\udcc5 Emploi du Temps
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            {schoolName} \u00b7 Ann\u00e9e {schoolYear}
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          style={{
            background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}
        >
          \u2795 Ajouter un cours
        </button>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {([
          { icon: '\ud83d\udcc5', label: 'Cours planifi\u00e9s', value: stats.coursTotal, bg: '#D8F3DC', color: '#1B4332' },
          { icon: '\ud83d\udc69\u200d\ud83c\udfeb', label: 'Enseignants actifs', value: stats.uniqueTeachers, bg: '#dbeafe', color: '#1e40af' },
          { icon: '\ud83c\udfeb', label: 'Classes couvertes', value: stats.uniqueClasses, bg: '#ede9fe', color: '#7c3aed' },
        ] as const).map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: kpi.color, opacity: 0.8 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: isMobile ? '4px 6px' : '6px 8px',
        background: '#f0faf3', borderRadius: 12, border: '1px solid #d1fae5',
        marginBottom: 20, overflowX: isMobile ? 'auto' : 'visible',
        flexWrap: isMobile ? 'nowrap' : 'wrap',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabBtn(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Grille ── */}
      {activeTab === 'grille' && (
        <div>
          {localSchedules.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid #d1fae5',
              padding: '48px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>\ud83d\udcc5</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1B4332', margin: '0 0 8px' }}>
                Aucun cours planifi\u00e9
              </h3>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>
                L\u2019emploi du temps est vide. Ajoutez des cours pour commencer.
              </p>
              <button
                onClick={() => openAddModal()}
                style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                \u2795 Ajouter le premier cours
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: isMobile ? 12 : 16 }}>
              <div style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 10, marginBottom: 14, flexWrap: 'wrap',
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Classe\u00a0:</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  style={{
                    border: '1.5px solid #d1fae5', borderRadius: 7, padding: '6px 12px',
                    fontSize: 13, fontWeight: 600, color: '#1B4332', background: '#fff',
                    cursor: 'pointer', width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {classes.length === 0 && <option value="">\u2014 Aucune classe \u2014</option>}
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  onClick={() => openAddModal(selectedClassId)}
                  style={{ background: '#F4A261', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  + Cours
                </button>
              </div>
              <EdtGrid
                classId={selectedClassId}
                className={classes.find(c => c.id === selectedClassId)?.name ?? ''}
                schedules={localSchedules}
                teachers={teachers}
                isMobile={isMobile}
                onCellClick={(day, slot) => openAddModal(selectedClassId, day, slot)}
                onDeleteCourse={s => setDeleteModal({ open: true, schedule: s })}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Liste ── */}
      {activeTab === 'liste' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '12px 12px 8px' : '14px 16px 10px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="\ud83d\udd0d Rechercher mati\u00e8re, classe, enseignant\u2026"
              style={{
                border: '1.5px solid #d1fae5', borderRadius: 8, padding: '8px 12px',
                fontSize: 13, width: '100%', background: '#f9fafb', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>
          {filteredSchedules.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              {localSchedules.length === 0 ? 'Aucun cours planifi\u00e9' : 'Aucun r\u00e9sultat'}
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filteredSchedules.map((s, i) => {
                const cls = classes.find(c => c.id === s.class_id)?.name ?? '\u2014'
                const prof = teachers.find(t => t.id === s.teacher_id)?.full_name ?? '\u2014'
                const jour = JOURS[s.day_of_week] ?? `Jour ${s.day_of_week}`
                const slot = SLOTS.find(sl => sl.index === s.slot_index)?.label ?? `Cr\u00e9neau ${s.slot_index}`
                const c = subjectColor(s.subject)
                return (
                  <div key={s.id} style={{
                    padding: '12px 14px',
                    borderBottom: i < filteredSchedules.length - 1 ? '1px solid #f0faf3' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: c.bg,
                      border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, fontSize: 14,
                    }}>
                      \ud83d\udcda
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: c.color, fontSize: 13 }}>{s.subject}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{cls} \u00b7 {prof}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {jour} \u00b7 {slot}{s.room ? ` \u00b7 \ud83d\udccd ${s.room}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteModal({ open: true, schedule: s })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, padding: 4 }}
                    >
                      \ud83d\uddd1
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Mati\u00e8re', 'Classe', 'Enseignant', 'Jour', 'Cr\u00e9neau', 'Salle', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                        color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((s, i) => {
                    const cls = classes.find(c => c.id === s.class_id)?.name ?? '\u2014'
                    const prof = teachers.find(t => t.id === s.teacher_id)?.full_name ?? '\u2014'
                    const jour = JOURS[s.day_of_week] ?? `Jour ${s.day_of_week}`
                    const slot = SLOTS.find(sl => sl.index === s.slot_index)?.label ?? `Cr\u00e9neau ${s.slot_index}`
                    const c = subjectColor(s.subject)
                    const td: React.CSSProperties = {
                      padding: '10px 14px', fontSize: 13, color: '#374151',
                      borderBottom: '1px solid #f0faf3',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                    }
                    return (
                      <tr key={s.id}>
                        <td style={td}>
                          <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                            {s.subject}
                          </span>
                        </td>
                        <td style={td}>{cls}</td>
                        <td style={td}>{prof}</td>
                        <td style={td}>{jour}</td>
                        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{slot}</td>
                        <td style={td}>{s.room ?? '\u2014'}</td>
                        <td style={td}>
                          <button
                            onClick={() => setDeleteModal({ open: true, schedule: s })}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          >
                            \ud83d\uddd1 Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Ajouter ── */}
      {activeTab === 'ajouter' && (
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #d1fae5',
          padding: isMobile ? 16 : 24, maxWidth: 520,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', margin: '0 0 20px' }}>
            \u2795 Nouveau cours
          </h3>
          <AddCourseForm
            classes={classes}
            teachers={teachers}
            isMobile={isMobile}
            loading={addLoading}
            onCancel={() => setActiveTab('grille')}
            onSubmit={handleAddCourse}
          />
        </div>
      )}

      {/* Add modal (from grid / header) */}
      {addModal.open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setAddModal({ open: false })}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: isMobile ? '95vw' : 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', margin: 0 }}>
                \u2795 Ajouter un cours
              </h3>
              <button onClick={() => setAddModal({ open: false })} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>\u00d7</button>
            </div>
            <AddCourseForm
              classes={classes}
              teachers={teachers}
              isMobile={isMobile}
              loading={addLoading}
              initialClassId={addModal.classId}
              initialDay={addModal.day}
              initialSlot={addModal.slot}
              onCancel={() => setAddModal({ open: false })}
              onSubmit={handleAddCourse}
            />
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal.open && deleteModal.schedule && (() => {
        const s = deleteModal.schedule!
        const profName = teachers.find(t => t.id === s.teacher_id)?.full_name ?? '\u2014'
        const classeName = classes.find(c => c.id === s.class_id)?.name ?? '\u2014'
        const jourLabel = JOURS[s.day_of_week] ?? `Jour ${s.day_of_week}`
        const slotLabel = SLOTS.find(sl => sl.index === s.slot_index)?.label ?? `Cr\u00e9neau ${s.slot_index}`
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setDeleteModal({ open: false })}
          >
            <div
              style={{ background: '#fff', borderRadius: 14, padding: 24, width: isMobile ? '95vw' : 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#991b1b', margin: '0 0 16px' }}>
                \ud83d\uddd1 Supprimer ce cours ?
              </h3>
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 14px', marginBottom: 18, border: '1px solid #fca5a5' }}>
                <div style={{ fontWeight: 700, color: '#1B4332', fontSize: 14 }}>{s.subject}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {classeName} \u00b7 {profName} \u00b7 {jourLabel} {slotLabel}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteModal({ open: false })} disabled={deleteLoading} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleteLoading}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
                >
                  {deleteLoading ? 'Suppression\u2026' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
