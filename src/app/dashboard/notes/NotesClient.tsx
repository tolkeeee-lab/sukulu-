'use client'

import { useState, useMemo, useCallback } from 'react'
import Button from '@/components/ui/Button'

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
  if (avg >= 14) return { color: '#166534', bg: '#dcfce7' }
  if (avg >= 10) return { color: '#d97706', bg: '#fef3c7' }
  return { color: '#dc2626', bg: '#fee2e2' }
}

function getMentionColor(avg: number): string {
  return getMentionColors(avg).color
}

function getNoteColor(note: number): string {
  if (note < 10) return '#dc2626'
  if (note < 12) return '#d97706'
  if (note >= 14) return '#166534'
  return '#1e40af'
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: '#1B4332', color: '#ffffff',
      padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
      boxShadow: '0 4px 14px rgba(27,67,50,0.3)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999,
    }}>
      ✅ {message}
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
      >
        ✕
      </button>
    </div>
  )
}

// ─── Modal Ajouter Matière ────────────────────────────────────────────────────

interface AddSubjectModalProps {
  classId: string
  className: string
  onClose: () => void
  onCreated: (subject: Subject) => void
}

function AddSubjectModal({ classId, className, onClose, onCreated }: AddSubjectModalProps) {
  const [name, setName] = useState('')
  const [coefficient, setCoefficient] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est obligatoire'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), coefficient, class_id: classId || null }),
      })
      const json = (await res.json()) as { subject?: Subject; error?: string }
      if (!res.ok) { setError(json.error ?? 'Erreur'); return }
      if (json.subject) onCreated(json.subject)
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 13, padding: 22, minWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: '#1B4332' }}>
            Ajouter une matière
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#6b7280', padding: 4 }}>✕</button>
        </div>
        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 7, marginBottom: 12, fontSize: 12 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Nom de la matière *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Mathématiques"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', fontFamily: 'Source Sans 3, sans-serif' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Coefficient *
            </label>
            <input
              type="number"
              min={1}
              max={9}
              value={coefficient}
              onChange={e => setCoefficient(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Classe
            </label>
            <input
              value={className}
              disabled
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', background: '#f9fafb', color: '#6b7280' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Création...' : 'Créer la matière'}</Button>
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
  const [activeTab, setActiveTab] = useState<'saisie' | 'bulletins' | 'stats'>('saisie')
  const [selectedClasseId, setSelectedClasseId] = useState<string>(classes[0]?.id ?? '')
  const [selectedTrimestre, setSelectedTrimestre] = useState<1 | 2 | 3>(1)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [localGrades, setLocalGrades] = useState<Grade[]>(initialGrades)
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(initialSubjects)
  const [pendingSaves, setPendingSaves] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // Input buffer: studentId → { note, comment }
  const [inputBuffer, setInputBuffer] = useState<Record<string, { note: string; comment: string }>>({})

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Derived data ──

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
    for (const g of localGrades) {
      map.set(`${g.student_id}|${g.subject_id}|${g.trimestre}`, g)
    }
    return map
  }, [localGrades])

  // ── Stats cards ──

  const totalNotes = localGrades.length

  const moyenneGenerale = useMemo(() => {
    if (localGrades.length === 0) return 0
    const sum = localGrades.reduce((acc, g) => acc + (g.grade / g.max_grade) * 20, 0)
    return Math.round((sum / localGrades.length) * 10) / 10
  }, [localGrades])

  const trimestreGradesForClass = useMemo(
    () => localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === selectedTrimestre),
    [localGrades, selectedClasseId, selectedTrimestre]
  )

  const notesSaisies = trimestreGradesForClass.length
  const notesPossibles = classeStudents.length * classeSubjects.length
  const noteManquantes = Math.max(0, notesPossibles - notesSaisies)

  const matieresCompletes = useMemo(() => {
    let count = 0
    for (const subj of classeSubjects) {
      const allNoted = classeStudents.every(s => gradeMap.has(`${s.id}|${subj.id}|${selectedTrimestre}`))
      if (allNoted && classeStudents.length > 0) count++
    }
    return count
  }, [classeSubjects, classeStudents, gradeMap, selectedTrimestre])

  // ── Save grade ──

  const saveGrade = useCallback(async (student: Student, note: string, comment: string) => {
    const numNote = parseFloat(note)
    if (isNaN(numNote) || note.trim() === '') return
    if (!selectedSubjectId || !selectedClasseId) return

    const key = student.id
    setPendingSaves(p => ({ ...p, [key]: true }))

    const existing = gradeMap.get(`${student.id}|${selectedSubjectId}|${selectedTrimestre}`)

    // Optimistic update
    const optimisticGrade: Grade = existing
      ? { ...existing, grade: numNote, comment: comment || null }
      : {
          id: `temp-${Date.now()}`,
          student_id: student.id,
          subject_id: selectedSubjectId,
          class_id: selectedClasseId,
          teacher_id: '',
          grade: numNote,
          max_grade: 20,
          trimestre: selectedTrimestre,
          comment: comment || null,
          created_at: new Date().toISOString(),
        }

    setLocalGrades(prev => {
      const filtered = prev.filter(
        g => !(g.student_id === student.id && g.subject_id === selectedSubjectId && g.trimestre === selectedTrimestre)
      )
      return [...filtered, optimisticGrade]
    })

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          subject_id: selectedSubjectId,
          class_id: selectedClasseId,
          grade: numNote,
          max_grade: 20,
          trimestre: selectedTrimestre,
          comment: comment || null,
        }),
      })
      const json = (await res.json()) as { grade?: Grade; error?: string }
      if (res.ok && json.grade) {
        setLocalGrades(prev => {
          const filtered = prev.filter(
            g => !(g.student_id === student.id && g.subject_id === selectedSubjectId && g.trimestre === selectedTrimestre)
          )
          return [...filtered, json.grade!]
        })
      }
    } catch {
      // revert
      setLocalGrades(prev => {
        const filtered = prev.filter(
          g => !(g.student_id === student.id && g.subject_id === selectedSubjectId && g.trimestre === selectedTrimestre)
        )
        if (existing) return [...filtered, existing]
        return filtered
      })
    } finally {
      setPendingSaves(p => { const n = { ...p }; delete n[key]; return n })
    }
  }, [selectedSubjectId, selectedClasseId, selectedTrimestre, gradeMap])

  const handleBlur = useCallback((student: Student) => {
    const buf = inputBuffer[student.id]
    if (!buf) return
    saveGrade(student, buf.note, buf.comment)
  }, [inputBuffer, saveGrade])

  const saveAll = useCallback(async () => {
    const entries = Object.entries(inputBuffer)
    for (const [studentId, buf] of entries) {
      const student = students.find(s => s.id === studentId)
      if (student) await saveGrade(student, buf.note, buf.comment)
    }
    showToast('Toutes les notes ont été enregistrées')
  }, [inputBuffer, students, saveGrade, showToast])

  // ── Subject added ──

  const handleSubjectCreated = useCallback((subject: Subject) => {
    setLocalSubjects(prev => [...prev, subject])
    setSelectedSubjectId(subject.id)
    setShowAddSubject(false)
    showToast(`Matière "${subject.name}" créée`)
  }, [showToast])

  // ── Bulletin data for a student ──

  function getBulletinData(studentId: string, trimestre: number) {
    const subs = localSubjects.filter(s => s.class_id === selectedClasseId || s.class_id === null)
    const rows = subs.map(sub => {
      const g = gradeMap.get(`${studentId}|${sub.id}|${trimestre}`)
      return { subject: sub, grade: g ?? null }
    })
    const notedRows = rows.filter(r => r.grade !== null)
    let weightedSum = 0
    let coefSum = 0
    for (const r of notedRows) {
      if (r.grade) {
        const note20 = (r.grade.grade / r.grade.max_grade) * 20
        weightedSum += note20 * r.subject.coefficient
        coefSum += r.subject.coefficient
      }
    }
    const avg = coefSum > 0 ? Math.round((weightedSum / coefSum) * 10) / 10 : 0

    // Rang dans la classe
    const allAvgs = classeStudents.map(s => {
      let ws = 0; let cs = 0
      for (const sub of subs) {
        const g = gradeMap.get(`${s.id}|${sub.id}|${trimestre}`)
        if (g) { ws += (g.grade / g.max_grade) * 20 * sub.coefficient; cs += sub.coefficient }
      }
      return { id: s.id, avg: cs > 0 ? ws / cs : 0 }
    })
    allAvgs.sort((a, b) => b.avg - a.avg)
    const rank = allAvgs.findIndex(a => a.id === studentId) + 1

    // Moy classe par matière
    const classeAvgBySubject = new Map<string, number>()
    for (const sub of subs) {
      const subGrades = classeStudents.map(s => gradeMap.get(`${s.id}|${sub.id}|${trimestre}`)).filter(Boolean) as Grade[]
      if (subGrades.length > 0) {
        const avg = subGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / subGrades.length
        classeAvgBySubject.set(sub.id, Math.round(avg * 10) / 10)
      }
    }

    // Moy classe globale pour ce trimestre
    const classeGrades = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === trimestre)
    const classeAvg = classeGrades.length > 0
      ? Math.round((classeGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / classeGrades.length) * 10) / 10
      : 0

    return { rows, avg, rank, total: classeStudents.length, classeAvgBySubject, classeAvg }
  }

  // ── Render: Saisie tab ──

  function renderSaisie() {
    const thStyle: React.CSSProperties = {
      padding: '6px 8px', fontSize: 9, fontWeight: 700, color: '#6b7280',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      textAlign: 'center' as const, borderBottom: '2px solid #d1fae5', whiteSpace: 'nowrap',
    }

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedClasseId}
            onChange={e => { setSelectedClasseId(e.target.value); setSelectedSubjectId('') }}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', fontFamily: 'Source Sans 3, sans-serif', cursor: 'pointer' }}
          >
            {classes.length === 0 && <option value="">Aucune classe</option>}
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                  background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                  color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
                }}
              >
                {t === 1 ? '1er' : `${t}e`} trim.
              </button>
            ))}
          </div>

          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', cursor: 'pointer', minWidth: 180 }}
          >
            <option value="">— Choisir une matière —</option>
            {classeSubjects.map(s => <option key={s.id} value={s.id}>{s.name} (coef {s.coefficient})</option>)}
          </select>

          <button
            onClick={() => setShowAddSubject(true)}
            style={{ background: '#fff4ec', border: '1px solid #fed7aa', color: '#9a3412', padding: '7px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
          >
            + Matière
          </button>

          {selectedSubjectId && (
            <button
              onClick={saveAll}
              style={{ background: '#1B4332', color: '#ffffff', padding: '7px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500, marginLeft: 'auto' }}
            >
              💾 Tout sauvegarder
            </button>
          )}
        </div>

        {!selectedSubjectId ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
            📋 Sélectionne une matière pour commencer la saisie des notes
          </div>
        ) : classeStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
            Aucun élève dans cette classe
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Rang</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Élève</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Matricule</th>
                  <th style={thStyle}>Note /20</th>
                  <th style={thStyle}>Commentaire</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {classeStudents.map((student, idx) => {
                  const existing = gradeMap.get(`${student.id}|${selectedSubjectId}|${selectedTrimestre}`)
                  const buf = inputBuffer[student.id]
                  const noteVal = buf?.note ?? (existing ? String(existing.grade) : '')
                  const commentVal = buf?.comment ?? (existing?.comment ?? '')
                  const isSaving = pendingSaves[student.id] ?? false
                  const noteNum = noteVal ? parseFloat(noteVal) : null
                  const noteColor = noteNum !== null ? getNoteColor(noteNum) : '#374151'

                  return (
                    <tr
                      key={student.id}
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f0faf3' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                    >
                      <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280' }}>{idx + 1}</td>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#1B4332' }}>
                        {student.last_name} {student.first_name}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{student.matricule}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={noteVal}
                          onChange={e => {
                            const v = e.target.value
                            setInputBuffer(p => ({ ...p, [student.id]: { note: v, comment: p[student.id]?.comment ?? commentVal } }))
                          }}
                          onBlur={() => handleBlur(student)}
                          style={{
                            width: 60, padding: '3px 6px', borderRadius: 5, textAlign: 'center',
                            border: `1.5px solid ${noteNum !== null && noteNum < 10 ? '#fca5a5' : '#d1fae5'}`,
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600,
                            color: noteColor, background: existing ? '#f0faf3' : '#fff',
                            outline: 'none',
                          }}
                        />
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <input
                          type="text"
                          value={commentVal}
                          onChange={e => {
                            const v = e.target.value
                            setInputBuffer(p => ({ ...p, [student.id]: { note: p[student.id]?.note ?? noteVal, comment: v } }))
                          }}
                          onBlur={() => handleBlur(student)}
                          placeholder="Commentaire..."
                          style={{ width: '100%', padding: '3px 8px', border: '1px solid #e5e7eb', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        {isSaving ? (
                          <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999 }}>💾 En cours...</span>
                        ) : existing ? (
                          <span style={{ background: '#D8F3DC', color: '#1B4332', fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999 }}>✅ Enregistré</span>
                        ) : (
                          <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999 }}>⏳ Non saisi</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf3', borderTop: '2px solid #D8F3DC' }}>
                  <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 700, color: '#1B4332', fontSize: 12 }}>
                    Moyenne de la classe
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1B4332', fontSize: 14 }}>
                    {(() => {
                      const subGrades = classeStudents
                        .map(s => gradeMap.get(`${s.id}|${selectedSubjectId}|${selectedTrimestre}`))
                        .filter(Boolean) as Grade[]
                      if (subGrades.length === 0) return '—'
                      const avg = subGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / subGrades.length
                      return `${avg.toFixed(1)}/20`
                    })()}
                  </td>
                  <td colSpan={2} style={{ padding: '8px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>
                    {trimestreGradesForClass.filter(g => g.subject_id === selectedSubjectId).length}/{classeStudents.length} élèves notés
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Bulletins tab ──

  function renderBulletins() {
    const bulletinStudents = students.filter(s => s.class_id === selectedClasseId)
    const activeStudentId: string = selectedStudentId || bulletinStudents[0]?.id || ''
    const activeStudent = bulletinStudents.find(s => s.id === activeStudentId)
    const selectedClasse = classes.find(c => c.id === selectedClasseId)

    if (bulletinStudents.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13 }}>
          Aucun élève dans cette classe
        </div>
      )
    }

    const { rows, avg: moyenneEleve, rank, classeAvgBySubject, classeAvg: moyenneClasse } = getBulletinData(activeStudentId, selectedTrimestre)
    const mention = getMention(moyenneEleve)
    const { color: mentionColor, bg: mentionBg } = getMentionColors(moyenneEleve)
    const initials = activeStudent ? (activeStudent.first_name[0] + activeStudent.last_name[0]).toUpperCase() : ''

    const getAppreciation = (noteVal: number | null): string => {
      if (noteVal === null) return '—'
      if (noteVal >= 18) return 'Excellent'
      if (noteVal >= 16) return 'Très bien'
      if (noteVal >= 14) return 'Bien'
      if (noteVal >= 12) return 'Assez bien'
      if (noteVal >= 10) return 'Passable'
      return 'Insuffisant'
    }

    const generalAppreciation =
      mention === 'Excellent' ? 'Résultats remarquables. Continuez ainsi !' :
      mention === 'Très bien' ? 'Excellent travail. Félicitations !' :
      mention === 'Bien' ? 'Bons résultats. Encouragé à continuer.' :
      mention === 'Assez bien' ? 'Des efforts notables. Peut faire mieux.' :
      mention === 'Passable' ? 'Résultats moyens. Des progrès sont attendus.' :
      'Résultats insuffisants. Un travail plus sérieux est nécessaire.'

    const activeIdx = bulletinStudents.findIndex(s => s.id === activeStudentId)

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <select
            value={selectedClasseId}
            onChange={e => { setSelectedClasseId(e.target.value); setSelectedStudentId('') }}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', cursor: 'pointer' }}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                  background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                  color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
                }}
              >
                {t === 1 ? '1er' : `${t}e`} trim.
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
          {/* Liste élèves */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #d1fae5', fontWeight: 600, fontSize: 12, color: '#1B4332' }}>
              Élèves ({bulletinStudents.length})
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 600 }}>
              {bulletinStudents.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  style={{
                    padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                    background: activeStudentId === s.id ? '#f0faf3' : '#ffffff',
                    borderLeft: `3px solid ${activeStudentId === s.id ? '#1B4332' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{ width: 28, height: 28, background: '#1B4332', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#ffffff', flexShrink: 0 }}>
                    {(s.first_name[0] + s.last_name[0]).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1B4332' }}>{s.last_name} {s.first_name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>Rang {i + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document bulletin */}
          {activeStudent && (
            <div style={{ background: '#ffffff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(27,67,50,0.12)' }}>
              {/* Header vert foncé */}
              <div style={{ background: '#1B4332', padding: '24px 32px 20px', position: 'relative', overflow: 'hidden' }}>
                {/* Watermark S */}
                <div style={{
                  position: 'absolute', right: -20, top: -20,
                  fontFamily: 'Playfair Display, serif', fontSize: 160,
                  color: 'rgba(255,255,255,0.04)', fontWeight: 700, lineHeight: 1,
                  pointerEvents: 'none', userSelect: 'none',
                }}>S</div>

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, background: '#F4A261', borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#1B4332', flexShrink: 0,
                    }}>S</div>
                    <div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>
                        {schoolName}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Établissement scolaire
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#F4A261', color: '#1B4332', fontSize: 10, fontWeight: 600, padding: '5px 14px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Bulletin scolaire
                  </div>
                </div>

                {/* Meta grid 4 cellules */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                  {[
                    { label: 'Année scolaire', val: schoolYear },
                    { label: 'Classe', val: selectedClasse?.name ?? '—' },
                    { label: 'Trimestre', val: `${selectedTrimestre === 1 ? '1er' : `${selectedTrimestre}e`} trimestre` },
                    { label: "Date d'édition", val: new Date().toLocaleDateString('fr-FR') },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 14px' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#ffffff' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloc élève */}
              <div style={{ background: '#f0faf3', borderBottom: '1px solid #d1fae5', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 50, height: 50, background: '#1B4332', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#ffffff', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#1B4332' }}>
                    {activeStudent.last_name.toUpperCase()} {activeStudent.first_name}
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 3, fontSize: 11, color: '#6b7280' }}>
                    <span>Matricule : <strong style={{ color: '#0d1f16' }}>{activeStudent.matricule}</strong></span>
                    <span>Classe : <strong style={{ color: '#0d1f16' }}>{selectedClasse?.name}</strong></span>
                    <span>Année : <strong style={{ color: '#0d1f16' }}>{schoolYear}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ background: '#1B4332', border: '1px solid #1B4332', borderRadius: 6, padding: '8px 14px', textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 500, lineHeight: 1, marginBottom: 3, color: '#F4A261' }}>{moyenneEleve}/20</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moyenne</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px 14px', textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 500, lineHeight: 1, marginBottom: 3, color: '#1B4332' }}>{rank}e</div>
                    <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rang</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px 14px', textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: mentionColor, marginBottom: 3 }}>{mention}</div>
                    <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mention</div>
                  </div>
                </div>
              </div>

              {/* Contenu bulletin */}
              <div style={{ padding: '0 32px 32px' }}>
                {/* En-tête colonnes */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 100px',
                  gap: 6, padding: '6px 32px 4px',
                  background: '#D8F3DC', margin: '0 -32px',
                  fontSize: 9, fontWeight: 600, color: '#1B4332',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>Matière</span>
                  <span style={{ textAlign: 'center' }}>Coef</span>
                  <span style={{ textAlign: 'center' }}>Note</span>
                  <span style={{ textAlign: 'center' }}>Moy. classe</span>
                  <span style={{ textAlign: 'center' }}>Appréciation</span>
                </div>

                {/* Lignes matières */}
                {rows.map(({ subject, grade }) => {
                  const noteVal = grade ? (grade.grade / grade.max_grade) * 20 : null
                  const classMoy = classeAvgBySubject.get(subject.id) ?? null
                  const noteColor = noteVal === null ? '#9ca3af' : getNoteColor(noteVal)
                  const noteBg = noteVal === null ? '#f3f4f6' : noteVal < 10 ? '#fee2e2' : noteVal < 12 ? '#fef3c7' : '#dcfce7'
                  const appreciation = getAppreciation(noteVal)

                  return (
                    <div key={subject.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 100px', gap: 6, padding: '9px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1f16' }}>{subject.name}</div>
                      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{subject.coefficient}</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: noteBg, color: noteColor }}>
                          {noteVal !== null ? `${noteVal % 1 === 0 ? noteVal : noteVal.toFixed(1)}/20` : 'NC'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6b7280' }}>
                        {classMoy !== null ? `${classMoy.toFixed(1)}/20` : '—'}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontStyle: 'italic', color: noteColor }}>{appreciation}</span>
                      </div>
                    </div>
                  )
                })}

                {/* Ligne moyenne générale */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 100px', gap: 6, padding: '12px 32px', borderTop: '2px solid #D8F3DC', alignItems: 'center', background: '#f0faf3', margin: '0 -32px' }}>
                  <div style={{ fontWeight: 700, color: '#1B4332', fontSize: 13 }}>Moyenne générale</div>
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>—</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#F4A261' }}>{moyenneEleve}/20</span>
                  </div>
                  <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6b7280' }}>
                    {moyenneClasse > 0 ? `${moyenneClasse}/20` : '—'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: mentionBg, color: mentionColor }}>{mention}</span>
                  </div>
                </div>

                {/* Appréciation générale */}
                <div style={{ background: '#f0faf3', borderLeft: '4px solid #F4A261', borderRadius: 4, padding: '14px 16px', marginTop: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Appréciation générale
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                    {generalAppreciation}
                  </div>
                </div>
              </div>

              {/* Boutons navigation */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingBottom: 16, flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  disabled={activeIdx <= 0}
                  onClick={() => activeIdx > 0 && setSelectedStudentId(bulletinStudents[activeIdx - 1].id)}
                >
                  ⬅️ Précédent
                </Button>
                <Button variant="primary" onClick={() => window.print()}>
                  🖨️ Imprimer ce bulletin
                </Button>
                <Button
                  variant="outline"
                  disabled={activeIdx >= bulletinStudents.length - 1}
                  onClick={() => activeIdx < bulletinStudents.length - 1 && setSelectedStudentId(bulletinStudents[activeIdx + 1].id)}
                >
                  Suivant ➡️
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Stats tab ──

  function renderStats() {
    const tranches = [
      { label: '0–5', min: 0, max: 5, color: '#dc2626' },
      { label: '5–10', min: 5, max: 10, color: '#f97316' },
      { label: '10–12', min: 10, max: 12, color: '#d97706' },
      { label: '12–14', min: 12, max: 14, color: '#84cc16' },
      { label: '14–16', min: 14, max: 16, color: '#22c55e' },
      { label: '16–20', min: 16, max: 20, color: '#1B4332' },
    ]

    const classeRankings = classes.map(cls => {
      const clsGrades = localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre)
      const avg = clsGrades.length > 0
        ? clsGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / clsGrades.length
        : 0
      return { id: cls.id, name: cls.name, moy: Math.round(avg * 10) / 10 }
    }).sort((a, b) => b.moy - a.moy)

    const clsGradesTri = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === selectedTrimestre)
    const distribution = tranches.map(t => ({
      ...t,
      count: clsGradesTri.filter(g => {
        const n = (g.grade / g.max_grade) * 20
        return n >= t.min && (t.max === 20 ? n <= t.max : n < t.max)
      }).length,
    }))
    const maxCount = Math.max(...distribution.map(d => d.count), 1)

    const subjectStats = classeSubjects.map(sub => {
      const subGrades = clsGradesTri.filter(g => g.subject_id === sub.id)
      const notes = subGrades.map(g => (g.grade / g.max_grade) * 20)
      const avg = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null
      return {
        subject: sub,
        avg: avg !== null ? Math.round(avg * 10) / 10 : null,
        count: notes.length,
        min: notes.length > 0 ? Math.round(Math.min(...notes) * 10) / 10 : null,
        max: notes.length > 0 ? Math.round(Math.max(...notes) * 10) / 10 : null,
      }
    })

    const classeTrends = ([1, 2, 3] as const).map((t, i) => {
      const clsG = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === t)
      const schoolG = localGrades.filter(g => g.trimestre === t)
      const clsAvg = clsG.length > 0 ? Math.round((clsG.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / clsG.length) * 10) / 10 : null
      const schoolAvg = schoolG.length > 0 ? Math.round((schoolG.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / schoolG.length) * 10) / 10 : null
      return { t, clsAvg, schoolAvg, idx: i }
    })

    const thStat: React.CSSProperties = {
      padding: '7px 8px', textAlign: 'center' as const, fontWeight: 600, color: '#1B4332',
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em',
    }

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <select
            value={selectedClasseId}
            onChange={e => setSelectedClasseId(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#ffffff', cursor: 'pointer' }}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
                  background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
                  color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
                }}
              >
                {t === 1 ? '1er' : `${t}e`} trim.
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Classement classes */}
            <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>🏆 Classement des classes</span>
              </div>
              <div style={{ padding: 14 }}>
                {classeRankings.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 16 }}>Aucune donnée</div>
                ) : (
                  classeRankings.map((c, i) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12 }}>
                      <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div style={{ width: 60, fontWeight: 700, color: '#1B4332', flexShrink: 0, fontFamily: 'Playfair Display, serif' }}>{c.name}</div>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(c.moy / 20) * 100}%`, height: '100%', background: c.moy >= 14 ? '#40916C' : c.moy >= 10 ? '#d97706' : '#dc2626', borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 50, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: getNoteColor(c.moy) }}>
                        {c.moy > 0 ? `${c.moy.toFixed(1)}/20` : '—'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Distribution */}
            <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>📊 Distribution des notes</span>
              </div>
              <div style={{ padding: 14 }}>
                {clsGradesTri.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 16 }}>Aucune note saisie</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
                      {distribution.map(t => (
                        <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 9, color: '#6b7280' }}>{t.count}</span>
                          <div style={{ width: '100%', height: `${Math.max(4, (t.count / maxCount) * 70)}px`, background: t.color, borderRadius: '3px 3px 0 0' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {distribution.map(t => (
                        <div key={t.label} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#6b7280' }}>{t.label}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Moyennes par matière */}
            <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>📚 Moyennes par matière</span>
              </div>
              {subjectStats.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 16 }}>Aucune matière</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0faf3' }}>
                      <th style={{ ...thStat, textAlign: 'left', padding: '7px 12px' }}>Matière</th>
                      <th style={thStat}>Moy. classe</th>
                      <th style={thStat}>Nb notes</th>
                      <th style={thStat}>Min</th>
                      <th style={thStat}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStats.map(s => (
                      <tr key={s.subject.id} style={{ borderBottom: '1px solid #f3f4f6', background: s.avg !== null && s.avg < 10 ? '#fee2e2' : 'transparent' }}>
                        <td style={{ padding: '7px 12px', color: '#0d1f16', fontWeight: 500 }}>{s.subject.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: s.avg !== null ? getNoteColor(s.avg) : '#d1d5db' }}>
                          {s.avg !== null ? s.avg.toFixed(1) : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#dc2626', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                          {s.min !== null ? s.min.toFixed(1) : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#166534', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                          {s.max !== null ? s.max.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Évolution par trimestre */}
            <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', borderBottom: '1px solid #d1fae5' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>📈 Évolution par trimestre</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f0faf3' }}>
                    <th style={{ ...thStat, textAlign: 'left', padding: '7px 12px' }}>Trimestre</th>
                    <th style={thStat}>Moy. classe</th>
                    <th style={thStat}>Moy. école</th>
                    <th style={thStat}>Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {classeTrends.map((row) => {
                    const prev = row.idx > 0 ? classeTrends[row.idx - 1].clsAvg : null
                    const trend = row.clsAvg !== null && prev !== null
                      ? row.clsAvg > prev ? '↑' : row.clsAvg < prev ? '↓' : '→'
                      : null
                    const trendColor = trend === '↑' ? '#166534' : trend === '↓' ? '#dc2626' : '#6b7280'
                    const ecart = row.clsAvg !== null && row.schoolAvg !== null
                      ? Math.round((row.clsAvg - row.schoolAvg) * 10) / 10
                      : null
                    return (
                      <tr key={row.t} style={{ borderBottom: '1px solid #f3f4f6', background: row.t === selectedTrimestre ? '#f0faf3' : 'transparent' }}>
                        <td style={{ padding: '7px 12px', fontWeight: row.t === selectedTrimestre ? 700 : 400, color: '#374151' }}>
                          T{row.t} {row.t === selectedTrimestre && <span style={{ color: '#1B4332' }}>●</span>}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: row.clsAvg !== null ? getNoteColor(row.clsAvg) : '#d1d5db', fontWeight: 700 }}>
                          {row.clsAvg !== null ? `${row.clsAvg}/20` : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: '#6b7280', fontSize: 10 }}>
                          {row.schoolAvg !== null ? `${row.schoolAvg}/20` : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: trendColor, fontWeight: 700, fontSize: 12 }}>
                            {trend && `${trend} `}{ecart !== null ? (ecart > 0 ? `+${ecart}` : `${ecart}`) : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ──

  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#0d1f16' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1B4332' }}>
            Notes &amp; Bulletins
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            {schoolYear} · {classes.length} classes · {students.length} élèves
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>📄 Exporter</Button>
      </div>

      {/* Stats cards — 5 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {/* Notes saisies */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: '#D8F3DC', color: '#1B4332' }}>Total</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color: '#1B4332', marginBottom: 2 }}>{totalNotes}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Notes saisies</div>
        </div>

        {/* Moyenne générale */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: moyenneGenerale >= 12 ? '#dbeafe' : '#fff4ec', color: moyenneGenerale >= 12 ? '#1e40af' : '#c2410c' }}>
              {moyenneGenerale >= 12 ? 'Bien' : 'À améliorer'}
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color: '#1B4332', marginBottom: 2 }}>
            {moyenneGenerale > 0 ? `${moyenneGenerale}/20` : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Moyenne générale</div>
        </div>

        {/* Matières complètes */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: '#D8F3DC', color: '#1B4332' }}>
              sur {classeSubjects.length}
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color: '#1B4332', marginBottom: 2 }}>{matieresCompletes}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Matières complètes</div>
        </div>

        {/* Notes manquantes */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: noteManquantes > 0 ? '#fee2e2' : '#D8F3DC', color: noteManquantes > 0 ? '#dc2626' : '#1B4332' }}>
              {noteManquantes > 0 ? 'Incomplet' : 'Complet'}
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color: noteManquantes > 0 ? '#dc2626' : '#1B4332', marginBottom: 2 }}>{noteManquantes}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Notes manquantes</div>
        </div>

        {/* Classes actives */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>🏫</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: '#D8F3DC', color: '#1B4332' }}>Actives</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 500, color: '#1B4332', marginBottom: 2 }}>{classes.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Classes actives</div>
        </div>
      </div>

      {/* Tabs — pill style */}
      <div style={{ display: 'flex', gap: 2, background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 11, padding: 4, marginBottom: 18, width: 'fit-content' }}>
        {([
          { key: 'saisie' as const, label: '📝 Saisie des notes', badge: noteManquantes > 0 ? String(Math.min(noteManquantes, 99)) : null },
          { key: 'bulletins' as const, label: '📋 Bulletins', badge: null },
          { key: 'stats' as const, label: '📊 Statistiques', badge: null },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? '#1B4332' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : '#6b7280',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Source Sans 3, sans-serif', transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#dc2626',
                color: '#ffffff', fontSize: 9, fontWeight: 700,
                padding: '1px 5px', borderRadius: 999,
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6b7280', fontSize: 13, background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏫</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune classe configurée</div>
          <div>Créez des classes depuis la page Gestion des Classes pour commencer à saisir des notes.</div>
        </div>
      ) : (
        <>
          {activeTab === 'saisie' && renderSaisie()}
          {activeTab === 'bulletins' && renderBulletins()}
          {activeTab === 'stats' && renderStats()}
        </>
      )}

      {/* Modal */}
      {showAddSubject && (
        <AddSubjectModal
          classId={selectedClasseId}
          className={classes.find(c => c.id === selectedClasseId)?.name ?? ''}
          onClose={() => setShowAddSubject(false)}
          onCreated={handleSubjectCreated}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
