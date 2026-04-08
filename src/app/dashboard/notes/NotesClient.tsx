'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Subject = { id: string; name: string; coefficient: number; class_id: string | null; teacher_id: string | null }
type Grade = { id: string; student_id: string; subject_id: string; class_id: string; teacher_id: string; grade: number; max_grade: number; trimestre: number; comment: string | null; created_at: string }
type Student = { id: string; first_name: string; last_name: string; matricule: string; class_id: string | null }
type Teacher = { id: string; full_name: string }

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
  teachers: Teacher[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ncStyle(v: number | null): React.CSSProperties {
  if (v === null) return {}
  if (v >= 16) return { background: '#dcfce7', color: '#166534' }
  if (v >= 14) return { background: '#dbeafe', color: '#1e40af' }
  if (v >= 12) return { background: '#fef9c3', color: '#854d0e' }
  if (v >= 10) return { background: '#ffedd5', color: '#9a3412' }
  return { background: '#fee2e2', color: '#991b1b' }
}

function mentionInfo(v: number): { label: string; color: string; bg: string; sub: string } {
  if (v >= 16) return { label: '\ud83c\udfc5 Tr\u00e8s Bien', color: '#166534', bg: '#dcfce7', sub: 'F\u00e9licitations du Conseil' }
  if (v >= 14) return { label: '\u2728 Bien', color: '#1e40af', bg: '#dbeafe', sub: 'Encouragements du Conseil' }
  if (v >= 12) return { label: '\u2714 Assez Bien', color: '#854d0e', bg: '#fef9c3', sub: "Tableau d'honneur" }
  if (v >= 10) return { label: 'Passable', color: '#9a3412', bg: '#ffedd5', sub: 'Peut mieux faire' }
  return { label: 'Insuffisant', color: '#991b1b', bg: '#fee2e2', sub: 'Redoublement possible' }
}

function getBarColor(n: number): string {
  if (n >= 16) return '#166534'
  if (n >= 14) return '#1e40af'
  if (n >= 12) return '#854d0e'
  if (n >= 10) return '#9a3412'
  return '#991b1b'
}

function inputBorderColor(val: string): string {
  if (!val || val === '') return '#d1fae5'
  const n = Number(val)
  if (isNaN(n)) return '#d1fae5'
  if (n >= 14) return '#16a34a'
  if (n >= 10) return '#1e40af'
  if (n >= 8) return '#d97706'
  return '#dc2626'
}

// ─── Chip components ──────────────────────────────────────────────────────────

const NC_BASE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 5,
  display: 'inline-block',
}

function NcChip({ v }: { v: number | null }) {
  if (v === null) return <span style={{ ...NC_BASE, background: '#f3f4f6', color: '#6b7280' }}>\u2014</span>
  return <span style={{ ...NC_BASE, ...ncStyle(v) }}>{v.toFixed(1)}</span>
}

