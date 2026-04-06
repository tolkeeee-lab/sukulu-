'use client'

import { useState, useMemo, useRef } from 'react'

// ── TYPES ──
interface Classe {
  id: string
  name: string
  level?: string | null
}

interface ParentProfile {
  id: string
  full_name: string
  phone?: string | null
}

interface Student {
  id: string
  matricule: string
  first_name: string
  last_name: string
  birth_date?: string | null
  photo_url?: string | null
  class_id?: string | null
  parent_id?: string | null
  is_archived?: boolean | null
  created_at: string
  classes?: Classe | null
  profiles?: ParentProfile | null
}

interface Payment {
  student_id: string
  status: string
  amount: number
  paid_at?: string | null
  payment_method?: string | null
  receipt_number?: string | null
}

interface Attendance {
  student_id: string
  status: string
  date?: string | null
  reason?: string | null
}

interface Props {
  schoolId: string
  schoolYear: string
  students: Student[]
  classes: Classe[]
  payments: Payment[]
  attendances: Attendance[]
  archivedStudents: Student[]
}

// ── CONSTANTES ──
const COLORS = [
  '#1B4332','#40916C','#1e40af','#7c3aed',
  '#be185d','#d97706','#065f46','#854d0e','#0e7490','#9a3412',
]
const PER_PAGE = 20

// ── UTILS ──
function getColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(first: string, last: string): string {
  return (first[0] ?? '').toUpperCase() + (last[0] ?? '').toUpperCase()
}

function getAge(birthDate?: string | null): number | null {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function getPaymentStatus(
  studentId: string,
  payments: Payment[]
): 'a_jour' | 'attente' | 'retard' {
  const sp = payments.filter(p => p.student_id === studentId)
  if (sp.length === 0) return 'attente'
  if (sp.some(p => p.status === 'overdue' || p.status === 'late')) return 'retard'
  if (sp.some(p => p.status === 'pending' || p.status === 'unpaid')) return 'attente'
  return 'a_jour'
}

function getAbsenceCount(studentId: string, attendances: Attendance[]): number {
  return attendances.filter(a => a.student_id === studentId && a.status === 'absent').length
}

// ── MINI-COMPOSANTS ──
function PaymentBadge({ status }: { status: 'a_jour' | 'attente' | 'retard' | string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    a_jour:  { bg: '#D8F3DC', color: '#1B4332', label: '✓ À jour' },
    attente: { bg: '#fef3c7', color: '#d97706', label: '⏳ Attente' },
    retard:  { bg: '#fee2e2', color: '#dc2626', label: '🔴 Retard' },
  }
  const st = map[status] ?? map.attente
  return (
    <span style={{
      background: st.bg, color: st.color,
      fontSize: 10, fontWeight: 500,
      padding: '2px 7px', borderRadius: 999,
    }}>
      {st.label}
    </span>
  )
}

function InfoField({ lbl, val }: { lbl: string; val: React.ReactNode }) {
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '8px 11px' }}>
      <div style={{
        fontSize: 10, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2,
      }}>
        {lbl}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1f16' }}>{val ?? '—'}</div>
    </div>
  )
}

// ── STYLES HELPERS ──
const css = {
  section: {
    background: '#ffffff',
    border: '1px solid #d1fae5',
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  } as React.CSSProperties,

  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 14px', borderBottom: '1px solid #d1fae5',
  } as React.CSSProperties,

  sectionTitre: {
    fontSize: 13, fontWeight: 600, color: '#1B4332',
  } as React.CSSProperties,

  th: {
    padding: '7px 10px', fontSize: 10, fontWeight: 600,
    color: '#6b7280', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', background: '#f3f4f6',
    borderBottom: '1px solid #d1fae5', textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  },

  td: {
    padding: '9px 10px', borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle' as const, fontSize: 12,
  },

  input: {
    padding: '8px 11px', border: '1.5px solid #e5e7eb',
    borderRadius: 7, fontSize: 12, fontFamily: 'inherit',
    width: '100%', background: '#fff', color: '#0d1f16',
  } as React.CSSProperties,

  select: {
    padding: '7px 10px', border: '1px solid #d1fae5',
    borderRadius: 7, fontSize: 12, fontFamily: 'inherit',
    background: '#fff', color: '#0d1f16',
  } as React.CSSProperties,

  formLabel: {
    fontSize: 11, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  },
}

