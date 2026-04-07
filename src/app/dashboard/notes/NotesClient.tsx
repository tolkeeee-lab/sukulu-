'use client'

import { useState, useMemo, useCallback } from 'react'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Subject = { id: string; name: string; coefficient: number; class_id: string | null; teacher_id: string | null }
type Grade = { id: string; student_id: string; subject_id: string; class_id: string; teacher_id: string; grade: number; max_grade: number; trimestre: number; comment: string | null; created_at: string }
type Student = { id: string; first_name: string; last_name: string; matricule: string; class_id: string | null }

interface NotesClientProps {
  schoolId: string
  schoolYear: string
  userId: string
  userRole: string
  classes: Classe[]
  subjects: Subject[]
  grades: Grade[]
  students: Student[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMention(avg: number): string {
  if (avg >= 16) return 'Excellent'
  if (avg >= 14) return 'Très Bien'
  if (avg >= 12) return 'Bien'
  if (avg >= 10) return 'Assez Bien'
  return 'Insuffisant'
}

function getMentionColor(avg: number): string {
  if (avg >= 14) return '#1B4332'
  if (avg >= 10) return '#d97706'
  return '#dc2626'
}

function getNoteColor(note: number, max: number = 20): string {
  const n = (note / max) * 20
  if (n < 10) return '#dc2626'
  if (n < 12) return '#d97706'
  if (n >= 14) return '#1B4332'
  return '#374151'
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        background: '#1B4332',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 9999,
      }}
    >
      ✅ {message}
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#D8F3DC', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  )
}

// ─── Modal Ajouter Matière ────────────────────────────────────────────────────

interface AddSubjectModalProps {
  classId: string
  onClose: () => void
  onCreated: (subject: Subject) => void
}