function SaisieChip({ pct }: { pct: number }) {
  let bg = '#fef3c7', color = '#d97706', label = `\u23f3 ${pct}%`
  if (pct === 100) { bg = '#D8F3DC'; color = '#1B4332'; label = '\u2713 100%' }
  else if (pct === 0) { bg = '#fee2e2'; color = '#dc2626'; label = '\u2717 0%' }
  return <span style={{ ...NC_BASE, background: bg, color, fontSize: 10 }}>{label}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotesClient({ schoolId, schoolYear, schoolName, userId, userRole, classes, subjects, grades, students, teachers }: NotesClientProps) {
  const isMobile = useIsMobile()

  // ── UI State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'bulletins' | 'apercu' | 'stats'>('overview')
  const [selectedTrimestre, setSelectedTrimestre] = useState<1 | 2 | 3>(1)
  const [selectedClasseId, setSelectedClasseId] = useState(() => classes[0]?.id ?? '')
  const [selectedBulletinClassId, setSelectedBulletinClassId] = useState(() => classes[0]?.id ?? '')
  const [selectedBulletinStudentId, setSelectedBulletinStudentId] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectCoef, setNewSubjectCoef] = useState('1')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  // ── Local data state initialized from props ─────────────────────────────────
  const [localGrades, setLocalGrades] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const g of grades) {
      map[`${g.student_id}-${g.subject_id}-${g.trimestre}`] = String(g.grade)
    }
    return map
  })

  const [localSubjects, setLocalSubjects] = useState(subjects)

  // ── Toast ───────────────────────────────────────────────────────────────────
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])
  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // ── Weighted average helper ─────────────────────────────────────────────────
  function calcMoyEleve(studentId: string, subjs: typeof localSubjects, tri: number): number | null {
    const notes = subjs
      .map(s => {
        const v = localGrades[`${studentId}-${s.id}-${tri}`]
        return v !== undefined && v !== '' && !isNaN(Number(v))
          ? { note: Number(v), coeff: s.coefficient }
          : null
      })
      .filter((x): x is { note: number; coeff: number } => x !== null)
    if (!notes.length) return null
    const tc = notes.reduce((s, n) => s + n.coeff, 0)
    return notes.reduce((s, n) => s + n.note * n.coeff, 0) / tc
  }

  // ── Save grade via API ───────────────────────────────────────────────────────
  async function handleSaveGrade(studentId: string, subjectId: string, classId: string, value: string) {
    const num = parseFloat(value)
    if (!value || isNaN(num) || num < 0 || num > 20) return
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        subject_id: subjectId,
        class_id: classId,
        grade: num,
        max_grade: 20,
        trimestre: selectedTrimestre,
      }),
    })
    if (res.ok) showToast('\u2713 Note sauvegard\u00e9e')
    else showToast('\u274c Erreur lors de l\'enregistrement')
  }

  // ── Add subject via API ──────────────────────────────────────────────────────
  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    const coef = parseInt(newSubjectCoef)
    if (!newSubjectName.trim() || isNaN(coef) || coef < 1 || coef > 9) {
      showToast('\u274c Nom et coefficient requis (1\u20139)')
      return
    }
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubjectName.trim(), coefficient: coef, class_id: selectedClasseId }),
    })
    if (res.ok) {
      const { subject } = await res.json() as { subject: Subject }
      setLocalSubjects(prev => [...prev, subject])
      setNewSubjectName('')
      setNewSubjectCoef('1')
      setShowSubjectModal(false)
      showToast('\u2713 Mati\u00e8re ajout\u00e9e')
    } else {
      showToast('\u274c Erreur lors de l\'ajout')
    }
  }

  // ── Per-class stats ─────────────────────────────────────────────────────────
  const classStats = useMemo(() => {
    return classes.map(cls => {
      const clsStudents = students.filter(s => s.class_id === cls.id)
      const clsSubjects = localSubjects.filter(s => s.class_id === cls.id)
      const nbStudents = clsStudents.length
      const nbSubjects = clsSubjects.length

      let gradeCount = 0
      for (const s of clsStudents) {
        for (const sub of clsSubjects) {
          const v = localGrades[`${s.id}-${sub.id}-${selectedTrimestre}`]
          if (v !== undefined && v !== '') gradeCount++
        }
      }
      const totalExpected = nbStudents * nbSubjects
      const pct = totalExpected > 0 ? Math.round((gradeCount / totalExpected) * 100) : 0

      const studentAvgs = clsStudents
        .map(s => calcMoyEleve(s.id, clsSubjects, selectedTrimestre))
        .filter((m): m is number => m !== null)
      const moy = studentAvgs.length > 0
        ? Math.round((studentAvgs.reduce((a, b) => a + b, 0) / studentAvgs.length) * 10) / 10
        : null

      const teacher = teachers.find(t => t.id === cls.teacher_id)

      return {
        id: cls.id,
        nom: cls.name,
        maitre: teacher?.full_name ?? 'Non assign\u00e9',
        eleves: nbStudents,
        pct,
        moy,
        niveau: cls.level ?? 'Autre',
        publie: pct === 100 && nbStudents > 0,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, students, localSubjects, localGrades, selectedTrimestre, teachers])

  // ── Header stats (5 real-data cards) ────────────────────────────────────────
  const headerStats = useMemo(() => {
    const notesSaisies = grades.filter(g => g.trimestre === selectedTrimestre).length

    const allStudentAvgs: number[] = []
    for (const cls of classes) {
      const clsSubjects = localSubjects.filter(s => s.class_id === cls.id)
      for (const student of students.filter(s => s.class_id === cls.id)) {
        const moy = calcMoyEleve(student.id, clsSubjects, selectedTrimestre)
        if (moy !== null) allStudentAvgs.push(moy)
      }
    }

    const moyGen = allStudentAvgs.length > 0
      ? Math.round((allStudentAvgs.reduce((a, b) => a + b, 0) / allStudentAvgs.length) * 10) / 10
      : null

    const nbReussite = allStudentAvgs.filter(m => m >= 10).length
    const tauxReussite = allStudentAvgs.length > 0
      ? Math.round((nbReussite / allStudentAvgs.length) * 100)
      : 0

    const enDifficulte = allStudentAvgs.filter(m => m < 10).length
    const matiereActives = localSubjects.length

    return { notesSaisies, moyGen, tauxReussite, enDifficulte, matiereActives }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grades, classes, students, localSubjects, localGrades, selectedTrimestre])

  // ── Filtered overview classes ───────────────────────────────────────────────
  const filteredClasses = useMemo(() => {
    return classStats.filter(c => {
      if (filterNiveau && c.niveau !== filterNiveau) return false
      if (filterStatut === 'publie' && !c.publie) return false
      if (filterStatut === 'non_publie' && c.publie) return false
      return true
    })
  }, [classStats, filterNiveau, filterStatut])

  const selectedClassObj = useMemo(
    () => classes.find(c => c.id === selectedClasseId) ?? null,
    [classes, selectedClasseId]
  )

  // ── Stats tab data ──────────────────────────────────────────────────────────
  const subjectAvgStats = useMemo(() => {
    const trimGrades = grades.filter(g => g.trimestre === selectedTrimestre)
    return localSubjects
      .map(sub => {
        const sg = trimGrades.filter(g => g.subject_id === sub.id)
        if (sg.length === 0) return null
        const avg = Math.round((sg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / sg.length) * 10) / 10
        return { mat: sub.name, moy: avg }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.moy ?? 0) - (a!.moy ?? 0)) as { mat: string; moy: number }[]
  }, [localSubjects, grades, selectedTrimestre])

  const mentionDistribution = useMemo(() => {
    const trimGrades = grades.filter(g => g.trimestre === selectedTrimestre)
    const buckets = [
      { label: 'Tr\u00e8s Bien', min: 16, color: '#166534', bg: '#dcfce7' },
      { label: 'Bien', min: 14, color: '#1e40af', bg: '#dbeafe' },
      { label: 'Assez Bien', min: 12, color: '#854d0e', bg: '#fef9c3' },
      { label: 'Passable', min: 10, color: '#9a3412', bg: '#ffedd5' },
      { label: 'Insuffisant', min: 0, color: '#991b1b', bg: '#fee2e2' },
    ]
    const studentAvgs = students.map(s => {
      const subs = localSubjects.filter(sub => sub.class_id === s.class_id)
      const sg = trimGrades.filter(g => g.student_id === s.id)
      if (sg.length === 0) return null
      const totalPts = sg.reduce((sum, g) => {
        const sub = subs.find(sub => sub.id === g.subject_id)
        return sum + (g.grade / g.max_grade) * 20 * (sub?.coefficient ?? 1)
      }, 0)
      const totalCoef = sg.reduce((sum, g) => {
        const sub = subs.find(sub => sub.id === g.subject_id)
        return sum + (sub?.coefficient ?? 1)
      }, 0)
      return totalCoef > 0 ? totalPts / totalCoef : null
    }).filter(Boolean) as number[]

    return buckets.map((b, i) => ({
      ...b,
      count: studentAvgs.filter(avg => avg >= b.min && avg < (i === 0 ? 21 : buckets[i - 1].min)).length,
    }))
  }, [students, localSubjects, grades, selectedTrimestre])

  const trimesterEvol = useMemo(() => {
    return [1, 2, 3].map(t => {
      const tg = grades.filter(g => g.trimestre === t)
      if (tg.length === 0) return null
      return Math.round((tg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / tg.length) * 10) / 10
    })
  }, [grades])

  const classesSansMatieres = useMemo(
    () => classes.filter(c => localSubjects.filter(s => s.class_id === c.id).length === 0),
    [classes, localSubjects]
  )

  const trimLabel = (t: number) => t === 1 ? '1er' : `${t}e`

  const TABS = [
    { key: 'overview' as const, label: "\ud83c\udfe7 Vue d'ensemble", badge: null },
    { key: 'notes' as const, label: '\ud83d\udcdd Notes par classe', badge: null },
    { key: 'bulletins' as const, label: '\ud83d\udcca Bulletins', badge: null },
    { key: 'apercu' as const, label: '\ud83d\udc41\ufe0f Aper\u00e7u bulletin', badge: null },
    { key: 'stats' as const, label: '\ud83d\udcc8 Statistiques', badge: null },
  ]

  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: isMobile ? 12 : 18, ...style }}>
      {children}
    </div>
  )

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: '#1B4332', marginBottom: 10 }}>
      {children}
    </div>
  )

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{children}</label>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db',
    fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  // ─── TAB 1: VUE D'ENSEMBLE ────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option value="">Tous les niveaux</option>
            <option value="Primaire">Primaire</option>
            <option value="Coll\u00e8ge">Coll\u00e8ge</option>
            <option value="Lyc\u00e9e">Lyc\u00e9e</option>
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option value="">Tous les statuts</option>
            <option value="publie">Publi\u00e9s</option>
            <option value="non_publie">Non publi\u00e9s</option>
          </select>
          <button style={{ padding: '7px 13px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}
            onClick={() => showToast('Export en cours...')}>
            \ud83d\udcc4 Exporter
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            \ud83d\udccb \u00c9tat des notes par classe \u2014 {trimLabel(selectedTrimestre)} Trimestre
          </div>
          <button style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => showToast('Relances envoy\u00e9es !')}>
            \ud83d\udce9 Relancer tous
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
          {filteredClasses.map((cl, i) => {
            const barBg = cl.pct === 100 ? '#40916C' : cl.pct >= 50 ? '#d97706' : '#dc2626'
            const nbSub = localSubjects.filter(s => s.class_id === cl.id).length
            if (isMobile) {
              return (
                <div key={cl.id} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</span>
                    <SaisieChip pct={cl.pct} />
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{cl.maitre}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{cl.eleves} \u00e9l\u00e8ves \u00b7 {nbSub} mati\u00e8res \u00b7 {cl.niveau}</div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${cl.pct}%`, background: barBg }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <NcChip v={cl.moy} />
                    {cl.publie
                      ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>\u2713 Publi\u00e9</span>
                      : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelectedClasseId(cl.id); setActiveTab('notes') }}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      \ud83d\udcdd Notes
                    </button>
                    <button onClick={() => { setSelectedBulletinClassId(cl.id); setSelectedBulletinStudentId(''); setActiveTab('apercu') }}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      \ud83d\udcca Bulletin
                    </button>
                    <button onClick={() => showToast(cl.publie ? 'D\u00e9publi\u00e9 !' : 'Publi\u00e9 !')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {cl.publie ? 'D\u00e9publier' : 'Publier'}
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <div key={cl.id} style={{ display: 'flex', gap: 14, padding: '12px 15px', borderBottom: i < filteredClasses.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                <div style={{ width: 70, minWidth: 70, fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{cl.maitre}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{cl.eleves} \u00e9l\u00e8ves \u00b7 {nbSub} mati\u00e8res \u00b7 {cl.niveau}</div>
                </div>
                <div style={{ width: 120, minWidth: 120 }}>
                  <div style={{ marginBottom: 4 }}><SaisieChip pct={cl.pct} /></div>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                    <div style={{ height: 4, borderRadius: 2, width: `${cl.pct}%`, background: barBg }} />
                  </div>
                </div>
                <div style={{ width: 60, textAlign: 'center' }}><NcChip v={cl.moy} /></div>
                <div style={{ width: 80, textAlign: 'center' }}>
                  {cl.publie
                    ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>\u2713 Publi\u00e9</span>
                    : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setSelectedClasseId(cl.id); setActiveTab('notes') }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    \ud83d\udcdd Notes
                  </button>
                  <button onClick={() => { setSelectedBulletinClassId(cl.id); setSelectedBulletinStudentId(''); setActiveTab('apercu') }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    \ud83d\udcca Bulletin
                  </button>
                  <button onClick={() => showToast(cl.publie ? 'D\u00e9publi\u00e9 !' : 'Publi\u00e9 !')}
                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {cl.publie ? 'D\u00e9publier' : 'Publier'}
                  </button>
                </div>
              </div>
            )
          })}
          {filteredClasses.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucune classe trouv\u00e9e.</div>
          )}
        </div>
      </div>
    )
  }

  // ─── TAB 2: NOTES PAR CLASSE ──────────────────────────────────────────────

  function renderNotes() {
    const classSubjects = localSubjects
      .filter(s => s.class_id === selectedClasseId)
      .sort((a, b) => b.coefficient - a.coefficient)

    const classStudents = [...students.filter(s => s.class_id === selectedClasseId)]
      .sort((a, b) => a.last_name.localeCompare(b.last_name))

    const colAvgs = classSubjects.map(sub => {
      const vals = classStudents
        .map(s => localGrades[`${s.id}-${sub.id}-${selectedTrimestre}`])
        .filter(v => v !== undefined && v !== '' && !isNaN(Number(v)))
        .map(Number)
      return vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : null
    })

    const studentRows = classStudents.map(s => ({
      student: s,
      moy: calcMoyEleve(s.id, classSubjects, selectedTrimestre),
    }))
    const sortedByMoy = [...studentRows].sort((a, b) => (b.moy ?? -1) - (a.moy ?? -1))
    const ranked = studentRows.map(row => ({
      ...row,
      rang: row.moy !== null ? sortedByMoy.findIndex(r => r.student.id === row.student.id) + 1 : null,
    }))

    const classAvgs = studentRows.map(r => r.moy).filter((m): m is number => m !== null)
    const moyClasse = classAvgs.length > 0
      ? Math.round((classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length) * 10) / 10
      : null

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {[1, 2, 3].map(t => (
            <button key={t} onClick={() => setSelectedTrimestre(t as 1 | 2 | 3)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
              background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
              color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              fontFamily: 'inherit',
            }}>
              {t === 1 ? '1er trim.' : `${t}e trim.`}
            </button>
          ))}
          <button style={{ padding: '7px 13px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}
            onClick={() => showToast('Export en cours...')}>
            \ud83d\udcc4 Exporter
          </button>
          <button onClick={() => setShowSubjectModal(true)}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #fed7aa', background: '#fff4ec', color: '#c2410c', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, width: isMobile ? '100%' : 'auto' }}>
            + Mati\u00e8re
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { icon: '\ud83d\udc65', val: String(classStudents.length), label: '\u00c9l\u00e8ves' },
            { icon: '\ud83d\udcca', val: moyClasse !== null ? moyClasse.toFixed(1).replace('.', ',') : '\u2014', label: 'Moyenne' },
            { icon: '\ud83d\udcda', val: String(classSubjects.length), label: 'Mati\u00e8res' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 100px' }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            \ud83d\udcdd Saisie des notes \u2014 {selectedClassObj?.name ?? '\u2014'} \u00b7 {trimLabel(selectedTrimestre)} Trimestre
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('Notes valid\u00e9es \u2713')}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#D8F3DC', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              \u2705 Valider tout
            </button>
            <button onClick={() => { setSelectedBulletinClassId(selectedClasseId); setSelectedBulletinStudentId(''); setActiveTab('apercu') }}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              \ud83d\udcca Voir bulletin
            </button>
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun \u00e9l\u00e8ve inscrit dans cette classe.</div>
        ) : classSubjects.length === 0 ? (
          <div style={{ padding: 24, background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 8, color: '#9a3412', fontSize: 13 }}>
            \u26a0\ufe0f Aucune mati\u00e8re d\u00e9finie pour cette classe. Cliquez sur <strong>+ Mati\u00e8re</strong> pour en ajouter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#f3f4f6', zIndex: 1 }}>\u00c9l\u00e8ve</th>
                  {classSubjects.map(sub => (
                    <th key={sub.id} style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {sub.name}<br /><span style={{ fontWeight: 400 }}>coef {sub.coefficient}</span>
                    </th>
                  ))}
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Moy. g\u00e9n.</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280' }}>Rang</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280' }}>Mention</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row, ri) => {
                  const mi = row.moy !== null ? mentionInfo(row.moy) : null
                  const nom = `${row.student.last_name} ${row.student.first_name}`
                  return (
                    <tr key={row.student.id} style={{ borderBottom: '1px solid #f0f0f0', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1B4332', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: ri % 2 === 0 ? '#fff' : '#fafafa', zIndex: 1 }}>{nom}</td>
                      {classSubjects.map(sub => {
                        const key = `${row.student.id}-${sub.id}-${selectedTrimestre}`
                        const val = localGrades[key] ?? ''
                        return (
                          <td key={sub.id} style={{ padding: '4px 5px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              step={0.5}
                              value={val}
                              onChange={e => setLocalGrades(prev => ({ ...prev, [key]: e.target.value }))}
                              onBlur={e => handleSaveGrade(row.student.id, sub.id, selectedClasseId, e.target.value)}
                              style={{
                                width: 60,
                                textAlign: 'center',
                                borderRadius: 5,
                                border: `2px solid ${inputBorderColor(val)}`,
                                padding: '4px 2px',
                                fontSize: 12,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                background: val !== '' ? '#f0faf3' : '#fff',
                                color: '#1B4332',
                                outline: 'none',
                              }}
                              placeholder="\u2014"
                            />
                          </td>
                        )
                      })}
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <NcChip v={row.moy !== null ? Math.round(row.moy * 10) / 10 : null} />
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#1B4332' }}>
                        {row.rang ?? '\u2014'}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        {mi ? <span style={{ ...NC_BASE, background: mi.bg, color: mi.color, fontSize: 10 }}>{mi.label}</span> : <span style={{ color: '#9ca3af' }}>\u2014</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0faf3', borderTop: '2px solid #d1fae5' }}>
                  <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#1B4332', position: 'sticky', left: 0, background: '#f0faf3', zIndex: 1 }}>Moy. classe</td>
                  {colAvgs.map((avg, i) => (
                    <td key={i} style={{ padding: '8px 8px', textAlign: 'center' }}><NcChip v={avg} /></td>
                  ))}
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ─── TAB 3: BULLETINS ────────────────────────────────────────────────────

  function renderBulletins() {
    const nbPublies = classStats.filter(cs => cs.publie).length
    const nbEnAttente = classStats.filter(cs => cs.pct > 0 && cs.pct < 100).length
    const nbSansNotes = classStats.filter(cs => cs.pct === 0).length

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {[1, 2, 3].map(t => (
            <button key={t} onClick={() => setSelectedTrimestre(t as 1 | 2 | 3)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
              background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
              color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              fontFamily: 'inherit',
            }}>
              {t === 1 ? '1er trim.' : `${t}e trim.`}
            </button>
          ))}
          <button onClick={() => showToast('Export en cours...')}
            style={{ padding: '7px 13px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            \ud83d\udcc4 Tout exporter
          </button>
          <button onClick={() => showToast('Envoi aux parents en cours...')}
            style={{ padding: '7px 13px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, width: isMobile ? '100%' : 'auto' }}>
            \ud83d\udce9 Envoyer \u00e0 tous les parents
          </button>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 10 }}>
          \ud83d\udcca Gestion des bulletins \u2014 {trimLabel(selectedTrimestre)} Trimestre &nbsp;|&nbsp; {nbPublies} publi\u00e9s \u00b7 {nbEnAttente} en cours \u00b7 {nbSansNotes} sans notes
        </div>

        {isMobile ? (
          <div>
            {classStats.map(cl => {
              const sortedStudents = [...students.filter(s => s.class_id === cl.id)].sort((a, b) => a.last_name.localeCompare(b.last_name))
              return (
                <div key={cl.id} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</span>
                    <SaisieChip pct={cl.pct} />
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{cl.maitre} \u00b7 {cl.eleves} \u00e9l\u00e8ves</div>
                  <div style={{ marginBottom: 8 }}>
                    {cl.publie
                      ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>\u2713 Publi\u00e9</span>
                      : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setSelectedBulletinClassId(cl.id); setSelectedBulletinStudentId(sortedStudents[0]?.id ?? ''); setActiveTab('apercu') }}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>\ud83d\udc41\ufe0f Aper\u00e7u</button>
                    <button onClick={() => showToast('PDF g\u00e9n\u00e9r\u00e9')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>\ud83d\udcc4 PDF</button>
                    <button onClick={() => showToast(cl.publie ? 'D\u00e9publi\u00e9 !' : 'Publi\u00e9 !')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {cl.publie ? 'D\u00e9publier' : 'Publier'}
                    </button>
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
                  {['Classe', 'Ma\u00eetre', '\u00c9l\u00e8ves', 'Notes saisies', 'Moy. classe', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStats.map((cl, i) => {
                  const sortedStudents = [...students.filter(s => s.class_id === cl.id)].sort((a, b) => a.last_name.localeCompare(b.last_name))
                  return (
                    <tr key={cl.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 10px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1B4332' }}>{cl.nom}</td>
                      <td style={{ padding: '10px 10px', color: '#374151' }}>{cl.maitre}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center', color: '#374151' }}>{cl.eleves}</td>
                      <td style={{ padding: '10px 10px' }}><SaisieChip pct={cl.pct} /></td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}><NcChip v={cl.moy} /></td>
                      <td style={{ padding: '10px 10px' }}>
                        {cl.publie
                          ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>\u2713 Publi\u00e9</span>
                          : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => { setSelectedBulletinClassId(cl.id); setSelectedBulletinStudentId(sortedStudents[0]?.id ?? ''); setActiveTab('apercu') }}
                            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>\ud83d\udc41\ufe0f</button>
                          <button onClick={() => showToast('PDF g\u00e9n\u00e9r\u00e9')}
                            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>\ud83d\udcc4</button>
                          <button onClick={() => showToast(cl.publie ? 'D\u00e9publi\u00e9 !' : 'Publi\u00e9 !')}
                            style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            {cl.publie ? 'D\u00e9publier' : 'Publier'}
                          </button>
                        </div>
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

  // ─── TAB 4: APERÇU BULLETIN ──────────────────────────────────────────────

  function renderApercu() {
    const bulletinClass = classes.find(c => c.id === selectedBulletinClassId) ?? classes[0]
    if (!bulletinClass) {
      return <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>Aucune classe disponible.</div>
    }

    const clsStudents = [...students.filter(s => s.class_id === bulletinClass.id)]
      .sort((a, b) => a.last_name.localeCompare(b.last_name))

    const currentStudentId = selectedBulletinStudentId || clsStudents[0]?.id
    const currentStudent = clsStudents.find(s => s.id === currentStudentId) ?? clsStudents[0]

    if (!currentStudent) {
      return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <select value={selectedBulletinClassId} onChange={e => { setSelectedBulletinClassId(e.target.value); setSelectedBulletinStudentId('') }}
              style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun \u00e9l\u00e8ve inscrit dans cette classe.</div>
        </div>
      )
    }

    const clsSubjects = localSubjects
      .filter(s => s.class_id === bulletinClass.id)
      .sort((a, b) => b.coefficient - a.coefficient)

    const allStudentAvgs = clsStudents.map(s => ({
      id: s.id,
      moy: calcMoyEleve(s.id, clsSubjects, selectedTrimestre),
    }))
    const sortedByAvg = [...allStudentAvgs].sort((a, b) => (b.moy ?? -1) - (a.moy ?? -1))
    const studentMoy = allStudentAvgs.find(r => r.id === currentStudent.id)?.moy ?? null
    const rang = studentMoy !== null ? sortedByAvg.findIndex(r => r.id === currentStudent.id) + 1 : null
    const total = clsStudents.length

    const clsAvgs = allStudentAvgs.map(r => r.moy).filter((m): m is number => m !== null)
    const moyClasse = clsAvgs.length > 0
      ? Math.round((clsAvgs.reduce((a, b) => a + b, 0) / clsAvgs.length) * 10) / 10
      : null

    const mention = studentMoy !== null ? mentionInfo(studentMoy) : null
    const teacher = teachers.find(t => t.id === bulletinClass.teacher_id)

    function autoApprec(moy: number | null): string {
      if (moy === null) return 'En attente des r\u00e9sultats.'
      if (moy >= 16) return `${currentStudent.first_name} fait preuve d'excellence et de rigueur. F\u00e9licitations du conseil de classe !`
      if (moy >= 14) return `${currentStudent.first_name} travaille tr\u00e8s bien. Encouragements du conseil de classe.`
      if (moy >= 12) return `${currentStudent.first_name} fournit des efforts satisfaisants. Peut viser encore plus haut.`
      if (moy >= 10) return `${currentStudent.first_name} passe ce trimestre. Des efforts suppl\u00e9mentaires sont attendus.`
      return `${currentStudent.first_name} rencontre des difficult\u00e9s. Un suivi particulier est n\u00e9cessaire pour progresser.`
    }

    const today = new Date().toLocaleDateString('fr-FR')
    const bulletinNum = `BUL-${new Date().getFullYear()}-${currentStudent.matricule.split('-').pop() ?? '0000'}`
    const moyGenStr = studentMoy !== null ? (Math.round(studentMoy * 10) / 10).toFixed(1).replace('.', ',') : '\u2014'
    const initiales = `${currentStudent.first_name[0] ?? ''}${currentStudent.last_name[0] ?? ''}`.toUpperCase()

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={selectedBulletinClassId} onChange={e => { setSelectedBulletinClassId(e.target.value); setSelectedBulletinStudentId('') }}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={currentStudent.id} onChange={e => setSelectedBulletinStudentId(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            {clsStudents.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
          </select>
          {[1, 2, 3].map(t => (
            <button key={t} onClick={() => setSelectedTrimestre(t as 1 | 2 | 3)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
              background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
              color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              fontFamily: 'inherit',
            }}>
              {t === 1 ? '1er trim.' : `${t}e trim.`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: '\ud83d\udda8\ufe0f Imprimer / PDF', bg: '#fff', color: '#374151', border: '1px solid #d1fae5' },
            { label: '\ud83d\udce7 Envoyer email', bg: '#fff', color: '#374151', border: '1px solid #d1fae5' },
            { label: '\u2705 Publier', bg: '#1B4332', color: '#fff', border: 'none' },
            { label: 'D\u00e9publier', bg: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
          ].map(btn => (
            <button key={btn.label} onClick={() => showToast(`${btn.label} en cours...`)}
              style={{ padding: '7px 13px', borderRadius: 7, border: btn.border, background: btn.bg, color: btn.color, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(27,67,50,0.12)' }}>
          <div style={{ background: '#1B4332', padding: isMobile ? '16px' : '24px 32px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, fontFamily: "'Playfair Display', serif", fontSize: 160, color: 'rgba(255,255,255,0.04)', fontWeight: 700, pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>S</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, background: '#F4A261', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>S</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{schoolName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>\u00c9tablissement d&apos;enseignement g\u00e9n\u00e9ral</div>
                </div>
              </div>
              <span style={{ background: '#F4A261', color: '#1B4332', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start' }}>
                Bulletin \u2014 {trimLabel(selectedTrimestre)} Trimestre
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Ann\u00e9e scolaire', val: schoolYear },
                { label: 'Trimestre', val: `${trimLabel(selectedTrimestre)} Trimestre` },
                { label: "Date d'\u00e9dition", val: today },
                { label: 'N\u00b0 Bulletin', val: bulletinNum },
              ].map(m => (
                <div key={m.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#f0faf3', padding: isMobile ? '14px 16px' : '18px 32px', borderBottom: '1px solid #d1fae5' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#F4A261', flexShrink: 0 }}>
                {initiales}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#1B4332' }}>
                  {currentStudent.last_name} {currentStudent.first_name}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  Classe : <strong>{bulletinClass.name}</strong> &nbsp;\u00b7&nbsp;
                  Matricule : <strong>{currentStudent.matricule}</strong> &nbsp;\u00b7&nbsp;
                  Effectif : <strong>{total}</strong> &nbsp;\u00b7&nbsp;
                  Ma\u00eetre : <strong>{teacher?.full_name ?? 'Non assign\u00e9'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#1B4332', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Moy./20</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#F4A261', lineHeight: 1 }}>{moyGenStr}</div>
                </div>
                <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rang</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>
                    {rang !== null ? <>{rang}<span style={{ fontSize: 12 }}>/{total}</span></> : '\u2014'}
                  </div>
                </div>
                <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Moy. classe</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>
                    {moyClasse !== null ? moyClasse.toFixed(1).replace('.', ',') : '\u2014'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: isMobile ? '0 16px 24px' : '0 32px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '190px 1fr 50px 60px 60px 80px', gap: 4, background: '#D8F3DC', borderRadius: '0 0 6px 6px', padding: '6px 10px', marginBottom: 8, fontSize: 9, fontWeight: 700, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Mati\u00e8re / Enseignant</span>
              {!isMobile && <span>\u00c9valuations</span>}
              <span style={{ textAlign: 'center' }}>Coef.</span>
              <span style={{ textAlign: 'center' }}>Moy./20</span>
              {!isMobile && <span style={{ textAlign: 'center' }}>Cl.</span>}
              <span style={{ textAlign: 'center' }}>Note finale</span>
            </div>

            {clsSubjects.length === 0 ? (
              <div style={{ padding: '16px 10px', color: '#6b7280', fontSize: 12, fontStyle: 'italic' }}>
                Aucune mati\u00e8re d\u00e9finie pour cette classe.
              </div>
            ) : clsSubjects.map(sub => {
              const gradeKey = `${currentStudent.id}-${sub.id}-${selectedTrimestre}`
              const gradeVal = localGrades[gradeKey]
              const moy = gradeVal !== undefined && gradeVal !== '' && !isNaN(Number(gradeVal))
                ? Math.round(Number(gradeVal) * 10) / 10
                : null
              const subTeacher = teachers.find(t => t.id === sub.teacher_id)
              const subClsAvg = (() => {
                const vals = clsStudents
                  .map(s => localGrades[`${s.id}-${sub.id}-${selectedTrimestre}`])
                  .filter(v => v !== undefined && v !== '' && !isNaN(Number(v)))
                  .map(Number)
                return vals.length > 0
                  ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
                  : null
              })()
              return (
                <div key={sub.id} style={{ borderBottom: '1px solid #f0faf3', paddingBottom: 4, marginBottom: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '190px 1fr 50px 60px 60px 80px', gap: 4, alignItems: 'center', padding: '4px 10px' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>{sub.name}</div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{subTeacher?.full_name ?? '\u2014'}</div>
                    </div>
                    {!isMobile && <div style={{ fontSize: 10, color: '#9ca3af' }}>\u2014</div>}
                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{sub.coefficient}</div>
                    <div style={{ textAlign: 'center' }}><NcChip v={moy} /></div>
                    {!isMobile && <div style={{ textAlign: 'center', fontSize: 10, color: '#6b7280' }}>{subClsAvg !== null ? subClsAvg.toFixed(1) : '\u2014'}</div>}
                    <div style={{ textAlign: 'center' }}><NcChip v={moy} /></div>
                  </div>
                </div>
              )
            })}

            {clsSubjects.length > 0 && (
              <div style={{ marginTop: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4332', marginBottom: 6 }}>Tableau de calcul</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f0faf3' }}>
                        {['Mati\u00e8re', 'Moyenne', 'Coef', 'Points', 'Barre', 'Mention'].map(h => (
                          <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clsSubjects.map(sub => {
                        const gradeVal = localGrades[`${currentStudent.id}-${sub.id}-${selectedTrimestre}`]
                        const moy = gradeVal !== undefined && gradeVal !== '' && !isNaN(Number(gradeVal))
                          ? Math.round(Number(gradeVal) * 10) / 10
                          : null
                        const pts = moy !== null ? moy * sub.coefficient : null
                        const mi = moy !== null ? mentionInfo(moy) : null
                        return (
                          <tr key={sub.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 500, color: '#1B4332' }}>{sub.name}</td>
                            <td style={{ padding: '5px 8px' }}><NcChip v={moy} /></td>
                            <td style={{ padding: '5px 8px', color: '#6b7280' }}>{sub.coefficient}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151' }}>{pts !== null ? pts.toFixed(1) : '\u2014'}</td>
                            <td style={{ padding: '5px 8px', minWidth: 80 }}>
                              <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
                                {moy !== null && <div style={{ height: 5, borderRadius: 3, width: `${(moy / 20) * 100}%`, background: getBarColor(moy) }} />}
                              </div>
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              {mi ? <span style={{ ...NC_BASE, background: mi.bg, color: mi.color, fontSize: 9 }}>{mi.label}</span> : <span style={{ color: '#9ca3af', fontSize: 9 }}>\u2014</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#1B4332', color: '#fff' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>TOTAL</td>
                        <td style={{ padding: '6px 8px' }}>\u2014</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{clsSubjects.reduce((a, s) => a + s.coefficient, 0)}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>
                          {(() => {
                            const pts = clsSubjects.reduce((sum, sub) => {
                              const v = localGrades[`${currentStudent.id}-${sub.id}-${selectedTrimestre}`]
                              return v !== undefined && v !== '' && !isNaN(Number(v)) ? sum + Number(v) * sub.coefficient : sum
                            }, 0)
                            return pts > 0 ? pts.toFixed(1) : '\u2014'
                          })()}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>MOYENNE FINALE</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{moyGenStr}/20</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div style={{ background: '#f0faf3', borderLeft: '4px solid #F4A261', borderRadius: 4, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 700 }}>Appr\u00e9ciation g\u00e9n\u00e9rale</div>
              <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', lineHeight: 1.8 }}>{autoApprec(studentMoy)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Rang', val: rang !== null ? `${rang}/${total}` : '\u2014' },
                { label: 'Moy. classe', val: moyClasse !== null ? moyClasse.toFixed(1).replace('.', ',') : '\u2014' },
                { label: 'Mention', val: mention?.label ?? '\u2014' },
              ].map(item => (
                <div key={item.label} style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1B4332', fontWeight: 700 }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f0faf3', borderTop: '1.5px solid #d1fae5', padding: isMobile ? '16px' : '16px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center' }}>
                {['Le Ma\u00eetre de classe', 'Visa des parents', 'La Direction'].map(sig => (
                  <div key={sig}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>{sig}</div>
                    <div style={{ width: 110, height: 44, border: '1px solid #d1fae5', borderRadius: 4, background: '#fff', margin: '0 auto 5px' }} />
                    <div style={{ width: 130, height: 1, background: '#d1d5db', margin: '16px auto 5px' }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Signature</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, color: '#9ca3af', marginTop: 14 }}>
                Sukulu \u00b7 Syst\u00e8me de gestion scolaire \u00b7 {bulletinNum} \u00b7 {schoolName}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── TAB 5: STATISTIQUES ──────────────────────────────────────────────────

  function renderStats() {
    const classesByMoy = [...classStats]
      .filter(c => c.moy !== null)
      .sort((a, b) => (b.moy ?? 0) - (a.moy ?? 0))

    const maxMentions = Math.max(...mentionDistribution.map(m => m.count), 1)
    const tEvol = trimesterEvol
    const diff01 = tEvol[0] !== null && tEvol[1] !== null
      ? Math.round((tEvol[1] - tEvol[0]) * 10) / 10
      : null

    const topStudents = students
      .map(s => {
        const subs = localSubjects.filter(sub => sub.class_id === s.class_id)
        const allAvgs = [1, 2, 3].map(t => calcMoyEleve(s.id, subs, t)).filter((m): m is number => m !== null)
        if (!allAvgs.length) return null
        return { student: s, overall: Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10 }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.overall ?? 0) - (a!.overall ?? 0))
      .slice(0, 10) as { student: Student; overall: number }[]

    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Card>
          <SectionTitle>\ud83c\udfc6 Classement des classes par moyenne</SectionTitle>
          {classesByMoy.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Aucune donn\u00e9e pour ce trimestre.</div>
          ) : classesByMoy.map(cl => (
            <div key={cl.id} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 11, alignItems: 'center' }}>
              <span style={{ width: 130, minWidth: 130, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cl.nom}</span>
              <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${((cl.moy ?? 0) / 20) * 100}%`, background: getBarColor(cl.moy ?? 0) }} />
              </div>
              <span style={{ width: 32, minWidth: 32, textAlign: 'right', fontWeight: 700, color: '#1B4332' }}>{(cl.moy ?? 0).toFixed(1)}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>\ud83d\udcca Distribution des mentions</SectionTitle>
          {mentionDistribution.every(m => m.count === 0) ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Aucune donn\u00e9e pour ce trimestre.</div>
          ) : mentionDistribution.map(m => (
            <div key={m.label} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 11, alignItems: 'center' }}>
              <span style={{ width: 90, minWidth: 90, color: '#6b7280' }}>{m.label}</span>
              <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${(m.count / maxMentions) * 100}%`, background: m.color }} />
              </div>
              <span style={{ ...NC_BASE, background: m.bg, color: m.color, fontSize: 10 }}>{m.count}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>\ud83d\udcda Moyennes par mati\u00e8re</SectionTitle>
          {subjectAvgStats.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Aucune note saisie pour ce trimestre.</div>
          ) : subjectAvgStats.map(m => (
            <div key={m.mat} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 11, alignItems: 'center' }}>
              <span style={{ width: 80, minWidth: 80, color: '#6b7280' }}>{m.mat}</span>
              <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${(m.moy / 20) * 100}%`, background: getBarColor(m.moy) }} />
              </div>
              <NcChip v={m.moy} />
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>\ud83d\udcc8 \u00c9volution trimestrielle</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f0faf3' }}>
                  {['Trimestre', 'T1', 'T2', 'T3'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#1B4332' }}>Moy. \u00e9cole</td>
                  {[0, 1, 2].map(ti => (
                    <td key={ti} style={{ padding: '10px', textAlign: 'center' }}>
                      {tEvol[ti] !== null
                        ? <NcChip v={tEvol[ti] as number} />
                        : <span style={{ ...NC_BASE, background: '#f3f4f6', color: '#6b7280', fontSize: 10 }}>\u2014</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {diff01 !== null && (
            <div style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#1B4332', fontWeight: 500 }}>
              \ud83d\udcc8 {diff01 >= 0 ? '+' : ''}{diff01.toFixed(1)} pt par rapport au T1
            </div>
          )}
        </Card>

        <Card style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
          <SectionTitle>\ud83e\udd47 Top 10 \u00e9l\u00e8ves (moyenne toutes \u00e9valuations)</SectionTitle>
          {topStudents.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Aucune donn\u00e9e disponible.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f0faf3' }}>
                    {['#', '\u00c9l\u00e8ve', 'Classe', 'Matricule', 'Moy. g\u00e9n\u00e9rale'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((row, i) => {
                    const cls = classes.find(c => c.id === row.student.class_id)
                    const medal = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `${i + 1}`
                    return (
                      <tr key={row.student.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: '#1B4332' }}>{medal}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{row.student.last_name} {row.student.first_name}</td>
                        <td style={{ padding: '7px 10px', color: '#6b7280' }}>{cls?.name ?? '\u2014'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#6b7280', fontSize: 11 }}>{row.student.matricule}</td>
                        <td style={{ padding: '7px 10px' }}><NcChip v={row.overall} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    )
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#0d1f16', maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 10px' : '24px 20px' }}>

      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 18, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            \ud83d\udcdd Notes &amp; Bulletins
          </h1>
          <div style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
            {schoolYear} \u00b7 {schoolName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          {[1, 2, 3].map(t => (
            <button key={t} onClick={() => setSelectedTrimestre(t as 1 | 2 | 3)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${selectedTrimestre === t ? '#1B4332' : '#d1fae5'}`,
              background: selectedTrimestre === t ? '#1B4332' : '#ffffff',
              color: selectedTrimestre === t ? '#ffffff' : '#6b7280',
              fontFamily: 'inherit',
            }}>
              {t === 1 ? '1er trim.' : `${t}e trim.`}
            </button>
          ))}
          <button style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, width: isMobile ? '100%' : 'auto' }}
            onClick={() => showToast('G\u00e9n\u00e9ration des bulletins en cours...')}>
            \ud83d\udcca G\u00e9n\u00e9rer tous les bulletins
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '\ud83d\udcdd', val: String(headerStats.notesSaisies), lbl: 'Notes saisies', badge: `${trimLabel(selectedTrimestre)} trim.`, badgeBg: '#D8F3DC', badgeColor: '#1B4332' },
          { icon: '\ud83d\udcca', val: headerStats.moyGen !== null ? (Math.round(headerStats.moyGen * 10) / 10).toFixed(1).replace('.', ',') : '\u2014', lbl: 'Moy. g\u00e9n\u00e9rale', badge: `${trimLabel(selectedTrimestre)} trim.`, badgeBg: '#dbeafe', badgeColor: '#1e40af' },
          { icon: '\u2705', val: `${headerStats.tauxReussite}%`, lbl: 'Taux r\u00e9ussite', badge: '\u2265 10/20', badgeBg: '#D8F3DC', badgeColor: '#1B4332' },
          { icon: '\u26a0\ufe0f', val: String(headerStats.enDifficulte), lbl: 'En difficult\u00e9', badge: '< 10/20', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
          { icon: '\ud83d\udcda', val: String(headerStats.matiereActives), lbl: 'Mati\u00e8res actives', badge: 'total', badgeBg: '#fef3c7', badgeColor: '#d97706' },
        ].map(s => (
          <div key={s.lbl} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: isMobile ? '10px' : '13px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, background: s.badgeBg, color: s.badgeColor, borderRadius: 4, padding: '2px 6px' }}>{s.badge}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {classesSansMatieres.length > 0 && (
        <div style={{ background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 8, padding: isMobile ? '8px 10px' : '10px 14px', marginBottom: 14, fontSize: isMobile ? 11 : 12, color: '#9a3412', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>\u26a0\ufe0f <strong>{classesSansMatieres.map(c => c.name).join(', ')}</strong> n&apos;ont aucune mati\u00e8re d\u00e9finie. Ajoutez des mati\u00e8res pour pouvoir saisir des notes.</span>
          <span onClick={() => { setActiveTab('notes') }} style={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Aller \u00e0 la saisie \u2192</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', whiteSpace: isMobile ? 'nowrap' : 'normal', borderBottom: '2px solid #d1fae5' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: isMobile ? '8px 12px' : '9px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === tab.key ? '#1B4332' : 'transparent',
            color: activeTab === tab.key ? '#fff' : '#6b7280',
            fontSize: isMobile ? 11 : 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: activeTab === tab.key ? 600 : 400,
            position: 'relative',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {tab.label}
            {tab.badge && (
              <span style={{ marginLeft: 5, background: '#dc2626', color: '#fff', borderRadius: '50%', fontSize: 9, fontWeight: 700, padding: '1px 5px', display: 'inline-block' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'bulletins' && renderBulletins()}
        {activeTab === 'apercu' && renderApercu()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {showSubjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowSubjectModal(false)}>
          <div style={{ background: '#fff', borderRadius: 13, padding: 24, width: isMobile ? '95vw' : 380 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332' }}>\ud83d\udcda Ajouter une mati\u00e8re</div>
              <button onClick={() => setShowSubjectModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>\u2715</button>
            </div>
            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Classe</FieldLabel>
                <select value={selectedClasseId} disabled style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Nom de la mati\u00e8re</FieldLabel>
                <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="Ex: Fran\u00e7ais, Math\u00e9matiques\u2026" style={inputStyle} required />
              </div>
              <div>
                <FieldLabel>Coefficient (1\u20139)</FieldLabel>
                <input type="number" min={1} max={9} value={newSubjectCoef} onChange={e => setNewSubjectCoef(e.target.value)}
                  style={inputStyle} required />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowSubjectModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 7, border: '1px solid #d1fae5', background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  \u2795 Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: isMobile ? 80 : 24, right: 24, background: '#1B4332', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, boxShadow: '0 4px 14px rgba(27,67,50,0.3)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999 }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, padding: 0 }}>\u2715</button>
        </div>
      )}
    </div>
  )
}
