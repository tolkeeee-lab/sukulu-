'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Payment = {
  id: string
  student_id: string
  amount: number
  status: 'paid' | 'partial' | 'unpaid'
  payment_method?: string | null
  paid_at?: string | null
  receipt_number?: string | null
  term?: number | null
  students?: {
    id: string
    first_name: string
    last_name: string
    matricule: string
    classes?: { id: string; name: string } | null
  } | null
}

type StaffMember = {
  id: string
  full_name: string
  role: string
  salary?: number | null
  salary_paid?: boolean | null
}

type BudgetLine = {
  id: string
  category: string
  planned: number
  actual: number
  type: 'expense' | 'revenue'
  color?: string
}

interface Props {
  schoolId: string
  schoolYear: string
  payments: Payment[]
  staff: StaffMember[]
  budgetLines: BudgetLine[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return String(n)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function getColor(str: string): string {
  const colors = ['#1B4332', '#40916C', '#1e40af', '#7c3aed', '#be185d', '#d97706', '#065f46']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    enseignant: 'Enseignant',
    admin: 'Administration',
    directeur: 'Directeur',
    comptable: 'Comptable',
  }
  return map[role] ?? role
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'paid' | 'partial' | 'unpaid' | string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: '#D8F3DC', color: '#1B4332', label: '✅ Payé' },
    partial: { bg: '#fef3c7', color: '#d97706', label: '⏳ Partiel' },
    unpaid:  { bg: '#fee2e2', color: '#dc2626', label: '🔴 Impayé' },
  }
  const s = map[status] ?? map.unpaid
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 600,
      padding: '2px 8px', borderRadius: 999,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function KpiCard({
  icon, label, value, sub, color = '#1B4332', bg = '#D8F3DC',
}: {
  icon: string; label: string; value: string; sub?: string; color?: string; bg?: string
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
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
      {sub && <div style={{ fontSize: 11, color: '#6b7280' }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ pct, color = '#40916C' }: { pct: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 999, height: 6, overflow: 'hidden', flex: 1 }}>
      <div style={{ background: color, width: `${clamped}%`, height: '100%', borderRadius: 999, transition: 'width 0.4s' }} />
    </div>
  )
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const color = getColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancesClient({ schoolId, schoolYear, payments: initPayments, staff: initStaff, budgetLines }: Props) {
  const isMobile = useIsMobile()

  // ── State ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'dashboard' | 'frais' | 'salaires' | 'budget' | 'recus'>('dashboard')
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1)
  const [searchFrais, setSearchFrais] = useState('')
  const [searchRecus, setSearchRecus] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [modalOuvert, setModalOuvert] = useState<string | null>(null) // 'paiement-{id}' | 'budget' | null
  const [payments, setPayments] = useState<Payment[]>(initPayments)
  const [staff, setStaff] = useState<StaffMember[]>(initStaff)

  // Modal paiement state
  const [modalStudentId, setModalStudentId] = useState<string>('')
  const [modalAmount, setModalAmount] = useState<string>('')
  const [modalMethod, setModalMethod] = useState<string>('especes')
  const [modalRef, setModalRef] = useState<string>('')
  const [modalLoading, setModalLoading] = useState(false)

  // Toast timer
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Computed: Frais scolaires ────────────────────────────────────────────────
  // Default annual fee per student — should ideally come from school configuration
  const FRAIS_ANNUEL = 150_000
  const FRAIS_TRIM = Math.round(FRAIS_ANNUEL / 3)

  // All students from payments
  const allStudents = useMemo(() => {
    const map = new Map<string, NonNullable<Payment['students']>>()
    for (const p of payments) {
      if (p.students && !map.has(p.students.id)) {
        map.set(p.students.id, p.students)
      }
    }
    return Array.from(map.values())
  }, [payments])

  // Per-student payment aggregation for selected term
  type StudentRow = {
    student: NonNullable<Payment['students']>
    totalDu: number
    totalPaye: number
    reste: number
    pct: number
    status: 'paid' | 'partial' | 'unpaid'
    dernierPaiement: string | null
    receiptNumber: string | null
    paymentId: string | null
  }

  const studentRows = useMemo((): StudentRow[] => {
    return allStudents.map(student => {
      const termPayments = payments.filter(p => p.student_id === student.id && (p.term ?? 1) === selectedTerm)
      const totalPaye = termPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
      const totalDu = FRAIS_TRIM
      const reste = Math.max(0, totalDu - totalPaye)
      const pct = totalDu > 0 ? Math.min(100, Math.round((totalPaye / totalDu) * 100)) : 0

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid'
      if (totalPaye >= totalDu) status = 'paid'
      else if (totalPaye > 0) status = 'partial'

      const sorted = [...termPayments].sort((a, b) =>
        new Date(b.paid_at ?? 0).getTime() - new Date(a.paid_at ?? 0).getTime()
      )
      const last = sorted[0]

      return {
        student,
        totalDu,
        totalPaye,
        reste,
        pct,
        status,
        dernierPaiement: last?.paid_at ?? null,
        receiptNumber: last?.receipt_number ?? null,
        paymentId: last?.id ?? null,
      }
    })
  }, [allStudents, payments, selectedTerm, FRAIS_TRIM])

  const filteredRows = useMemo(() => {
    if (!searchFrais) return studentRows
    const q = searchFrais.toLowerCase()
    return studentRows.filter(r =>
      `${r.student.first_name} ${r.student.last_name}`.toLowerCase().includes(q) ||
      (r.student.classes?.name ?? '').toLowerCase().includes(q) ||
      r.student.matricule.toLowerCase().includes(q)
    )
  }, [studentRows, searchFrais])

  // ── Computed: KPI Dashboard ──────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalCollecte = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
    const totalDu = allStudents.length * FRAIS_ANNUEL
    const taux = totalDu > 0 ? Math.round((totalCollecte / totalDu) * 100) : 0
    const impayes = studentRows.filter(r => r.status === 'unpaid').reduce((s, r) => s + r.reste, 0)
    const masseSalariale = staff.reduce((s, m) => s + (m.salary ?? 0), 0)
    const excedent = totalCollecte - masseSalariale
    return { totalCollecte, taux, impayes, masseSalariale, excedent }
  }, [payments, allStudents, FRAIS_ANNUEL, studentRows, staff])

  // Top 5 débiteurs
  const top5Debiteurs = useMemo(() =>
    [...studentRows]
      .filter(r => r.reste > 0)
      .sort((a, b) => b.reste - a.reste)
      .slice(0, 5),
    [studentRows]
  )

  // Trend: encaissements par mois (6 derniers mois)
  const trendData = useMemo(() => {
    const now = new Date()
    const months: { label: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      const total = payments
        .filter(p => {
          if (!p.paid_at) return false
          const pd = new Date(p.paid_at)
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
        })
        .reduce((s, p) => s + (p.amount ?? 0), 0)
      months.push({ label, total })
    }
    return months
  }, [payments])

  const maxTrend = useMemo(() => Math.max(...trendData.map(d => d.total), 1), [trendData])

  // Alertes: élèves avec aucun paiement pour le trimestre courant
  const alertes = useMemo(() =>
    studentRows.filter(r => r.status === 'unpaid').slice(0, 5),
    [studentRows]
  )

  // ── Computed: Salaires ───────────────────────────────────────────────────────
  const enseignants = useMemo(() => staff.filter(m => m.role === 'enseignant'), [staff])
  const adminStaff = useMemo(() => staff.filter(m => m.role !== 'enseignant'), [staff])
  const masseSalariale = useMemo(() => staff.reduce((s, m) => s + (m.salary ?? 0), 0), [staff])
  const salairesPaies = useMemo(() => staff.filter(m => m.salary_paid).reduce((s, m) => s + (m.salary ?? 0), 0), [staff])

  // ── Computed: Budget ─────────────────────────────────────────────────────────
  const expenses = useMemo(() => budgetLines.filter(b => b.type === 'expense'), [budgetLines])
  const revenues = useMemo(() => budgetLines.filter(b => b.type === 'revenue'), [budgetLines])
  const totalRevenuPrevu = useMemo(() => revenues.reduce((s, b) => s + b.planned, 0), [revenues])
  const totalRevenuRealise = useMemo(() => revenues.reduce((s, b) => s + b.actual, 0), [revenues])
  const totalDepenseRealise = useMemo(() => expenses.reduce((s, b) => s + b.actual, 0), [expenses])
  const excedentBudget = totalRevenuRealise - totalDepenseRealise

  // ── Computed: Reçus ───────────────────────────────────────────────────────────
  const reçus = useMemo(() => {
    const list = payments
      .filter(p => p.receipt_number && p.paid_at)
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())

    if (!searchRecus) return list
    const q = searchRecus.toLowerCase()
    return list.filter(p => {
      const nom = p.students ? `${p.students.first_name} ${p.students.last_name}` : ''
      return nom.toLowerCase().includes(q) || (p.receipt_number ?? '').toLowerCase().includes(q)
    })
  }, [payments, searchRecus])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleEnregistrerPaiement() {
    if (!modalStudentId || !modalAmount) {
      showToast('❌ Veuillez remplir tous les champs')
      return
    }
    const amount = parseFloat(modalAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('❌ Montant invalide')
      return
    }
    setModalLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: modalStudentId,
          amount,
          payment_method: modalMethod,
          reference: modalRef || undefined,
          term: selectedTerm,
        }),
      })
      if (res.ok) {
        const { payment } = await res.json() as { payment: Payment; newTotal: number }
        setPayments(prev => [...prev, payment])
        showToast('✅ Paiement enregistré')
        setModalOuvert(null)
        setModalAmount('')
        setModalRef('')
      } else {
        const err = await res.json().catch(() => ({ error: '' })) as { error?: string }
        showToast(`❌ ${err.error || 'Erreur'}`)
      }
    } finally {
      setModalLoading(false)
    }
  }

  async function handleVirementSalaire(staffId: string) {
    const res = await fetch(`/api/salary?id=${staffId}`, { method: 'PATCH' })
    if (res.ok) {
      setStaff(prev => prev.map(m => m.id === staffId ? { ...m, salary_paid: true } : m))
      showToast('✅ Salaire viré avec succès')
    } else {
      showToast('❌ Erreur lors du virement')
    }
  }

  // ── Style helpers ─────────────────────────────────────────────────────────────
  const tabStyle = (t: typeof activeTab): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: isMobile ? '6px 10px' : '7px 14px',
    borderRadius: 999,
    fontSize: isMobile ? 11 : 12,
    fontWeight: 600, cursor: 'pointer',
    border: activeTab === t ? '1px solid #d1fae5' : '1px solid transparent',
    background: activeTab === t ? '#fff' : 'transparent',
    color: activeTab === t ? '#1B4332' : '#6b7280',
    boxShadow: activeTab === t ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: '1px solid',
    background: active ? '#1B4332' : '#fff',
    color: active ? '#fff' : '#1B4332',
    borderColor: active ? '#1B4332' : '#d1fae5',
  })

  const inputStyle: React.CSSProperties = {
    padding: '8px 11px', border: '1.5px solid #d1fae5',
    borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
    background: '#fff', color: '#0d1f16', outline: 'none', width: '100%',
    boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: '#1B4332', color: '#fff', border: 'none', cursor: 'pointer',
  }

  const btnOutline: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 500,
    background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer',
  }

  const th: React.CSSProperties = {
    padding: '8px 10px', fontSize: 10, fontWeight: 600,
    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f3f4f6', borderBottom: '1px solid #e5e7eb',
    textAlign: 'left', whiteSpace: 'nowrap',
  }

  const td: React.CSSProperties = {
    padding: '9px 10px', borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle', fontSize: 12,
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", color: '#0d1f16', paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1B4332', margin: 0,
          }}>
            💰 Finances
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            Gestion financière · Année {schoolYear}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: isMobile ? '4px 6px' : '6px 8px',
        background: '#f0faf3', borderRadius: 12, border: '1px solid #d1fae5',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {([
          ['dashboard', '📊', 'Dashboard'],
          ['frais', '💳', 'Frais scolaires'],
          ['salaires', '👥', 'Salaires'],
          ['budget', '📋', 'Budget'],
          ['recus', '🧾', 'Reçus'],
        ] as const).map(([t, icon, label]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: DASHBOARD
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div>
          {/* KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
            gap: 12, marginBottom: 20,
          }}>
            <KpiCard
              icon="💵" label="Total collecté" bg="#D8F3DC" color="#1B4332"
              value={fmtShort(kpi.totalCollecte)}
              sub={fmt(kpi.totalCollecte)}
            />
            <KpiCard
              icon="📈" label="Taux recouvrement" bg="#dbeafe" color="#1e40af"
              value={`${kpi.taux}%`}
              sub={`${allStudents.length} élève(s)`}
            />
            <KpiCard
              icon="⚠️" label="Impayés" bg="#fee2e2" color="#dc2626"
              value={fmtShort(kpi.impayes)}
              sub={fmt(kpi.impayes)}
            />
            <KpiCard
              icon="👥" label="Masse salariale" bg="#fef3c7" color="#d97706"
              value={fmtShort(kpi.masseSalariale)}
              sub={fmt(kpi.masseSalariale)}
            />
            <KpiCard
              icon={kpi.excedent >= 0 ? '✅' : '🔴'}
              label="Excédent/Déficit"
              bg={kpi.excedent >= 0 ? '#D8F3DC' : '#fee2e2'}
              color={kpi.excedent >= 0 ? '#1B4332' : '#dc2626'}
              value={fmtShort(Math.abs(kpi.excedent))}
              sub={kpi.excedent >= 0 ? 'Bénéficiaire' : 'Déficitaire'}
            />
          </div>

          {/* Tendance + Débiteurs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 14, marginBottom: 20,
          }}>
            {/* Graphique tendance */}
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
                📈 Encaissements / 6 mois
              </div>
              {trendData.every(d => d.total === 0) ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '24px 0' }}>
                  Aucun paiement enregistré
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {trendData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 9, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                        {d.total > 0 ? fmtShort(d.total) : ''}
                      </div>
                      <div style={{
                        width: '100%', background: '#1B4332',
                        borderRadius: '3px 3px 0 0', opacity: 0.8,
                        height: maxTrend > 0 ? `${Math.max(4, Math.round((d.total / maxTrend) * 80))}px` : '4px',
                      }} />
                      <div style={{ fontSize: 9, color: '#6b7280' }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 débiteurs */}
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 12 }}>
                🔴 Top 5 impayés
              </div>
              {top5Debiteurs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '24px 0' }}>
                  ✅ Tous les élèves sont à jour
                </div>
              ) : (
                top5Debiteurs.map((r, i) => (
                  <div key={r.student.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 0', borderBottom: i < top5Debiteurs.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <Avatar name={`${r.student.first_name} ${r.student.last_name}`} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1f16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.student.first_name} {r.student.last_name}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{r.student.classes?.name ?? '—'}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                      {fmt(r.reste)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alertes */}
          {alertes.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 10 }}>
                ⚠️ Alertes — Élèves sans paiement ce trimestre
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {alertes.map(r => (
                  <span key={r.student.id} style={{
                    background: '#fee2e2', color: '#dc2626',
                    fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 999,
                  }}>
                    🔴 {r.student.first_name} {r.student.last_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: FRAIS SCOLAIRES
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'frais' && (
        <div>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 10, marginBottom: 14,
          }}>
            {/* Trimestre pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {([1, 2, 3] as const).map(t => (
                <button key={t} style={pill(selectedTerm === t)} onClick={() => setSelectedTerm(t)}>
                  {t === 1 ? '1er' : `${t}e`} trim.
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              style={{ ...inputStyle, maxWidth: isMobile ? '100%' : 240 }}
              placeholder="🔍 Rechercher nom, classe..."
              value={searchFrais}
              onChange={e => setSearchFrais(e.target.value)}
            />
          </div>

          {/* Table / Cards */}
          {allStudents.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
              padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13,
            }}>
              Aucun élève avec données de paiement
            </div>
          ) : isMobile ? (
            // ── MOBILE: Cards ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredRows.map(r => (
                <div key={r.student.id} style={{
                  background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar name={`${r.student.first_name} ${r.student.last_name}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1f16' }}>
                        {r.student.first_name} {r.student.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{r.student.classes?.name ?? '—'}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      ['Total dû', fmt(r.totalDu)],
                      ['Payé', fmt(r.totalPaye)],
                      ['Reste', fmt(r.reste)],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#f9fafb', borderRadius: 6, padding: '6px 8px' }}>
                        <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0d1f16', fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <ProgressBar pct={r.pct} color={r.status === 'paid' ? '#40916C' : r.status === 'partial' ? '#d97706' : '#dc2626'} />
                    <span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace' " }}>{r.pct}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...btnPrimary, flex: 1 }} onClick={() => {
                      setModalStudentId(r.student.id)
                      setModalOuvert(`paiement-${r.student.id}`)
                    }}>
                      + Payer
                    </button>
                    <button style={{ ...btnOutline, flex: 1 }} onClick={() => showToast('📩 Relance envoyée')}>📩</button>
                    <button style={{ ...btnOutline, flex: 1 }} onClick={() => showToast('🧾 Reçu affiché')}>🧾</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── DESKTOP: Table ──
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Élève', 'Classe', 'Total dû', 'Payé', 'Reste', 'Progression', 'Statut', 'Dernier paiement', 'Actions'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={r.student.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={`${r.student.first_name} ${r.student.last_name}`} size={28} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.student.first_name} {r.student.last_name}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>{r.student.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td style={td}>{r.student.classes?.name ?? '—'}</td>
                        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(r.totalDu)}</td>
                        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", color: '#1B4332', fontWeight: 600 }}>{fmt(r.totalPaye)}</td>
                        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", color: r.reste > 0 ? '#dc2626' : '#1B4332', fontWeight: 600 }}>{fmt(r.reste)}</td>
                        <td style={{ ...td, minWidth: 100 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ProgressBar pct={r.pct} color={r.status === 'paid' ? '#40916C' : r.status === 'partial' ? '#d97706' : '#dc2626'} />
                            <span style={{ fontSize: 10, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>{r.pct}%</span>
                          </div>
                        </td>
                        <td style={td}><StatusBadge status={r.status} /></td>
                        <td style={{ ...td, fontSize: 11, color: '#6b7280' }}>
                          {r.dernierPaiement
                            ? new Date(r.dernierPaiement).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button style={btnPrimary} onClick={() => {
                              setModalStudentId(r.student.id)
                              setModalOuvert(`paiement-${r.student.id}`)
                            }}>
                              + Payer
                            </button>
                            <button style={btnOutline} onClick={() => showToast('📩 Relance envoyée')}>📩</button>
                            <button style={btnOutline} onClick={() => showToast('🧾 Reçu généré')}>🧾</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compteurs */}
          <div style={{
            display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Payés', count: studentRows.filter(r => r.status === 'paid').length, color: '#1B4332', bg: '#D8F3DC' },
              { label: 'Partiels', count: studentRows.filter(r => r.status === 'partial').length, color: '#d97706', bg: '#fef3c7' },
              { label: 'Impayés', count: studentRows.filter(r => r.status === 'unpaid').length, color: '#dc2626', bg: '#fee2e2' },
            ].map(({ label, count, color, bg }) => (
              <span key={label} style={{
                background: bg, color, fontSize: 11, fontWeight: 600,
                padding: '4px 12px', borderRadius: 999,
              }}>
                {count} {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: SALAIRES
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'salaires' && (
        <div>
          {/* Résumé */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: 12, marginBottom: 20,
          }}>
            <KpiCard icon="👥" label="Masse salariale" bg="#fef3c7" color="#d97706"
              value={fmtShort(masseSalariale)} sub={fmt(masseSalariale)} />
            <KpiCard icon="✅" label="Salaires versés" bg="#D8F3DC" color="#1B4332"
              value={fmtShort(salairesPaies)} sub={`${staff.filter(m => m.salary_paid).length} personne(s)`} />
            <KpiCard icon="⏳" label="En attente" bg="#fee2e2" color="#dc2626"
              value={fmtShort(masseSalariale - salairesPaies)}
              sub={`${staff.filter(m => !m.salary_paid).length} personne(s)`} />
          </div>

          {/* Enseignants */}
          {enseignants.length > 0 && (
            <StaffSection
              title="📚 Enseignants"
              members={enseignants}
              onVirer={handleVirementSalaire}
              onFiche={(id) => showToast('📄 Fiche de paie générée')}
              isMobile={isMobile}
              td={td}
              th={th}
              btnPrimary={btnPrimary}
              btnOutline={btnOutline}
            />
          )}

          {/* Personnel admin */}
          {adminStaff.length > 0 && (
            <StaffSection
              title="🏢 Personnel administratif"
              members={adminStaff}
              onVirer={handleVirementSalaire}
              onFiche={(id) => showToast('📄 Fiche de paie générée')}
              isMobile={isMobile}
              td={td}
              th={th}
              btnPrimary={btnPrimary}
              btnOutline={btnOutline}
            />
          )}

          {staff.length === 0 && (
            <div style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
              padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13,
            }}>
              Aucun membre du personnel enregistré
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: BUDGET
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'budget' && (
        <div>
          {/* Synthèse 4 blocs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12, marginBottom: 20,
          }}>
            <KpiCard icon="📋" label="Recettes prévues" bg="#dbeafe" color="#1e40af"
              value={fmtShort(totalRevenuPrevu)} sub={fmt(totalRevenuPrevu)} />
            <KpiCard icon="💵" label="Recettes réalisées" bg="#D8F3DC" color="#1B4332"
              value={fmtShort(totalRevenuRealise)} sub={fmt(totalRevenuRealise)} />
            <KpiCard icon="💸" label="Dépenses réalisées" bg="#fef3c7" color="#d97706"
              value={fmtShort(totalDepenseRealise)} sub={fmt(totalDepenseRealise)} />
            <KpiCard
              icon={excedentBudget >= 0 ? '✅' : '🔴'}
              label="Excédent/Déficit"
              bg={excedentBudget >= 0 ? '#D8F3DC' : '#fee2e2'}
              color={excedentBudget >= 0 ? '#1B4332' : '#dc2626'}
              value={fmtShort(Math.abs(excedentBudget))}
              sub={excedentBudget >= 0 ? 'Excédent' : 'Déficit'}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 14,
          }}>
            {/* Dépenses */}
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>💸 Dépenses</div>
                <button style={btnOutline} onClick={() => setModalOuvert('budget')}>Modifier budget</button>
              </div>
              {expenses.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Aucune ligne budgétaire
                </div>
              ) : (
                expenses.map(b => (
                  <BudgetRow key={b.id} line={b} />
                ))
              )}
            </div>

            {/* Recettes */}
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>💵 Recettes</div>
              {revenues.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Aucune ligne budgétaire
                </div>
              ) : (
                revenues.map(b => (
                  <BudgetRow key={b.id} line={b} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: REÇUS
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'recus' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <input
              style={{ ...inputStyle, maxWidth: isMobile ? '100%' : 280 }}
              placeholder="🔍 Rechercher par nom ou référence..."
              value={searchRecus}
              onChange={e => setSearchRecus(e.target.value)}
            />
          </div>

          {reçus.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
              padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13,
            }}>
              Aucun reçu généré
            </div>
          ) : isMobile ? (
            // ── MOBILE: Cards ──
            <div>
              {reçus.map(p => (
                <div key={p.id} style={{
                  background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
                  padding: 12, marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: '#D8F3DC', color: '#1B4332',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>
                      🧾
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1f16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.students ? `${p.students.first_name} ${p.students.last_name}` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {p.students?.classes?.name ?? '—'} · Trimestre {p.term ?? 1}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#1B4332',
                      fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
                    }}>
                      {fmt(p.amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11, color: '#6b7280', background: '#f3f4f6',
                      padding: '2px 8px', borderRadius: 5,
                    }}>
                      {p.receipt_number}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...btnOutline, flex: 1 }} onClick={() => showToast('🖨️ Impression lancée')}>🖨️ Imprimer</button>
                    <button style={{ ...btnOutline, flex: 1 }} onClick={() => showToast('📧 Reçu envoyé par e-mail')}>📧 E-mail</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── DESKTOP: List ──
            <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden' }}>
              {reçus.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < reçus.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#D8F3DC', color: '#1B4332',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    🧾
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1f16' }}>
                      {p.students ? `${p.students.first_name} ${p.students.last_name}` : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                      {p.students?.classes?.name ?? '—'} · Trimestre {p.term ?? 1}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, color: '#6b7280', background: '#f3f4f6',
                    padding: '2px 8px', borderRadius: 5, whiteSpace: 'nowrap',
                  }}>
                    {p.receipt_number}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#1B4332',
                    fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
                  }}>
                    {fmt(p.amount)}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button style={btnOutline} onClick={() => showToast('🖨️ Impression lancée')}>🖨️</button>
                    <button style={btnOutline} onClick={() => showToast('📧 Reçu envoyé par e-mail')}>📧</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: PAIEMENT
         ══════════════════════════════════════════════════════════════ */}
      {modalOuvert?.startsWith('paiement') && (
        <Modal onClose={() => setModalOuvert(null)} title="💳 Enregistrer un paiement" isMobile={isMobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                Montant (FCFA)
              </label>
              <input
                style={inputStyle}
                type="number"
                placeholder="Ex: 50000"
                value={modalAmount}
                onChange={e => setModalAmount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                Méthode de paiement
              </label>
              <select
                style={{ ...inputStyle }}
                value={modalMethod}
                onChange={e => setModalMethod(e.target.value)}
              >
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement bancaire</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                Référence (optionnel)
              </label>
              <input
                style={inputStyle}
                placeholder="Ex: TXN-12345"
                value={modalRef}
                onChange={e => setModalRef(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={btnOutline} onClick={() => setModalOuvert(null)}>Annuler</button>
              <button style={{ ...btnPrimary, opacity: modalLoading ? 0.7 : 1 }}
                onClick={handleEnregistrerPaiement}
                disabled={modalLoading}
              >
                {modalLoading ? '⏳ Enregistrement...' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: BUDGET
         ══════════════════════════════════════════════════════════════ */}
      {modalOuvert === 'budget' && (
        <Modal onClose={() => setModalOuvert(null)} title="📋 Modifier le budget" isMobile={isMobile}>
          <div style={{ color: '#6b7280', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
            La modification du budget se fait depuis le tableau de bord administratif Supabase.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnOutline} onClick={() => setModalOuvert(null)}>Fermer</button>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TOAST
         ══════════════════════════════════════════════════════════════ */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1B4332', color: '#fff',
          fontSize: 12, fontWeight: 500,
          padding: '10px 16px', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(27,67,50,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ children, onClose, title, isMobile = false }: { children: React.ReactNode; onClose: () => void; title: string; isMobile?: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 22,
        width: isMobile ? '95vw' : 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif" }}>
            {title}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#9ca3af', lineHeight: 1,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Staff section ────────────────────────────────────────────────────────────

function StaffSection({
  title, members, onVirer, onFiche, isMobile, td, th, btnPrimary, btnOutline,
}: {
  title: string
  members: StaffMember[]
  onVirer: (id: string) => void
  onFiche: (id: string) => void
  isMobile: boolean
  td: React.CSSProperties
  th: React.CSSProperties
  btnPrimary: React.CSSProperties
  btnOutline: React.CSSProperties
}) {
  if (isMobile) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 10 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => (
            <div key={m.id} style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar name={m.full_name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1f16' }}>{m.full_name}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>{getRoleLabel(m.role)}</div>
                </div>
                <span style={{
                  background: m.salary_paid ? '#D8F3DC' : '#fef3c7',
                  color: m.salary_paid ? '#1B4332' : '#d97706',
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                }}>
                  {m.salary_paid ? '✅ Viré' : '⏳ En attente'}
                </span>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#1B4332',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 8,
              }}>
                {m.salary != null ? (m.salary.toLocaleString('fr-FR') + ' FCFA') : '—'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!m.salary_paid && (
                  <button style={{ ...btnPrimary, flex: 1 }} onClick={() => onVirer(m.id)}>💸 Virer</button>
                )}
                <button style={{ ...btnOutline, flex: 1 }} onClick={() => onFiche(m.id)}>📄 Fiche</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Personnel', 'Poste', 'Salaire', 'Statut', 'Actions'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={m.full_name} size={28} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{m.full_name}</span>
                </div>
              </td>
              <td style={{ ...td, fontSize: 11, color: '#6b7280' }}>{getRoleLabel(m.role)}</td>
              <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#1B4332' }}>
                {m.salary != null ? (m.salary.toLocaleString('fr-FR') + ' FCFA') : '—'}
              </td>
              <td style={td}>
                <span style={{
                  background: m.salary_paid ? '#D8F3DC' : '#fef3c7',
                  color: m.salary_paid ? '#1B4332' : '#d97706',
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                }}>
                  {m.salary_paid ? '✅ Viré' : '⏳ En attente'}
                </span>
              </td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {!m.salary_paid && (
                    <button style={btnPrimary} onClick={() => onVirer(m.id)}>💸 Virer</button>
                  )}
                  <button style={btnOutline} onClick={() => onFiche(m.id)}>📄 Fiche</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Budget row ───────────────────────────────────────────────────────────────

function BudgetRow({ line }: { line: BudgetLine }) {
  const pct = line.planned > 0 ? Math.min(100, Math.round((line.actual / line.planned) * 100)) : 0
  const color = line.color ?? (line.type === 'expense' ? '#d97706' : '#1B4332')

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#0d1f16' }}>{line.category}</span>
        <span style={{ fontSize: 11, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
          {line.actual.toLocaleString('fr-FR')} / {line.planned.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ProgressBar pct={pct} color={color} />
        <span style={{ fontSize: 10, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
          {pct}%
        </span>
      </div>
    </div>
  )
}
