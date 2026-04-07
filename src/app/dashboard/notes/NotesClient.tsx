'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Subject = { id: string; name: string; coefficient: number; class_id: string | null; teacher_id: string | null }
type Grade = { id: string; student_id: string; subject_id: string; class_id: string; teacher_id: string; grade: number; max_grade: number; trimestre: number; comment: string | null; created_at: string }
type Student = { id: string; first_name: string; last_name: string; matricule: string; class_id: string | null }

interface NotesClientProps {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  classes: Classe[]
  subjects: Subject[]
  grades: Grade[]
  students: Student[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMention(avg: number): string {
  if (avg >= 18) return 'Excellent'
  if (avg >= 16) return 'Très bien'
  if (avg >= 14) return 'Bien'
  if (avg >= 12) return 'Assez bien'
  if (avg >= 10) return 'Passable'
  return 'Insuffisant'
}

function getMentionColors(avg: number): { color: string; bg: string } {
  if (avg >= 18) return { color: '#166534', bg: '#dcfce7' }
  if (avg >= 14) return { color: '#1e40af', bg: '#dbeafe' }
  if (avg >= 12) return { color: '#d97706', bg: '#fef3c7' }
  if (avg >= 10) return { color: '#6b7280', bg: '#f3f4f6' }
  return { color: '#dc2626', bg: '#fee2e2' }
}

function getNoteStyle(note: number | null): { borderColor: string; bg: string; color: string } {
  if (note === null) return { borderColor: '#d1fae5', bg: '#ffffff', color: '#6b7280' }
  if (note >= 14) return { borderColor: '#16a34a', bg: '#f0faf3', color: '#166534' }
  if (note >= 10) return { borderColor: '#1e40af', bg: '#ffffff', color: '#1e40af' }
  if (note >= 8)  return { borderColor: '#d97706', bg: '#ffffff', color: '#d97706' }
  return { borderColor: '#dc2626', bg: '#fff0f0', color: '#dc2626' }
}

function getInitials(first: string, last: string): string {
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

const AVATAR_COLORS = ['#1B4332','#40916C','#1e40af','#7c3aed','#be185d','#d97706','#065f46','#0e7490']
function getAvatarColor(id: string): string {
  let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose, isMobile }: { message: string; onClose: () => void; isMobile: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: isMobile ? 80 : 24, right: 24,
      background: '#1B4332', color: '#ffffff',
      padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
      boxShadow: '0 4px 14px rgba(27,67,50,0.3)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999,
    }}>
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
    </div>
  )
}

// ─── Modal Ajouter Matière ────────────────────────────────────────────────────

interface AddSubjectModalProps {
  classId: string
  className: string
  isMobile: boolean
  onClose: () => void
  onCreated: (subject: Subject) => void
}

