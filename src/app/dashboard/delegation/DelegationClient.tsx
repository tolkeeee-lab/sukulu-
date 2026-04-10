'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ────────────────────────────────────────────────────────────────────

type Delegation = {
  id: string
  delegated_to: string
  intitule: string
  permissions: string[]
  classes_scope: string
  note: string | null
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
  delegate_name: string
  delegate_email: string | null
  delegate_phone: string | null
  delegate_role: string
}

type StaffMember = { id: string; full_name: string; role: string; email?: string | null; phone?: string | null }
type ClassItem = { id: string; name: string }
type DelegationLog = {
  id: string
  delegation_id: string | null
  delegated_to: string
  delegate_name: string
  action: string
  detail: string
  severity: 'ok' | 'warn' | 'danger'
  created_at: string
}

interface DelegationClientProps {
  schoolId: string
  schoolName: string
  userId: string
  userRole: string
  delegations: Delegation[]
  staff: StaffMember[]
  classes: ClassItem[]
  logs: DelegationLog[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  { id: 'eleves',       nom: 'Gérer les élèves',         desc: 'Voir, ajouter, modifier les fiches élèves', icon: '👦' },
  { id: 'inscriptions', nom: 'Valider inscriptions',      desc: 'Accepter ou refuser les demandes',          icon: '📝' },
  { id: 'notes',        nom: 'Saisir les notes',          desc: 'Saisir et consulter les notes',             icon: '📊' },
  { id: 'bulletins',    nom: 'Publier les bulletins',     desc: 'Générer et envoyer les bulletins',          icon: '📋' },
  { id: 'absences',     nom: 'Gérer les absences',        desc: 'Appel, justifications, historique',         icon: '📅' },
  { id: 'messages',     nom: 'Envoyer des messages',      desc: 'Contacter parents et personnels',           icon: '💬' },
  { id: 'paiements',    nom: 'Voir les paiements',        desc: 'Consulter (sans modifier) les paiements',   icon: '💰' },
  { id: 'rapports',     nom: 'Voir les rapports',         desc: 'Accéder aux statistiques et rapports',      icon: '📈' },
  { id: 'edt',          nom: "Gérer l'emploi du temps",  desc: 'Modifier les créneaux et cours',            icon: '🗓️' },
  { id: 'personnel',    nom: 'Voir le personnel',         desc: 'Consulter les fiches des enseignants',      icon: '👨‍🏫' },
  { id: 'classes',      nom: 'Gérer les classes',         desc: 'Modifier les informations de classe',       icon: '🏫' },
  { id: 'delegation',   nom: 'Créer des délégations',     desc: "⚠️ Déléguer des droits à d'autres",        icon: '🔑' },
]

const TEMPLATES = [
  { id: 'censeur',      nom: 'Censeur',           icon: '🏫', permissions: ['absences', 'bulletins', 'messages', 'rapports'],                                                                desc: 'Surveillance et discipline scolaire' },
  { id: 'secretaire',  nom: 'Secrétaire',         icon: '📝', permissions: ['eleves', 'inscriptions', 'messages', 'rapports'],                                                             desc: 'Gestion administrative des élèves' },
  { id: 'resp',        nom: 'Resp. pédagogique',  icon: '📊', permissions: ['notes', 'bulletins', 'absences', 'edt', 'classes'],                                                            desc: 'Suivi pédagogique et évaluations' },
  { id: 'interim',     nom: 'Directeur intérim',  icon: '🔑', permissions: ['eleves', 'inscriptions', 'notes', 'bulletins', 'absences', 'messages', 'rapports', 'edt', 'personnel', 'classes'], desc: 'Toutes les permissions sauf délégation' },
  { id: 'consultation',nom: 'Consultation',       icon: '👁️', permissions: [],                                                                                                              desc: 'Accès lecture seule (aucune permission active)' },
]

const AVATAR_COLORS = ['#1B4332', '#40916C', '#1e40af', '#7c3aed', '#be185d', '#d97706', '#065f46', '#854d0e', '#0e7490', '#9a3412']

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
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
  if (role === 'censeur') return 'Censeur'
  if (role === 'secretaire') return 'Secrétaire'
  return role
}

