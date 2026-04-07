'use client'

import { useState, useMemo, useCallback } from 'react'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Classe, Enseignant } from './page'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassesClientProps {
  classes: Classe[]
  enseignants: Enseignant[]
  totalEleves: number
  classesSansMaitre: number
  schoolYear: string
  schoolName: string
}

type NiveauTab = 'Toutes' | 'Primaire' | 'Collège' | 'Lycée'
type ViewMode = 'grille' | 'tableau'
type SortKey = 'name' | 'level' | 'eleveCount'
type SortDir = 'asc' | 'desc'
type ModalMode = 'none' | 'create' | 'edit' | 'assign'

const PRIMAIRE = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2']
const COLLEGE = ['6e', '5e', '4e', '3e']
const LYCEE = ['2nde', '1ère', 'Terminale']
const ALL_LEVELS = [...PRIMAIRE, ...COLLEGE, ...LYCEE]
const CAPACITY = 50

const NIVEAU_LABELS: Record<string, string> = {
  CI: "Cours d'Initiation",
  CP: 'Cours Préparatoire',
  CE1: 'Cours Élémentaire 1ère année',
  CE2: 'Cours Élémentaire 2e année',
  CM1: 'Cours Moyen 1ère année',
  CM2: 'Cours Moyen 2e année',
  '6e': '6ème',
  '5e': '5ème',
  '4e': '4ème',
  '3e': '3ème',
  '2nde': 'Seconde',
  '1ère': 'Première',
  Terminale: 'Terminale',
}

function getLevelCategory(level: string | null): 'Primaire' | 'Collège' | 'Lycée' | 'Autre' {
  if (!level) return 'Autre'
  if (PRIMAIRE.includes(level)) return 'Primaire'
  if (COLLEGE.includes(level)) return 'Collège'
  if (LYCEE.includes(level)) return 'Lycée'
  return 'Autre'
}