function btn(
  variant: 'primary' | 'outline' | 'danger',
  size?: 'sm'
): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: size === 'sm' ? '4px 9px' : '7px 13px',
    borderRadius: 7,
    fontSize: size === 'sm' ? 11 : 12,
    border: variant === 'primary'
      ? 'none'
      : variant === 'danger'
        ? '1px solid #fca5a5'
        : '1px solid #d1fae5',
    cursor: 'pointer', fontFamily: 'inherit',
    background: variant === 'primary' ? '#1B4332'
      : variant === 'danger' ? '#fee2e2' : 'transparent',
    color: variant === 'primary' ? '#fff'
      : variant === 'danger' ? '#dc2626' : '#6b7280',
  }
}

function badge(color: string, bg: string): React.CSSProperties {
  return {
    display: 'inline-block', fontSize: 10, fontWeight: 500,
    padding: '2px 7px', borderRadius: 999,
    background: bg, color,
  }
}

// ══════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════
export default function ElevesClient({
  schoolId,
  schoolYear,
  students,
  classes,
  payments,
  attendances,
  archivedStudents,
}: Props) {

  // ── État ──
  const [onglet, setOnglet] = useState<'liste' | 'archives'>('liste')
  const [vue, setVue] = useState<'table' | 'cartes'>('table')
  const [search, setSearch] = useState('')
  const [filtreClasse, setFiltreClasse] = useState('')
  const [filtrePaiement, setFiltrePaiement] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalOuvert, setModalOuvert] = useState<string | null>(null)
  const [eleveDetail, setEleveDetail] = useState<Student | null>(null)
  const [detailTab, setDetailTab] = useState<'infos' | 'paiements' | 'absences'>('infos')
  const [toastMsg, setToastMsg] = useState('')
  const [form, setForm] = useState({ prenom: '', nom: '', ddn: '', sexe: '', classe: '', tel: '' })
  const [formErr, setFormErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Toast ──
  function showToast(msg: string) {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 3200)
  }

  // ── Modals ──
  function openModal(id: string) { setModalOuvert(id) }
  function closeModal() { setModalOuvert(null) }

  // ── Stats ──
  const nbAJour   = students.filter(s => getPaymentStatus(s.id, payments) === 'a_jour').length
  const nbAttente = students.filter(s => getPaymentStatus(s.id, payments) === 'attente').length
  const nbRetard  = students.filter(s => getPaymentStatus(s.id, payments) === 'retard').length

  // ── Filtrage ──
  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !search
        || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
        || s.matricule.toLowerCase().includes(q)
      const matchClasse = !filtreClasse || s.class_id === filtreClasse
      const matchPay = !filtrePaiement || getPaymentStatus(s.id, payments) === filtrePaiement
      return matchSearch && matchClasse && matchPay
    })
  }, [students, search, filtreClasse, filtrePaiement, payments])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Sélection ──
  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }
  function toggleAll() {
    setSelected(prev =>
      prev.size === pageData.length
        ? new Set()
        : new Set(pageData.map(s => s.id))
    )
  }

  // ── Actions ──
  function ouvrirDetail(s: Student) {
    setEleveDetail(s)
    setDetailTab('infos')
    openModal('detail')
  }

  async function archiverEleve(id: string) {
    await fetch('/api/students/archive', {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    })
    showToast('📦 Élève archivé !')
    closeModal()
  }

  async function soumettreAjout() {
    if (!form.prenom || !form.nom || !form.ddn || !form.sexe || !form.classe) {
      setFormErr('⚠️ Veuillez remplir tous les champs obligatoires.')
      return
    }
    setFormErr('')
    setSubmitting(true)
    const res = await fetch('/api/students/create', {
      method: 'POST',
      body: JSON.stringify({ ...form, school_id: schoolId, school_year: schoolYear }),
      headers: { 'Content-Type': 'application/json' },
    })
    setSubmitting(false)
    if (res.ok) {
      closeModal()
      showToast('✅ Élève ajouté ! La page va se rafraîchir.')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setFormErr("❌ Erreur lors de l'ajout.")
    }
  }

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: '#0d1f16' }}>

      {/* ── En-tête de page ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            Gestion des Élèves
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            {students.length} élèves actifs · Année scolaire {schoolYear}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn('outline')} onClick={() => showToast('📊 Export Excel généré !')}>
            ⬇ Exporter
          </button>
          <button style={btn('outline')} onClick={() => openModal('import')}>
            ⬆ Importer
          </button>
          <button style={btn('primary')} onClick={() => openModal('ajouter')}>
            + Ajouter un élève
          </button>
        </div>
      </div>

      {/* ── 5 Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { icon: '👦', val: students.length,       lbl: 'Total élèves',          color: '#1B4332', trend: 'Actifs',    up: true },
          { icon: '✅', val: nbAJour,                lbl: 'Paiements à jour',      color: '#1B4332', trend: `${students.length > 0 ? Math.round(nbAJour / students.length * 100) : 0}%`, up: true },
          { icon: '⏳', val: nbAttente,              lbl: 'En attente',            color: '#d97706', trend: 'À relancer', up: false },
          { icon: '🔴', val: nbRetard,               lbl: 'Paiement en retard',    color: '#dc2626', trend: 'Urgent',    up: false },
          { icon: '📦', val: archivedStudents.length, lbl: 'Archivés',             color: '#6b7280', trend: 'Archivés',  up: false },
        ].map((c, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #d1fae5',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 999, fontWeight: 500,
                background: c.up ? '#dcfce7' : '#f3f4f6',
                color: c.up ? '#166534' : '#6b7280',
              }}>
                {c.trend}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: c.color, marginBottom: 2 }}>
              {c.val}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div style={{
        display: 'flex', gap: 2, background: '#fff',
        border: '1px solid #d1fae5', borderRadius: 10,
        padding: 4, marginBottom: 14, width: 'fit-content',
      }}>
        {([
          { key: 'liste',    label: `📋 Élèves (${students.length})` },
          { key: 'archives', label: `📦 Archivés (${archivedStudents.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setOnglet(t.key)}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: onglet === t.key ? '#1B4332' : 'transparent',
              color:      onglet === t.key ? '#fff'    : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          ONGLET LISTE
      ══════════════════════════════════════ */}
      {onglet === 'liste' && (
        <>
          {/* Alerte retards */}
          {nbRetard > 0 && (
            <div style={{
              background: '#fff4ec', border: '1px solid #fed7aa',
              borderRadius: 8, padding: '9px 13px', marginBottom: 12,
              fontSize: 12, color: '#9a3412', display: 'flex', gap: 8,
            }}>
              ⚠️
              <div>
                <strong>{nbRetard} élèves</strong> ont des paiements en retard.{' '}
                <span
                  onClick={() => { setFiltrePaiement('retard'); setPage(1) }}
                  style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Voir la liste →
                </span>
              </div>
            </div>
          )}

          {/* Barre recherche + filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...css.input, flex: 1, minWidth: 200 }}
              placeholder="Rechercher par nom, prénom ou matricule…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <select
              style={css.select}
              value={filtreClasse}
              onChange={e => { setFiltreClasse(e.target.value); setPage(1) }}
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              style={css.select}
              value={filtrePaiement}
              onChange={e => { setFiltrePaiement(e.target.value); setPage(1) }}
            >
              <option value="">Tous statuts</option>
              <option value="a_jour">À jour</option>
              <option value="attente">En attente</option>
              <option value="retard">En retard</option>
            </select>

            {/* Réinitialiser filtres */}
            {(search || filtreClasse || filtrePaiement) && (
              <button
                style={btn('outline', 'sm')}
                onClick={() => { setSearch(''); setFiltreClasse(''); setFiltrePaiement(''); setPage(1) }}
              >
                ✕ Réinitialiser
              </button>
            )}

            {/* Toggle vue */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              <button style={btn(vue === 'table' ? 'primary' : 'outline', 'sm')} onClick={() => setVue('table')}>☰ Tableau</button>
              <button style={btn(vue === 'cartes' ? 'primary' : 'outline', 'sm')} onClick={() => setVue('cartes')}>⊞ Cartes</button>
            </div>
          </div>

          {/* ── VUE TABLE ── */}
          {vue === 'table' && (
            <div style={css.section}>
              <div style={css.sectionHeader}>
                <div style={css.sectionTitre}>📋 {filtered.length} élève{filtered.length > 1 ? 's' : ''}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {selected.size > 0 && (
                    <button style={btn('primary', 'sm')} onClick={() => openModal('action-groupe')}>
                      ⚡ Actions ({selected.size})
                    </button>
                  )}
                  <button style={btn('outline', 'sm')} onClick={toggleAll}>
                    ☑ {selected.size === pageData.length && pageData.length > 0 ? 'Tout désélect.' : 'Tout sélect.'}
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ ...css.th, width: 30 }}>
                        <input
                          type="checkbox"
                          onChange={toggleAll}
                          checked={selected.size === pageData.length && pageData.length > 0}
                        />
                      </th>
                      <th style={css.th}>Élève</th>
                      <th style={css.th}>Classe</th>
                      <th style={css.th}>Âge</th>
                      <th style={css.th}>Absences</th>
                      <th style={css.th}>Paiement</th>
                      <th style={css.th}>Parent / Contact</th>
                      <th style={css.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map(eleve => {
                      const color      = getColor(eleve.id)
                      const initiales  = getInitials(eleve.first_name, eleve.last_name)
                      const age        = getAge(eleve.birth_date)
                      const absCount   = getAbsenceCount(eleve.id, attendances)
                      const payStatus  = getPaymentStatus(eleve.id, payments)
                      const isCollege  = eleve.classes?.level === 'college'

                      return (
                        <tr
                          key={eleve.id}
                          style={{ cursor: 'default' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0faf3')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                          <td style={css.td}>
                            <input
                              type="checkbox"
                              checked={selected.has(eleve.id)}
                              onChange={() => toggleSelect(eleve.id)}
                            />
                          </td>

                          {/* Nom + matricule */}
                          <td style={css.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: color, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: '#fff',
                              }}>
                                {initiales}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {eleve.first_name} {eleve.last_name}
                                </div>
                                <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>
                                  {eleve.matricule}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Classe */}
                          <td style={css.td}>
                            <span style={badge(
                              isCollege ? '#1e40af' : '#1B4332',
                              isCollege ? '#dbeafe' : '#D8F3DC',
                            )}>
                              {eleve.classes?.name ?? '—'}
                            </span>
                          </td>

                          {/* Âge */}
                          <td style={{ ...css.td, fontFamily: 'monospace', color: '#6b7280' }}>
                            {age !== null ? `${age} ans` : '—'}
                          </td>

                          {/* Absences */}
                          <td style={{
                            ...css.td, fontFamily: 'monospace',
                            color: absCount > 4 ? '#dc2626' : absCount > 1 ? '#d97706' : '#6b7280',
                          }}>
                            {absCount} j.
                          </td>

                          {/* Paiement */}
                          <td style={css.td}>
                            <PaymentBadge status={payStatus} />
                          </td>

                          {/* Parent */}
                          <td style={{ ...css.td, fontSize: 11, color: '#6b7280' }}>
                            <div>{eleve.profiles?.full_name ?? '—'}</div>
                            {eleve.profiles?.phone && (
                              <div style={{ fontSize: 10 }}>{eleve.profiles.phone}</div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={css.td}>
                            <div style={{ display: 'flex', gap: 3 }}>
                              <button style={btn('outline', 'sm')} onClick={() => ouvrirDetail(eleve)}>
                                👁️
                              </button>
                              <button style={btn('outline', 'sm')} onClick={() => { setEleveDetail(eleve); openModal('modifier') }}>
                                ✏️
                              </button>
                              <button style={btn('danger', 'sm')} onClick={() => archiverEleve(eleve.id)}>
                                📦
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {pageData.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...css.td, textAlign: 'center', color: '#6b7280', padding: 32 }}>
                          Aucun élève trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderTop: '1px solid #d1fae5',
                fontSize: 12, color: '#6b7280',
              }}>
                <div>
                  Affichage {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}
                  –{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length} élèves
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', cursor: 'pointer' }}
                  >‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: '1px solid #d1fae5', cursor: 'pointer',
                        background: page === p ? '#1B4332' : '#fff',
                        color:      page === p ? '#fff'    : '#0d1f16',
                        fontWeight: page === p ? 600 : 400,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1fae5', background: '#fff', cursor: 'pointer' }}
                  >›</button>
                </div>
              </div>
            </div>
          )}

          {/* ── VUE CARTES ── */}
          {vue === 'cartes' && (
            <div style={css.section}>
              <div style={css.sectionHeader}>
                <div style={css.sectionTitre}>⊞ Vue cartes ({filtered.length})</div>
              </div>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {filtered.slice(0, 21).map(eleve => {
                  const color     = getColor(eleve.id)
                  const initiales = getInitials(eleve.first_name, eleve.last_name)
                  const age       = getAge(eleve.birth_date)
                  const absCount  = getAbsenceCount(eleve.id, attendances)
                  const payStatus = getPaymentStatus(eleve.id, payments)

                  return (
                    <div
                      key={eleve.id}
                      style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s' }}
                      onClick={() => ouvrirDetail(eleve)}
                    >
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>
                          {initiales}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {eleve.first_name} {eleve.last_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>
                            {eleve.classes?.name ?? '—'} · {age !== null ? `${age} ans` : '—'}
                          </div>
                          <div style={{ marginTop: 5 }}>
                            <PaymentBadge status={payStatus} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #d1fae5' }}>
                        <div style={{ padding: '7px 10px', textAlign: 'center', borderRight: '1px solid #d1fae5' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: absCount > 3 ? '#dc2626' : '#1B4332' }}>
                            {absCount}
                          </div>
                          <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', marginTop: 1 }}>Absences</div>
                        </div>
                        <div style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                            {eleve.matricule.slice(-4)}
                          </div>
                          <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', marginTop: 1 }}>Matricule</div>
                        </div>
                      </div>

                      <div style={{ padding: '8px 14px', background: '#f3f4f6', display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                        <button
                          style={btn('outline', 'sm')}
                          onClick={e => { e.stopPropagation(); setEleveDetail(eleve); openModal('modifier') }}
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filtered.length > 21 && (
                <div style={{ padding: '8px 14px', textAlign: 'center', fontSize: 12, color: '#6b7280', borderTop: '1px solid #d1fae5' }}>
                  Affichage de 21 sur {filtered.length} · <span style={{ cursor: 'pointer', color: '#1B4332', fontWeight: 500 }} onClick={() => setVue('table')}>Voir tout en tableau →</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          ONGLET ARCHIVES
      ══════════════════════════════════════ */}
      {onglet === 'archives' && (
        <div style={css.section}>
          <div style={css.sectionHeader}>
            <div style={css.sectionTitre}>📦 Élèves archivés ({archivedStudents.length})</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={css.th}>Élève</th>
                  <th style={css.th}>Classe</th>
                  <th style={css.th}>Matricule</th>
                  <th style={css.th}>Archivé le</th>
                  <th style={css.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedStudents.map(eleve => (
                  <tr key={eleve.id}>
                    <td style={css.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: getColor(eleve.id),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff',
                        }}>
                          {getInitials(eleve.first_name, eleve.last_name)}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {eleve.first_name} {eleve.last_name}
                        </div>
                      </div>
                    </td>
                    <td style={css.td}>{eleve.classes?.name ?? '—'}</td>
                    <td style={{ ...css.td, fontFamily: 'monospace', color: '#6b7280' }}>{eleve.matricule}</td>
                    <td style={{ ...css.td, color: '#6b7280' }}>
                      {new Date(eleve.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={css.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={btn('outline', 'sm')} onClick={() => showToast('✅ Élève restauré !')}>↩ Restaurer</button>
                        <button style={btn('danger', 'sm')} onClick={() => showToast('🗑️ Supprimé définitivement')}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {archivedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...css.td, textAlign: 'center', color: '#6b7280', padding: 32 }}>
                      Aucun élève archivé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — DÉTAIL ÉLÈVE
      ══════════════════════════════════════ */}
      {modalOuvert === 'detail' && eleveDetail && (() => {
        const color     = getColor(eleveDetail.id)
        const initiales = getInitials(eleveDetail.first_name, eleveDetail.last_name)
        const age       = getAge(eleveDetail.birth_date)
        const absCount  = getAbsenceCount(eleveDetail.id, attendances)
        const payStatus = getPaymentStatus(eleveDetail.id, payments)
        const sp        = payments.filter(p => p.student_id === eleveDetail.id)
        const sa        = attendances.filter(a => a.student_id === eleveDetail.id)
        const nbAbs     = sa.filter(a => a.status === 'absent').length
        const nbRet     = sa.filter(a => a.status === 'late').length
        const totalPaye = sp
          .filter(p => p.status === 'paid' || p.status === 'success')
          .reduce((acc, p) => acc + Number(p.amount), 0)

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={closeModal}
          >
            <div
              style={{ background: '#fff', borderRadius: 14, padding: 24, width: 720, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#1B4332' }}>
                  Fiche élève
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={btn('outline', 'sm')} onClick={() => { closeModal(); setEleveDetail(eleveDetail); openModal('modifier') }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
                </div>
              </div>

              {/* Hero */}
              <div style={{ background: '#1B4332', borderRadius: 10, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 58, height: 58, borderRadius: 14, background: '#F4A261', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#1B4332', flexShrink: 0 }}>
                  {initiales}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#fff', fontWeight: 700 }}>
                    {eleveDetail.first_name} {eleveDetail.last_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                    {eleveDetail.classes?.name ?? '—'} · {eleveDetail.matricule} · {age !== null ? `${age} ans` : '—'}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <PaymentBadge status={payStatus} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { val: absCount, lbl: 'Absences' },
                    { val: sp.length, lbl: 'Paiements' },
                  ].map((st, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 500, color: '#F4A261' }}>{st.val}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1, textTransform: 'uppercase' }}>{st.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs internes */}
              <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 8, padding: 3, marginBottom: 16, width: 'fit-content' }}>
                {([
                  { key: 'infos',      label: '📋 Informations' },
                  { key: 'paiements',  label: '💰 Paiements' },
                  { key: 'absences',   label: '📅 Absences' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setDetailTab(t.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: detailTab === t.key ? '#1B4332' : 'transparent',
                      color:      detailTab === t.key ? '#fff'    : '#6b7280',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ─ Tab Infos ─ */}
              {detailTab === 'infos' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <InfoField lbl="Matricule"         val={eleveDetail.matricule} />
                    <InfoField lbl="Date de naissance" val={eleveDetail.birth_date ? new Date(eleveDetail.birth_date).toLocaleDateString('fr-FR') : '—'} />
                    <InfoField lbl="Classe"            val={eleveDetail.classes?.name} />
                    <InfoField lbl="Niveau"            val={eleveDetail.classes?.level} />
                    <InfoField lbl="Parent"            val={eleveDetail.profiles?.full_name} />
                    <InfoField lbl="Téléphone parent"  val={eleveDetail.profiles?.phone} />
                    <InfoField lbl="Date inscription"  val={new Date(eleveDetail.created_at).toLocaleDateString('fr-FR')} />
                    <InfoField lbl="Année scolaire"    val={schoolYear} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <button style={btn('outline', 'sm')} onClick={() => showToast('💬 Message envoyé aux parents !')}>
                      💬 Contacter parents
                    </button>
                    <button style={btn('outline', 'sm')} onClick={() => showToast('📊 Bulletin généré !')}>
                      📊 Générer bulletin
                    </button>
                    <button
                      style={{ ...btn('danger', 'sm'), marginLeft: 'auto' }}
                      onClick={() => archiverEleve(eleveDetail.id)}
                    >
                      📦 Archiver
                    </button>
                  </div>
                </div>
              )}

              {/* ─ Tab Paiements ─ */}
              {detailTab === 'paiements' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
                    <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 500, color: '#1B4332' }}>
                        {totalPaye.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>Total payé</div>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 500, color: '#d97706' }}>
                        {sp.length}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280' }}>Transactions</div>
                    </div>
                  </div>
                  {sp.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 12 }}>
                      Aucun paiement enregistré.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Reçu', 'Montant', 'Mode', 'Date', 'Statut'].map(h => (
                            <th key={h} style={css.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sp.map((p, i) => (
                          <tr key={i}>
                            <td style={{ ...css.td, fontFamily: 'monospace', color: '#6b7280', fontSize: 11 }}>
                              {p.receipt_number ?? '—'}
                            </td>
                            <td style={{ ...css.td, fontFamily: 'monospace', color: '#1B4332' }}>
                              {Number(p.amount).toLocaleString('fr-FR')} FCFA
                            </td>
                            <td style={css.td}>{p.payment_method ?? '—'}</td>
                            <td style={{ ...css.td, color: '#6b7280' }}>
                              {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td style={css.td}>
                              <PaymentBadge status={
                                p.status === 'paid' || p.status === 'success'
                                  ? 'a_jour'
                                  : p.status === 'pending'
                                    ? 'attente'
                                    : 'retard'
                              } />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ─ Tab Absences ─ */}
              {detailTab === 'absences' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { val: nbAbs, lbl: 'Absences',     color: nbAbs > 3 ? '#dc2626' : '#1B4332' },
                      { val: nbRet, lbl: 'Retards',       color: '#d97706' },
                      { val: sa.length > 0 ? `${Math.round((1 - nbAbs / sa.length) * 100)}%` : '100%', lbl: 'Taux présence', color: '#1B4332' },
                    ].map((st, i) => (
                      <div key={i} style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 500, color: st.color }}>{st.val}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{st.lbl}</div>
                      </div>
                    ))}
                  </div>
                  {sa.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 12 }}>
                      ✅ Aucune absence enregistrée.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Date', 'Type', 'Motif'].map(h => (
                            <th key={h} style={css.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sa.map((a, i) => (
                          <tr key={i}>
                            <td style={{ ...css.td, color: '#6b7280' }}>
                              {a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td style={css.td}>
                              <span style={badge(
                                a.status === 'absent' ? '#dc2626' : '#d97706',
                                a.status === 'absent' ? '#fee2e2' : '#fef3c7',
                              )}>
                                {a.status === 'absent' ? '❌ Absent' : '⏰ Retard'}
                              </span>
                            </td>
                            <td style={{ ...css.td, color: '#6b7280' }}>{a.reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ══════════════════════════════════════
          MODAL — AJOUTER UN ÉLÈVE
      ══════════════════════════════════════ */}
      {modalOuvert === 'ajouter' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: 560, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#1B4332' }}>
                ➕ Ajouter un élève
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>

            {formErr && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 7, marginBottom: 12, fontSize: 12 }}>
                {formErr}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              {/* Prénom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Prénom *</label>
                <input style={css.input} placeholder="Prénom" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
              {/* Nom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Nom *</label>
                <input style={css.input} placeholder="Nom de famille" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              {/* Date naissance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Date de naissance *</label>
                <input type="date" style={css.input} value={form.ddn} onChange={e => setForm(f => ({ ...f, ddn: e.target.value }))} />
              </div>
              {/* Téléphone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Téléphone parent</label>
                <input type="tel" style={css.input} placeholder="+229 XX XX XX XX" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
              </div>
              {/* Sexe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Sexe *</label>
                <select style={css.input} value={form.sexe} onChange={e => setForm(f => ({ ...f, sexe: e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              {/* Classe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Classe *</label>
                <select style={css.input} value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button style={btn('outline')} onClick={closeModal}>Annuler</button>
              <button style={btn('primary')} onClick={soumettreAjout} disabled={submitting}>
                {submitting ? '⏳ Envoi…' : '✅ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — MODIFIER ÉLÈVE
      ══════════════════════════════════════ */}
      {modalOuvert === 'modifier' && eleveDetail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: 480, maxWidth: '96vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#1B4332' }}>
                ✏️ Modifier — {eleveDetail.first_name} {eleveDetail.last_name}
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Prénom</label>
                <input style={css.input} defaultValue={eleveDetail.first_name} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Nom</label>
                <input style={css.input} defaultValue={eleveDetail.last_name} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Date de naissance</label>
                <input type="date" style={css.input} defaultValue={eleveDetail.birth_date ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={css.formLabel}>Classe</label>
                <select style={css.input} defaultValue={eleveDetail.class_id ?? ''}>
                  <option value="">—</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button style={btn('outline')} onClick={closeModal}>Annuler</button>
              <button
                style={btn('primary')}
                onClick={() => { closeModal(); showToast('✅ Modifications sauvegardées !') }}
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — IMPORT EXCEL
      ══════════════════════════════════════ */}
      {modalOuvert === 'import' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: 460, maxWidth: '96vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#1B4332' }}>
                ⬆️ Importer des élèves
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <div style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 12, color: '#40916C' }}>
              ℹ️ Colonnes obligatoires : Prénom, Nom, Classe, Sexe, Date naissance, Téléphone parent.
            </div>
            <div style={{ border: '2px dashed #d1fae5', borderRadius: 10, padding: 32, textAlign: 'center', background: '#f0faf3', cursor: 'pointer', marginBottom: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1B4332', marginBottom: 4 }}>
                Glissez votre fichier Excel ici
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>ou cliquez pour choisir · .xlsx, .csv</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={btn('outline')} onClick={() => showToast('📄 Modèle téléchargé !')}>
                ⬇ Modèle Excel
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btn('outline')} onClick={closeModal}>Annuler</button>
                <button style={btn('primary')} onClick={() => { closeModal(); showToast('✅ 12 élèves importés !') }}>
                  ✅ Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — ACTIONS GROUPÉES
      ══════════════════════════════════════ */}
      {modalOuvert === 'action-groupe' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380, maxWidth: '96vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#1B4332' }}>
                ⚡ Actions groupées
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              {selected.size} élève{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📩', label: 'Envoyer message aux parents', msg: '📩 Messages envoyés !' },
                { icon: '📊', label: 'Générer les bulletins',        msg: '📊 Bulletins générés !' },
                { icon: '📄', label: 'Exporter la sélection',        msg: '📄 Export généré !' },
              ].map((a, i) => (
                <button
                  key={i}
                  style={{ ...btn('outline'), justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => { closeModal(); showToast(a.msg) }}
                >
                  {a.icon} {a.label}
                </button>
              ))}
              <button
                style={{ ...btn('danger'), justifyContent: 'flex-start', width: '100%' }}
                onClick={() => { closeModal(); showToast('📦 Élèves archivés !') }}
              >
                📦 Archiver la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1B4332', color: '#fff',
          padding: '10px 16px', borderRadius: 8,
          fontSize: 12, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(27,67,50,0.3)',
          zIndex: 999, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn .2s ease',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}
