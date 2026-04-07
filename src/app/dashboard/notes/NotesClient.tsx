'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  teachers: Teacher[]
}

type Teacher = { id: string; full_name: string }

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
  if (v >= 16) return { label: '🏅 Très Bien', color: '#166534', bg: '#dcfce7', sub: 'Félicitations du Conseil' }
  if (v >= 14) return { label: '✨ Bien', color: '#1e40af', bg: '#dbeafe', sub: 'Encouragements du Conseil' }
  if (v >= 12) return { label: '✔ Assez Bien', color: '#854d0e', bg: '#fef9c3', sub: "Tableau d'honneur" }
  if (v >= 10) return { label: 'Passable', color: '#9a3412', bg: '#ffedd5', sub: 'Peut mieux faire' }
  return { label: 'Insuffisant', color: '#991b1b', bg: '#fee2e2', sub: 'Redoublement possible' }
}

function moyenneGeneraleCalc(moys: number[]): number {
  const coefs = [4, 4, 2, 2, 2, 1, 1, 1]
  const totalPts = moys.reduce((sum, m, i) => sum + m * coefs[i], 0)
  const totalCoef = coefs.reduce((a, b) => a + b, 0)
  return Math.round((totalPts / totalCoef) * 10) / 10
}

function getBarColor(n: number): string {
  if (n >= 16) return '#166534'
  if (n >= 14) return '#1e40af'
  if (n >= 12) return '#854d0e'
  if (n >= 10) return '#9a3412'
  return '#991b1b'
}

// ─── Static Demo Data ─────────────────────────────────────────────────────────

const DEMO_CLASSES = [
  { id: '', nom: 'CP', maitre: 'Mme Sohou Alice', eleves: 32, pct: 100, publie: true, moy: 15.1, niveau: 'Primaire' },
  { id: '', nom: 'CM2-A', maitre: 'M. Agossou Didier', eleves: 38, pct: 100, publie: true, moy: 14.8, niveau: 'Primaire' },
  { id: '', nom: 'CM2-B', maitre: 'Mme Tossou Béatrice', eleves: 36, pct: 85, publie: true, moy: 13.5, niveau: 'Primaire' },
  { id: '', nom: 'CM1-A', maitre: 'M. Dossou René', eleves: 40, pct: 75, publie: false, moy: 12.8, niveau: 'Primaire' },
  { id: '', nom: 'CE2-A', maitre: 'Mme Gnanli Rose', eleves: 50, pct: 60, publie: false, moy: 11.9, niveau: 'Primaire' },
  { id: '', nom: 'CE1-A', maitre: 'Non assigné', eleves: 34, pct: 0, publie: false, moy: null, niveau: 'Primaire' },
  { id: '', nom: '6e-A', maitre: 'M. Koffi Marc', eleves: 42, pct: 90, publie: true, moy: 12.9, niveau: 'Collège' },
  { id: '', nom: '5e-B', maitre: 'Mme Ahounou Afi', eleves: 38, pct: 95, publie: true, moy: 13.5, niveau: 'Collège' },
  { id: '', nom: '4e-A', maitre: 'M. Zannou Roland', eleves: 50, pct: 70, publie: false, moy: 12.4, niveau: 'Collège' },
  { id: '', nom: '3e-B', maitre: 'M. Tchékpo', eleves: 36, pct: 100, publie: true, moy: 13.8, niveau: 'Collège' },
  { id: '', nom: '2nde-A', maitre: 'Non assigné', eleves: 0, pct: 0, publie: false, moy: null, niveau: 'Lycée' },
  { id: '', nom: '1ère-C', maitre: 'Non assigné', eleves: 0, pct: 0, publie: false, moy: null, niveau: 'Lycée' },
]

const DEMO_CLASSES_LIST = DEMO_CLASSES.map(c => c.nom)

const DEMO_MATIERES = ['Français', 'Maths', 'EST', 'SVT', 'Éveil', 'Lg.Nat.', 'EPS', 'Dessin']
const DEMO_COEFS = [4, 4, 2, 2, 2, 1, 1, 1]

const DEMO_ELEVES = [
  { nom: 'Adjoua Koné', notes: [14.7, 17.0, 14.3, 15.3, 13.0, 12.3, 16.7, 17.5], rang: 2 },
  { nom: 'Koffi Jean', notes: [16.5, 18.0, 15.0, 16.0, 14.0, 13.0, 17.0, 18.0], rang: 1 },
  { nom: 'Zannou Reine', notes: [14.0, 15.5, 13.5, 14.0, 12.5, 12.0, 15.0, 16.0], rang: 3 },
  { nom: 'Ahounou Théo', notes: [13.5, 15.0, 13.0, 13.5, 12.0, 11.5, 14.5, 15.5], rang: 4 },
  { nom: 'Pierre Dossou', notes: [13.0, 14.5, 12.5, 13.0, 11.5, 11.0, 14.0, 15.0], rang: 5 },
  { nom: 'Marie Houénou', notes: [8.5, 9.5, 9.0, 9.0, 8.0, 7.5, 11.0, 9.5], rang: 36 },
  { nom: 'Dossou Arnaud', notes: [9.0, 10.0, 9.5, 9.5, 8.5, 8.0, 11.5, 10.0], rang: 35 },
]