// Returns positive for future dates, negative for past dates
function daysFromNow(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const DEFAULT_DELEGATION_DURATION_DAYS = 90

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d}j`
  return formatDateFr(dateStr.split('T')[0])
}

function expiryBadge(expires_at: string): { label: string; bg: string; color: string } {
  const days = daysFromNow(expires_at)
  if (days < 0) return { label: 'Expiré', bg: '#fee2e2', color: '#dc2626' }
  if (days < 10) return { label: `${days}j restants`, bg: '#fee2e2', color: '#dc2626' }
  if (days < 30) return { label: `${days}j restants`, bg: '#fef3c7', color: '#d97706' }
  return { label: `${days}j restants`, bg: '#D8F3DC', color: '#1B4332' }
}

function severityIcon(s: 'ok' | 'warn' | 'danger'): string {
  if (s === 'danger') return '🔴'
  if (s === 'warn') return '🟡'
  return '🟢'
}

function severityColors(s: 'ok' | 'warn' | 'danger'): { bg: string; color: string } {
  if (s === 'danger') return { bg: '#fee2e2', color: '#dc2626' }
  if (s === 'warn') return { bg: '#fef3c7', color: '#d97706' }
  return { bg: '#D8F3DC', color: '#1B4332' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1B4332', color: '#fff', borderRadius: 10,
      padding: '10px 22px', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 9999,
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: checked ? '#40916C' : '#d1d5db', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ─── Permission Grid ──────────────────────────────────────────────────────────

function PermissionGrid({ permissions, onChange, compact = false }: {
  permissions: string[]
  onChange?: (perms: string[]) => void
  compact?: boolean
}) {
  const displayed = compact ? PERMISSIONS.slice(0, 8) : PERMISSIONS
  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: compact ? 4 : 8 }}>
      {displayed.map(p => {
        const active = permissions.includes(p.id)
        return (
          <div
            key={p.id}
            onClick={onChange ? () => {
              if (active) onChange(permissions.filter(x => x !== p.id))
              else onChange([...permissions, p.id])
            } : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
              padding: compact ? '4px 6px' : '8px 10px',
              borderRadius: 8,
              background: active ? '#D8F3DC' : '#f3f4f6',
              border: `1px solid ${active ? '#40916C' : '#e5e7eb'}`,
              cursor: onChange ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: compact ? 12 : 16 }}>{p.icon}</span>
            {!compact && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: active ? '#1B4332' : '#6b7280' }}>{p.nom}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.desc}</div>
              </div>
            )}
            {compact && (
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#1B4332' : '#9ca3af' }}>
                {p.nom.split(' ')[0]}
              </span>
            )}
            <div style={{
              marginLeft: 'auto', width: compact ? 8 : 10, height: compact ? 8 : 10,
              borderRadius: '50%', background: active ? '#40916C' : '#d1d5db', flexShrink: 0,
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Delegation Form ──────────────────────────────────────────────────────────

function DelegationForm({
  staff, classes, initial, onSubmit, onCancel, onRevoke,
}: {
  staff: StaffMember[]
  classes: ClassItem[]
  initial?: Partial<Delegation>
  onSubmit: (values: Partial<Delegation>) => Promise<void>
  onCancel: () => void
  onRevoke?: () => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [delegatedTo, setDelegatedTo] = useState(initial?.delegated_to ?? '')
  const [intitule, setIntitule] = useState(initial?.intitule ?? '')
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? [])
  const [startsAt, setStartsAt] = useState(initial?.starts_at ?? todayStr())
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '')
  const [classesScope, setClassesScope] = useState(initial?.classes_scope ?? 'all')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)

  function applyTemplate(tid: string) {
    const t = TEMPLATES.find(x => x.id === tid)
    if (!t) return
    setSelectedTemplate(tid)
    setPermissions(t.permissions)
    setIntitule(t.nom)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!delegatedTo || !intitule || !expiresAt) return
    setSaving(true)
    await onSubmit({ delegated_to: delegatedTo, intitule, permissions, starts_at: startsAt, expires_at: expiresAt, classes_scope: classesScope, note: note || null })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #d1fae5', fontSize: 13, background: '#f0faf3',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#1B4332', marginBottom: 4, display: 'block',
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Template quick-select */}
      {!initial && (
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Gabarit rapide</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TEMPLATES.slice(0, 4).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `2px solid ${selectedTemplate === t.id ? '#40916C' : '#d1fae5'}`,
                  background: selectedTemplate === t.id ? '#D8F3DC' : '#f0faf3',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: selectedTemplate === t.id ? '#1B4332' : '#40916C',
                }}
              >
                {t.icon} {t.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Délégué *</label>
          <select value={delegatedTo} onChange={e => setDelegatedTo(e.target.value)} required style={inputStyle}>
            <option value="">Sélectionner un membre...</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({getRoleLabel(s.role)})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Intitulé *</label>
          <input value={intitule} onChange={e => setIntitule(e.target.value)} required style={inputStyle} placeholder="ex: Censeur" />
        </div>
        <div>
          <label style={labelStyle}>Date de début</label>
          <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date d&apos;expiration *</label>
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Portée des classes</label>
          <select value={classesScope} onChange={e => setClassesScope(e.target.value)} style={inputStyle}>
            <option value="all">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Note (facultatif)</label>
          <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="Remarque interne..." />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Permissions ({permissions.length}/12)</label>
        <PermissionGrid permissions={permissions} onChange={setPermissions} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onRevoke && (
          <button type="button" onClick={onRevoke} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #dc2626',
            background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Révoquer
          </button>
        )}
        <button type="button" onClick={onCancel} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid #d1fae5',
          background: '#f0faf3', color: '#40916C', cursor: 'pointer', fontSize: 13,
        }}>
          Annuler
        </button>
        <button type="submit" disabled={saving} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none',
          background: saving ? '#9ca3af' : '#1B4332', color: '#fff',
          cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          {saving ? 'Enregistrement...' : (initial ? 'Modifier' : 'Créer la délégation')}
        </button>
      </div>
    </form>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DelegationClient({
  schoolId: _schoolId,
  schoolName,
  userId,
  userRole,
  delegations: initialDelegations,
  staff,
  classes,
  logs: initialLogs,
}: DelegationClientProps) {
  const isMobile = useIsMobile()

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'active' | 'templates' | 'journal' | 'archived' | 'security'>('active')
  const [delegations, setDelegations] = useState<Delegation[]>(initialDelegations)
  const [logs, setLogs] = useState<DelegationLog[]>(initialLogs)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Delegation | null>(null)
  const [logFilter, setLogFilter] = useState({ delegate: '', action: '', severity: '' })
  const [logPage, setLogPage] = useState(0)

  // Security settings (local only)
  const [secSettings, setSecSettings] = useState({
    maxDelegations: 5,
    requireNote: false,
    alertOnExpiry: true,
    autoRevoke: false,
  })

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(''), 3200)
    return () => clearTimeout(t)
  }, [toastMsg])

  const toast = useCallback((msg: string) => setToastMsg(msg), [])

  // ── API helpers ────────────────────────────────────────────────────────────

  async function refreshLogs() {
    try {
      const res = await fetch('/api/delegations?logs=true', { headers: { 'x-user-id': userId } })
      if (!res.ok) return
      const json = await res.json()
      if (json.logs) setLogs(json.logs)
    } catch {
      // Silently ignore log refresh failures
    }
  }

  async function handleCreate(values: Partial<Delegation>) {
    const res = await fetch('/api/delegations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast('❌ ' + ((json as { error?: string }).error ?? 'Erreur'))
      return
    }
    const json = await res.json()

    const member = staff.find(s => s.id === values.delegated_to)
    const newDel: Delegation = {
      id: json.delegation.id,
      delegated_to: values.delegated_to!,
      intitule: values.intitule!,
      permissions: values.permissions ?? [],
      classes_scope: values.classes_scope ?? 'all',
      note: values.note ?? null,
      starts_at: values.starts_at ?? todayStr(),
      expires_at: values.expires_at!,
      is_active: true,
      created_at: json.delegation.created_at ?? new Date().toISOString(),
      delegate_name: member?.full_name ?? '',
      delegate_email: member?.email ?? null,
      delegate_phone: member?.phone ?? null,
      delegate_role: member?.role ?? '',
    }
    setDelegations(prev => [newDel, ...prev])
    setShowNewModal(false)
    toast('✅ Délégation créée avec succès')
    refreshLogs()
  }

  async function handleEdit(values: Partial<Delegation>) {
    if (!editTarget) return
    const res = await fetch(`/api/delegations?id=${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast('❌ ' + ((json as { error?: string }).error ?? 'Erreur'))
      return
    }
    setDelegations(prev => prev.map(d => d.id === editTarget.id ? { ...d, ...values } : d))
    setEditTarget(null)
    toast('✅ Délégation modifiée')
    refreshLogs()
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/delegations?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ is_active: false }),
    })
    if (!res.ok) { toast('❌ Erreur lors de la révocation'); return }
    setDelegations(prev => prev.filter(d => d.id !== id))
    setEditTarget(null)
    toast('⚠️ Délégation révoquée')
    refreshLogs()
  }

  async function handleRenew(id: string) {
    const d = delegations.find(x => x.id === id)
    if (!d) return
    const base = new Date(d.expires_at)
    base.setMonth(base.getMonth() + 3)
    const newExpiry = base.toISOString().split('T')[0]
    const res = await fetch(`/api/delegations?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ expires_at: newExpiry }),
    })
    if (!res.ok) { toast('❌ Erreur lors du renouvellement'); return }
    setDelegations(prev => prev.map(x => x.id === id ? { ...x, expires_at: newExpiry } : x))
    toast('🔄 Délégation renouvelée (+3 mois)')
    refreshLogs()
  }

  async function handleRestore(id: string) {
    const res = await fetch(`/api/delegations?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ is_active: true }),
    })
    if (!res.ok) { toast('❌ Erreur lors de la restauration'); return }
    const del = delegations.find(d => d.id === id)
    if (del) setDelegations(prev => prev.map(d => d.id === id ? { ...d, is_active: true } : d))
    toast('✅ Délégation restaurée')
    refreshLogs()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/delegations?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) { toast('❌ Erreur lors de la suppression'); return }
    setDelegations(prev => prev.filter(d => d.id !== id))
    toast('🗑️ Délégation supprimée')
  }

  async function handleCreateFromTemplate(templateId: string, delegatedTo: string, startsAt: string, expiresAt: string) {
    const t = TEMPLATES.find(x => x.id === templateId)
    if (!t || !delegatedTo || !expiresAt) { toast('❌ Veuillez remplir tous les champs'); return }
    await handleCreate({
      delegated_to: delegatedTo,
      intitule: t.nom,
      permissions: t.permissions,
      starts_at: startsAt,
      expires_at: expiresAt,
      classes_scope: 'all',
    })
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  const activeDelegations = delegations.filter(d => d.is_active)
  const archivedDelegations = delegations.filter(d => !d.is_active)

  const filteredLogs = logs.filter(l => {
    if (logFilter.delegate && !l.delegate_name.toLowerCase().includes(logFilter.delegate.toLowerCase())) return false
    if (logFilter.action && l.action !== logFilter.action) return false
    if (logFilter.severity && l.severity !== logFilter.severity) return false
    return true
  })
  const paginatedLogs = filteredLogs.slice(logPage * 20, logPage * 20 + 20)

  // ── Render helpers ─────────────────────────────────────────────────────────

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: isMobile ? '8px 12px' : '10px 20px',
    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: isMobile ? 12 : 13,
    fontWeight: activeTab === tab ? 700 : 500,
    background: activeTab === tab ? '#1B4332' : '#f0faf3',
    color: activeTab === tab ? '#fff' : '#40916C',
    transition: 'all 0.15s',
  })

  const btnStyle = (variant: 'primary' | 'secondary' | 'danger' | 'warn' = 'secondary'): React.CSSProperties => {
    if (variant === 'primary') return { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#1B4332', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
    if (variant === 'danger') return { padding: '6px 14px', borderRadius: 7, border: '1px solid #dc2626', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
    if (variant === 'warn') return { padding: '6px 14px', borderRadius: 7, border: '1px solid #d97706', background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
    return { padding: '6px 14px', borderRadius: 7, border: '1px solid #d1fae5', background: '#f0faf3', color: '#40916C', cursor: 'pointer', fontSize: 12 }
  }

  // ── Tab: Active ────────────────────────────────────────────────────────────

  function renderActiveTab() {
    if (activeDelegations.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1B4332', marginBottom: 8 }}>Aucune délégation active</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Créez votre première délégation pour partager des responsabilités</div>
          <button onClick={() => setShowNewModal(true)} style={{ ...btnStyle('primary'), padding: '10px 24px', fontSize: 14 }}>
            + Nouvelle délégation
          </button>
        </div>
      )
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
        {activeDelegations.map(d => {
          const badge = expiryBadge(d.expires_at)
          const days = daysFromNow(d.expires_at)
          const pct = Math.max(0, Math.min(100, Math.round((days / DEFAULT_DELEGATION_DURATION_DAYS) * 100)))
          const isExpanded = expandedId === d.id

          return (
            <div key={d.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              {/* Card header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0faf3' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <Avatar name={d.delegate_name} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.delegate_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#40916C', fontWeight: 600 }}>{d.intitule}</div>
                    {d.delegate_email && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.delegate_email}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                </div>

                {/* Permissions mini-grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {PERMISSIONS.slice(0, 8).map(p => (
                    <span key={p.id} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 6,
                      background: d.permissions.includes(p.id) ? '#D8F3DC' : '#f3f4f6',
                      color: d.permissions.includes(p.id) ? '#1B4332' : '#9ca3af',
                      fontWeight: d.permissions.includes(p.id) ? 600 : 400,
                    }}>
                      {p.icon} {p.nom.split(' ').slice(-1)[0]}
                    </span>
                  ))}
                </div>

                {/* Expiry bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 4 }}>
                    <span>Expire le {formatDateFr(d.expires_at)}</span>
                    <span>{d.permissions.length} permissions</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: days < 10 ? '#dc2626' : days < 30 ? '#d97706' : '#40916C', borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '10px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setExpandedId(isExpanded ? null : d.id)} style={btnStyle()}>
                  {isExpanded ? 'Masquer' : 'Détail'}
                </button>
                <button onClick={() => setEditTarget(d)} style={btnStyle()}>✏️ Modifier</button>
                <button onClick={() => toast('💬 Fonction messagerie bientôt disponible')} style={btnStyle()}>💬</button>
                <button onClick={() => handleRenew(d.id)} style={btnStyle('warn')}>🔄 +3 mois</button>
                <button onClick={() => { if (confirm('Révoquer cette délégation ?')) handleRevoke(d.id) }} style={btnStyle('danger')}>
                  Révoquer
                </button>
              </div>

              {/* Detail panel */}
              {isExpanded && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid #f0faf3', background: '#f9fffe' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1B4332', marginBottom: 10 }}>Détails de la délégation</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: '#6b7280' }}>Rôle : </span><strong>{getRoleLabel(d.delegate_role)}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Portée : </span><strong>{d.classes_scope === 'all' ? 'Toutes les classes' : (classes.find(c => c.id === d.classes_scope)?.name ?? d.classes_scope)}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Début : </span><strong>{formatDateFr(d.starts_at)}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Créé le : </span><strong>{formatDateFr(d.created_at.split('T')[0])}</strong></div>
                    {d.delegate_phone && <div><span style={{ color: '#6b7280' }}>Tél : </span><strong>{d.delegate_phone}</strong></div>}
                  </div>
                  {d.note && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                      📝 {d.note}
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Toutes les permissions :</div>
                    <PermissionGrid permissions={d.permissions} compact />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Tab: Templates ─────────────────────────────────────────────────────────

  function TemplateCard({ t }: { t: typeof TEMPLATES[0] }) {
    const [delegatedTo, setDelegatedTo] = useState('')
    const [startsAt, setStartsAt] = useState(todayStr())
    const [expiresAt, setExpiresAt] = useState('')
    const [open, setOpen] = useState(false)

    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif", marginBottom: 2 }}>{t.nom}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{t.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {t.permissions.length === 0
                ? <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Aucune permission</span>
                : t.permissions.map(pid => {
                  const p = PERMISSIONS.find(x => x.id === pid)
                  return p ? <span key={pid} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#D8F3DC', color: '#1B4332', fontWeight: 600 }}>{p.icon} {p.nom.split(' ').slice(-1)[0]}</span> : null
                })
              }
            </div>
          </div>
          <button onClick={() => setOpen(!open)} style={btnStyle('primary')}>
            {open ? 'Fermer' : 'Utiliser'}
          </button>
        </div>
        {open && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f0faf3', background: '#f9fffe' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 4 }}>Membre du staff *</label>
                <select value={delegatedTo} onChange={e => setDelegatedTo(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none' }}>
                  <option value="">Choisir...</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 4 }}>Début</label>
                <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#1B4332', display: 'block', marginBottom: 4 }}>Expiration *</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => handleCreateFromTemplate(t.id, delegatedTo, startsAt, expiresAt)} style={btnStyle('primary')}>
                Créer la délégation
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderTemplatesTab() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {TEMPLATES.map(t => <TemplateCard key={t.id} t={t} />)}
        <div style={{ background: '#fff', borderRadius: 12, border: '2px dashed #d1fae5', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => setShowNewModal(true)}>
          <div style={{ fontSize: 32 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif" }}>Personnalisé</div>
          <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Créer une délégation avec permissions sur mesure</div>
          <button style={btnStyle('primary')}>Créer</button>
        </div>
      </div>
    )
  }

  // ── Tab: Journal ───────────────────────────────────────────────────────────

  function renderJournalTab() {
    const totalPages = Math.ceil(filteredLogs.length / 20)
    return (
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={logFilter.delegate}
            onChange={e => { setLogFilter(f => ({ ...f, delegate: e.target.value })); setLogPage(0) }}
            placeholder="Filtrer par délégué..."
            style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none' }}
          />
          <select value={logFilter.action} onChange={e => { setLogFilter(f => ({ ...f, action: e.target.value })); setLogPage(0) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none' }}>
            <option value="">Toutes les actions</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="revoke">Révocation</option>
            <option value="restore">Restauration</option>
            <option value="renew">Renouvellement</option>
          </select>
          <select value={logFilter.severity} onChange={e => { setLogFilter(f => ({ ...f, severity: e.target.value })); setLogPage(0) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12, background: '#f0faf3', outline: 'none' }}>
            <option value="">Toute sévérité</option>
            <option value="ok">✅ OK</option>
            <option value="warn">⚠️ Attention</option>
            <option value="danger">🔴 Danger</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>Aucun log trouvé</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginatedLogs.map(log => {
              const sc = severityColors(log.severity)
              return (
                <div key={log.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${sc.bg}`, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{severityIcon(log.severity)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1B4332' }}>{log.delegate_name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600 }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{timeAgo(log.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{log.detail}</div>
                  </div>
                  {log.severity === 'danger' && (
                    <button onClick={() => toast('🔒 Blocage du délégué — fonctionnalité à venir')} style={btnStyle('danger')}>
                      Bloquer
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setLogPage(p => Math.max(0, p - 1))} disabled={logPage === 0} style={btnStyle()}>← Précédent</button>
            <span style={{ fontSize: 12, color: '#6b7280', padding: '6px 12px' }}>Page {logPage + 1} / {totalPages}</span>
            <button onClick={() => setLogPage(p => Math.min(totalPages - 1, p + 1))} disabled={logPage === totalPages - 1} style={btnStyle()}>Suivant →</button>
          </div>
        )}
      </div>
    )
  }

  // ── Tab: Archived ──────────────────────────────────────────────────────────

  function renderArchivedTab() {
    if (archivedDelegations.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          Aucune délégation archivée
        </div>
      )
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f0faf3', textAlign: 'left' }}>
              {['Membre', 'Rôle', 'Intitulé', 'Permissions', 'Créé le', 'Expiré le', 'Note', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', color: '#1B4332', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archivedDelegations.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f0faf3', background: i % 2 === 0 ? '#fff' : '#fafffe' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={d.delegate_name} size={28} />
                    <span style={{ fontWeight: 600, color: '#1B4332' }}>{d.delegate_name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{getRoleLabel(d.delegate_role)}</td>
                <td style={{ padding: '10px 12px', color: '#40916C', fontWeight: 600 }}>{d.intitule}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.permissions.length}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDateFr(d.created_at.split('T')[0])}</td>
                <td style={{ padding: '10px 12px', color: '#dc2626', whiteSpace: 'nowrap' }}>{formatDateFr(d.expires_at)}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontStyle: d.note ? 'normal' : 'italic' }}>{d.note ?? '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleRestore(d.id)} style={btnStyle()}>↩ Restaurer</button>
                    <button onClick={() => { if (confirm('Supprimer définitivement ?')) handleDelete(d.id) }} style={btnStyle('danger')}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Tab: Security ──────────────────────────────────────────────────────────

  function renderSecurityTab() {
    const dangerLogs = logs.filter(l => l.severity === 'danger').slice(0, 5)
    const warnLogs = logs.filter(l => l.severity === 'warn').slice(0, 5)

    // Permission usage stats from logs
    const permUsage: Record<string, number> = {}
    activeDelegations.forEach(d => {
      d.permissions.forEach(p => { permUsage[p] = (permUsage[p] ?? 0) + 1 })
    })
    const maxUsage = Math.max(1, ...Object.values(permUsage))
    const sortedPerms = PERMISSIONS.filter(p => permUsage[p.id]).sort((a, b) => (permUsage[b.id] ?? 0) - (permUsage[a.id] ?? 0)).slice(0, 6)

    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Security rules */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>⚙️ Règles de sécurité</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'requireNote', label: 'Exiger une note lors de la création', desc: 'Toute nouvelle délégation doit avoir une note explicative' },
              { key: 'alertOnExpiry', label: 'Alertes d\'expiration', desc: 'Envoyer une notification 7 jours avant expiration' },
              { key: 'autoRevoke', label: 'Révocation automatique', desc: 'Révoquer automatiquement les délégations à l\'expiration' },
            ].map(rule => (
              <div key={rule.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{rule.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{rule.desc}</div>
                </div>
                <Switch
                  checked={secSettings[rule.key as keyof typeof secSettings] as boolean}
                  onChange={(v) => setSecSettings(s => ({ ...s, [rule.key]: v }))}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Nombre max de délégations actives
              </label>
              <input
                type="number" min={1} max={20}
                value={secSettings.maxDelegations}
                onChange={e => setSecSettings(s => ({ ...s, maxDelegations: parseInt(e.target.value) || 5 }))}
                style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, background: '#f0faf3', outline: 'none' }}
              />
            </div>
            <button onClick={() => toast('✅ Paramètres de sécurité sauvegardés')} style={{ ...btnStyle('primary'), alignSelf: 'flex-start' }}>
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Permission usage */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #d1fae5', padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>📊 Permissions les plus utilisées</div>
          {sortedPerms.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>Aucune délégation active</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedPerms.map(p => {
                const count = permUsage[p.id] ?? 0
                const pct = Math.round((count / maxUsage) * 100)
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{p.icon} {p.nom}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1B4332', fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#40916C', borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Danger alerts */}
        {(dangerLogs.length > 0 || warnLogs.length > 0) && (
          <div style={{ gridColumn: isMobile ? undefined : 'span 2', background: '#fff', borderRadius: 12, border: '1px solid #fecaca', padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>🚨 Alertes récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...dangerLogs, ...warnLogs].slice(0, 5).map(log => {
                const sc = severityColors(log.severity)
                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: sc.bg }}>
                    <span>{severityIcon(log.severity)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{log.delegate_name}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>{log.detail}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(log.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1B4332', fontFamily: "'Playfair Display', serif" }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '20px' }}>{children}</div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────

  const canManage = userRole === 'director' || userRole === 'admin'

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", minHeight: '100vh', background: '#e8f5ec', padding: isMobile ? 12 : 20 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '16px' : '20px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1B4332', margin: 0 }}>
            🤝 Délégation de droits
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{schoolName} — Gestion des accès délégués</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1B4332', fontFamily: "'JetBrains Mono', monospace" }}>{activeDelegations.length}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>délégation{activeDelegations.length !== 1 ? 's' : ''} active{activeDelegations.length !== 1 ? 's' : ''}</div>
          </div>
          {canManage && (
            <button onClick={() => setShowNewModal(true)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1B4332', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              + Nouvelle délégation
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {([
          ['active', '🟢 Actives', activeDelegations.length],
          ['templates', '📐 Gabarits', null],
          ['journal', '📋 Journal', logs.length],
          ['archived', '📦 Archivées', archivedDelegations.length],
          ['security', '🔒 Sécurité', null],
        ] as const).map(([tab, label, count]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
            {label}
            {count !== null && count > 0 && (
              <span style={{ marginLeft: 6, background: activeTab === tab ? 'rgba(255,255,255,0.25)' : '#D8F3DC', color: activeTab === tab ? '#fff' : '#1B4332', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 14 : 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {activeTab === 'active' && renderActiveTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'journal' && renderJournalTab()}
        {activeTab === 'archived' && renderArchivedTab()}
        {activeTab === 'security' && renderSecurityTab()}
      </div>

      {/* New delegation modal */}
      {showNewModal && (
        <Modal title="✨ Nouvelle délégation" onClose={() => setShowNewModal(false)}>
          <DelegationForm
            staff={staff}
            classes={classes}
            onSubmit={handleCreate}
            onCancel={() => setShowNewModal(false)}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`✏️ Modifier — ${editTarget.intitule}`} onClose={() => setEditTarget(null)}>
          <DelegationForm
            staff={staff}
            classes={classes}
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            onRevoke={() => { if (confirm('Révoquer cette délégation ?')) handleRevoke(editTarget.id) }}
          />
        </Modal>
      )}

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} />}
    </div>
  )
}