function AddSubjectModal({ classId, onClose, onCreated }: AddSubjectModalProps) {
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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, padding: 28, minWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, color: '#1B4332', marginBottom: 18 }}>
          ➕ Ajouter une matière
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
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }}
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
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Création...' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotesClient({
  schoolYear,
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

    return { rows, avg, rank, total: classeStudents.length, classeAvgBySubject }
  }

  // ── Render: Saisie tab ──

  function renderSaisie() {
    const subject = localSubjects.find(s => s.id === selectedSubjectId)

    return (
      <div>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <select
            value={selectedClasseId}
            onChange={e => { setSelectedClasseId(e.target.value); setSelectedSubjectId('') }}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', cursor: 'pointer' }}
          >
            {classes.length === 0 && <option value="">Aucune classe</option>}
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedTrimestre === t ? '#1B4332' : '#f3f4f6',
                  color: selectedTrimestre === t ? '#fff' : '#374151',
                  border: `1px solid ${selectedTrimestre === t ? '#1B4332' : '#d1d5db'}`,
                }}
              >
                {t === 1 ? '1er' : `${t}e`}
              </button>
            ))}
          </div>

          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', cursor: 'pointer', minWidth: 160 }}
          >
            <option value="">— Choisir une matière —</option>
            {classeSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} (coef {s.coefficient})</option>
            ))}
          </select>

          <Button variant="outline" onClick={() => setShowAddSubject(true)} style={{ fontSize: 12 }}>
            ➕ Matière
          </Button>

          {selectedSubjectId && (
            <Button onClick={saveAll} style={{ marginLeft: 'auto', fontSize: 12 }}>
              💾 Tout sauvegarder
            </Button>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f0faf3', borderBottom: '2px solid #D8F3DC' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1B4332', width: 50 }}>Rang</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Élève</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Matricule</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#1B4332', width: 120 }}>Note /20</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Commentaire</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#1B4332', width: 110 }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {classeStudents.map((student, idx) => {
                  const existing = gradeMap.get(`${student.id}|${selectedSubjectId}|${selectedTrimestre}`)
                  const buf = inputBuffer[student.id]
                  const noteVal = buf?.note ?? (existing ? String(existing.grade) : '')
                  const commentVal = buf?.comment ?? (existing?.comment ?? '')
                  const isSaving = pendingSaves[student.id] ?? false

                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f0faf3', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>
                        {student.last_name} {student.first_name}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {student.matricule}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
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
                            width: 70,
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            fontSize: 13,
                            fontFamily: 'JetBrains Mono, monospace',
                            textAlign: 'center',
                            color: noteVal ? getNoteColor(parseFloat(noteVal)) : '#374151',
                            fontWeight: 700,
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={commentVal}
                          onChange={e => {
                            const v = e.target.value
                            setInputBuffer(p => ({ ...p, [student.id]: { note: p[student.id]?.note ?? noteVal, comment: v } }))
                          }}
                          onBlur={() => handleBlur(student)}
                          placeholder="Commentaire optionnel"
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {isSaving ? (
                          <Badge variant="bleu">💾 En cours...</Badge>
                        ) : existing ? (
                          <Badge variant="vert">✅ Enregistré</Badge>
                        ) : (
                          <Badge variant="jaune">⏳ Non saisi</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf3', borderTop: '2px solid #D8F3DC' }}>
                  <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: '#1B4332', fontSize: 12 }}>
                    Résumé — {subject?.name}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {(() => {
                      const subGrades = classeStudents
                        .map(s => gradeMap.get(`${s.id}|${selectedSubjectId}|${selectedTrimestre}`))
                        .filter(Boolean) as Grade[]
                      if (subGrades.length === 0) return <span style={{ color: '#6b7280', fontSize: 11 }}>—</span>
                      const avg = subGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / subGrades.length
                      return (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: getNoteColor(avg) }}>
                          {avg.toFixed(1)}/20
                        </span>
                      )
                    })()}
                  </td>
                  <td colSpan={2} style={{ padding: '10px 12px', color: '#6b7280', fontSize: 11 }}>
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
    const currentStudent = bulletinStudents.find(s => s.id === selectedStudentId) ?? bulletinStudents[0]

    if (bulletinStudents.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280', fontSize: 13 }}>
          Aucun élève dans cette classe
        </div>
      )
    }

    const activeStudent = currentStudent ?? bulletinStudents[0]
    const { rows, avg, rank, total, classeAvgBySubject } = getBulletinData(activeStudent.id, selectedTrimestre)

    function getApprec(g: Grade | null): string {
      if (!g) return '—'
      const n = (g.grade / g.max_grade) * 20
      return getMention(n)
    }

    return (
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar élèves */}
        <div style={{ width: 180, flexShrink: 0, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: 11.5, color: '#1B4332', background: '#f0faf3', borderBottom: '1px solid #D8F3DC' }}>
            ÉLÈVES ({bulletinStudents.length})
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {bulletinStudents.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: 11.5,
                  background: (selectedStudentId === s.id || (!selectedStudentId && s.id === bulletinStudents[0]?.id)) ? '#D8F3DC' : 'transparent',
                  color: '#111827', fontWeight: (selectedStudentId === s.id || (!selectedStudentId && s.id === bulletinStudents[0]?.id)) ? 700 : 400,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {s.last_name} {s.first_name}
              </button>
            ))}
          </div>
        </div>

        {/* Bulletin */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <select
              value={selectedClasseId}
              onChange={e => { setSelectedClasseId(e.target.value); setSelectedStudentId('') }}
              style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', cursor: 'pointer' }}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              {([1, 2, 3] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTrimestre(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedTrimestre === t ? '#1B4332' : '#f3f4f6',
                    color: selectedTrimestre === t ? '#fff' : '#374151',
                    border: `1px solid ${selectedTrimestre === t ? '#1B4332' : '#d1d5db'}`,
                  }}
                >
                  {t === 1 ? '1er' : `${t}e`}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => window.print()} style={{ marginLeft: 'auto', fontSize: 12 }}>
              🖨️ Imprimer
            </Button>
          </div>

          {/* Bulletin card */}
          <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#1B4332', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700 }}>BULLETIN SCOLAIRE</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  Trimestre {selectedTrimestre} · Année {schoolYear}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>{activeStudent.last_name} {activeStudent.first_name}</div>
                <div style={{ opacity: 0.8 }}>Matricule : {activeStudent.matricule}</div>
              </div>
            </div>

            <div style={{ padding: '14px 24px 6px', display: 'flex', gap: 20, fontSize: 12, color: '#374151', borderBottom: '1px solid #f0faf3' }}>
              <span>Classe : <strong>{classes.find(c => c.id === selectedClasseId)?.name ?? '—'}</strong></span>
              <span>Rang : <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{rank}/{total}</strong></span>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f0faf3', borderBottom: '2px solid #D8F3DC' }}>
                  <th style={{ padding: '9px 16px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Matière</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#1B4332', width: 60 }}>Coef</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#1B4332', width: 80 }}>Note</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#1B4332', width: 80 }}>Moy. classe</th>
                  <th style={{ padding: '9px 16px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ subject, grade }) => {
                  const note20 = grade ? (grade.grade / grade.max_grade) * 20 : null
                  const classeAvg = classeAvgBySubject.get(subject.id)
                  return (
                    <tr key={subject.id} style={{ borderBottom: '1px solid #f0faf3' }}>
                      <td style={{ padding: '8px 16px', color: '#111827', fontWeight: 500 }}>{subject.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>{subject.coefficient}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {note20 !== null ? (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: getNoteColor(note20) }}>
                            {note20 % 1 === 0 ? note20 : note20.toFixed(1)}
                          </span>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                        {classeAvg !== undefined ? classeAvg.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '8px 16px', color: '#374151', fontSize: 11.5 }}>{getApprec(grade)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf3', borderTop: '2px solid #D8F3DC' }}>
                  <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 700, color: '#1B4332' }}>Moyenne générale</td>
                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: getMentionColor(avg) }}>
                      {avg.toFixed(1)}/20
                    </span>
                  </td>
                  <td />
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={avg >= 14 ? 'vert' : avg >= 10 ? 'jaune' : 'rouge'}>
                      {getMention(avg)}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Stats tab ──

  function renderStats() {
    const tranche = [
      { label: '0–5', min: 0, max: 5, color: '#dc2626' },
      { label: '5–10', min: 5, max: 10, color: '#f97316' },
      { label: '10–12', min: 10, max: 12, color: '#d97706' },
      { label: '12–14', min: 12, max: 14, color: '#84cc16' },
      { label: '14–16', min: 14, max: 16, color: '#22c55e' },
      { label: '16–20', min: 16, max: 20, color: '#1B4332' },
    ]

    // Classement des classes par moyenne
    const classeRankings = classes.map(cls => {
      const clsGrades = localGrades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre)
      const avg = clsGrades.length > 0
        ? clsGrades.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / clsGrades.length
        : 0
      return { classe: cls, avg: Math.round(avg * 10) / 10, count: clsGrades.length }
    }).sort((a, b) => b.avg - a.avg)

    const maxAvg = Math.max(...classeRankings.map(r => r.avg), 1)

    // Distribution pour la classe sélectionnée
    const clsGradesTri = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === selectedTrimestre)
    const distribution = tranche.map(t => ({
      ...t,
      count: clsGradesTri.filter(g => {
        const n = (g.grade / g.max_grade) * 20
        return n >= t.min && (t.max === 20 ? n <= t.max : n < t.max)
      }).length,
    }))
    const maxDist = Math.max(...distribution.map(d => d.count), 1)

    // Stats par matière
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

    // Évolution par trimestre
    const trimestres = [1, 2, 3] as const
    const schoolGrades = localGrades
    const classeTrends = trimestres.map(t => {
      const clsG = localGrades.filter(g => g.class_id === selectedClasseId && g.trimestre === t)
      const schoolG = schoolGrades.filter(g => g.trimestre === t)
      const clsAvg = clsG.length > 0 ? clsG.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / clsG.length : null
      const schoolAvg = schoolG.length > 0 ? schoolG.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / schoolG.length : null
      return {
        t,
        clsAvg: clsAvg !== null ? Math.round(clsAvg * 10) / 10 : null,
        schoolAvg: schoolAvg !== null ? Math.round(schoolAvg * 10) / 10 : null,
      }
    })

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <select
            value={selectedClasseId}
            onChange={e => setSelectedClasseId(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12.5, background: '#fff', cursor: 'pointer' }}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {([1, 2, 3] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrimestre(t)}
                style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: selectedTrimestre === t ? '#1B4332' : '#f3f4f6',
                  color: selectedTrimestre === t ? '#fff' : '#374151',
                  border: `1px solid ${selectedTrimestre === t ? '#1B4332' : '#d1d5db'}`,
                }}
              >
                {t === 1 ? '1er' : `${t}e`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Classement classes */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B4332', marginBottom: 14 }}>
                🏆 Classement des classes — Trimestre {selectedTrimestre}
              </div>
              {classeRankings.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 20 }}>Aucune donnée</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {classeRankings.map((r, i) => (
                    <div key={r.classe.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {r.classe.name}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: getNoteColor(r.avg), fontWeight: 700 }}>
                          {r.avg > 0 ? `${r.avg}/20` : '—'}
                        </span>
                      </div>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(r.avg / maxAvg) * 100}%`,
                          height: '100%',
                          background: getNoteColor(r.avg),
                          borderRadius: 4,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distribution des notes */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B4332', marginBottom: 14 }}>
                📊 Distribution des notes — {classes.find(c => c.id === selectedClasseId)?.name ?? '—'}
              </div>
              {clsGradesTri.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 20 }}>Aucune note saisie</div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
                  {distribution.map(d => (
                    <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: d.color }}>
                        {d.count}
                      </div>
                      <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '3px 3px 0 0', height: 88, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{
                          width: '100%',
                          height: `${(d.count / maxDist) * 100}%`,
                          background: d.color,
                          borderRadius: '3px 3px 0 0',
                          minHeight: d.count > 0 ? 4 : 0,
                          transition: 'height 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: 9.5, color: '#6b7280', textAlign: 'center' }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stats par matière */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B4332', marginBottom: 14 }}>
                📚 Moyennes par matière
              </div>
              {subjectStats.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 20 }}>Aucune matière configurée</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: '#f0faf3', borderBottom: '1px solid #D8F3DC' }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Matière</th>
                      <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Moy.</th>
                      <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Nb</th>
                      <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Min</th>
                      <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStats.map(s => (
                      <tr key={s.subject.id} style={{ borderBottom: '1px solid #f0faf3', background: s.avg !== null && s.avg < 10 ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '7px 10px', color: '#111827', fontWeight: 500 }}>{s.subject.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: s.avg !== null ? getNoteColor(s.avg) : '#d1d5db' }}>
                          {s.avg !== null ? s.avg.toFixed(1) : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>{s.count}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#dc2626', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          {s.min !== null ? s.min.toFixed(1) : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#1B4332', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          {s.max !== null ? s.max.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Évolution par trimestre */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1B4332', marginBottom: 14 }}>
                📈 Évolution par trimestre
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#f0faf3', borderBottom: '1px solid #D8F3DC' }}>
                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#1B4332' }}>Trimestre</th>
                    <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Moy. classe</th>
                    <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Moy. école</th>
                    <th style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#1B4332' }}>Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {classeTrends.map((row, i) => {
                    const prev = i > 0 ? classeTrends[i - 1].clsAvg : null
                    const trend = row.clsAvg !== null && prev !== null
                      ? row.clsAvg > prev ? '↑' : row.clsAvg < prev ? '↓' : '→'
                      : '—'
                    const trendColor = trend === '↑' ? '#1B4332' : trend === '↓' ? '#dc2626' : '#6b7280'
                    const ecart = row.clsAvg !== null && row.schoolAvg !== null
                      ? Math.round((row.clsAvg - row.schoolAvg) * 10) / 10
                      : null
                    return (
                      <tr key={row.t} style={{ borderBottom: '1px solid #f0faf3', background: row.t === selectedTrimestre ? '#f0faf3' : 'transparent' }}>
                        <td style={{ padding: '7px 10px', fontWeight: row.t === selectedTrimestre ? 700 : 400, color: '#374151' }}>
                          T{row.t} {row.t === selectedTrimestre ? '●' : ''}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: row.clsAvg !== null ? getNoteColor(row.clsAvg) : '#d1d5db', fontWeight: 700 }}>
                          {row.clsAvg !== null ? `${row.clsAvg}/20` : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: '#6b7280', fontSize: 11 }}>
                          {row.schoolAvg !== null ? `${row.schoolAvg}/20` : '—'}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: trendColor, fontWeight: 700, fontSize: 12 }}>
                            {trend !== '—' && trend} {ecart !== null ? (ecart > 0 ? `+${ecart}` : `${ecart}`) : ''}
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
    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#111827' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1B4332' }}>
            Notes &amp; Bulletins
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            {schoolYear} · {classes.length} classes · {students.length} élèves
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => window.print()}>📄 Exporter</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📝" label="Notes saisies" value={totalNotes} variant="vert" />
        <StatCard
          icon="📊"
          label="Moyenne générale"
          value={moyenneGenerale > 0 ? `${moyenneGenerale}/20` : '—'}
          variant="bleu"
        />
        <StatCard icon="✅" label="Matières complètes" value={matieresCompletes} variant="vert" sub={`sur ${classeSubjects.length} matières`} />
        <StatCard icon="⏳" label="Notes manquantes" value={noteManquantes} variant="orange" sub={`T${selectedTrimestre} · ${classes.find(c => c.id === selectedClasseId)?.name ?? ''}`} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: '2px solid #e5e7eb' }}>
        {([
          { key: 'saisie', label: '📝 Saisie des notes' },
          { key: 'bulletins', label: '📋 Bulletins' },
          { key: 'stats', label: '📊 Statistiques' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 18px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#1B4332' : '#6b7280',
              cursor: 'pointer',
              borderBottom: `3px solid ${activeTab === tab.key ? '#1B4332' : 'transparent'}`,
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
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
          onClose={() => setShowAddSubject(false)}
          onCreated={handleSubjectCreated}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