const DEMO_BULLETINS: Record<string, {
  nom: string; initiales: string; classe: string; matricule: string
  rang: number; total: number; moyGen: string; moyGenN: number; maitre: string
  moyClasse: string; absences: string; retards: string; conduite: string; travail: string
  apprec: string; moys: number[]
}> = {
  adjoua: {
    nom: 'Adjoua Koné', initiales: 'AK', classe: 'CM2-A', matricule: 'SKU-2026-0042',
    rang: 2, total: 38, moyGen: '15,2', moyGenN: 15.2, maitre: 'M. Agossou Didier',
    moyClasse: '12,4', absences: '0 jour(s)', retards: '1 fois', conduite: 'Très bien', travail: 'Très satisfaisant',
    apprec: "Adjoua est une élève sérieuse, curieuse et assidue. Ses résultats témoignent d'un travail régulier et d'une bonne compréhension des matières. Continuez ainsi !",
    moys: [14.7, 17.0, 14.3, 15.3, 14.8, 12.3, 16.7, 17.5],
  },
  koffi: {
    nom: 'Koffi Jean', initiales: 'KJ', classe: 'CM2-A', matricule: 'SKU-2026-0038',
    rang: 1, total: 38, moyGen: '17,4', moyGenN: 17.4, maitre: 'M. Agossou Didier',
    moyClasse: '12,4', absences: '0 jour(s)', retards: '0 fois', conduite: 'Excellent', travail: 'Excellent',
    apprec: "Koffi est un élève exceptionnel. 1er de classe, il fait preuve d'une rigueur et d'une curiosité intellectuelle remarquables. Félicitations !",
    moys: [16.5, 18.0, 15.0, 16.0, 14.0, 13.0, 17.0, 18.0],
  },
  brice: {
    nom: 'Brice Tchédo', initiales: 'BT', classe: '6e-A', matricule: 'SKU-2026-0051',
    rang: 22, total: 42, moyGen: '10,8', moyGenN: 10.8, maitre: 'M. Koffi Marc',
    moyClasse: '12,9', absences: '3 jour(s)', retards: '2 fois', conduite: 'Assez bien', travail: 'Passable',
    apprec: "Des efforts à fournir. Brice est capable mais manque de concentration. Un travail plus régulier lui permettrait d'améliorer ses résultats.",
    moys: [10.5, 11.0, 10.0, 11.5, 10.5, 10.0, 12.5, 11.0],
  },
  marie: {
    nom: 'Marie Houénou', initiales: 'MH', classe: '3e-B', matricule: 'SKU-2026-0033',
    rang: 34, total: 36, moyGen: '9,1', moyGenN: 9.1, maitre: 'M. Tchékpo',
    moyClasse: '13,8', absences: '5 jour(s)', retards: '3 fois', conduite: 'Passable', travail: 'Insuffisant',
    apprec: "Résultats insuffisants ce trimestre. Marie rencontre de sérieuses difficultés. Un accompagnement renforcé est nécessaire.",
    moys: [8.5, 9.5, 9.0, 9.0, 8.0, 7.5, 11.0, 9.5],
  },
}

const BULLETIN_MATIERES: [string, number][] = [
  ['Français', 4], ['Mathématiques', 4], ['EST', 2], ['SVT', 2],
  ['Éveil', 2], ['Langue Nationale', 1], ['EPS', 1], ['Dessin', 1],
]

const BULLETIN_GROUPES = [
  { label: 'Domaine des Lettres', color: '#1B4332', indices: [0] },
  { label: 'Domaine Scientifique', color: '#40916C', indices: [1, 2, 3] },
  { label: 'Autres Disciplines', color: '#F4A261', indices: [4, 5, 6, 7] },
]

const PROFS = ['M. Ekpo', 'Mme Sénou', 'M. Agossou', 'Mme Tossou', 'M. Dossou', 'Mme Gnanli', 'M. Zannou', 'M. Koffi']

const EVAL_APPRC = [
  'Très bon travail, continuez !',
  'Résultats satisfaisants.',
  'Des efforts à poursuivre.',
  'Bonne participation en classe.',
  'Peut mieux faire.',
  'Assidu et rigoureux.',
  'Bonne volonté.',
  'Des progrès notables.',
]

// ─── Chip component ──────────────────────────────────────────────────────────

const NC_BASE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 5,
  display: 'inline-block',
}

function NcChip({ v }: { v: number | null }) {
  if (v === null) return <span style={{ ...NC_BASE, background: '#f3f4f6', color: '#6b7280' }}>—</span>
  return <span style={{ ...NC_BASE, ...ncStyle(v) }}>{v.toFixed(1)}</span>
}

