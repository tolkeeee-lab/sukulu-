'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string
  full_name: string
  role: string
  salary: number | null
  salary_paid: boolean | null
  email: string | null
  phone: string | null
  created_at: string
}

type ClassData = {
  id: string
  name: string
  teacher_id: string | null
}

interface Props {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  staff: StaffMember[]
  classes: ClassData[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = [
  '#1B4332', '#40916C', '#1e40af', '#7c3aed',
  '#be185d', '#d97706', '#065f46', '#b45309',
]

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/)
  if (p.length >= 2) return ((p[0][0] ?? '') + (p[p.length - 1][0] ?? '')).toUpperCase()
  return (name[0] ?? '').toUpperCase()
}

function getRoleLabel(role: string): string {
  if (role === 'director') return 'Directeur'
  if (role === 'teacher') return 'Enseignant'
  if (role === 'accountant') return 'Comptable'
  if (role === 'admin') return 'Administrateur'
  return role
}

function getRoleBg(role: string): { bg: string; color: string } {
  if (role === 'director') return { bg: '#D8F3DC', color: '#1B4332' }
  if (role === 'teacher') return { bg: '#dbeafe', color: '#1e40af' }
  if (role === 'accountant') return { bg: '#ede9fe', color: '#7c3aed' }
  if (role === 'admin') return { bg: '#fff4ec', color: '#9a3412' }
  return { bg: '#f3f4f6', color: '#6b7280' }
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const bg = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {getInitials(name)}
    </div>
  )
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
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>&times;</button>
    </div>
  )
}

// ─── Staff Card (mobile) ───────────────────────────────────────────────────────

