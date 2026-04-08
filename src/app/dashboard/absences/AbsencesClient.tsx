'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Student = { id: string; first_name: string; last_name: string; matricule: string; class_id: string | null; photo_url?: string | null }
type Attendance = { id: string; student_id: string; class_id: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'; reason: string | null; recorded_by: string | null }
type Teacher = { id: string; full_name: string }

interface AbsencesClientProps {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  classes: Classe[]
  students: Student[]
  attendances: Attendance[]
  teachers: Teacher[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COLORS = ['#1B4332','#40916C','#1e40af','#7c3aed','#be185d','#d97706','#065f46','#854d0e','#0e7490','#9a3412']

function getColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(first: string, last: string): string {
  return (first[0] ?? '').toUpperCase() + (last[0] ?? '').toUpperCase()
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDateFr(dateStr: string): string {
  const [y, m, day] = dateStr.split('-')
  return `${day}/${m}/${y}`
}

function todayStr(): string {
  return formatDate(new Date())
}

function presenceRate(present: number, total: number): number {
  if (total === 0) return 100
  return Math.round((present / total) * 100)
}

function rateColor(rate: number): { color: string; bg: string } {
  if (rate >= 90) return { color: '#166534', bg: '#dcfce7' }
  if (rate >= 70) return { color: '#854d0e', bg: '#fef3c7' }
  return { color: '#991b1b', bg: '#fee2e2' }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AbsencesClient({
  schoolId: _schoolId,
  schoolYear,
  schoolName,
  userId,
  userRole: _userRole,
  classes,
  students,
  attendances,
  teachers: _teachers,
}: AbsencesClientProps) {
  const isMobile = useIsMobile()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'appel' | 'overview' | 'alertes' | 'stats'>('appel')
  const [selectedClassId, setSelectedClassId] = useState(() => classes[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all')
  const [weekOffset, setWeekOffset] = useState(0)
  const [alertClassFilter, setAlertClassFilter] = useState('all')

  // ── Local attendance state ────────────────────────────────────────────────
  const [localAttendances, setLocalAttendances] = useState<Attendance[]>(attendances)

  // Track reason input per student
  const [reasons, setReasons] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const a of attendances) {
      if (a.reason) map[a.student_id + '-' + a.date] = a.reason
    }
    return map
  })

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // ── Get attendance for a student on selected date ─────────────────────────
  function getAttendance(studentId: string, date: string, classId: string): Attendance | null {
    return localAttendances.find(
      a => a.student_id === studentId && a.date === date && a.class_id === classId
    ) ?? null
  }

  // ── Save attendance ────────────────────────────────────────────────────────
  async function handleSetStatus(
    studentId: string,
    classId: string,
    date: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) {
    const reason = reasons[studentId + '-' + date] ?? null
    const existing = getAttendance(studentId, date, classId)

    // Optimistic update
    if (existing) {
      setLocalAttendances(prev =>
        prev.map(a => a.id === existing.id ? { ...a, status, reason: reason || null } : a)
      )
    } else {
      const tempId = `temp-${studentId}-${date}`
      setLocalAttendances(prev => [...prev, {
        id: tempId,
        student_id: studentId,
        class_id: classId,
        date,
        status,
        reason: reason || null,
        recorded_by: userId,
      }])
    }

    const res = await fetch('/api/attendances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, class_id: classId, date, status, reason: reason || null }),
    })

    if (res.ok) {
      const json = await res.json() as { attendance: Attendance }
      setLocalAttendances(prev => {
        const filtered = prev.filter(a => a.student_id !== studentId || a.date !== date || a.class_id !== classId)
        return [...filtered, json.attendance]
      })
      showToast('✓ Présence enregistrée')
    } else {
      // Revert
      setLocalAttendances(attendances)
      const err = await res.json().catch(() => ({ error: '' })) as { error?: string }
      showToast(`✗ ${err.error || 'Erreur'}`)
    }
  }

  // ── Save reason ────────────────────────────────────────────────────────────
  async function handleSaveReason(studentId: string, classId: string, date: string) {
    const att = getAttendance(studentId, date, classId)
    if (!att) return
    const reason = reasons[studentId + '-' + date] ?? ''

    setLocalAttendances(prev =>
      prev.map(a => a.id === att.id ? { ...a, reason: reason || null } : a)
    )

    const res = await fetch(`/api/attendances?id=${att.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: att.status, reason: reason || null }),
    })
    if (res.ok) showToast('✓ Motif sauvegardé')
    else showToast('✗ Erreur lors de la sauvegarde du motif')
  }

  // ── Students in selected class ─────────────────────────────────────────────
  const classStudents = useMemo(() =>
    students.filter(s => s.class_id === selectedClassId),
    [students, selectedClassId]
  )

  // ── Day summary counters ───────────────────────────────────────────────────
  const daySummary = useMemo(() => {
    const forDay = localAttendances.filter(a => a.date === selectedDate && a.class_id === selectedClassId)
    const total = classStudents.length
    const present = forDay.filter(a => a.status === 'present').length
    const absent = forDay.filter(a => a.status === 'absent').length
    const late = forDay.filter(a => a.status === 'late').length
    const excused = forDay.filter(a => a.status === 'excused').length
    const notRecorded = total - forDay.length
    return { total, present, absent, late, excused, notRecorded }
  }, [localAttendances, selectedDate, selectedClassId, classStudents])

  // ── Filtered students for appel tab ───────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (filterStatus === 'all') return classStudents
    return classStudents.filter(s => {
      const att = localAttendances.find(
        a => a.student_id === s.id && a.date === selectedDate && a.class_id === selectedClassId
      )
      return att?.status === filterStatus
    })
  }, [classStudents, filterStatus, selectedDate, selectedClassId, localAttendances])

  // ── Week dates for overview ────────────────────────────────────────────────
  const weekDates = useMemo(() => {
    const monday = getMondayOfWeek(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return formatDate(d)
    })
  }, [weekOffset])

  // ── Overview: per-class weekly stats ──────────────────────────────────────
  const overviewData = useMemo(() => {
    return classes.map(cls => {
      const clsStudents = students.filter(s => s.class_id === cls.id)
      const total = clsStudents.length
      const days = weekDates.map(date => {
        const att = localAttendances.filter(a => a.date === date && a.class_id === cls.id)
        const present = att.filter(a => a.status === 'present').length
        return { date, present, total, rate: presenceRate(present, total) }
      })
      const weekPresent = days.reduce((s, d) => s + d.present, 0)
      const weekTotal = days.filter(d => d.total > 0).length * total
      const weekRate = presenceRate(weekPresent, weekTotal)
      return { cls, days, weekRate }
    })
  }, [classes, students, localAttendances, weekDates])

  // ── Alerts: students with ≥3 unexcused absences in last 30 days ───────────
  const alertStudents = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = formatDate(thirtyDaysAgo)

    return students
      .filter(s => alertClassFilter === 'all' || s.class_id === alertClassFilter)
      .map(s => {
        const recent = localAttendances.filter(a => a.student_id === s.id && a.date >= cutoff)
        const unexcusedAbsences = recent.filter(a => a.status === 'absent').length
        const lates = recent.filter(a => a.status === 'late').length
        const lastAtt = recent.sort((a, b) => b.date.localeCompare(a.date))[0]
        return { student: s, unexcusedAbsences, lates, lastStatus: lastAtt?.status ?? null }
      })
      .filter(x => x.unexcusedAbsences >= 3)
      .sort((a, b) => b.unexcusedAbsences - a.unexcusedAbsences)
  }, [students, localAttendances, alertClassFilter])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statsData = useMemo(() => {
    const now = new Date()
    const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
    const monthAtt = localAttendances.filter(a => a.date >= monthStart)

    const totalRecords = localAttendances.length
    const totalPresent = localAttendances.filter(a => a.status === 'present').length
    const globalRate = presenceRate(totalPresent, totalRecords)

    const monthAbsences = monthAtt.filter(a => a.status === 'absent' || a.status === 'late').length
    const excusedAbsences = monthAtt.filter(a => a.status === 'excused').length
    const unexcusedAbsences = monthAtt.filter(a => a.status === 'absent').length

    const studentAbsenceCounts = students.map(s => {
      const monthStudentAtt = monthAtt.filter(a => a.student_id === s.id)
      const absCount = monthStudentAtt.filter(a => a.status === 'absent' || a.status === 'late').length
      const presCount = monthStudentAtt.filter(a => a.status === 'present').length
      const rate = presenceRate(presCount, monthStudentAtt.length)
      return { student: s, absCount, rate }
    })

    const studentsWithoutAbsence = studentAbsenceCounts.filter(x => x.absCount === 0).length
    const topAbsents = studentAbsenceCounts
      .filter(x => x.absCount > 0)
      .sort((a, b) => b.absCount - a.absCount)
      .slice(0, 10)

    const classPresenceRates = classes.map(cls => {
      const clsAtt = localAttendances.filter(a => a.class_id === cls.id)
      const clsPresent = clsAtt.filter(a => a.status === 'present').length
      const rate = presenceRate(clsPresent, clsAtt.length)
      return { cls, rate }
    })

    return {
      globalRate,
      monthAbsences,
      studentsWithoutAbsence,
      excusedAbsences,
      unexcusedAbsences,
      topAbsents,
      classPresenceRates,
    }
  }, [localAttendances, students, classes])

  // ─── Styles ────────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: 13,
    color: '#0d1f16',
    padding: isMobile ? '12px 8px' : '20px 24px',
    maxWidth: 1200,
    margin: '0 auto',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  }

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: isMobile ? 20 : 24,
    fontWeight: 700,
    color: '#1B4332',
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  }

  const btnPrimaryStyle: React.CSSProperties = {
    background: '#1B4332',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)',
    gap: isMobile ? 8 : 4,
    background: '#f0faf3',
    border: '1px solid #d1fae5',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    width: isMobile ? '100%' : 'fit-content',
  }

  function tabStyle(tab: string): React.CSSProperties {
    const isActive = activeTab === tab
    return {
      padding: isMobile ? '10px 8px' : '8px 16px',
      borderRadius: 8,
      border: 'none',
      background: isActive ? '#1B4332' : 'transparent',
      color: isActive ? '#fff' : '#40916C',
      fontWeight: isActive ? 700 : 500,
      fontSize: isMobile ? 12 : 13,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.15s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #d1fae5',
    borderRadius: 12,
    padding: isMobile ? 12 : 16,
    marginBottom: 12,
  }

  const selectStyle: React.CSSProperties = {
    border: '1px solid #d1fae5',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: '#0d1f16',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 120,
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #d1fae5',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: '#0d1f16',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const statusColors: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    present:  { bg: '#dcfce7', color: '#166534', label: 'Présent',  icon: '✓' },
    absent:   { bg: '#fee2e2', color: '#991b1b', label: 'Absent',   icon: '✗' },
    late:     { bg: '#fef3c7', color: '#854d0e', label: 'Retard',   icon: '⚠' },
    excused:  { bg: '#ede9fe', color: '#5b21b6', label: 'Excusé',   icon: '~' },
  }

  // ─── Render Tabs ───────────────────────────────────────────────────────────

  function renderAppelTab() {
    return (
      <div>
        {/* Selectors */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: isMobile ? 'unset' : '0 0 auto' }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Classe</label>
            <select
              style={selectStyle}
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.level ? ` — ${c.level}` : ''}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: isMobile ? 'unset' : '0 0 auto' }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Date</label>
            <input
              type="date"
              style={selectStyle}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          <div style={{ flex: isMobile ? 'unset' : '0 0 auto' }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Statut</label>
            <select
              style={selectStyle}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">Tous</option>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="late">Retard</option>
              <option value="excused">Excusé</option>
            </select>
          </div>
        </div>

        {/* Day summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}>
          {[
            { title: 'Présents', value: daySummary.present, ...statusColors.present },
            { title: 'Absents', value: daySummary.absent, ...statusColors.absent },
            { title: 'Retards', value: daySummary.late, ...statusColors.late },
            { title: 'Excusés', value: daySummary.excused, ...statusColors.excused },
          ].map(item => (
            <div key={item.title} style={{
              background: item.bg,
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                <div style={{ fontSize: 11, color: item.color, opacity: 0.8 }}>{item.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Non enregistrés */}
        {daySummary.notRecorded > 0 && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 14,
            fontSize: 12,
            color: '#6b7280',
          }}>
            ⏳ {daySummary.notRecorded} élève{daySummary.notRecorded > 1 ? 's' : ''} sans statut enregistré
          </div>
        )}

        {/* Student list */}
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
            <div>Aucun élève dans cette classe</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredStudents.map(student => {
              const att = getAttendance(student.id, selectedDate, selectedClassId)
              const currentStatus = att?.status ?? null
              const reasonKey = student.id + '-' + selectedDate
              const showReasonField = currentStatus === 'absent' || currentStatus === 'late'

              return (
                <div key={student.id} style={{
                  ...cardStyle,
                  padding: isMobile ? '12px' : '12px 16px',
                  marginBottom: 0,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 10 : 12,
                  }}>
                    {/* Avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: getColor(student.id),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {getInitials(student.first_name, student.last_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {student.last_name} {student.first_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{student.matricule}</div>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 6,
                      width: isMobile ? '100%' : 'auto',
                    }}>
                      {(['present', 'absent', 'late', 'excused'] as const).map(s => {
                        const sc = statusColors[s]
                        const isSelected = currentStatus === s
                        return (
                          <button
                            key={s}
                            onClick={() => handleSetStatus(student.id, selectedClassId, selectedDate, s)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: isSelected ? `2px solid ${sc.color}` : '1px solid #d1fae5',
                              background: isSelected ? sc.bg : '#f9fafb',
                              color: isSelected ? sc.color : '#6b7280',
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.12s',
                            }}
                          >
                            {sc.icon} {sc.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Reason field */}
                  {showReasonField && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Motif (optionnel)"
                        value={reasons[reasonKey] ?? ''}
                        onChange={e => setReasons(prev => ({ ...prev, [reasonKey]: e.target.value }))}
                        onBlur={() => handleSaveReason(student.id, selectedClassId, selectedDate)}
                      />
                      <button
                        onClick={() => handleSaveReason(student.id, selectedClassId, selectedDate)}
                        style={{
                          ...btnPrimaryStyle,
                          padding: '7px 12px',
                          fontSize: 12,
                          background: '#40916C',
                          borderRadius: 6,
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderOverviewTab() {
    const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
    const weekLabel = (() => {
      if (weekOffset === 0) return 'Semaine courante'
      if (weekOffset === -1) return 'Semaine précédente'
      if (weekOffset === 1) return 'Semaine suivante'
      return `Semaine ${weekOffset > 0 ? '+' : ''}${weekOffset}`
    })()

    return (
      <div>
        {/* Week navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            style={{ ...btnPrimaryStyle, background: '#f0faf3', color: '#1B4332', padding: '6px 12px' }}
          >
            ← Précédente
          </button>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#1B4332' }}>{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            style={{ ...btnPrimaryStyle, background: '#f0faf3', color: '#1B4332', padding: '6px 12px' }}
          >
            Suivante →
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{ ...btnPrimaryStyle, background: '#D8F3DC', color: '#1B4332', padding: '6px 12px' }}
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>

        {/* Dates header */}
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>
          {weekDates.map((d, i) => `${dayLabels[i]} ${formatDateFr(d)}`).join(' · ')}
        </div>

        {isMobile ? (
          // Mobile: cards
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overviewData.map(({ cls, days, weekRate }) => {
              const rc = rateColor(weekRate)
              return (
                <div key={cls.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</div>
                    <span style={{
                      background: rc.bg, color: rc.color,
                      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                    }}>
                      {weekRate}%
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                    {days.map((d, i) => {
                      const dc = rateColor(d.rate)
                      return (
                        <div key={d.date} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>{dayLabels[i]}</div>
                          <div style={{
                            background: dc.bg, color: dc.color,
                            borderRadius: 6, padding: '4px 2px',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {d.total > 0 ? `${d.present}/${d.total}` : '—'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Desktop: table
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0faf3' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Classe</th>
                  {dayLabels.map((d, i) => (
                    <th key={d} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>
                      {d}<br /><span style={{ fontSize: 10, fontWeight: 400, color: '#6b7280' }}>{formatDateFr(weekDates[i])}</span>
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Taux semaine</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.map(({ cls, days, weekRate }) => {
                  const rc = rateColor(weekRate)
                  return (
                    <tr key={cls.id} style={{ borderBottom: '1px solid #f0faf3' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{cls.name}</td>
                      {days.map(d => {
                        const dc = rateColor(d.rate)
                        return (
                          <td key={d.date} style={{ padding: '8px 14px', textAlign: 'center' }}>
                            {d.total > 0 ? (
                              <span style={{
                                background: dc.bg, color: dc.color,
                                padding: '3px 8px', borderRadius: 8,
                                fontSize: 12, fontWeight: 600,
                              }}>
                                {d.present}/{d.total}
                              </span>
                            ) : (
                              <span style={{ color: '#d1d5db' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: rc.bg, color: rc.color,
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {weekRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  function renderAlertesTab() {
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Filtrer par classe :</span>
          <select
            style={selectStyle}
            value={alertClassFilter}
            onChange={e => setAlertClassFilter(e.target.value)}
          >
            <option value="all">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #f4a261',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#854d0e',
        }}>
          ⚠️ Élèves avec <strong>≥ 3 absences non excusées</strong> sur les 30 derniers jours
        </div>

        {alertStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Aucune alerte</div>
            <div style={{ fontSize: 12 }}>Tous les élèves ont un bon taux de présence</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alertStudents.map(({ student, unexcusedAbsences, lates, lastStatus }) => {
              const cls = classes.find(c => c.id === student.class_id)
              return (
                <div key={student.id} style={{
                  ...cardStyle,
                  marginBottom: 0,
                  borderLeft: '4px solid #dc2626',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: getColor(student.id),
                      color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(student.first_name, student.last_name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {student.last_name} {student.first_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {cls?.name ?? '—'} · {student.matricule}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        background: '#fee2e2', color: '#991b1b',
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        ✗ {unexcusedAbsences} abs.
                      </span>
                      {lates > 0 && (
                        <span style={{
                          background: '#fef3c7', color: '#854d0e',
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 700,
                        }}>
                          ⚠ {lates} retard{lates > 1 ? 's' : ''}
                        </span>
                      )}
                      {lastStatus && (
                        <span style={{
                          background: statusColors[lastStatus]?.bg ?? '#f3f4f6',
                          color: statusColors[lastStatus]?.color ?? '#6b7280',
                          padding: '3px 8px', borderRadius: 8, fontSize: 11,
                        }}>
                          Dernier : {statusColors[lastStatus]?.label ?? lastStatus}
                        </span>
                      )}
                      <span style={{
                        background: '#fef3c7', color: '#d97706',
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        ⚠ Suivi requis
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderStatsTab() {
    const { globalRate, monthAbsences, studentsWithoutAbsence, excusedAbsences, unexcusedAbsences, topAbsents, classPresenceRates } = statsData
    const rc = rateColor(globalRate)

    const maxRate = Math.max(...classPresenceRates.map(c => c.rate), 1)

    return (
      <div>
        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 20,
        }}>
          <div style={{ background: rc.bg, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: rc.color, fontWeight: 600, marginBottom: 4 }}>Taux de présence global</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: rc.color, fontFamily: "'JetBrains Mono', monospace" }}>{globalRate}%</div>
          </div>
          <div style={{ background: '#fee2e2', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>Absences ce mois</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#991b1b', fontFamily: "'JetBrains Mono', monospace" }}>{monthAbsences}</div>
          </div>
          <div style={{ background: '#dcfce7', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Élèves sans absence</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#166534', fontFamily: "'JetBrains Mono', monospace" }}>{studentsWithoutAbsence}</div>
          </div>
          <div style={{ background: '#ede9fe', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#5b21b6', fontWeight: 600, marginBottom: 4 }}>Excusées / Non excusées</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5b21b6', fontFamily: "'JetBrains Mono', monospace" }}>
              {excusedAbsences} / {unexcusedAbsences}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        {classPresenceRates.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: '#1B4332', marginBottom: 14 }}>
              📊 Taux de présence par classe
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classPresenceRates.map(({ cls, rate }) => {
                const bc = rateColor(rate)
                const pct = (rate / maxRate) * 100
                return (
                  <div key={cls.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{cls.name}</span>
                      <span style={{ color: bc.color, fontWeight: 700 }}>{rate}%</span>
                    </div>
                    <div style={{ background: '#f0faf3', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: bc.color,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top absents */}
        {topAbsents.length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: '#1B4332', marginBottom: 14 }}>
              🔴 Top absences ce mois (élèves)
            </div>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topAbsents.map(({ student, absCount, rate }, idx) => {
                  const cls = classes.find(c => c.id === student.class_id)
                  const rc2 = rateColor(rate)
                  return (
                    <div key={student.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', background: '#f9fafb', borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 11, color: '#6b7280', width: 20, textAlign: 'center' }}>{idx + 1}</span>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: getColor(student.id), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {getInitials(student.first_name, student.last_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{student.last_name} {student.first_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{cls?.name ?? '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>{absCount} abs.</div>
                        <div style={{ fontSize: 11, color: rc2.color }}>{rate}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f0faf3' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>#</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Élève</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Classe</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Absences</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>Taux présence</th>
                  </tr>
                </thead>
                <tbody>
                  {topAbsents.map(({ student, absCount, rate }, idx) => {
                    const cls = classes.find(c => c.id === student.class_id)
                    const rc2 = rateColor(rate)
                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid #f0faf3' }}>
                        <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: getColor(student.id), color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              {getInitials(student.first_name, student.last_name)}
                            </div>
                            <span style={{ fontWeight: 600 }}>{student.last_name} {student.first_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#6b7280' }}>{cls?.name ?? '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                            {absCount}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ background: rc2.bg, color: rc2.color, padding: '2px 8px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>🗓️ Gestion des Absences</h1>
          <div style={subtitleStyle}>{schoolYear} · {schoolName}</div>
        </div>
        <button
          style={btnPrimaryStyle}
          onClick={() => { setActiveTab('appel'); setSelectedDate(todayStr()) }}
        >
          📋 Saisie rapide
        </button>
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button style={tabStyle('appel')} onClick={() => setActiveTab('appel')}>
          📋 {isMobile ? 'Appel' : 'Appel du jour'}
        </button>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
          📊 {isMobile ? 'Vue' : 'Vue d\'ensemble'}
        </button>
        <button style={tabStyle('alertes')} onClick={() => setActiveTab('alertes')}>
          🔴 Alertes
          {alertStudents.length > 0 && (
            <span style={{
              background: '#dc2626', color: '#fff',
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, marginLeft: 2,
            }}>
              {alertStudents.length}
            </span>
          )}
        </button>
        <button style={tabStyle('stats')} onClick={() => setActiveTab('stats')}>
          📈 Statistiques
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'appel' && renderAppelTab()}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'alertes' && renderAlertesTab()}
      {activeTab === 'stats' && renderStatsTab()}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: isMobile ? 12 : 24,
          left: isMobile ? 12 : 'auto',
          background: toast.startsWith('✗') ? '#dc2626' : '#1B4332',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