function SaisieChip({ pct }: { pct: number }) {
  let bg = '#fef3c7', color = '#d97706', label = `⏳ ${pct}%`
  if (pct === 100) { bg = '#D8F3DC'; color = '#1B4332'; label = '✓ 100%' }
  else if (pct === 0) { bg = '#fee2e2'; color = '#dc2626'; label = '✗ 0%' }
  return <span style={{ ...NC_BASE, background: bg, color, fontSize: 10 }}>{label}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function NotesClient({ schoolId, schoolYear, schoolName, userId, userRole, classes, subjects, grades, students, teachers }: NotesClientProps) {
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'bulletins' | 'apercu' | 'stats'>('overview')
  const [selectedTrimestre, setSelectedTrimestre] = useState<1 | 2 | 3>(2)
  const [selectedClasseId, setSelectedClasseId] = useState(() => classes[0]?.id ?? '')
  const [selectedClasseDemo, setSelectedClasseDemo] = useState('CM2-A')
  const [selectedBulletinEleve, setSelectedBulletinEleve] = useState('adjoua')
  const [toast, setToast] = useState<string | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showIAModal, setShowIAModal] = useState(false)
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // ── Real-data flag ──────────────────────────────────────────────────────────
  const hasRealData = classes.length > 0

  // ── Per-class computed stats from real data ─────────────────────────────────
  const classStats = useMemo(() => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id)
      const classSubjects = subjects.filter(s => s.class_id === cls.id)
      const trimGrades = grades.filter(g => g.class_id === cls.id && g.trimestre === selectedTrimestre)

      const nbStudents = classStudents.length
      const nbSubjects = classSubjects.length
      const totalExpected = nbStudents * nbSubjects

      const gradedPairs = new Set(trimGrades.map(g => `${g.student_id}|${g.subject_id}`))
      const pct = totalExpected > 0 ? Math.round((gradedPairs.size / totalExpected) * 100) : 0

      const gradesNorm = trimGrades.map(g => (g.grade / g.max_grade) * 20)
      const moy = gradesNorm.length > 0
        ? Math.round((gradesNorm.reduce((a, b) => a + b, 0) / gradesNorm.length) * 10) / 10
        : null

      const teacher = teachers.find(t => t.id === cls.teacher_id)

      return {
        id: cls.id,
        nom: cls.name,
        maitre: teacher?.full_name ?? 'Non assigné',
        eleves: nbStudents,
        pct,
        moy,
        niveau: cls.level ?? 'Autre',
        publie: pct === 100 && nbStudents > 0,
      }
    })
  }, [classes, students, subjects, grades, selectedTrimestre, teachers])

  // ── School-wide KPI stats ───────────────────────────────────────────────────
  const schoolStats = useMemo(() => {
    if (!hasRealData) return null
    const trimGrades = grades.filter(g => g.trimestre === selectedTrimestre)

    let totalExpected = 0
    let totalSaisies = 0
    for (const cls of classes) {
      const nbStu = students.filter(s => s.class_id === cls.id).length
      const nbSub = subjects.filter(s => s.class_id === cls.id).length
      totalExpected += nbStu * nbSub
      const pairs = new Set(
        trimGrades.filter(g => g.class_id === cls.id).map(g => `${g.student_id}|${g.subject_id}`)
      )
      totalSaisies += pairs.size
    }

    const pctSaisies = totalExpected > 0 ? Math.round((totalSaisies / totalExpected) * 100) : 0

    const gradesNorm = trimGrades.map(g => (g.grade / g.max_grade) * 20)
    const moyEcoleN = gradesNorm.length > 0
      ? Math.round((gradesNorm.reduce((a, b) => a + b, 0) / gradesNorm.length) * 10) / 10
      : null
    const moyEcoleStr = moyEcoleN !== null ? moyEcoleN.toFixed(1).replace('.', ',') : '—'

    // T1 vs T2 diff for badge
    const t1Grades = grades.filter(g => g.trimestre === 1).map(g => (g.grade / g.max_grade) * 20)
    const t2Grades = grades.filter(g => g.trimestre === 2).map(g => (g.grade / g.max_grade) * 20)
    const moyT1 = t1Grades.length > 0 ? t1Grades.reduce((a, b) => a + b, 0) / t1Grades.length : null
    const moyT2 = t2Grades.length > 0 ? t2Grades.reduce((a, b) => a + b, 0) / t2Grades.length : null
    const diff = moyT1 !== null && moyT2 !== null ? Math.round((moyT2 - moyT1) * 10) / 10 : null
    const diffStr = diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pt` : '—'

    const classesSansNotes = classes.filter(cls => !trimGrades.some(g => g.class_id === cls.id))
    const nbPublies = classStats.filter(cs => cs.publie).length
    const nbEnAttente = classStats.filter(cs => cs.pct > 0 && cs.pct < 100).length

    return {
      pctSaisies,
      moyEcoleStr,
      moyEcoleN,
      nbPublies,
      nbEnAttente,
      nbSansNotes: classesSansNotes.length,
      classesSansNotesNoms: classesSansNotes.map(c => c.name),
      diffStr,
    }
  }, [classes, students, subjects, grades, selectedTrimestre, classStats, hasRealData])

  // ── Selected class (Tab 2) ──────────────────────────────────────────────────
  const selectedClassObj = useMemo(
    () => classes.find(c => c.id === selectedClasseId) ?? null,
    [classes, selectedClasseId]
  )

  const realClassNotes = useMemo(() => {
    if (!selectedClassObj) return null
    const classStudents = [...students.filter(s => s.class_id === selectedClassObj.id)]
      .sort((a, b) => a.last_name.localeCompare(b.last_name))
    const classSubjects = [...subjects.filter(s => s.class_id === selectedClassObj.id)]
      .sort((a, b) => b.coefficient - a.coefficient)
    const trimGrades = grades.filter(g => g.class_id === selectedClassObj.id && g.trimestre === selectedTrimestre)

    const gradeMap = new Map<string, number>()
    for (const g of trimGrades) {
      gradeMap.set(`${g.student_id}|${g.subject_id}`, Math.round((g.grade / g.max_grade) * 20 * 10) / 10)
    }

    const studentRows = classStudents.map(s => {
      const notes = classSubjects.map(sub => gradeMap.get(`${s.id}|${sub.id}`) ?? null)
      const valid = notes
        .map((n, i) => (n !== null ? { note: n, coef: classSubjects[i].coefficient } : null))
        .filter(Boolean) as { note: number; coef: number }[]
      const totalPts = valid.reduce((sum, x) => sum + x.note * x.coef, 0)
      const totalCoef = valid.reduce((sum, x) => sum + x.coef, 0)
      const moy = totalCoef > 0 ? Math.round((totalPts / totalCoef) * 10) / 10 : null
      return { student: s, notes, moy }
    })

    const sorted = [...studentRows].sort((a, b) => (b.moy ?? -1) - (a.moy ?? -1))
    const ranked = studentRows.map(row => ({
      ...row,
      rang: row.moy !== null ? sorted.findIndex(r => r.student.id === row.student.id) + 1 : null,
    }))

    const colAvgs = classSubjects.map((_, si) => {
      const vals = ranked.map(r => r.notes[si]).filter((n): n is number => n !== null)
      return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
    })

    const totalExpected = classStudents.length * classSubjects.length
    const pctSaisie = totalExpected > 0
      ? Math.round((new Set(trimGrades.map(g => `${g.student_id}|${g.subject_id}`)).size / totalExpected) * 100)
      : 0

    const allMoys = ranked.map(r => r.moy).filter((m): m is number => m !== null)
    const moyClasse = allMoys.length > 0
      ? Math.round((allMoys.reduce((a, b) => a + b, 0) / allMoys.length) * 10) / 10
      : null

    return { classStudents, classSubjects, ranked, colAvgs, pctSaisie, moyClasse }
  }, [selectedClassObj, students, subjects, grades, selectedTrimestre])

  // ── Stats Tab — subject averages ────────────────────────────────────────────
  const subjectAvgStats = useMemo(() => {
    if (!hasRealData) return null
    const trimGrades = grades.filter(g => g.trimestre === selectedTrimestre)
    return subjects
      .map(sub => {
        const sg = trimGrades.filter(g => g.subject_id === sub.id)
        if (sg.length === 0) return null
        const avg = Math.round((sg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / sg.length) * 10) / 10
        return { mat: sub.name, moy: avg }
      })
      .filter(Boolean)
      .sort((a, b) => (b!.moy ?? 0) - (a!.moy ?? 0)) as { mat: string; moy: number }[]
  }, [subjects, grades, selectedTrimestre, hasRealData])

  // ── Stats Tab — mention distribution ────────────────────────────────────────
  const mentionDistribution = useMemo(() => {
    if (!hasRealData) return null
    const trimGrades = grades.filter(g => g.trimestre === selectedTrimestre)
    const buckets = [
      { label: 'Très Bien', min: 16, color: '#166534', bg: '#dcfce7' },
      { label: 'Bien', min: 14, color: '#1e40af', bg: '#dbeafe' },
      { label: 'Assez Bien', min: 12, color: '#854d0e', bg: '#fef9c3' },
      { label: 'Passable', min: 10, color: '#9a3412', bg: '#ffedd5' },
      { label: 'Insuffisant', min: 0, color: '#991b1b', bg: '#fee2e2' },
    ]
    const studentAvgs = students.map(s => {
      const subs = subjects.filter(sub => sub.class_id === s.class_id)
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
      count: studentAvgs.filter(avg => avg >= b.min && avg < (buckets[i - 1]?.min ?? 21)).length,
    }))
  }, [students, subjects, grades, selectedTrimestre, hasRealData])

  // ── Stats Tab — trimester evolution ─────────────────────────────────────────
  const trimesterEvol = useMemo(() => {
    if (!hasRealData) return null
    return [1, 2, 3].map(t => {
      const tg = grades.filter(g => g.trimestre === t)
      if (tg.length === 0) return null
      const avg = Math.round((tg.reduce((a, g) => a + (g.grade / g.max_grade) * 20, 0) / tg.length) * 10) / 10
      return avg
    })
  }, [grades, hasRealData])

  const filteredClasses = useMemo(() => {
    const source = hasRealData ? classStats : DEMO_CLASSES
    return source.filter(c => {
      if (filterNiveau && c.niveau !== filterNiveau) return false
      if (filterStatut === 'publie' && !c.publie) return false
      if (filterStatut === 'non_publie' && c.publie) return false
      return true
    })
  }, [hasRealData, classStats, filterNiveau, filterStatut])

  const bulletin = DEMO_BULLETINS[selectedBulletinEleve]

  const trimLabel = (t: number) => t === 1 ? '1er' : `${t}e`

  const TABS = [
    { key: 'overview' as const, label: "🏫 Vue d'ensemble", badge: null },
    { key: 'notes' as const, label: '📝 Notes par classe', badge: null },
    { key: 'bulletins' as const, label: '📊 Bulletins', badge: hasRealData ? String(schoolStats?.nbEnAttente ?? 0) : '7' },
    { key: 'apercu' as const, label: '👁️ Aperçu bulletin', badge: null },
    { key: 'stats' as const, label: '📈 Statistiques', badge: null },
  ]

  // ── Shared wrappers ──

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
            <option value="Collège">Collège</option>
            <option value="Lycée">Lycée</option>
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option value="">Tous les statuts</option>
            <option value="publie">Publiés</option>
            <option value="non_publie">Non publiés</option>
          </select>
          <button style={{ padding: '7px 13px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}
            onClick={() => showToast('Export en cours...')}>
            📄 Exporter
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            📋 État des notes par classe — {trimLabel(selectedTrimestre)} Trimestre
          </div>
          <button style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => showToast('Relances envoyées !')}>
            📩 Relancer tous
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
          {filteredClasses.map((cl, i) => {
            const barBg = cl.pct === 100 ? '#40916C' : cl.pct >= 50 ? '#d97706' : '#dc2626'
            if (isMobile) {
              return (
                <div key={cl.nom} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</span>
                    <SaisieChip pct={cl.pct} />
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{cl.maitre}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{cl.eleves} élèves · {cl.niveau}</div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${cl.pct}%`, background: barBg }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <NcChip v={cl.moy} />
                    {cl.publie
                      ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>✓ Publié</span>
                      : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                      if (hasRealData) { setSelectedClasseId(cl.id ?? ''); } else { setSelectedClasseDemo(cl.nom); }
                      setActiveTab('notes')
                    }}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      📝 Notes
                    </button>
                    <button onClick={() => setActiveTab('apercu')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      📊 Bulletin
                    </button>
                    <button onClick={() => showToast(cl.publie ? 'Dépublié !' : 'Publié !')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {cl.publie ? 'Dépublier' : 'Publier'}
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <div key={cl.nom} style={{ display: 'flex', gap: 14, padding: '12px 15px', borderBottom: i < filteredClasses.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                <div style={{ width: 70, minWidth: 70, fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{cl.maitre}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{cl.eleves} élèves · {cl.niveau}</div>
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
                    ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>✓ Publié</span>
                    : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => {
                    if (hasRealData) { setSelectedClasseId(cl.id ?? ''); } else { setSelectedClasseDemo(cl.nom); }
                    setActiveTab('notes')
                  }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    📝 Notes
                  </button>
                  <button onClick={() => setActiveTab('apercu')}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    📊 Bulletin
                  </button>
                  <button onClick={() => showToast(cl.publie ? 'Dépublié !' : 'Publié !')}
                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {cl.publie ? 'Dépublier' : 'Publier'}
                  </button>
                </div>
              </div>
            )
          })}
          {filteredClasses.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucune classe trouvée.</div>
          )}
        </div>
      </div>
    )
  }

  // ─── TAB 2: NOTES PAR CLASSE ──────────────────────────────────────────────

  function renderNotes() {
    // ── Real data branch ──
    if (hasRealData && realClassNotes) {
      const { classSubjects, ranked, colAvgs, pctSaisie, moyClasse } = realClassNotes
      const nomClasse = selectedClassObj?.name ?? '—'
      const classesList = classes

      return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <select value={selectedClasseId} onChange={e => setSelectedClasseId(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
              {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              📄 Exporter
            </button>
            <button onClick={() => setShowNoteModal(true)}
              style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, width: isMobile ? '100%' : 'auto' }}>
              + Saisir une note
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { icon: '👥', val: String(realClassNotes.classStudents.length), label: 'Élèves' },
              { icon: '📊', val: moyClasse !== null ? moyClasse.toFixed(1).replace('.', ',') : '—', label: 'Moyenne' },
              { icon: '✅', val: `${pctSaisie}%`, label: 'Notes saisies' },
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
              📝 Notes — {nomClasse} · {trimLabel(selectedTrimestre)} Trimestre
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => showToast('Notes validées ✓')}
                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#D8F3DC', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                ✅ Valider tout
              </button>
              <button onClick={() => setActiveTab('apercu')}
                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                📊 Voir bulletin
              </button>
            </div>
          </div>

          {ranked.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun élève inscrit dans cette classe.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#f3f4f6', zIndex: 1 }}>Élève</th>
                    {classSubjects.map(sub => (
                      <th key={sub.id} style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {sub.name}<br /><span style={{ fontWeight: 400 }}>coef {sub.coefficient}</span>
                      </th>
                    ))}
                    <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Moy. gén.</th>
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
                        {row.notes.map((n, ni) => (
                          <td key={ni} style={{ padding: '8px 8px', textAlign: 'center' }}><NcChip v={n} /></td>
                        ))}
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}><NcChip v={row.moy} /></td>
                        <td style={{ padding: '8px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#1B4332' }}>
                          {row.rang ?? '—'}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          {mi ? <span style={{ ...NC_BASE, background: mi.bg, color: mi.color, fontSize: 10 }}>{mi.label}</span> : <span style={{ color: '#9ca3af' }}>—</span>}
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

    // ── Demo data branch ──
    const colAvgs = DEMO_MATIERES.map((_, mi) => {
      const vals = DEMO_ELEVES.map(e => e.notes[mi])
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    })

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={selectedClasseDemo} onChange={e => setSelectedClasseDemo(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            {DEMO_CLASSES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
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
            📄 Exporter
          </button>
          <button onClick={() => setShowNoteModal(true)}
            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, width: isMobile ? '100%' : 'auto' }}>
            + Saisir une note
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { icon: '👥', val: '38', label: 'Élèves' },
            { icon: '📊', val: '14,8', label: 'Moyenne' },
            { icon: '✅', val: '78%', label: 'Notes saisies' },
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
            📝 Notes — {selectedClasseDemo} · {trimLabel(selectedTrimestre)} Trimestre
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('Notes validées ✓')}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#D8F3DC', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              ✅ Valider tout
            </button>
            <button onClick={() => setActiveTab('apercu')}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              📊 Voir bulletin
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#f3f4f6', zIndex: 1 }}>Élève</th>
                {DEMO_MATIERES.map((m, i) => (
                  <th key={m} style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {m}<br /><span style={{ fontWeight: 400 }}>coef {DEMO_COEFS[i]}</span>
                  </th>
                ))}
                <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Moy. gén.</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280' }}>Rang</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280' }}>Mention</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ELEVES.map((eleve, ri) => {
                const moy = moyenneGeneraleCalc(eleve.notes)
                const mi = mentionInfo(moy)
                return (
                  <tr key={eleve.nom} style={{ borderBottom: '1px solid #f0f0f0', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1B4332', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: ri % 2 === 0 ? '#fff' : '#fafafa', zIndex: 1 }}>{eleve.nom}</td>
                    {eleve.notes.map((n, ni) => (
                      <td key={ni} style={{ padding: '8px 8px', textAlign: 'center' }}><NcChip v={n} /></td>
                    ))}
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}><NcChip v={moy} /></td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#1B4332' }}>{eleve.rang}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <span style={{ ...NC_BASE, background: mi.bg, color: mi.color, fontSize: 10 }}>{mi.label}</span>
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
      </div>
    )
  }

  // ─── TAB 3: BULLETINS ────────────────────────────────────────────────────

  function renderBulletins() {
    const bulletinClasses = hasRealData ? classStats : DEMO_CLASSES
    const bulletinClassNames = bulletinClasses.map(c => c.nom)
    const nbPublies = hasRealData ? (schoolStats?.nbPublies ?? 0) : 5
    const nbEnAttente = hasRealData ? (schoolStats?.nbEnAttente ?? 0) : 7
    const nbSansNotes = hasRealData ? (schoolStats?.nbSansNotes ?? 0) : 3

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option>Toutes les classes</option>
            {bulletinClassNames.map(c => <option key={c}>{c}</option>)}
          </select>
          <select style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option>Tous les statuts</option>
            <option>Publiés</option>
            <option>Non publiés</option>
          </select>
          <button onClick={() => showToast('Export en cours...')}
            style={{ padding: '7px 13px', borderRadius: 7, border: '1px solid #d1fae5', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            📄 Tout exporter
          </button>
          <button onClick={() => showToast('Envoi aux parents en cours...')}
            style={{ padding: '7px 13px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, width: isMobile ? '100%' : 'auto' }}>
            📩 Envoyer à tous les parents
          </button>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 10 }}>
          📊 Gestion des bulletins — {trimLabel(selectedTrimestre)} Trimestre &nbsp;|&nbsp; {nbPublies} publiés · {nbEnAttente} en attente · {nbSansNotes} sans notes
        </div>

        {isMobile ? (
          <div>
            {bulletinClasses.map(cl => (
              <div key={cl.nom} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332' }}>{cl.nom}</span>
                  <SaisieChip pct={cl.pct} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{cl.maitre}</div>
                <div style={{ marginBottom: 8 }}>
                  {cl.publie
                    ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>✓ Publié</span>
                    : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setActiveTab('apercu')} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>👁️ Aperçu</button>
                  <button onClick={() => showToast('PDF généré')} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>📄 PDF</button>
                  <button onClick={() => showToast(cl.publie ? 'Dépublié !' : 'Publié !')}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {cl.publie ? 'Dépublier' : 'Publier'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['Classe', 'Maître', 'Élèves', 'Notes saisies', 'Bulletins générés', 'Statut', 'Dernière action', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulletinClasses.map((cl, i) => (
                  <tr key={cl.nom} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 10px', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#1B4332' }}>{cl.nom}</td>
                    <td style={{ padding: '10px 10px', color: '#374151' }}>{cl.maitre}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#374151' }}>{cl.eleves}</td>
                    <td style={{ padding: '10px 10px' }}><SaisieChip pct={cl.pct} /></td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <span style={{ ...NC_BASE, background: '#dbeafe', color: '#1e40af', fontSize: 10 }}>{cl.eleves} / {cl.eleves}</span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      {cl.publie
                        ? <span style={{ ...NC_BASE, background: '#D8F3DC', color: '#1B4332', fontSize: 10 }}>✓ Publié</span>
                        : <span style={{ ...NC_BASE, background: '#fef3c7', color: '#d97706', fontSize: 10 }}>En attente</span>}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#6b7280', fontSize: 11 }}>—</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setActiveTab('apercu')} style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>👁️</button>
                        <button onClick={() => showToast('PDF généré')} style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #d1fae5', background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>📄</button>
                        <button onClick={() => showToast(cl.publie ? 'Dépublié !' : 'Publié !')}
                          style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: cl.publie ? '#fee2e2' : '#1B4332', color: cl.publie ? '#dc2626' : '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {cl.publie ? 'Dépublier' : 'Publier'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ─── TAB 4: APERÇU BULLETIN ──────────────────────────────────────────────

  function renderApercu() {
    if (!bulletin) return null
    const b = bulletin
    const mention = mentionInfo(b.moyGenN)
    const coefTotal = BULLETIN_MATIERES.reduce((a, m) => a + m[1], 0)
    const totalPts = b.moys.reduce((sum, m, i) => sum + m * BULLETIN_MATIERES[i][1], 0)
    const today = new Date().toLocaleDateString('fr-FR')
    const bulletinNum = `BUL-${new Date().getFullYear()}-${b.matricule.split('-').pop() ?? '0000'}`

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <select value={selectedBulletinEleve} onChange={e => setSelectedBulletinEleve(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d1fae5', borderRadius: 7, fontSize: 12, background: '#fff', fontFamily: 'inherit', width: isMobile ? '100%' : 'auto' }}>
            <option value="adjoua">Adjoua Koné</option>
            <option value="koffi">Koffi Jean</option>
            <option value="brice">Brice Tchédo</option>
            <option value="marie">Marie Houénou</option>
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
          <button onClick={() => setShowIAModal(true)}
            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, width: isMobile ? '100%' : 'auto' }}>
            🤖 Appréciation IA
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: '🖨️ Imprimer / PDF', bg: '#fff', color: '#374151', border: '1px solid #d1fae5' },
            { label: '📧 Envoyer email', bg: '#fff', color: '#374151', border: '1px solid #d1fae5' },
            { label: '📱 WhatsApp parent', bg: '#fff', color: '#374151', border: '1px solid #d1fae5' },
            { label: '✅ Publier', bg: '#1B4332', color: '#fff', border: 'none' },
            { label: 'Dépublier', bg: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
          ].map(btn => (
            <button key={btn.label} onClick={() => showToast(`${btn.label} en cours...`)}
              style={{ padding: '7px 13px', borderRadius: 7, border: btn.border, background: btn.bg, color: btn.color, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Bulletin document */}
        <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(27,67,50,0.12)' }}>

          {/* Header */}
          <div style={{ background: '#1B4332', padding: isMobile ? '16px' : '24px 32px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, fontFamily: "'Playfair Display', serif", fontSize: 160, color: 'rgba(255,255,255,0.04)', fontWeight: 700, pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>S</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, background: '#F4A261', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>S</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 14 : 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{schoolName || 'École Primaire Les Étoiles'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Établissement d'enseignement général</div>
                </div>
              </div>
              <span style={{ background: '#F4A261', color: '#1B4332', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start' }}>
                Bulletin — {trimLabel(selectedTrimestre)} Trimestre
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Année scolaire', val: schoolYear || '2025-2026' },
                { label: 'Trimestre', val: `${trimLabel(selectedTrimestre)} Trimestre` },
                { label: "Date d'édition", val: today },
                { label: 'N° Bulletin', val: bulletinNum },
              ].map(m => (
                <div key={m.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '7px 10px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc élève */}
          <div style={{ background: '#f0faf3', padding: isMobile ? '14px 16px' : '18px 32px', borderBottom: '1px solid #d1fae5' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#F4A261', flexShrink: 0 }}>
                {b.initiales}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#1B4332' }}>{b.nom}</div>
                <div style={{ fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                  Classe : <strong>{b.classe}</strong> &nbsp;·&nbsp; Matricule : <strong>{b.matricule}</strong> &nbsp;·&nbsp; Effectif : <strong>{b.total}</strong> &nbsp;·&nbsp; Maître : <strong>{b.maitre}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#1B4332', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Moy./20</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#F4A261', lineHeight: 1 }}>{b.moyGen}</div>
                </div>
                <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rang</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>{b.rang}<span style={{ fontSize: 12 }}>/{b.total}</span></div>
                </div>
                <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 16px', minWidth: 80 }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Moy. classe</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>{b.moyClasse}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ padding: isMobile ? '0 16px 24px' : '0 32px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '190px 1fr 50px 60px 60px 80px', gap: 4, background: '#D8F3DC', borderRadius: '0 0 6px 6px', padding: '6px 10px', marginBottom: 8, fontSize: 9, fontWeight: 700, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Matière / Enseignant</span>
              {!isMobile && <span>Évaluations</span>}
              <span style={{ textAlign: 'center' }}>Coef.</span>
              <span style={{ textAlign: 'center' }}>Moy./20</span>
              {!isMobile && <span style={{ textAlign: 'center' }}>Cl.</span>}
              <span style={{ textAlign: 'center' }}>Note finale</span>
            </div>

            {BULLETIN_GROUPES.map(groupe => (
              <div key={groupe.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: groupe.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: groupe.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupe.label}</div>
                </div>
                {groupe.indices.map(idx => {
                  const [mName, coef] = BULLETIN_MATIERES[idx]
                  const moy = b.moys[idx]
                  const ctrl = Math.max(0, Math.round((moy - 0.5) * 4) / 4)
                  const inter = Math.min(20, Math.round((moy + 0.5) * 4) / 4)
                  const exam = moy
                  return (
                    <div key={mName} style={{ borderBottom: '1px solid #f0faf3', paddingBottom: 4, marginBottom: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 70px' : '190px 1fr 50px 60px 60px 80px', gap: 4, alignItems: 'center', padding: '4px 10px' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>{mName}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>{PROFS[idx]}</div>
                        </div>
                        {!isMobile && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {([['Ctrl', ctrl], ['Inter', inter], ['Exam', exam]] as [string, number][]).map(([lbl, val]) => (
                              <span key={lbl} style={{ ...NC_BASE, ...ncStyle(val), fontSize: 10, padding: '2px 5px' }}>
                                {lbl}: {val.toFixed(1)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{coef}</div>
                        <div style={{ textAlign: 'center' }}><NcChip v={moy} /></div>
                        {!isMobile && <div style={{ textAlign: 'center', fontSize: 10, color: '#6b7280' }}>12,4</div>}
                        <div style={{ textAlign: 'center' }}><NcChip v={moy} /></div>
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: 10, color: '#6b7280', paddingLeft: 20, borderLeft: '2px solid #D8F3DC', margin: '2px 10px 4px' }}>
                        {EVAL_APPRC[idx]}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Tableau de calcul */}
            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4332', marginBottom: 6 }}>Tableau de calcul</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f0faf3' }}>
                      {['Matière', 'Moyenne', 'Coef', 'Points', 'Barre', 'Mention'].map(h => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BULLETIN_MATIERES.map(([mName, coef], idx) => {
                      const moy = b.moys[idx]
                      const pts = moy * coef
                      const mi = mentionInfo(moy)
                      return (
                        <tr key={mName} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 500, color: '#1B4332' }}>{mName}</td>
                          <td style={{ padding: '5px 8px' }}><NcChip v={moy} /></td>
                          <td style={{ padding: '5px 8px', color: '#6b7280' }}>{coef}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600, color: '#374151' }}>{pts.toFixed(1)}</td>
                          <td style={{ padding: '5px 8px', minWidth: 80 }}>
                            <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
                              <div style={{ height: 5, borderRadius: 3, width: `${(moy / 20) * 100}%`, background: getBarColor(moy) }} />
                            </div>
                          </td>
                          <td style={{ padding: '5px 8px' }}>
                            <span style={{ ...NC_BASE, background: mi.bg, color: mi.color, fontSize: 9 }}>{mi.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1B4332', color: '#fff' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>TOTAL</td>
                      <td style={{ padding: '6px 8px' }}>—</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{coefTotal}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{totalPts.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>MOYENNE FINALE</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{b.moyGen}/20</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Vie scolaire */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4332', marginBottom: 6 }}>Vie scolaire</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { label: 'Absences', val: b.absences },
                  { label: 'Retards', val: b.retards },
                  { label: 'Conduite', val: b.conduite },
                  { label: 'Travail', val: b.travail },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appréciation générale */}
            <div style={{ background: '#f0faf3', borderLeft: '4px solid #F4A261', borderRadius: 4, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: '#F4A261', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 700 }}>Appréciation générale</div>
              <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', lineHeight: 1.8 }}>{b.apprec}</div>
            </div>

            {/* Classement & mention */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Rang', val: `${b.rang}/${b.total}` },
                { label: 'Moy. classe', val: b.moyClasse },
                { label: 'Mention', val: mention.label },
              ].map(item => (
                <div key={item.label} style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1B4332', fontWeight: 700 }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div style={{ background: '#f0faf3', borderTop: '1.5px solid #d1fae5', padding: isMobile ? '16px' : '16px 0', marginBottom: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center' }}>
                {['Le Maître de classe', 'Visa des parents', 'La Direction'].map(sig => (
                  <div key={sig}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>{sig}</div>
                    <div style={{ width: 110, height: 44, border: '1px solid #d1fae5', borderRadius: 4, background: '#fff', margin: '0 auto 5px' }} />
                    <div style={{ width: 130, height: 1, background: '#d1d5db', margin: '16px auto 5px' }} />
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Signature</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, color: '#9ca3af', marginTop: 14 }}>
                Sukulu · Système de gestion scolaire · {bulletinNum} · {schoolName || 'École Primaire Les Étoiles'}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── TAB 5: STATISTIQUES ──────────────────────────────────────────────────

  function renderStats() {
    // Class rankings
    const classesByMoy = hasRealData
      ? [...classStats].filter(c => c.moy !== null).sort((a, b) => (b.moy ?? 0) - (a.moy ?? 0))
      : [...DEMO_CLASSES].filter(c => c.moy !== null).sort((a, b) => (b.moy ?? 0) - (a.moy ?? 0))

    // Mention distribution
    const mentions = hasRealData && mentionDistribution
      ? mentionDistribution
      : [
        { label: 'Très Bien', count: 18, color: '#166534', bg: '#dcfce7' },
        { label: 'Bien', count: 42, color: '#1e40af', bg: '#dbeafe' },
        { label: 'Assez Bien', count: 75, color: '#854d0e', bg: '#fef9c3' },
        { label: 'Passable', count: 68, color: '#9a3412', bg: '#ffedd5' },
        { label: 'Insuffisant', count: 42, color: '#991b1b', bg: '#fee2e2' },
      ]
    const maxMentions = Math.max(...mentions.map(m => m.count), 1)

    // Subject averages
    const matMoys = hasRealData && subjectAvgStats && subjectAvgStats.length > 0
      ? subjectAvgStats
      : [
        { mat: 'EPS', moy: 13.1 }, { mat: 'Maths', moy: 12.8 }, { mat: 'SVT', moy: 12.3 },
        { mat: 'EST', moy: 12.1 }, { mat: 'Français', moy: 11.8 }, { mat: 'Éveil', moy: 11.5 },
        { mat: 'Dessin', moy: 11.2 }, { mat: 'Lg.Nat.', moy: 10.4 },
      ]

    // Trimester evolution
    const tEvol = hasRealData && trimesterEvol
      ? trimesterEvol
      : [12.3, 13.2, null]
    const diff01 = tEvol[0] !== null && tEvol[1] !== null
      ? Math.round((tEvol[1] - tEvol[0]) * 10) / 10
      : null

    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Card>
          <SectionTitle>🏆 Classement des classes par moyenne</SectionTitle>
          {classesByMoy.map(cl => (
            <div key={cl.nom} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 11, alignItems: 'center' }}>
              <span style={{ width: 130, minWidth: 130, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cl.nom}</span>
              <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${((cl.moy ?? 0) / 20) * 100}%`, background: getBarColor(cl.moy ?? 0) }} />
              </div>
              <span style={{ width: 32, minWidth: 32, textAlign: 'right', fontWeight: 700, color: '#1B4332' }}>{(cl.moy ?? 0).toFixed(1)}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>📊 Distribution des mentions</SectionTitle>
          {mentions.map(m => (
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
          <SectionTitle>📚 Moyennes par matière</SectionTitle>
          {matMoys.map(m => (
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
          <SectionTitle>📈 Évolution trimestrielle</SectionTitle>
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
                  <td style={{ padding: '10px', fontWeight: 600, color: '#1B4332' }}>Moy. école</td>
                  {[0, 1, 2].map(ti => (
                    <td key={ti} style={{ padding: '10px', textAlign: 'center' }}>
                      {tEvol[ti] !== null
                        ? <NcChip v={tEvol[ti] as number} />
                        : <span style={{ ...NC_BASE, background: '#f3f4f6', color: '#6b7280', fontSize: 10 }}>En cours</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {diff01 !== null && (
            <div style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 6, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#1B4332', fontWeight: 500 }}>
              📈 {diff01 >= 0 ? '+' : ''}{diff01.toFixed(1)} pt par rapport au T1
            </div>
          )}
        </Card>
      </div>
    )
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#0d1f16', maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 10px' : '24px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 18, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            📝 Notes &amp; Bulletins
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
            {schoolName || 'École Primaire Les Étoiles'} · {schoolYear}
          </p>
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
            onClick={() => showToast('Génération des bulletins en cours...')}>
            📊 Générer tous les bulletins
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          {
            icon: '📝',
            val: hasRealData ? `${schoolStats?.pctSaisies ?? 0}%` : '78%',
            lbl: 'Notes saisies',
            badge: `${trimLabel(selectedTrimestre)} trim.`,
            badgeBg: '#D8F3DC', badgeColor: '#1B4332',
          },
          {
            icon: '📊',
            val: hasRealData ? (schoolStats?.moyEcoleStr ?? '—') : '13,2',
            lbl: 'Moy. générale école',
            badge: hasRealData ? (schoolStats?.diffStr ?? '—') : '+0,9 pts',
            badgeBg: '#dbeafe', badgeColor: '#1e40af',
          },
          {
            icon: '✅',
            val: hasRealData ? String(schoolStats?.nbPublies ?? 0) : '5',
            lbl: 'Bulletins publiés',
            badge: `${hasRealData ? (schoolStats?.nbPublies ?? 0) : 5} classes`,
            badgeBg: '#D8F3DC', badgeColor: '#1B4332',
          },
          {
            icon: '⏳',
            val: hasRealData ? String(schoolStats?.nbEnAttente ?? 0) : '7',
            lbl: 'Non publiés',
            badge: 'En cours',
            badgeBg: '#fef3c7', badgeColor: '#d97706',
          },
          {
            icon: '🔴',
            val: hasRealData ? String(schoolStats?.nbSansNotes ?? 0) : '3',
            lbl: 'Classes sans notes',
            badge: 'À régler',
            badgeBg: '#fee2e2', badgeColor: '#dc2626',
          },
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

      {/* Orange alert */}
      {(() => {
        const noNoteClasses = hasRealData
          ? schoolStats?.classesSansNotesNoms ?? []
          : ['CE1-A', '2nde-A', '1ère-C']
        if (noNoteClasses.length === 0) return null
        return (
          <div style={{ background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 8, padding: isMobile ? '8px 10px' : '10px 14px', marginBottom: 14, fontSize: isMobile ? 11 : 12, color: '#9a3412', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span>⚠️ <strong>{noNoteClasses.join(', ')}</strong> n'ont aucune note saisie ce trimestre. Relancez les enseignants.</span>
            <span onClick={() => showToast('Relances envoyées !')} style={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Envoyer relances →</span>
          </div>
        )
      })()}

      {/* Tabs */}
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

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'bulletins' && renderBulletins()}
        {activeTab === 'apercu' && renderApercu()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {/* Modal: Saisir une note */}
      {showNoteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowNoteModal(false)}>
          <div style={{ background: '#fff', borderRadius: 13, padding: 24, width: isMobile ? '95vw' : 420, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332' }}>📝 Saisir une note</div>
              <button onClick={() => setShowNoteModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); showToast('Note enregistrée ✓'); setShowNoteModal(false) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Élève</FieldLabel>
                <select style={inputStyle}>
                  <option>Adjoua Koné</option><option>Koffi Jean</option><option>Zannou Reine</option>
                  <option>Ahounou Théo</option><option>Pierre Dossou</option>
                </select>
              </div>
              <div>
                <FieldLabel>Matière</FieldLabel>
                <select style={inputStyle}>
                  <option>Français</option><option>Maths</option><option>EST</option><option>SVT</option>
                  <option>Éveil</option><option>Lg.Nat.</option><option>EPS</option><option>Dessin</option>
                </select>
              </div>
              <div>
                <FieldLabel>Type évaluation</FieldLabel>
                <select style={inputStyle}>
                  <option>Contrôle</option><option>Interrogation</option><option>Examen</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <FieldLabel>Note /20</FieldLabel>
                  <input type="number" min={0} max={20} step={0.25} defaultValue={14} style={inputStyle} />
                </div>
                <div>
                  <FieldLabel>Coef. éval</FieldLabel>
                  <input type="number" min={1} defaultValue={1} style={inputStyle} />
                </div>
              </div>
              <div>
                <FieldLabel>Date</FieldLabel>
                <input type="date" style={inputStyle} defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <FieldLabel>Appréciation</FieldLabel>
                <input type="text" placeholder="Commentaire facultatif" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowNoteModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 7, border: '1px solid #d1fae5', background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  💾 Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Appréciation IA */}
      {showIAModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowIAModal(false)}>
          <div style={{ background: '#fff', borderRadius: 13, padding: 24, width: isMobile ? '95vw' : 460 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332' }}>🤖 Appréciation IA</div>
              <button onClick={() => setShowIAModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ background: '#D8F3DC', borderRadius: 7, padding: '9px 13px', marginBottom: 14, fontSize: 12, color: '#1B4332', display: 'flex', gap: 8 }}>
              <span>ℹ️</span>
              <span>L'IA analysera les notes et générera une appréciation personnalisée pour cet élève.</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Élève</FieldLabel>
              <select style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }}>
                <option>Adjoua Koné</option><option>Koffi Jean</option><option>Brice Tchédo</option><option>Marie Houénou</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Appréciation générée</FieldLabel>
              <textarea rows={4} defaultValue={DEMO_BULLETINS[selectedBulletinEleve]?.apprec}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => showToast('Regénération...')}
                style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#F4A261', color: '#1B4332', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                🔄 Regénérer
              </button>
              <button onClick={() => setShowIAModal(false)}
                style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #d1fae5', background: 'transparent', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button onClick={() => { showToast('Appréciation validée ✓'); setShowIAModal(false) }}
                style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                ✅ Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: isMobile ? 80 : 24, right: 24, background: '#1B4332', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, boxShadow: '0 4px 14px rgba(27,67,50,0.3)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999 }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
        </div>
      )}
    </div>
  )
}