function AddSubjectModal({ classId, className, isMobile, onClose, onCreated }: AddSubjectModalProps) {
  const [name, setName] = useState('')
  const [coefficient, setCoefficient] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), coefficient, class_id: classId || null }),
      })
      const json = (await res.json()) as { subject?: Subject; error?: string }
      if (!res.ok) { setError(json.error ?? 'Erreur'); return }
      if (json.subject) onCreated(json.subject)
    } catch { setError('Erreur réseau') }
    finally { setSaving(false) }
  }

  const modalStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column', padding: 20, overflowY: 'auto' }
    : { background: '#fff', borderRadius: 13, padding: 24, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: isMobile ? 'transparent' : 'rgba(0,0,0,0.45)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={isMobile ? undefined : onClose}
    >
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: '#1B4332' }}>
            ➕ Ajouter une matière
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', padding: 4 }}>✕</button>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 7, marginBottom: 12, fontSize: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom de la matière *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Mathématiques"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Source Sans 3, sans-serif' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Coefficient *</label>
            <input type="number" min={1} max={10} value={coefficient} onChange={e => setCoefficient(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Classe</label>
            <input value={className} disabled
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', background: '#f9fafb', color: '#6b7280' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #d1fae5', background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Création...' : 'Créer la matière'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotesClient({
  schoolYear,
  schoolName,
  classes,
  subjects: initialSubjects,
  grades: initialGrades,
  students,
}: NotesClientProps) {
  const isMobile = useIsMobile()

  // ── State ──
  const [activeTab, setActiveTab] = useState<'saisie' | 'bulletins' | 'stats'>('saisie')
  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [selectedTrimestre, setSelectedTrimestre] = useState<1 | 2 | 3>(1)
  const [localGrades, setLocalGrades] = useState<Grade[]>(initialGrades)
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(initialSubjects)
  // noteInputs[studentId][subjectId] = local string value being edited
  const [noteInputs, setNoteInputs] = useState<Record<string, Record<string, string>>>({})
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Derived data ──

  const selectedClasse = classes.find(c => c.id === selectedClasseId)

  const classeStudents = useMemo(
    () => students.filter(s => s.class_id === selectedClasseId),
    [students, selectedClasseId]
  )

  const classeSubjects = useMemo(
    () => localSubjects.filter(s => s.class_id === selectedClasseId || s.class_id === null),
    [localSubjects, selectedClasseId]
  )

  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>()
    for (const g of localGrades) map.set(`${g.student_id}|${g.subject_id}|${g.trimestre}`, g)
    return map
  }, [localGrades])

  // ── Global stats ──

  const totalNotesSaisies = useMemo(
    () => localGrades.filter(g => g.trimestre === selectedTrimestre).length,
    [localGrades, selectedTrimestre]
  )

  const moyenneGenerale = useMemo(() => {
    const tg = localGrades.filter(g => g.trimestre === selectedTrimestre)
    if (!tg.length) return 0
    return Math.round((tg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / tg.length) * 10) / 10
  }, [localGrades, selectedTrimestre])

  // Taux de réussite: % unique students with avg >= 10 for trimestre
  const { tauxReussite, enDifficulte } = useMemo(() => {
    if (!students.length) return { tauxReussite: 0, enDifficulte: 0 }
    const studentAvgs = students.map(s => {
      const subs = localSubjects.filter(sub => sub.class_id === s.class_id || sub.class_id === null)
      let ws = 0, cs = 0
      for (const sub of subs) {
        const g = gradeMap.get(`${s.id}|${sub.id}|${selectedTrimestre}`)
        if (g) { ws += (g.grade / g.max_grade) * 20 * sub.coefficient; cs += sub.coefficient }
      }
      return cs > 0 ? ws / cs : null
    }).filter((a): a is number => a !== null)
    const passing = studentAvgs.filter(a => a >= 10).length
    return {
      tauxReussite: studentAvgs.length > 0 ? Math.round((passing / studentAvgs.length) * 100) : 0,
      enDifficulte: studentAvgs.filter(a => a < 10).length,
    }
  }, [students, localSubjects, gradeMap, selectedTrimestre])

  const nbMatieresActives = localSubjects.length

  // ── Classes without subjects ──
  const classesWithoutSubjects = useMemo(
    () => classes.filter(c => !localSubjects.some(s => s.class_id === c.id)),
    [classes, localSubjects]
  )

  // ── Save grade ──

  const saveGrade = useCallback(async (student: Student, subjectId: string, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 20 || !selectedClasseId) return

    const key = `${student.id}|${subjectId}`
    setPendingSaves(prev => new Set([...prev, key]))

    const existing = gradeMap.get(`${student.id}|${subjectId}|${selectedTrimestre}`)
    const optimistic: Grade = existing
      ? { ...existing, grade: num }
      : { id: `tmp-${Date.now()}`, student_id: student.id, subject_id: subjectId, class_id: selectedClasseId, teacher_id: '', grade: num, max_grade: 20, trimestre: selectedTrimestre, comment: null, created_at: new Date().toISOString() }

    setLocalGrades(prev => [...prev.filter(g => !(g.student_id === student.id && g.subject_id === subjectId && g.trimestre === selectedTrimestre)), optimistic])

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, subject_id: subjectId, class_id: selectedClasseId, grade: num, max_grade: 20, trimestre: selectedTrimestre, comment: null }),
      })
      const json = (await res.json()) as { grade?: Grade }
      if (res.ok && json.grade) {
        setLocalGrades(prev => [...prev.filter(g => !(g.student_id === student.id && g.subject_id === subjectId && g.trimestre === selectedTrimestre)), json.grade!])
        showToast('Note sauvegardée ✓')
      }
    } catch {
      setLocalGrades(prev => {
        const f = prev.filter(g => !(g.student_id === student.id && g.subject_id === subjectId && g.trimestre === selectedTrimestre))
        return existing ? [...f, existing] : f
      })
    } finally {
      setPendingSaves(prev => { const n = new Set(prev); n.delete(key); return n })
      setNoteInputs(prev => {
        const next = { ...prev }
        const sMap = { ...(next[student.id] ?? {}) }
        delete sMap[subjectId]
        next[student.id] = sMap
        return next
      })
    }
  }, [selectedClasseId, selectedTrimestre, gradeMap, showToast])

  const saveAll = useCallback(async () => {
    const entries = Object.entries(noteInputs)
    if (entries.length === 0) { showToast('Aucune note en attente'); return }
    for (const [studentId, subMap] of entries) {
      const student = students.find(s => s.id === studentId)
      if (!student) continue
      for (const [subjectId, value] of Object.entries(subMap)) {
        if (value !== '') await saveGrade(student, subjectId, value)
      }
    }
    showToast('Toutes les notes ont été sauvegardées ✓')
  }, [noteInputs, students, saveGrade, showToast])

  const handleSubjectCreated = useCallback((subject: Subject) => {
    setLocalSubjects(prev => [...prev, subject])
    setShowAddSubject(false)
    showToast(`Matière "${subject.name}" créée ✓`)
  }, [showToast])

  // ── Bulletin helpers ──

  function getStudentAvg(studentId: string, trimestre: number, classId: string) {
    const subs = localSubjects.filter(s => s.class_id === classId || s.class_id === null)
    let ws = 0, cs = 0
    for (const sub of subs) {
      const g = gradeMap.get(`${studentId}|${sub.id}|${trimestre}`)
      if (g) { ws += (g.grade / g.max_grade) * 20 * sub.coefficient; cs += sub.coefficient }
    }
    return cs > 0 ? Math.round((ws / cs) * 10) / 10 : 0
  }

  function getBulletinData(studentId: string, trimestre: number) {
    const subs = classeSubjects
    const rows = subs.map(sub => {
      const g = gradeMap.get(`${studentId}|${sub.id}|${trimestre}`)
      return { subject: sub, grade: g ?? null }
    })
    const notedRows = rows.filter(r => r.grade !== null)
    let ws = 0, cs = 0
    for (const r of notedRows) { if (r.grade) { ws += (r.grade.grade / r.grade.max_grade) * 20 * r.subject.coefficient; cs += r.subject.coefficient } }
    const avg = cs > 0 ? Math.round((ws / cs) * 10) / 10 : 0

    const allAvgs = classeStudents.map(s => ({ id: s.id, avg: getStudentAvg(s.id, trimestre, selectedClasseId) })).sort((a, b) => b.avg - a.avg)
    const rank = allAvgs.findIndex(a => a.id === studentId) + 1

    const classeAvgBySubject = new Map<string, number>()
    for (const sub of subs) {
      const sgs = classeStudents.map(s => gradeMap.get(`${s.id}|${sub.id}|${trimestre}`)).filter(Boolean) as Grade[]
      if (sgs.length) classeAvgBySubject.set(sub.id, Math.round((sgs.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / sgs.length) * 10) / 10)
    }

    const clsGrades = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === trimestre)
    const classeAvg = clsGrades.length > 0 ? Math.round((clsGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / clsGrades.length) * 10) / 10 : 0

    return { rows, avg, rank, total: classeStudents.length, classeAvgBySubject, classeAvg }
  }

  // ── Render helpers ──

  function trimLabel(t: 1 | 2 | 3) { return t === 1 ? '1er trim.' : `${t}e trim.` }

  function NoteChip({ val }: { val: number | null }) {
    if (val === null) return <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>
    const s = getNoteStyle(val)
    return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, borderRadius: 5, padding: '1px 7px', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', display: 'inline-block' }}>{val % 1 === 0 ? val : val.toFixed(1)}</span>
  }

  // ═══════════════════════════════════════════════════════
  // TAB SAISIE
  // ═══════════════════════════════════════════════════════

  function renderSaisie() {
    return (
      <div>
        {/* Alerte orange: classes sans matières */}
        {classesWithoutSubjects.length > 0 && (
          <div style={{ background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 8, padding: '9px 13px', marginBottom: 12, fontSize: 12, color: '#9a3412', display: 'flex', gap: 8 }}>
            <span>⚠️</span>
            <span><strong>{classesWithoutSubjects.length} classe{classesWithoutSubjects.length > 1 ? 's' : ''}</strong> n'ont pas encore de matières configurées.{' '}
              <span onClick={() => setShowAddSubject(true)} style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Configurer →</span>
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select
            value={selectedClasseId}
            onChange={e => { setSelectedClasseId(e.target.value); setNoteInputs({}) }}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', fontFamily: 'inherit', cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}
          >
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', width: isMobile ? '100%' : 'auto' }}>
            {([1, 2, 3] as const).map(t => (
              <button key={t} onClick={() => setSelectedTrimestre(t)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
                fontFamily: 'inherit',
              }}>
                {trimLabel(t)}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAddSubject(true)}
            style={{ background: '#fff4ec', border: '1px solid #fed7aa', color: '#9a3412', padding: '7px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            + Matière
          </button>
        </div>

        {/* Content */}
        {!selectedClasseId ? renderClasseList() : renderSaisieTable()}
      </div>
    )
  }

  function renderClasseList() {
    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classes.map(cls => {
            const clsStudents = students.filter(s => s.class_id === cls.id)
            const clsSubs = localSubjects.filter(s => s.class_id === cls.id || s.class_id === null)
            const noted = localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre).length
            const possible = clsStudents.length * clsSubs.length
            const pct = possible > 0 ? Math.round((noted / possible) * 100) : 0
            const color = getAvatarColor(cls.id)
            return (
              <div key={cls.id}
                onClick={() => setSelectedClasseId(cls.id)}
                style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {cls.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B4332' }}>{cls.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{clsStudents.length} élèves · {clsSubs.length} matières</div>
                  </div>
                  <span style={{ background: '#D8F3DC', color: '#1B4332', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    {clsSubs.length}/{clsSubs.length > 0 ? clsSubs.length : '0'} mat.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#40916C' : pct >= 40 ? '#d97706' : '#dc2626', borderRadius: 3, transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{noted}/{possible} notes</span>
                </div>
              </div>
            )
          })}
          {classes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: 13 }}>Aucune classe configurée</div>
          )}
        </div>
      )
    }

    // Desktop: table list with progress bars
    return (
      <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
          📋 Sélectionnez une classe pour saisir les notes
        </div>
        {classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#6b7280', fontSize: 13 }}>Aucune classe configurée</div>
        ) : (
          <div>
            {classes.map(cls => {
              const clsStudents = students.filter(s => s.class_id === cls.id)
              const clsSubs = localSubjects.filter(s => s.class_id === cls.id || s.class_id === null)
              const noted = localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre).length
              const possible = clsStudents.length * clsSubs.length
              const pct = possible > 0 ? Math.round((noted / possible) * 100) : 0
              return (
                <div key={cls.id}
                  onClick={() => setSelectedClasseId(cls.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0faf3')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: getAvatarColor(cls.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {cls.name[0]}
                  </div>
                  <div style={{ width: 120, fontWeight: 600, color: '#1B4332', fontSize: 13 }}>{cls.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', width: 100 }}>{clsStudents.length} élèves</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#40916C' : pct >= 40 ? '#d97706' : '#dc2626', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', width: 80, textAlign: 'right' }}>{noted}/{possible} notes</span>
                  </div>
                  <span style={{ background: '#D8F3DC', color: '#1B4332', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {clsSubs.length} matière{clsSubs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderSaisieTable() {
    const thStyle: React.CSSProperties = {
      padding: '7px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280',
      textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f3f4f6',
      borderBottom: '1px solid #d1fae5', whiteSpace: 'nowrap', textAlign: 'center',
    }

    // Row average for a student
    function getRowAvg(student: Student): number | null {
      let ws = 0, cs = 0
      for (const sub of classeSubjects) {
        const g = gradeMap.get(`${student.id}|${sub.id}|${selectedTrimestre}`)
        if (g) { ws += (g.grade / g.max_grade) * 20 * sub.coefficient; cs += sub.coefficient }
      }
      return cs > 0 ? Math.round((ws / cs) * 10) / 10 : null
    }

    // Column average for a subject
    function getColAvg(subjectId: string): number | null {
      const gs = classeStudents.map(s => gradeMap.get(`${s.id}|${subjectId}|${selectedTrimestre}`)).filter(Boolean) as Grade[]
      if (!gs.length) return null
      return Math.round((gs.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / gs.length) * 10) / 10
    }

    return (
      <div>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            📋 {selectedClasse?.name} — Saisie {trimLabel(selectedTrimestre)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isMobile && (
              <button onClick={() => setSelectedClasseId('')}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Retour
              </button>
            )}
            <button onClick={saveAll}
              style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              💾 Tout sauvegarder
            </button>
          </div>
        </div>

        {classeStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
            Aucun élève dans cette classe
          </div>
        ) : classeSubjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9a3412', fontSize: 13, background: '#fff4ec', borderRadius: 10, border: '1px dashed #fed7aa' }}>
            ⚠️ Aucune matière configurée pour cette classe.{' '}
            <span onClick={() => setShowAddSubject(true)} style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Ajouter une matière →</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 500 + classeSubjects.length * 70 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', width: 28 }}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left', minWidth: 130 }}>Élève</th>
                  {classeSubjects.map(sub => (
                    <th key={sub.id} style={{ ...thStyle, width: 70 }}>
                      <div style={{ fontSize: 9 }}>{sub.name}</div>
                      <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 400 }}>coef {sub.coefficient}</div>
                    </th>
                  ))}
                  <th style={{ ...thStyle, width: 70 }}>Moy. /20</th>
                </tr>
              </thead>
              <tbody>
                {classeStudents.map((student, idx) => {
                  const rowAvg = getRowAvg(student)
                  const avgStyle = rowAvg !== null ? getNoteStyle(rowAvg) : null
                  return (
                    <tr key={student.id}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0faf3' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#1B4332', whiteSpace: 'nowrap', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: getAvatarColor(student.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {getInitials(student.first_name, student.last_name)}
                          </div>
                          <span style={{ fontSize: 12 }}>{student.last_name} {student.first_name}</span>
                        </div>
                      </td>
                      {classeSubjects.map(sub => {
                        const gKey = `${student.id}|${sub.id}|${selectedTrimestre}`
                        const existing = gradeMap.get(gKey)
                        const localVal = noteInputs[student.id]?.[sub.id]
                        const displayVal = localVal ?? (existing ? String((existing.grade / existing.max_grade) * 20) : '')
                        const noteNum = displayVal !== '' ? parseFloat(displayVal) : null
                        const ns = getNoteStyle(noteNum)
                        const isSaving = pendingSaves.has(`${student.id}|${sub.id}`)
                        return (
                          <td key={sub.id} style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                            <input
                              type="number" min={0} max={20} step={0.5}
                              value={displayVal}
                              onChange={e => {
                                const v = e.target.value
                                setNoteInputs(prev => ({ ...prev, [student.id]: { ...(prev[student.id] ?? {}), [sub.id]: v } }))
                              }}
                              onBlur={() => {
                                const val = noteInputs[student.id]?.[sub.id]
                                if (val !== undefined) saveGrade(student, sub.id, val)
                              }}
                              style={{
                                width: 60, height: 28, textAlign: 'center',
                                borderRadius: 5, fontSize: 12, fontWeight: 600,
                                border: `1.5px solid ${isSaving ? '#d97706' : ns.borderColor}`,
                                background: isSaving ? '#fef3c7' : (existing ? ns.bg : '#ffffff'),
                                color: ns.color,
                                outline: 'none', fontFamily: 'JetBrains Mono, monospace',
                                boxSizing: 'border-box',
                              }}
                            />
                          </td>
                        )
                      })}
                      <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        {rowAvg !== null && avgStyle ? (
                          <span style={{ display: 'inline-block', background: avgStyle.bg, color: avgStyle.color, border: `1px solid ${avgStyle.borderColor}`, borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                            {rowAvg % 1 === 0 ? rowAvg : rowAvg.toFixed(1)}
                          </span>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf3', borderTop: '2px solid #D8F3DC' }}>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: 10, color: '#6b7280' }}>—</td>
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#1B4332', fontSize: 11 }}>Moyennes</td>
                  {classeSubjects.map(sub => {
                    const avg = getColAvg(sub.id)
                    const s = avg !== null ? getNoteStyle(avg) : null
                    return (
                      <td key={sub.id} style={{ padding: '8px 6px', textAlign: 'center' }}>
                        {avg !== null && s ? (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: s.color }}>{avg % 1 === 0 ? avg : avg.toFixed(1)}</span>
                        ) : <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>}
                      </td>
                    )
                  })}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {(() => {
                      const allAvgs = classeStudents.map(s => getRowAvg(s)).filter((a): a is number => a !== null)
                      if (!allAvgs.length) return <span style={{ color: '#d1d5db' }}>—</span>
                      const gAvg = Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10
                      const s = getNoteStyle(gAvg)
                      return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: s.color }}>{gAvg % 1 === 0 ? gAvg : gAvg.toFixed(1)}</span>
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  // TAB BULLETINS
  // ═══════════════════════════════════════════════════════

  function renderBulletins() {
    const bulletinStudents = students.filter(s => s.class_id === selectedClasseId)
    const activeStudent = bulletinStudents.find(s => s.id === selectedStudentId)

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={selectedClasseId} onChange={e => { setSelectedClasseId(e.target.value); setSelectedStudentId('') }}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option value="">— Choisir une classe —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button key={t} onClick={() => setSelectedTrimestre(t)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              }}>{trimLabel(t)}</button>
            ))}
          </div>
          <button style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
            onClick={() => showToast('Génération des bulletins en cours...')}>
            🖨️ Générer tous les bulletins
          </button>
          <button style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => showToast('Export PDF en cours...')}>
            📤 Exporter PDF
          </button>
        </div>

        {!selectedClasseId ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
            Sélectionnez une classe pour voir les bulletins
          </div>
        ) : bulletinStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13 }}>Aucun élève dans cette classe</div>
        ) : (
          <div>
            {/* Bulletin preview if student selected */}
            {activeStudent && (
              <div style={{ marginBottom: 16 }}>
                {renderBulletinDoc(activeStudent)}
                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button onClick={() => setSelectedStudentId('')}
                    style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Retour à la liste
                  </button>
                </div>
              </div>
            )}

            {/* Student table or cards */}
            {!activeStudent && (
              isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bulletinStudents.map((s, i) => {
                    const avg = getStudentAvg(s.id, selectedTrimestre, selectedClasseId)
                    const mention = getMention(avg)
                    const { color: mc, bg: mb } = getMentionColors(avg)
                    const ns = getNoteStyle(avg)
                    return (
                      <div key={s.id} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: getAvatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                            {getInitials(s.first_name, s.last_name)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>{s.last_name} {s.first_name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>Rang {i + 1} · {s.matricule}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: ns.color }}>{avg > 0 ? `${avg}/20` : '—'}</div>
                            <span style={{ background: mb, color: mc, fontSize: 10, padding: '1px 7px', borderRadius: 999, fontWeight: 500 }}>{mention}</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedStudentId(s.id)}
                          style={{ width: '100%', padding: '8px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                          👁️ Voir le bulletin
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6' }}>
                        {['Élève', 'Moyenne', 'Mention', 'Rang', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: h === 'Élève' ? 'left' : 'center', borderBottom: '1px solid #d1fae5', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulletinStudents.map((s, i) => {
                        const avg = getStudentAvg(s.id, selectedTrimestre, selectedClasseId)
                        const mention = getMention(avg)
                        const { color: mc, bg: mb } = getMentionColors(avg)
                        const ns = getNoteStyle(avg)
                        return (
                          <tr key={s.id}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0faf3')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                            <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: getAvatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                  {getInitials(s.first_name, s.last_name)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1B4332' }}>{s.last_name} {s.first_name}</div>
                                  <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>{s.matricule}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: ns.color }}>{avg > 0 ? `${avg}/20` : '—'}</span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                              <span style={{ background: mb, color: mc, fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>{mention}</span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#1B4332', fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>
                              {i + 1}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                              <button onClick={() => setSelectedStudentId(s.id)}
                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', color: '#1B4332', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                👁️ Voir
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>
    )
  }

  function renderBulletinDoc(activeStudent: Student) {
    const { rows, avg: moyenneEleve, rank, classeAvgBySubject, classeAvg: moyenneClasse } = getBulletinData(activeStudent.id, selectedTrimestre)
    const mention = getMention(moyenneEleve)
    const { color: mentionColor, bg: mentionBg } = getMentionColors(moyenneEleve)
    const initials = getInitials(activeStudent.first_name, activeStudent.last_name)

    const appreciation =
      mention === 'Excellent' ? 'Résultats remarquables. Continuez ainsi !' :
      mention === 'Très bien' ? 'Excellent travail. Félicitations !' :
      mention === 'Bien' ? 'Bons résultats. Encouragé à continuer.' :
      mention === 'Assez bien' ? 'Des efforts notables. Peut faire mieux.' :
      mention === 'Passable' ? 'Résultats moyens. Des progrès sont attendus.' :
      'Résultats insuffisants. Un travail plus sérieux est nécessaire.'

    const getAppreciation = (v: number | null) => {
      if (v === null) return '—'
      if (v >= 18) return 'Excellent'
      if (v >= 16) return 'Très bien'
      if (v >= 14) return 'Bien'
      if (v >= 12) return 'Assez bien'
      if (v >= 10) return 'Passable'
      return 'Insuffisant'
    }

    return (
      <div style={{ background: '#ffffff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(27,67,50,0.12)' }}>
        {/* Header vert */}
        <div style={{ background: '#1B4332', padding: '24px 28px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, fontFamily: 'Playfair Display, serif', fontSize: 160, color: 'rgba(255,255,255,0.04)', fontWeight: 700, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>S</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, background: '#F4A261', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>S</div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>{schoolName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Établissement scolaire</div>
              </div>
            </div>
            <div style={{ background: '#F4A261', color: '#1B4332', fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bulletin scolaire</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
            {[{ label: 'Année', val: schoolYear }, { label: 'Classe', val: selectedClasse?.name ?? '—' }, { label: 'Trimestre', val: trimLabel(selectedTrimestre) }, { label: "Date d'édition", val: new Date().toLocaleDateString('fr-FR') }]
              .map(({ label, val }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#ffffff' }}>{val}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Bloc élève */}
        <div style={{ background: '#f0faf3', borderBottom: '1px solid #d1fae5', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, background: getAvatarColor(activeStudent.id), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#ffffff', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#1B4332' }}>{activeStudent.last_name.toUpperCase()} {activeStudent.first_name}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 3, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
              <span>Mat. : <strong style={{ color: '#0d1f16' }}>{activeStudent.matricule}</strong></span>
              <span>Classe : <strong style={{ color: '#0d1f16' }}>{selectedClasse?.name}</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ background: '#1B4332', borderRadius: 6, padding: '8px 12px', textAlign: 'center', minWidth: 65 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#F4A261', lineHeight: 1, marginBottom: 2 }}>{moyenneEleve > 0 ? `${moyenneEleve}` : '—'}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Moyenne</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px 12px', textAlign: 'center', minWidth: 65 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#1B4332', lineHeight: 1, marginBottom: 2 }}>{rank}e</div>
              <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Rang</div>
            </div>
            <div style={{ background: mentionBg, border: `1px solid ${mentionColor}20`, borderRadius: 6, padding: '8px 12px', textAlign: 'center', minWidth: 65 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: mentionColor, lineHeight: 1, marginBottom: 2 }}>{mention}</div>
              <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Mention</div>
            </div>
          </div>
        </div>

        {/* Table des notes */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 80px 90px', gap: 6, padding: '6px 0', background: '#D8F3DC', margin: '0 -24px', paddingLeft: 24, paddingRight: 24, fontSize: 9, fontWeight: 600, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Matière</span>
            <span style={{ textAlign: 'center' }}>Coef</span>
            <span style={{ textAlign: 'center' }}>Note /20</span>
            <span style={{ textAlign: 'center' }}>Moy. classe</span>
            <span style={{ textAlign: 'center' }}>Appréciation</span>
          </div>
          {rows.map(({ subject, grade }) => {
            const noteVal = grade ? Math.round((grade.grade / grade.max_grade) * 20 * 10) / 10 : null
            const classMoy = classeAvgBySubject.get(subject.id) ?? null
            const ns = getNoteStyle(noteVal)
            return (
              <div key={subject.id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 80px 90px', gap: 6, padding: '8px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1f16' }}>{subject.name}</div>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>{subject.coefficient}</div>
                <div style={{ textAlign: 'center' }}>
                  <NoteChip val={noteVal} />
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280' }}>
                  {classMoy !== null ? `${classMoy.toFixed(1)}` : '—'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 10, fontStyle: 'italic', color: ns.color }}>{getAppreciation(noteVal)}</span>
                </div>
              </div>
            )
          })}
          {/* Ligne moyenne */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 80px 90px', gap: 6, padding: '10px 24px', borderTop: '2px solid #D8F3DC', alignItems: 'center', background: '#f0faf3', margin: '0 -24px' }}>
            <div style={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>Moyenne générale</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>—</div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#F4A261' }}>{moyenneEleve > 0 ? moyenneEleve : '—'}</span>
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280' }}>{moyenneClasse > 0 ? moyenneClasse : '—'}</div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: mentionBg, color: mentionColor }}>{mention}</span>
            </div>
          </div>
          {/* Appréciation */}
          <div style={{ background: '#f0faf3', borderLeft: '4px solid #F4A261', borderRadius: 4, padding: '12px 16px', marginTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Appréciation générale</div>
            <div style={{ fontSize: 13, color: '#374151', fontStyle: 'italic' }}>{appreciation}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingBottom: 16 }}>
          <button onClick={() => window.print()}
            style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            🖨️ Imprimer
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  // TAB STATS
  // ═══════════════════════════════════════════════════════

  function renderStats() {
    // Class rankings
    const classeRankings = classes.map(cls => {
      const cg = localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre)
      const avg = cg.length > 0 ? Math.round((cg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / cg.length) * 10) / 10 : 0
      return { ...cls, moy: avg }
    }).sort((a, b) => b.moy - a.moy)

    // Mention distribution
    const mentionDist = [
      { label: 'Excellent',   min: 18, max: 20, color: '#166534', bg: '#dcfce7' },
      { label: 'Très bien',   min: 16, max: 18, color: '#1e40af', bg: '#dbeafe' },
      { label: 'Bien',        min: 14, max: 16, color: '#0e7490', bg: '#cffafe' },
      { label: 'Assez bien',  min: 12, max: 14, color: '#d97706', bg: '#fef3c7' },
      { label: 'Passable',    min: 10, max: 12, color: '#6b7280', bg: '#f3f4f6' },
      { label: 'Insuffisant', min:  0, max: 10, color: '#dc2626', bg: '#fee2e2' },
    ]

    // Per-student averages for the trimestre
    const studentTrimAvgs = students.map(s => {
      const subs = localSubjects.filter(sub => sub.class_id === s.class_id || sub.class_id === null)
      let ws = 0, cs = 0
      for (const sub of subs) {
        const g = gradeMap.get(`${s.id}|${sub.id}|${selectedTrimestre}`)
        if (g) { ws += (g.grade / g.max_grade) * 20 * sub.coefficient; cs += sub.coefficient }
      }
      return cs > 0 ? { ...s, avg: Math.round((ws / cs) * 10) / 10 } : null
    }).filter((s): s is Student & { avg: number } => s !== null)

    const mentionCounts = mentionDist.map(m => ({
      ...m,
      count: studentTrimAvgs.filter(s => s.avg >= m.min && s.avg < m.max).length,
    }))
    const maxMentionCount = Math.max(...mentionCounts.map(m => m.count), 1)

    // Top 10 students by avg
    const top10 = [...studentTrimAvgs].sort((a, b) => b.avg - a.avg).slice(0, 10)

    const gridCols = isMobile ? '1fr' : '1fr 1fr'

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button key={t} onClick={() => setSelectedTrimestre(t)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              }}>{trimLabel(t)}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 14, marginBottom: 14 }}>
          {/* Classement classes */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>🏆 Classement par classe</div>
            <div style={{ padding: '12px 14px', background: '#f0faf3' }}>
              {classeRankings.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 12 }}>Aucune donnée</div>
              ) : classeRankings.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 12 }}>
                  <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                  <span style={{ width: 70, fontWeight: 600, color: '#1B4332', flexShrink: 0 }}>{c.name}</span>
                  <div style={{ flex: 1, height: 8, background: '#ffffff', borderRadius: 4, overflow: 'hidden', border: '1px solid #d1fae5' }}>
                    <div style={{ width: `${(c.moy / 20) * 100}%`, height: '100%', background: c.moy >= 14 ? '#40916C' : c.moy >= 10 ? '#d97706' : '#dc2626', borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 48, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: c.moy >= 14 ? '#166534' : c.moy >= 10 ? '#d97706' : '#dc2626', flexShrink: 0 }}>
                    {c.moy > 0 ? `${c.moy}/20` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution des mentions */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>📊 Distribution des mentions</div>
            <div style={{ padding: '12px 14px' }}>
              {mentionCounts.map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 72, fontSize: 11, color: '#374151', flexShrink: 0 }}>{m.label}</span>
                  <div style={{ flex: 1, height: 18, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(m.count / maxMentionCount) * 100}%`, height: '100%', background: m.color, borderRadius: 4, minWidth: m.count > 0 ? 4 : 0, transition: 'width .3s' }} />
                  </div>
                  <span style={{ width: 20, textAlign: 'right', fontSize: 11, fontWeight: 600, color: m.color, flexShrink: 0 }}>{m.count}</span>
                  <span style={{ width: 30, textAlign: 'right', fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                    {studentTrimAvgs.length > 0 ? `${Math.round((m.count / studentTrimAvgs.length) * 100)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 10 élèves */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>🎖️ Classement des élèves — {trimLabel(selectedTrimestre)}</div>
          {top10.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: '24px 16px' }}>Aucune note saisie pour ce trimestre</div>
          ) : isMobile ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top10.map((s, i) => {
                const cls = classes.find(c => c.id === s.class_id)
                const ns = getNoteStyle(s.avg)
                const { color: mc, bg: mb } = getMentionColors(s.avg)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ width: 24, fontSize: i < 3 ? 16 : 12, flexShrink: 0, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: getAvatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {getInitials(s.first_name, s.last_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>{s.last_name} {s.first_name}</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{cls?.name ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: ns.color }}>{s.avg}/20</div>
                      <span style={{ background: mb, color: mc, fontSize: 9, padding: '1px 6px', borderRadius: 999 }}>{getMention(s.avg)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['Rang', 'Élève', 'Classe', `Moy. T${selectedTrimestre}`, 'Mention'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: h === 'Élève' || h === 'Classe' ? 'left' : 'center', borderBottom: '1px solid #d1fae5', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top10.map((s, i) => {
                    const cls = classes.find(c => c.id === s.class_id)
                    const ns = getNoteStyle(s.avg)
                    const { color: mc, bg: mb } = getMentionColors(s.avg)
                    return (
                      <tr key={s.id} onMouseEnter={e => (e.currentTarget.style.background = '#f0faf3')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontSize: i < 3 ? 16 : 12, fontWeight: 700 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                        </td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: getAvatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {getInitials(s.first_name, s.last_name)}
                            </div>
                            <span style={{ fontWeight: 600, color: '#1B4332' }}>{s.last_name} {s.first_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0', color: '#6b7280' }}>{cls?.name ?? '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: ns.color }}>{s.avg}/20</span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ background: mb, color: mc, fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>{getMention(s.avg)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════

  const bulletinsManquants = classes.reduce((acc, cls) => {
    const clsStudents = students.filter(s => s.class_id === cls.id)
    const clsSubs = localSubjects.filter(s => s.class_id === cls.id || s.class_id === null)
    const noted = new Set(localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre).map(g => g.student_id))
    return acc + clsStudents.filter(s => !noted.has(s.id)).length
  }, 0)

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: '#0d1f16', paddingBottom: isMobile ? 80 : 0 }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            📝 Notes &amp; Bulletins
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3, margin: '3px 0 0' }}>
            {schoolYear}{schoolName ? ` · ${schoolName}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={() => showToast('Import en cours...')}
            style={{ flex: isMobile ? 1 : 'none', padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            📥 Importer
          </button>
          <button onClick={() => showToast('Export en cours...')}
            style={{ flex: isMobile ? 1 : 'none', padding: '7px 14px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⬇ Exporter
          </button>
        </div>
      </div>

      {/* ── 5 Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { icon: '📝', val: totalNotesSaisies, lbl: 'Notes saisies', badge: `T${selectedTrimestre}`, badgeBg: '#D8F3DC', badgeColor: '#1B4332' },
          { icon: '🏆', val: moyenneGenerale > 0 ? `${moyenneGenerale}/20` : '—', lbl: 'Moyenne générale', badge: getMention(moyenneGenerale), badgeBg: '#dbeafe', badgeColor: '#1e40af' },
          { icon: '✅', val: `${tauxReussite}%`, lbl: 'Taux de réussite', badge: '≥ 10/20', badgeBg: '#D8F3DC', badgeColor: '#1B4332' },
          { icon: '⚠️', val: enDifficulte, lbl: 'En difficulté', badge: '< 10/20', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
          { icon: '📚', val: nbMatieresActives, lbl: 'Matières actives', badge: 'Total', badgeBg: '#f3f4f6', badgeColor: '#6b7280' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: c.badgeBg, color: c.badgeColor }}>{c.badge}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: '#1B4332', marginBottom: 2, lineHeight: 1 }}>{c.val}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 2, background: '#ffffff', border: '1px solid #d1fae5',
        borderRadius: 11, padding: 4, marginBottom: 18,
        overflowX: isMobile ? 'auto' : 'visible',
        whiteSpace: isMobile ? 'nowrap' : 'normal',
        width: isMobile ? '100%' : 'fit-content',
      }}>
        {([
          { key: 'saisie' as const,    label: '📋 Saisie des notes', badge: null },
          { key: 'bulletins' as const, label: '📊 Bulletins',         badge: bulletinsManquants > 0 ? String(Math.min(bulletinsManquants, 99)) : null },
          { key: 'stats' as const,     label: '📈 Statistiques',       badge: null },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            background: activeTab === tab.key ? '#1B4332' : 'transparent',
            color:      activeTab === tab.key ? '#ffffff' : '#6b7280',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {tab.label}
            {tab.badge && (
              <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#dc2626', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏫</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune classe configurée</div>
          <div>Créez des classes depuis la page Gestion des Classes pour commencer à saisir des notes.</div>
        </div>
      ) : (
        <>
          {activeTab === 'saisie'    && renderSaisie()}
          {activeTab === 'bulletins' && renderBulletins()}
          {activeTab === 'stats'     && renderStats()}
        </>
      )}

      {/* ── Modal ── */}
      {showAddSubject && (
        <AddSubjectModal
          classId={selectedClasseId}
          className={classes.find(c => c.id === selectedClasseId)?.name ?? ''}
          isMobile={isMobile}
          onClose={() => setShowAddSubject(false)}
          onCreated={handleSubjectCreated}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} isMobile={isMobile} />}
    </div>
  )
}