function StaffCard({
  member,
  teacherClass,
  onVirer,
  onFiche,
}: {
  member: StaffMember
  teacherClass: string | null
  onVirer: (id: string) => void
  onFiche: (id: string) => void
}) {
  const rc = getRoleBg(member.role)
  return (
    <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar name={member.full_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0d1f16', fontSize: 13 }}>{member.full_name}</div>
          <span style={{ background: rc.bg, color: rc.color, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
            {getRoleLabel(member.role)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1B4332' }}>
            {member.salary ? fmt(member.salary) : '\u2014'}
          </div>
          <div style={{
            fontSize: 10, borderRadius: 8, padding: '2px 6px', display: 'inline-block', marginTop: 2,
            background: member.salary_paid ? '#D8F3DC' : '#fee2e2',
            color: member.salary_paid ? '#1B4332' : '#dc2626',
          }}>
            {member.salary_paid ? '\u2705 Pay\u00e9' : '\u23f3 En attente'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
        {member.email && <div>\u2709\ufe0f {member.email}</div>}
        {member.phone && <div>\ud83d\udcde {member.phone}</div>}
        {teacherClass && <div>\ud83c\udfeb Classe\u00a0: {teacherClass}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onFiche(member.id)}
          style={{ flex: 1, background: '#f0faf3', color: '#1B4332', border: '1px solid #d1fae5', borderRadius: 7, padding: '6px 0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
        >
          Fiche
        </button>
        {!member.salary_paid && member.salary && (
          <button
            onClick={() => onVirer(member.id)}
            style={{ flex: 1, background: '#1B4332', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            \ud83d\udcb0 Virer salaire
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

type TabId = 'overview' | 'enseignants' | 'admin' | 'ajouter'

export default function PersonnelClient({
  schoolId: _schoolId,
  schoolYear,
  schoolName,
  userId: _userId,
  userRole: _userRole,
  staff: initialStaff,
  classes,
}: Props) {
  const isMobile = useIsMobile()
  const [localStaff, setLocalStaff] = useState<StaffMember[]>(initialStaff)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [search, setSearch] = useState('')

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── Add modal ──
  const [addModal, setAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', role: 'teacher', email: '', phone: '', salary: '' })

  const handleAddStaff = useCallback(async () => {
    if (!form.full_name.trim()) return
    setAddLoading(true)
    const optimisticId = `opt-${Date.now()}`
    const optimistic: StaffMember = {
      id: optimisticId,
      full_name: form.full_name.trim(),
      role: form.role,
      email: form.email || null,
      phone: form.phone || null,
      salary: form.salary ? Number(form.salary) : null,
      salary_paid: null,
      created_at: new Date().toISOString(),
    }
    setLocalStaff(prev => [...prev, optimistic])
    setAddModal(false)
    try {
      const res = await fetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          role: form.role,
          email: form.email || null,
          phone: form.phone || null,
          salary: form.salary ? Number(form.salary) : null,
        }),
      })
      const json = await res.json() as { staff?: StaffMember; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setLocalStaff(prev => prev.map(s => s.id === optimisticId ? json.staff! : s))
      showToast('\u2705 Membre ajout\u00e9')
      setForm({ full_name: '', role: 'teacher', email: '', phone: '', salary: '' })
    } catch (err) {
      setLocalStaff(prev => prev.filter(s => s.id !== optimisticId))
      showToast(`\u274c ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setAddLoading(false)
    }
  }, [form, showToast])

  // ── Virer salaire ──
  const handleVirerSalaire = useCallback(async (staffId: string) => {
    setLocalStaff(prev => prev.map(s => s.id === staffId ? { ...s, salary_paid: true } : s))
    try {
      const res = await fetch(`/api/salary?id=${encodeURIComponent(staffId)}`, { method: 'PATCH' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Erreur serveur')
      }
      showToast('\u2705 Salaire vir\u00e9')
    } catch (err) {
      setLocalStaff(prev => prev.map(s => s.id === staffId ? { ...s, salary_paid: false } : s))
      showToast(`\u274c ${err instanceof Error ? err.message : 'Erreur'}`)
    }
  }, [showToast])

  // ── Fiche modal ──
  const [ficheModal, setFicheModal] = useState<StaffMember | null>(null)

  // ── Derived data ──
  const teacherClasses = useMemo(() => {
    const map = new Map<string, string>()
    for (const cls of classes) {
      if (cls.teacher_id) map.set(cls.teacher_id, cls.name)
    }
    return map
  }, [classes])

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase()
    return localStaff.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      getRoleLabel(s.role).toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  }, [localStaff, search])

  const enseignants = useMemo(() => filteredStaff.filter(s => s.role === 'teacher'), [filteredStaff])
  const adminStaff = useMemo(() => filteredStaff.filter(s => ['director', 'admin', 'accountant'].includes(s.role)), [filteredStaff])

  const stats = useMemo(() => {
    const total = localStaff.length
    const nTeachers = localStaff.filter(s => s.role === 'teacher').length
    const nAdmin = localStaff.filter(s => ['director', 'admin', 'accountant'].includes(s.role)).length
    const masseSalariale = localStaff.reduce((sum, s) => sum + (s.salary ?? 0), 0)
    const salairesPaies = localStaff.filter(s => s.salary_paid).reduce((sum, s) => sum + (s.salary ?? 0), 0)
    return { total, nTeachers, nAdmin, masseSalariale, salairesPaies }
  }, [localStaff])

  // ── Styles ──
  const TABS: { id: TabId; label: string }[] = [
    { id: 'overview', label: '\ud83d\udccb Vue d\u2019ensemble' },
    { id: 'enseignants', label: '\ud83d\udc68\u200d\ud83c\udfeb Enseignants' },
    { id: 'admin', label: '\ud83c\udfe2 Administration' },
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

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid #d1fae5', borderRadius: 7, padding: '8px 12px',
    fontSize: 13, width: '100%', background: '#fff', boxSizing: 'border-box', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
  const fieldStyle: React.CSSProperties = { marginBottom: 14 }

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  }
  const td = (i: number): React.CSSProperties => ({
    padding: '10px 14px', fontSize: 13, color: '#374151',
    borderBottom: '1px solid #f0faf3',
    background: i % 2 === 0 ? '#fff' : '#fafafa',
  })

  // Staff table (desktop)
  const StaffTable = ({ members }: { members: StaffMember[] }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Personnel', 'Poste', 'Email', 'T\u00e9l\u00e9phone', 'Salaire', 'Statut', 'Actions'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => {
            const rc = getRoleBg(m.role)
            const cls = teacherClasses.get(m.id)
            return (
              <tr key={m.id}>
                <td style={td(i)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={m.full_name} size={30} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.full_name}</div>
                      {cls && <div style={{ fontSize: 10, color: '#6b7280' }}>Classe\u00a0: {cls}</div>}
                    </div>
                  </div>
                </td>
                <td style={td(i)}>
                  <span style={{ background: rc.bg, color: rc.color, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                    {getRoleLabel(m.role)}
                  </span>
                </td>
                <td style={{ ...td(i), fontSize: 12 }}>{m.email ?? '\u2014'}</td>
                <td style={{ ...td(i), fontSize: 12 }}>{m.phone ?? '\u2014'}</td>
                <td style={{ ...td(i), fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  {m.salary ? fmt(m.salary) : '\u2014'}
                </td>
                <td style={td(i)}>
                  <span style={{
                    background: m.salary_paid ? '#D8F3DC' : '#fee2e2',
                    color: m.salary_paid ? '#1B4332' : '#dc2626',
                    borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>
                    {m.salary_paid ? '\u2705 Pay\u00e9' : '\u23f3 En attente'}
                  </span>
                </td>
                <td style={td(i)}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setFicheModal(m)}
                      style={{ background: '#f0faf3', color: '#1B4332', border: '1px solid #d1fae5', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Fiche
                    </button>
                    {!m.salary_paid && m.salary && (
                      <button
                        onClick={() => handleVirerSalaire(m.id)}
                        style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                      >
                        \ud83d\udcb0
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  // Staff list section (handles both mobile cards and desktop table)
  const StaffSection = ({ members }: { members: StaffMember[] }) => {
    if (members.length === 0) {
      return (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Aucun r\u00e9sultat
        </div>
      )
    }
    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map(m => (
            <StaffCard
              key={m.id}
              member={m}
              teacherClass={teacherClasses.get(m.id) ?? null}
              onVirer={handleVirerSalaire}
              onFiche={id => setFicheModal(members.find(s => s.id === id) ?? null)}
            />
          ))}
        </div>
      )
    }
    return <StaffTable members={members} />
  }

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
            \ud83d\udc65 Personnel
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            {schoolName} \u00b7 Ann\u00e9e {schoolYear}
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          style={{
            background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}
        >
          \u2795 Ajouter
        </button>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {([
          { icon: '\ud83d\udc65', label: 'Total personnel', value: stats.total, bg: '#D8F3DC', color: '#1B4332' },
          { icon: '\ud83d\udc68\u200d\ud83c\udfeb', label: 'Enseignants', value: stats.nTeachers, bg: '#dbeafe', color: '#1e40af' },
          { icon: '\ud83c\udfe2', label: 'Administration', value: stats.nAdmin, bg: '#ede9fe', color: '#7c3aed' },
          { icon: '\ud83d\udcb0', label: 'Masse salariale', value: (stats.masseSalariale / 1000).toFixed(0) + 'k', bg: '#fef3c7', color: '#d97706' },
          { icon: '\u2705', label: 'Salaires pay\u00e9s', value: (stats.salairesPaies / 1000).toFixed(0) + 'k', bg: '#f0fdf4', color: '#166534' },
        ] as const).map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 16 : 20, fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: kpi.color, opacity: 0.8 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="\ud83d\udd0d Rechercher par nom, poste, email\u2026"
          style={{
            border: '1.5px solid #d1fae5', borderRadius: 8, padding: '8px 12px',
            fontSize: 13, width: '100%', background: '#fff', boxSizing: 'border-box', outline: 'none',
          }}
        />
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

      {/* ── Tab: Vue d'ensemble ── */}
      {activeTab === 'overview' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            Tout le personnel ({filteredStaff.length})
          </div>
          <StaffSection members={filteredStaff} />
        </div>
      )}

      {/* ── Tab: Enseignants ── */}
      {activeTab === 'enseignants' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            Enseignants ({enseignants.length})
          </div>
          {enseignants.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Aucun enseignant enregistr\u00e9
            </div>
          ) : (
            <StaffSection members={enseignants} />
          )}
        </div>
      )}

      {/* ── Tab: Administration ── */}
      {activeTab === 'admin' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            Administration ({adminStaff.length})
          </div>
          {adminStaff.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Aucun membre administratif enregistr\u00e9
            </div>
          ) : (
            <StaffSection members={adminStaff} />
          )}
        </div>
      )}

      {/* ── Tab: Ajouter ── */}
      {activeTab === 'ajouter' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: isMobile ? 16 : 24, maxWidth: 520 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', margin: '0 0 20px' }}>
            \u2795 Nouveau membre
          </h3>
          <div style={fieldStyle}>
            <label style={labelStyle}>Nom complet *</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="ex\u00a0: M. Dupont Jean" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>R\u00f4le *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
              <option value="teacher">Enseignant</option>
              <option value="director">Directeur</option>
              <option value="admin">Administrateur</option>
              <option value="accountant">Comptable</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ecole.bj" type="email" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>T\u00e9l\u00e9phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+229 97 00 00 00" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Salaire (FCFA)</label>
            <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="ex\u00a0: 150000" type="number" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              disabled={addLoading || !form.full_name.trim()}
              onClick={handleAddStaff}
              style={{
                background: addLoading || !form.full_name.trim() ? '#9ca3af' : '#1B4332',
                color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
                fontSize: 13, fontWeight: 600, cursor: addLoading || !form.full_name.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {addLoading ? 'Ajout\u2026' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Add modal (from header button) */}
      {addModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setAddModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: isMobile ? '95vw' : 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', margin: 0 }}>
                \u2795 Ajouter un membre
              </h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nom complet *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="ex\u00a0: M. Dupont Jean" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>R\u00f4le *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                <option value="teacher">Enseignant</option>
                <option value="director">Directeur</option>
                <option value="admin">Administrateur</option>
                <option value="accountant">Comptable</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ecole.bj" type="email" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>T\u00e9l\u00e9phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+229 97 00 00 00" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salaire (FCFA)</label>
              <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="ex\u00a0: 150000" type="number" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setAddModal(false)}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                disabled={addLoading || !form.full_name.trim()}
                onClick={handleAddStaff}
                style={{
                  background: addLoading || !form.full_name.trim() ? '#9ca3af' : '#1B4332',
                  color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
                  fontSize: 13, fontWeight: 600, cursor: addLoading || !form.full_name.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {addLoading ? 'Ajout\u2026' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fiche modal */}
      {ficheModal && (() => {
        const m = ficheModal
        const rc = getRoleBg(m.role)
        const cls = teacherClasses.get(m.id)
        const dateEmb = new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setFicheModal(null)}
          >
            <div
              style={{ background: '#fff', borderRadius: 14, padding: 24, width: isMobile ? '95vw' : 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <Avatar name={m.full_name} size={52} />
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#1B4332', margin: 0 }}>
                    {m.full_name}
                  </h3>
                  <span style={{ background: rc.bg, color: rc.color, borderRadius: 10, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {getRoleLabel(m.role)}
                  </span>
                </div>
                <button onClick={() => setFicheModal(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Email', value: m.email ?? '\u2014' },
                  { label: 'T\u00e9l\u00e9phone', value: m.phone ?? '\u2014' },
                  { label: 'Classe assign\u00e9e', value: cls ?? '\u2014' },
                  { label: "Date d'embauche", value: dateEmb },
                  { label: 'Salaire mensuel', value: m.salary ? fmt(m.salary) : '\u2014' },
                  { label: 'Statut salaire', value: m.salary_paid ? '\u2705 Pay\u00e9 ce mois' : '\u23f3 En attente' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0faf3' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{value}</span>
                  </div>
                ))}
              </div>
              {!m.salary_paid && m.salary && (
                <button
                  onClick={() => { handleVirerSalaire(m.id); setFicheModal(null) }}
                  style={{ marginTop: 16, width: '100%', background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  \ud83d\udcb0 Virer le salaire
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