function levelBadgeVariant(level: string | null): 'vert' | 'bleu' | 'violet' | 'gris' {
  const cat = getLevelCategory(level)
  if (cat === 'Primaire') return 'vert'
  if (cat === 'Collège') return 'bleu'
  if (cat === 'Lycée') return 'violet'
  return 'gris'
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

// ─── Capacity bar ─────────────────────────────────────────────────────────────

function CapacityBar({ count, capacity = CAPACITY }: { count: number; capacity?: number }) {
  const pct = Math.min(100, Math.round((count / capacity) * 100))
  const color = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#40916C'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
        <span>{count} / {capacity} élèves</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 14, padding: '28px 32px',
          width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#1B4332' }}>
            {title}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── FormField helper ─────────────────────────────────────────────────────────

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 7,
  border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClassesClient({
  classes: initialClasses,
  enseignants,
  totalEleves,
  classesSansMaitre,
  schoolYear,
  schoolName,
}: ClassesClientProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<Classe[]>(initialClasses)
  const [niveauTab, setNiveauTab] = useState<NiveauTab>('Toutes')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grille')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedClasseId, setSelectedClasseId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'eleves' | 'matieres'>('info')
  const [modalMode, setModalMode] = useState<ModalMode>('none')
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLevel, setFormLevel] = useState('')
  const [formTeacherId, setFormTeacherId] = useState('')

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedClasse = classes.find(c => c.id === selectedClasseId) ?? null
  const classesPleines = classes.filter(c => c.eleveCount >= CAPACITY).length
  const moyenneRemplissage = classes.length > 0
    ? Math.round(classes.reduce((s, c) => s + Math.min(100, (c.eleveCount / CAPACITY) * 100), 0) / classes.length)
    : 0

  const filtered = useMemo(() => {
    let list = classes
    if (niveauTab !== 'Toutes') {
      list = list.filter(c => getLevelCategory(c.level) === niveauTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.teacherName ?? '').toLowerCase().includes(q) ||
          (c.level ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [classes, niveauTab, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const va = sortKey === 'eleveCount' ? a.eleveCount : (a[sortKey] ?? '')
      const vb = sortKey === 'eleveCount' ? b.eleveCount : (b[sortKey] ?? '')
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const groupedByLevel = useMemo(() => {
    const groups: Record<string, Classe[]> = { Primaire: [], Collège: [], Lycée: [], Autre: [] }
    for (const c of sorted) {
      const cat = getLevelCategory(c.level)
      groups[cat].push(c)
    }
    return groups
  }, [sorted])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const openCreate = () => {
    setFormName('')
    setFormLevel('')
    setFormTeacherId('')
    setModalMode('create')
  }

  const openEdit = (c: Classe) => {
    setEditingClasse(c)
    setFormName(c.name)
    setFormLevel(c.level ?? '')
    setFormTeacherId(c.teacher_id ?? '')
    setModalMode('edit')
  }

  const openAssign = (c: Classe) => {
    setEditingClasse(c)
    setFormTeacherId('')
    setModalMode('assign')
  }

  const closeModal = () => {
    setModalMode('none')
    setEditingClasse(null)
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formName.trim() || !formLevel) return
    setLoading(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          level: formLevel,
          teacher_id: formTeacherId || null,
          school_year: schoolYear,
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      const { classe } = await res.json() as { classe: Classe }
      const teacher = enseignants.find(e => e.id === formTeacherId)
      const newClasse: Classe = {
        ...classe,
        teacherName: teacher?.full_name ?? null,
        eleveCount: 0,
      }
      setClasses(prev => [...prev, newClasse])
      closeModal()
      showToast('Classe créée avec succès !')
    } catch {
      showToast('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingClasse || !formName.trim() || !formLevel) return
    setLoading(true)
    try {
      const res = await fetch(`/api/classes?id=${editingClasse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          level: formLevel,
          teacher_id: formTeacherId || null,
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      const teacher = enseignants.find(e => e.id === formTeacherId)
      setClasses(prev =>
        prev.map(c =>
          c.id === editingClasse.id
            ? { ...c, name: formName.trim(), level: formLevel, teacher_id: formTeacherId || null, teacherName: teacher?.full_name ?? null }
            : c
        )
      )
      closeModal()
      if (selectedClasseId === editingClasse.id) setSelectedClasseId(null)
      showToast('Classe modifiée avec succès !')
    } catch {
      showToast('Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingClasse) return
    if (!confirm(`Supprimer la classe "${editingClasse.name}" ?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/classes?id=${editingClasse.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      setClasses(prev => prev.filter(c => c.id !== editingClasse.id))
      if (selectedClasseId === editingClasse.id) setSelectedClasseId(null)
      closeModal()
      showToast('Classe supprimée.')
    } catch {
      showToast('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!editingClasse || !formTeacherId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/classes?id=${editingClasse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: formTeacherId }),
      })
      if (!res.ok) throw new Error('Erreur')
      const teacher = enseignants.find(e => e.id === formTeacherId)
      setClasses(prev =>
        prev.map(c =>
          c.id === editingClasse.id
            ? { ...c, teacher_id: formTeacherId, teacherName: teacher?.full_name ?? null }
            : c
        )
      )
      closeModal()
      showToast(`Maître assigné à ${editingClasse.name} !`)
    } catch {
      showToast("Erreur lors de l'assignation")
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#1f2937' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1B4332', marginBottom: 4 }}>
            Gestion des Classes
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {schoolName} · {classes.length} classe{classes.length !== 1 ? 's' : ''} · {totalEleves} élève{totalEleves !== 1 ? 's' : ''} · {schoolYear}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => window.print()}>
            📄 Exporter
          </Button>
          <Button onClick={openCreate}>
            + Nouvelle classe
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon="🏫" label="Total classes" value={classes.length} variant="vert" />
        <StatCard icon="👦" label="Total élèves inscrits" value={totalEleves} variant="bleu" />
        <StatCard
          icon="⚠️"
          label="Classes sans maître"
          value={classesSansMaitre}
          variant={classesSansMaitre > 0 ? 'orange' : 'vert'}
        />
        <StatCard
          icon="🔴"
          label="Classes pleines"
          value={classesPleines}
          variant={classesPleines > 0 ? 'orange' : 'vert'}
        />
        <StatCard icon="📊" label="Remplissage moyen" value={`${moyenneRemplissage}%`} variant="violet" />
      </div>

      {/* ── Alert sans maître ── */}
      {classesSansMaitre > 0 && (
        <div style={{
          background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          color: '#c2410c', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {classesSansMaitre} classe{classesSansMaitre !== 1 ? 's' : ''} n&apos;ont pas de maître assigné — les notes ne peuvent pas être saisies.
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
        padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['Toutes', 'Primaire', 'Collège', 'Lycée'] as NiveauTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setNiveauTab(tab)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: niveauTab === tab ? '#1B4332' : '#f3f4f6',
                color: niveauTab === tab ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Search */}
        <input
          type="search"
          placeholder="🔍 Rechercher classe ou maître..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            ...inputStyle, width: 240, padding: '6px 12px',
            border: '1px solid #d1d5db', flexShrink: 0,
          }}
        />
        {/* View switch */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('grille')}
            title="Vue grille"
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 16, border: 'none', cursor: 'pointer',
              background: viewMode === 'grille' ? '#D8F3DC' : '#f3f4f6',
              color: viewMode === 'grille' ? '#1B4332' : '#6b7280',
            }}
          >
            ⊞
          </button>
          <button
            onClick={() => setViewMode('tableau')}
            title="Vue tableau"
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 16, border: 'none', cursor: 'pointer',
              background: viewMode === 'tableau' ? '#D8F3DC' : '#f3f4f6',
              color: viewMode === 'tableau' ? '#1B4332' : '#6b7280',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedClasse && (
        <div style={{
          background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
          marginBottom: 20, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(27,67,50,0.08)',
        }}>
          {/* Detail header */}
          <div style={{ background: '#1B4332', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700 }}>
                {selectedClasse.name}
              </div>
              <div style={{ fontSize: 12, color: '#D8F3DC', marginTop: 4, display: 'flex', gap: 16 }}>
                <span>{NIVEAU_LABELS[selectedClasse.level ?? ''] ?? selectedClasse.level ?? '—'}</span>
                <span>{selectedClasse.eleveCount} élève{selectedClasse.eleveCount !== 1 ? 's' : ''}</span>
                {selectedClasse.teacherName && <span>👨‍🏫 {selectedClasse.teacherName}</span>}
              </div>
            </div>
            <button
              onClick={() => setSelectedClasseId(null)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ✕ Fermer
            </button>
          </div>
          {/* Detail tabs */}
          <div style={{ borderBottom: '1px solid #d1fae5', display: 'flex', gap: 0 }}>
            {([['info', '📋 Infos générales'], ['eleves', '👦 Élèves'], ['matieres', '📚 Matières']] as [typeof detailTab, string][]).map(
              ([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  style={{
                    padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: 'none',
                    borderBottom: detailTab === tab ? '2px solid #1B4332' : '2px solid transparent',
                    color: detailTab === tab ? '#1B4332' : '#6b7280',
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>
          {/* Detail content */}
          <div style={{ padding: '20px 24px' }}>
            {detailTab === 'info' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    ['Nom de la classe', selectedClasse.name],
                    ['Niveau', NIVEAU_LABELS[selectedClasse.level ?? ''] ?? selectedClasse.level ?? '—'],
                    ['Maître/Prof', selectedClasse.teacherName ?? '⚠️ Non assigné'],
                    ['Capacité', `${CAPACITY} élèves`],
                    ['Élèves inscrits', `${selectedClasse.eleveCount} élève${selectedClasse.eleveCount !== 1 ? 's' : ''}`],
                    ['Année scolaire', selectedClasse.school_year],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: '#f0faf3', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button onClick={() => openEdit(selectedClasse)}>✏️ Modifier</Button>
                  {!selectedClasse.teacher_id && (
                    <Button variant="outline" onClick={() => openAssign(selectedClasse)}>
                      👨‍🏫 Assigner un maître
                    </Button>
                  )}
                </div>
              </div>
            )}
            {detailTab === 'eleves' && (
              <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                👦 Liste des élèves — disponible via la page Élèves.
              </div>
            )}
            {detailTab === 'matieres' && (
              <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                📚 Matières — à configurer depuis la section Matières.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {sorted.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: 48, textAlign: 'center', color: '#6b7280' }}>
          🏫 Aucune classe trouvée
        </div>
      ) : viewMode === 'grille' ? (
        // ── Grid view ──
        <div>
          {(['Primaire', 'Collège', 'Lycée', 'Autre'] as const).map(cat => {
            const list = groupedByLevel[cat]
            if (!list || list.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 16, fontWeight: 700, color: '#1B4332',
                  marginBottom: 12, paddingBottom: 6,
                  borderBottom: '2px solid #D8F3DC',
                }}>
                  {cat === 'Primaire' ? '🌱 Primaire' : cat === 'Collège' ? '📘 Collège' : cat === 'Lycée' ? '🎓 Lycée' : '📚 Autre'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                    ({list.length} classe{list.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {list.map(c => {
                    const isPleine = c.eleveCount >= CAPACITY
                    const isSansMaitre = !c.teacher_id
                    const isSelected = c.id === selectedClasseId
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: '#fff',
                          border: `1.5px solid ${isSelected ? '#1B4332' : '#d1fae5'}`,
                          borderRadius: 12,
                          padding: '18px 18px 14px',
                          position: 'relative',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 16px rgba(27,67,50,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.15s, border-color 0.15s',
                        }}
                        onClick={() => {
                          setSelectedClasseId(isSelected ? null : c.id)
                          setDetailTab('info')
                        }}
                      >
                        {/* Corner badge */}
                        {(isPleine || isSansMaitre) && (
                          <div style={{ position: 'absolute', top: 10, right: 10 }}>
                            {isPleine && <Badge variant="rouge">🔴 Pleine</Badge>}
                            {!isPleine && isSansMaitre && <Badge variant="orange">⚠ Sans maître</Badge>}
                          </div>
                        )}
                        {/* Name */}
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1B4332', marginBottom: 2 }}>
                          {c.name}
                        </div>
                        {/* Level */}
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>
                          {NIVEAU_LABELS[c.level ?? ''] ?? c.level ?? '—'}
                        </div>
                        <Badge variant={levelBadgeVariant(c.level)} style={{ marginBottom: 12 }}>
                          {c.level ?? '—'}
                        </Badge>
                        {/* Capacity bar */}
                        <div style={{ marginBottom: 12 }}>
                          <CapacityBar count={c.eleveCount} />
                        </div>
                        {/* Teacher */}
                        <div style={{ fontSize: 12, color: c.teacherName ? '#374151' : '#dc2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {c.teacherName ? `👨‍🏫 ${c.teacherName}` : '⚠️ Non assigné'}
                        </div>
                        {/* Actions */}
                        <div
                          style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid #f0faf3' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEdit(c)}
                            style={{ background: '#f0faf3', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#1B4332', fontWeight: 600 }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => { setSelectedClasseId(c.id); setDetailTab('info') }}
                            style={{ background: '#f0faf3', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#1B4332', fontWeight: 600 }}
                          >
                            👁️ Détail
                          </button>
                          {isSansMaitre && (
                            <button
                              onClick={() => openAssign(c)}
                              style={{ background: '#fff4ec', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#c2410c', fontWeight: 600 }}
                            >
                              👨‍🏫 Assigner
                            </button>
                          )}
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
        // ── Table view ──
        <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f0faf3', borderBottom: '1px solid #d1fae5' }}>
                {([
                  ['name', 'Classe'],
                  ['level', 'Niveau'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {label}{sortIcon(key)}
                  </th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332' }}>Maître/Prof</th>
                <th
                  onClick={() => handleSort('eleveCount')}
                  style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  Élèves{sortIcon('eleveCount')}
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332', minWidth: 120 }}>Capacité</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332' }}>Statut</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1B4332' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const isPleine = c.eleveCount >= CAPACITY
                const isSansMaitre = !c.teacher_id
                const isSelected = c.id === selectedClasseId
                return (
                  <tr
                    key={c.id}
                    style={{
                      background: isSelected ? '#f0faf3' : i % 2 === 0 ? '#fff' : '#fafafa',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                    }}
                    onClick={() => { setSelectedClasseId(isSelected ? null : c.id); setDetailTab('info') }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1B4332' }}>{c.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={levelBadgeVariant(c.level)}>{c.level ?? '—'}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', color: c.teacherName ? '#374151' : '#dc2626' }}>
                      {c.teacherName ?? '⚠️ Non assigné'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{c.eleveCount}</td>
                    <td style={{ padding: '10px 14px', minWidth: 120 }}>
                      <CapacityBar count={c.eleveCount} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isPleine ? (
                        <Badge variant="rouge">🔴 Pleine</Badge>
                      ) : isSansMaitre ? (
                        <Badge variant="orange">⚠ Sans maître</Badge>
                      ) : (
                        <Badge variant="vert">✓ OK</Badge>
                      )}
                    </td>
                    <td
                      style={{ padding: '10px 14px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{ background: '#f0faf3', border: 'none', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#1B4332', fontWeight: 600 }}
                        >
                          ✏️
                        </button>
                        {isSansMaitre && (
                          <button
                            onClick={() => openAssign(c)}
                            style={{ background: '#fff4ec', border: 'none', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#c2410c', fontWeight: 600 }}
                          >
                            👨‍🏫
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0faf3', borderTop: '2px solid #D8F3DC' }}>
                <td colSpan={3} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#1B4332' }}>
                  Total ({sorted.length} classe{sorted.length !== 1 ? 's' : ''})
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1B4332' }}>
                  {sorted.reduce((s, c) => s + c.eleveCount, 0)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Modals ── */}

      {/* Create */}
      {modalMode === 'create' && (
        <Modal title="+ Nouvelle classe" onClose={closeModal}>
          <FormField label="Nom de la classe" required>
            <input
              style={inputStyle}
              placeholder="ex: CM2 A"
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
          </FormField>
          <FormField label="Niveau" required>
            <select
              style={inputStyle}
              value={formLevel}
              onChange={e => setFormLevel(e.target.value)}
            >
              <option value="">— Choisir un niveau —</option>
              <optgroup label="Primaire">
                {PRIMAIRE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
              <optgroup label="Collège">
                {COLLEGE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
              <optgroup label="Lycée">
                {LYCEE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
            </select>
          </FormField>
          <FormField label="Maître/Prof principal">
            <select
              style={inputStyle}
              value={formTeacherId}
              onChange={e => setFormTeacherId(e.target.value)}
            >
              <option value="">— Aucun pour l&apos;instant —</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="outline" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleCreate} disabled={loading || !formName.trim() || !formLevel}>
              {loading ? '…' : 'Créer la classe'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit */}
      {modalMode === 'edit' && editingClasse && (
        <Modal title={`✏️ Modifier — ${editingClasse.name}`} onClose={closeModal}>
          <FormField label="Nom de la classe" required>
            <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} />
          </FormField>
          <FormField label="Niveau" required>
            <select style={inputStyle} value={formLevel} onChange={e => setFormLevel(e.target.value)}>
              <option value="">— Choisir un niveau —</option>
              <optgroup label="Primaire">
                {PRIMAIRE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
              <optgroup label="Collège">
                {COLLEGE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
              <optgroup label="Lycée">
                {LYCEE.map(l => <option key={l} value={l}>{l} — {NIVEAU_LABELS[l]}</option>)}
              </optgroup>
            </select>
          </FormField>
          <FormField label="Maître/Prof principal">
            <select style={inputStyle} value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)}>
              <option value="">— Aucun —</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>🗑️ Supprimer</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" onClick={closeModal}>Annuler</Button>
              <Button onClick={handleEdit} disabled={loading || !formName.trim() || !formLevel}>
                {loading ? '…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign */}
      {modalMode === 'assign' && editingClasse && (
        <Modal title={`👨‍🏫 Assigner un maître — ${editingClasse.name}`} onClose={closeModal}>
          {enseignants.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
              Aucun enseignant disponible.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {enseignants.map(e => (
                <label
                  key={e.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: formTeacherId === e.id ? '#f0faf3' : '#fafafa',
                    border: `1px solid ${formTeacherId === e.id ? '#40916C' : '#e5e7eb'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="teacher"
                    value={e.id}
                    checked={formTeacherId === e.id}
                    onChange={() => setFormTeacherId(e.id)}
                    style={{ accentColor: '#1B4332' }}
                  />
                  <span style={{ fontWeight: 600, color: '#1B4332' }}>{e.full_name}</span>
                </label>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleAssign} disabled={loading || !formTeacherId}>
              {loading ? '…' : 'Confirmer'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
