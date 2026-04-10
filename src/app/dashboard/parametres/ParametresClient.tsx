'use client'

import { useState } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const vert = '#1B4332'
const vertMoyen = '#40916C'
const vertClair = '#D8F3DC'
const vertPale = '#f0faf3'
const orange = '#F4A261'
const orangeClair = '#fff4ec'
const noir = '#0d1f16'
const gris = '#6b7280'
const grisClair = '#f3f4f6'
const grisMid = '#e5e7eb'
const blanc = '#ffffff'
const bordure = '#d1fae5'
const rouge = '#dc2626'
const rougeClair = '#fee2e2'
const bleu = '#1e40af'
const bleuClair = '#dbeafe'
const jaune = '#d97706'
const jauneClair = '#fef3c7'
const violet = '#7c3aed'
const violetClair = '#ede9fe'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  userId: string
  userRole: string
  userProfile: { full_name: string; phone: string; momo_phone: string; avatar_url: string }
  school: { id: string; name: string; address: string; phone: string; logo_url: string; plan: string; billing_status: string }
  schoolYear: string
  classes: Array<{ id: string; name: string; level: string | null; teacher_id: string | null; school_year: string; teacherName?: string | null }>
  subjects: Array<{ id: string; name: string; coefficient: number; class_id: string | null; teacher_id: string | null }>
  staff: Array<{ id: string; full_name: string; role: string; phone: string | null; momo_phone: string | null; avatar_url: string | null; is_active: boolean; created_at: string }>
  feeTypes: Array<{ id: string; name: string; amount: number; due_date: string | null; school_year: string }>
  auditLogs: Array<{ id: number; action: string; entity: string; entity_id: string | null; user_id: string | null; created_at: string }>
  unreadNotifCount: number
}

type TabId = 'profil' | 'securite' | 'notifications' | 'ecole' | 'annee' | 'frais' | 'classes' | 'matieres' | 'utilisateurs' | 'apparence' | 'communications' | 'integrations' | 'donnees' | 'activite'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function getColorFromStr(str: string): string {
  const colors = [vert, vertMoyen, bleu, violet, '#be185d', jaune, '#065f46', '#9a3412']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    director: 'Directeur', teacher: 'Enseignant', accountant: 'Comptable',
    admin: 'Admin', service: 'Service', parent: 'Parent', student: 'Élève',
  }
  return map[role] ?? role
}

function getRoleBadgeColor(role: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    director: { bg: vertClair, color: vert },
    teacher: { bg: bleuClair, color: bleu },
    accountant: { bg: jauneClair, color: jaune },
    admin: { bg: violetClair, color: violet },
    service: { bg: orangeClair, color: orange },
  }
  return map[role] ?? { bg: grisClair, color: gris }
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 24, flexShrink: 0,
        background: checked ? vertMoyen : grisMid,
        borderRadius: 99, cursor: 'pointer', transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', height: 18, width: 18, bottom: 3,
        left: checked ? 23 : 3,
        background: blanc, borderRadius: '50%', transition: 'left .2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ParametresClient(props: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('profil')
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: props.userProfile.full_name,
    phone: props.userProfile.phone,
    momo_phone: props.userProfile.momo_phone,
  })
  const [schoolForm, setSchoolForm] = useState({
    name: props.school.name,
    address: props.school.address,
    phone: props.school.phone,
  })
  const [subjectsLocal, setSubjectsLocal] = useState(props.subjects)
  const [feeTypesLocal, setFeeTypesLocal] = useState(props.feeTypes)
  const [notifToggles, setNotifToggles] = useState({
    app: true, sms: true, email: false, whatsapp: false,
    paiement: true, impaye: true, bulletin: true, absence: true,
    notes: false, message: true, connexion: true, calendrier: false, rapport: true,
  })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  // Apparence toggles
  const [themeSombre, setThemeSombre] = useState(false)
  const [densiteCompacte, setDensiteCompacte] = useState(false)
  const [grandePolice, setGrandePolice] = useState(false)
  const [animations, setAnimations] = useState(true)
  // Données toggles
  const [autoBackup, setAutoBackup] = useState(true)

  function showToast(msg: string) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3200)
  }

  // ── Styles ──
  const cardStyle: React.CSSProperties = {
    background: blanc,
    border: `1px solid ${bordure}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  }

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15,
    fontWeight: 700,
    color: vert,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${bordure}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: noir,
    background: blanc,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Source Sans 3', sans-serif",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: gris,
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  }

  const btnPrimary: React.CSSProperties = {
    background: vert,
    color: blanc,
    border: 'none',
    borderRadius: 8,
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
    fontFamily: "'Source Sans 3', sans-serif",
  }

  const btnSecondary: React.CSSProperties = {
    background: grisClair,
    color: noir,
    border: `1px solid ${grisMid}`,
    borderRadius: 8,
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
  }

  const btnDanger: React.CSSProperties = {
    background: rougeClair,
    color: rouge,
    border: `1px solid ${rouge}`,
    borderRadius: 8,
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
  }

  const fieldGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 12,
  }

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 600,
    color: vert,
    borderBottom: `1px solid ${bordure}`,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: `1px solid ${grisClair}`,
    fontSize: 13,
    color: noir,
    verticalAlign: 'middle',
  }

  // ── Tab definitions ──
  const tabSections = [
    {
      label: 'Compte',
      tabs: [
        { id: 'profil' as TabId, icon: '👤', label: 'Profil' },
        { id: 'securite' as TabId, icon: '🔒', label: 'Sécurité' },
        { id: 'notifications' as TabId, icon: '🔔', label: 'Notifications' },
      ],
    },
    {
      label: 'École',
      tabs: [
        { id: 'ecole' as TabId, icon: '🏫', label: 'Informations' },
        { id: 'annee' as TabId, icon: '📅', label: 'Année scolaire' },
        { id: 'frais' as TabId, icon: '💰', label: 'Frais' },
        { id: 'classes' as TabId, icon: '🎓', label: 'Classes' },
        { id: 'matieres' as TabId, icon: '📚', label: 'Matières' },
      ],
    },
    {
      label: 'Système',
      tabs: [
        { id: 'utilisateurs' as TabId, icon: '👥', label: 'Utilisateurs' },
        { id: 'apparence' as TabId, icon: '🎨', label: 'Apparence' },
        { id: 'communications' as TabId, icon: '📡', label: 'Communications' },
        { id: 'integrations' as TabId, icon: '🔗', label: 'Intégrations' },
        { id: 'donnees' as TabId, icon: '💾', label: 'Données' },
        { id: 'activite' as TabId, icon: '📋', label: 'Journal' },
      ],
    },
  ]

  // ─── API helpers ─────────────────────────────────────────────────────────────
  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch(`/api/personnel?id=${props.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
      showToast('Profil mis à jour ✓')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function saveSchool() {
    setSaving(true)
    try {
      const res = await fetch('/api/parametres/ecole', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolForm),
      })
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
      showToast('École mise à jour ✓')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function saveFeeType(ft: { id: string; name: string; amount: number; due_date: string | null; school_year: string }) {
    setSaving(true)
    try {
      const res = await fetch(`/api/parametres/frais?id=${ft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: ft.amount }),
      })
      if (!res.ok) throw new Error('Erreur')
      showToast('Frais mis à jour ✓')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function saveSubject(s: { id: string; name: string; coefficient: number }) {
    setSaving(true)
    try {
      const res = await fetch(`/api/subjects?id=${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, coefficient: s.coefficient }),
      })
      if (!res.ok) throw new Error('Erreur')
      showToast('Matière mise à jour ✓')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ─── Tab renderers ────────────────────────────────────────────────────────────

  function renderProfil() {
    const initials = getInitials(profileForm.full_name || 'U')
    const color = getColorFromStr(profileForm.full_name || 'U')
    const roleBadge = getRoleBadgeColor(props.userRole)
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>👤 Informations personnelles</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: blanc, flexShrink: 0,
            }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: noir }}>{profileForm.full_name}</div>
              <span style={{
                display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, background: roleBadge.bg, color: roleBadge.color,
              }}>{getRoleLabel(props.userRole)}</span>
            </div>
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input style={inputStyle} value={profileForm.full_name}
                onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Téléphone MoMo</label>
            <input style={inputStyle} value={profileForm.momo_phone}
              onChange={e => setProfileForm(f => ({ ...f, momo_phone: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Rôle</label>
            <div style={{
              padding: '8px 12px', borderRadius: 8, background: grisClair, fontSize: 13, color: gris,
              border: `1px solid ${grisMid}`,
            }}>{getRoleLabel(props.userRole)}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>🌍 Préférences régionales</div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Langue</label>
              <select style={{ ...inputStyle }} defaultValue="fr">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fuseau horaire</label>
              <select style={{ ...inputStyle }} defaultValue="Africa/Abidjan">
                <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
                <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Devise</label>
              <select style={{ ...inputStyle }} defaultValue="XOF">
                <option value="XOF">FCFA (XOF)</option>
                <option value="XAF">FCFA (XAF)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Format de date</label>
              <select style={{ ...inputStyle }} defaultValue="dd/mm/yyyy">
                <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={btnSecondary} onClick={() => setProfileForm({
            full_name: props.userProfile.full_name,
            phone: props.userProfile.phone,
            momo_phone: props.userProfile.momo_phone,
          })}>Annuler</button>
          <button style={btnPrimary} disabled={saving} onClick={saveProfile}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    )
  }

  function renderSecurite() {
    const pwStrength = pwForm.next.length === 0 ? 0 : pwForm.next.length < 6 ? 1 : pwForm.next.length < 10 ? 2 : 3
    const strengthLabel = ['', 'Faible', 'Moyen', 'Fort']
    const strengthColor = ['', rouge, jaune, vertMoyen]
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>🔐 Sécurité du compte</div>
          <div style={{
            background: vertPale, border: `1px solid ${bordure}`, borderRadius: 8,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: vert }}>Compte sécurisé</div>
              <div style={{ fontSize: 12, color: gris }}>Dernière connexion: aujourd&apos;hui</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Authentification', val: 'Email + Mot de passe' },
              { label: 'Double facteur', val: 'Non activé' },
              { label: 'Sessions actives', val: '3' },
              { label: 'Dernière modification', val: 'Il y a 30 jours' },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: grisClair, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: gris, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: noir, fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>🔑 Changer le mot de passe</div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Mot de passe actuel</label>
            <input type="password" style={inputStyle} value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input type="password" style={inputStyle} value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
              {pwForm.next && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: i <= pwStrength ? strengthColor[pwStrength] : grisMid,
                    }} />
                  ))}
                  <span style={{ fontSize: 11, color: strengthColor[pwStrength], fontWeight: 600 }}>
                    {strengthLabel[pwStrength]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input type="password"
                style={{ ...inputStyle, borderColor: pwForm.confirm && pwForm.confirm !== pwForm.next ? rouge : bordure }}
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                <div style={{ fontSize: 11, color: rouge, marginTop: 4 }}>Les mots de passe ne correspondent pas</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnPrimary} disabled={saving || !pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm}
              onClick={() => { showToast('Mot de passe modifié ✓'); setPwForm({ current: '', next: '', confirm: '' }) }}>
              Modifier le mot de passe
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>💻 Sessions actives</div>
          {[
            { browser: 'Chrome 124', device: 'MacBook Pro', ip: '196.x.x.1', current: true },
            { browser: 'Firefox 125', device: 'iPhone 14', ip: '196.x.x.2', current: false },
            { browser: 'Safari 17', device: 'iPad Pro', ip: '196.x.x.3', current: false },
          ].map(({ browser, device, ip, current }) => (
            <div key={ip} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: `1px solid ${grisClair}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20 }}>{device.includes('iPhone') ? '📱' : device.includes('iPad') ? '📟' : '💻'}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>{browser} — {device}</div>
                  <div style={{ fontSize: 11, color: gris }}>IP: {ip} {current ? '• Session actuelle' : ''}</div>
                </div>
                {current && <span style={{ background: vertClair, color: vert, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Actuelle</span>}
              </div>
              {!current && (
                <button style={{ ...btnDanger, padding: '5px 12px', fontSize: 12 }}
                  onClick={() => showToast('Session révoquée')}>Révoquer</button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderNotifications() {
    type NotifToggleKey = keyof typeof notifToggles
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>📡 Canaux de notification</div>
          {([
            { key: 'app' as NotifToggleKey, icon: '📱', label: 'Notifications app', desc: 'Alertes dans l\'application' },
            { key: 'sms' as NotifToggleKey, icon: '💬', label: 'SMS', desc: 'Messages texte sur votre téléphone' },
            { key: 'email' as NotifToggleKey, icon: '📧', label: 'Email', desc: 'Notifications par email' },
            { key: 'whatsapp' as NotifToggleKey, icon: '💚', label: 'WhatsApp', desc: 'Messages WhatsApp' },
          ]).map(({ key, icon, label, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: `1px solid ${grisClair}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>{label}</div>
                  <div style={{ fontSize: 11, color: gris }}>{desc}</div>
                </div>
              </div>
              <Toggle checked={notifToggles[key]} onChange={v => setNotifToggles(t => ({ ...t, [key]: v }))} />
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>🔔 Types d&apos;alertes</div>
          {([
            { key: 'paiement' as NotifToggleKey, icon: '💰', label: 'Paiements reçus' },
            { key: 'impaye' as NotifToggleKey, icon: '⚠️', label: 'Impayés' },
            { key: 'bulletin' as NotifToggleKey, icon: '📄', label: 'Bulletins publiés' },
            { key: 'absence' as NotifToggleKey, icon: '📋', label: 'Absences' },
            { key: 'notes' as NotifToggleKey, icon: '✏️', label: 'Nouvelles notes' },
            { key: 'message' as NotifToggleKey, icon: '💬', label: 'Nouveaux messages' },
            { key: 'connexion' as NotifToggleKey, icon: '🔐', label: 'Connexions' },
            { key: 'calendrier' as NotifToggleKey, icon: '📅', label: 'Rappels calendrier' },
            { key: 'rapport' as NotifToggleKey, icon: '📊', label: 'Rapports disponibles' },
          ]).map(({ key, icon, label }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: `1px solid ${grisClair}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{icon}</span>
                <span style={{ fontSize: 13, color: noir }}>{label}</span>
              </div>
              <Toggle checked={notifToggles[key]} onChange={v => setNotifToggles(t => ({ ...t, [key]: v }))} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={btnPrimary} onClick={() => showToast('Préférences de notification sauvegardées ✓')}>
            Sauvegarder
          </button>
        </div>
      </div>
    )
  }

  function renderEcole() {
    const schoolInitials = getInitials(schoolForm.name || 'E')
    const planColors: Record<string, { bg: string; color: string }> = {
      standard: { bg: bleuClair, color: bleu },
      premium: { bg: violetClair, color: violet },
      free: { bg: grisClair, color: gris },
    }
    const planColor = planColors[props.school.plan] ?? planColors['standard']
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>🏫 Informations de l&apos;école</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 12, background: vert,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: blanc, flexShrink: 0,
            }}>{schoolInitials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: noir }}>{schoolForm.name}</div>
              <span style={{
                display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, background: planColor.bg, color: planColor.color,
                textTransform: 'uppercase',
              }}>{props.school.plan}</span>
              <span style={{
                display: 'inline-block', marginLeft: 6, padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                background: props.school.billing_status === 'active' ? vertClair : rougeClair,
                color: props.school.billing_status === 'active' ? vert : rouge,
              }}>{props.school.billing_status === 'active' ? 'Actif' : 'Suspendu'}</span>
            </div>
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Nom de l&apos;école</label>
              <input style={inputStyle} value={schoolForm.name}
                onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} value={schoolForm.phone}
                onChange={e => setSchoolForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Adresse</label>
            <input style={inputStyle} value={schoolForm.address}
              onChange={e => setSchoolForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Email (contact)</label>
              <input style={{ ...inputStyle, background: grisClair, color: gris }} value="contact@ecole.ci" disabled />
            </div>
            <div>
              <label style={labelStyle}>Site web</label>
              <input style={{ ...inputStyle, background: grisClair, color: gris }} value="https://ecole.ci" disabled />
            </div>
            <div>
              <label style={labelStyle}>Capacité d&apos;accueil</label>
              <input style={{ ...inputStyle, background: grisClair, color: gris }} value="500 élèves" disabled />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button style={btnSecondary} onClick={() => setSchoolForm({ name: props.school.name, address: props.school.address, phone: props.school.phone })}>
              Annuler
            </button>
            <button style={btnPrimary} disabled={saving || props.userRole !== 'director'} onClick={saveSchool}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
          {props.userRole !== 'director' && (
            <div style={{ fontSize: 11, color: rouge, marginTop: 6, textAlign: 'right' }}>
              Seul le directeur peut modifier ces informations
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderAnnee() {
    const [yearStart, yearEnd] = props.schoolYear.split('-')
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>📅 Année scolaire {props.schoolYear}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: vertPale, borderRadius: 8, padding: 12, border: `1px solid ${bordure}` }}>
              <div style={{ fontSize: 11, color: gris, fontWeight: 600 }}>DÉBUT</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: vert, fontFamily: 'monospace' }}>
                01/09/{yearStart}
              </div>
            </div>
            <div style={{ background: vertPale, borderRadius: 8, padding: 12, border: `1px solid ${bordure}` }}>
              <div style={{ fontSize: 11, color: gris, fontWeight: 600 }}>FIN</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: vert, fontFamily: 'monospace' }}>
                30/06/{yearEnd}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: noir, marginBottom: 10 }}>Trimestres</div>
          {[
            { label: '1er Trimestre', start: `01/10/${yearStart}`, end: `22/12/${yearStart}` },
            { label: '2ème Trimestre', start: `08/01/${yearEnd}`, end: `28/03/${yearEnd}` },
            { label: '3ème Trimestre', start: `14/04/${yearEnd}`, end: `30/06/${yearEnd}` },
          ].map(({ label, start, end }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: grisClair, borderRadius: 8, marginBottom: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: noir }}>{label}</span>
              <span style={{ fontSize: 12, color: gris, fontFamily: 'monospace' }}>{start} → {end}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>🗓️ Calendrier scolaire</div>
          {[
            { label: 'Vacances de la Toussaint', start: `28/10/${yearStart}`, end: `06/11/${yearStart}`, color: orangeClair, text: orange },
            { label: 'Vacances de Noël', start: `23/12/${yearStart}`, end: `07/01/${yearEnd}`, color: jauneClair, text: jaune },
            { label: 'Vacances d\'hiver', start: `10/02/${yearEnd}`, end: `21/02/${yearEnd}`, color: bleuClair, text: bleu },
            { label: 'Vacances de Pâques', start: `14/04/${yearEnd}`, end: `28/04/${yearEnd}`, color: violetClair, text: violet },
            { label: 'Grandes vacances d\'été', start: `01/07/${yearEnd}`, end: `31/08/${yearEnd}`, color: vertClair, text: vert },
          ].map(({ label, start, end, color, text }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: color, borderRadius: 8, marginBottom: 8,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</div>
              <div style={{ fontSize: 12, color: text, fontFamily: 'monospace' }}>{start} — {end}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderFrais() {
    const grouped: Record<string, typeof feeTypesLocal> = {}
    feeTypesLocal.forEach(ft => {
      if (!grouped[ft.school_year]) grouped[ft.school_year] = []
      grouped[ft.school_year].push(ft)
    })
    const totalBudget = feeTypesLocal.reduce((sum, ft) => sum + ft.amount, 0)

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Types de frais', val: feeTypesLocal.length, color: vert },
            { label: 'Total (année courante)', val: `${feeTypesLocal.filter(f => f.school_year === props.schoolYear).reduce((s, f) => s + f.amount, 0).toLocaleString('fr-FR')} FCFA`, color: bleu },
            { label: 'Budget total configuré', val: `${totalBudget.toLocaleString('fr-FR')} FCFA`, color: violet },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: blanc, border: `1px solid ${bordure}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: gris, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'monospace' }}>{val}</div>
            </div>
          ))}
        </div>

        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([year, items]) => (
          <div key={year} style={cardStyle}>
            <div style={cardTitleStyle}>💰 Frais — Année {year}</div>
            {items.map(ft => (
              <div key={ft.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: `1px solid ${grisClair}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>{ft.name}</div>
                  {ft.due_date && <div style={{ fontSize: 11, color: gris }}>Échéance: {ft.due_date}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 120, textAlign: 'right', fontFamily: 'monospace' }}
                    value={ft.amount}
                    onChange={e => setFeeTypesLocal(prev => prev.map(f => f.id === ft.id ? { ...f, amount: parseInt(e.target.value, 10) || 0 } : f))}
                  />
                  <span style={{ fontSize: 12, color: gris, whiteSpace: 'nowrap' }}>FCFA</span>
                  <button style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }} disabled={saving}
                    onClick={() => saveFeeType(ft)}>✓</button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: gris }}>
            Aucun type de frais configuré
          </div>
        )}

        <div style={cardStyle}>
          <div style={cardTitleStyle}>📊 Configuration des plans de paiement</div>
          {[
            { label: 'Paiement intégral', desc: 'Dès le début de l\'année', discount: '5% de réduction', color: vertClair, text: vert },
            { label: 'Paiement trimestriel', desc: '3 versements égaux', discount: 'Pas de surcoût', color: bleuClair, text: bleu },
            { label: 'Paiement mensuel', desc: '10 mensualités', discount: '+2% de frais', color: jauneClair, text: jaune },
          ].map(({ label, desc, discount, color, text }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: color, borderRadius: 8, marginBottom: 8,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{label}</div>
                <div style={{ fontSize: 11, color: text }}>{desc}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{discount}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderClasses() {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>🎓 Classes — {props.schoolYear}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: vertPale }}>
                <th style={thStyle}>Classe</th>
                <th style={thStyle}>Niveau</th>
                <th style={thStyle}>Enseignant principal</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Matières</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {props.classes.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: gris }}>Aucune classe</td></tr>
              ) : props.classes.map(c => (
                <tr key={c.id} style={{ transition: 'background .15s' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: vert }}>{c.name}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: bleuClair, color: bleu, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {c.level ?? '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {c.teacherName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', background: getColorFromStr(c.teacherName),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: blanc, flexShrink: 0,
                        }}>{getInitials(c.teacherName)}</div>
                        <span style={{ fontSize: 13 }}>{c.teacherName}</span>
                      </div>
                    ) : <span style={{ color: gris }}>Non assigné</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                    {props.subjects.filter(s => s.class_id === c.id).length}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ background: vertClair, color: vert, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderMatieres() {
    const totalCoeff = subjectsLocal.reduce((s, sub) => s + sub.coefficient, 0)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: gris }}>
            Total des coefficients: <strong style={{ color: vert, fontFamily: 'monospace' }}>{totalCoeff}</strong>
          </div>
          <button style={btnPrimary} disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                await Promise.all(subjectsLocal.map(s => saveSubject(s)))
                showToast('Toutes les matières sauvegardées ✓')
              } finally {
                setSaving(false)
              }
            }}>
            {saving ? 'Sauvegarde...' : 'Tout sauvegarder'}
          </button>
        </div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>📚 Matières</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: vertPale }}>
                  <th style={thStyle}>Matière</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Note max</th>
                  <th style={thStyle}>Classe</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectsLocal.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: gris }}>Aucune matière</td></tr>
                ) : subjectsLocal.map(sub => {
                  const cls = props.classes.find(c => c.id === sub.class_id)
                  return (
                    <tr key={sub.id}>
                      <td style={tdStyle}>
                        <input style={{ ...inputStyle, width: '100%' }} value={sub.name}
                          onChange={e => setSubjectsLocal(prev => prev.map(s => s.id === sub.id ? { ...s, name: e.target.value } : s))} />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input type="number" min={1} max={9}
                          style={{ ...inputStyle, width: 60, textAlign: 'center', fontFamily: 'monospace' }}
                          value={sub.coefficient}
                          onChange={e => setSubjectsLocal(prev => prev.map(s => s.id === sub.id ? { ...s, coefficient: parseInt(e.target.value, 10) || 1 } : s))} />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace', color: gris }}>20</td>
                      <td style={tdStyle}>{cls ? cls.name : <span style={{ color: gris }}>—</span>}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11 }} disabled={saving}
                          onClick={() => saveSubject(sub)}>✓ Sauver</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderUtilisateurs() {
    const permissions = ['Voir', 'Créer', 'Modifier', 'Supprimer', 'Rapports', 'Config']
    const roles = [
      { role: 'director', perms: [true, true, true, true, true, true] },
      { role: 'accountant', perms: [true, true, true, false, true, false] },
      { role: 'admin', perms: [true, true, true, true, false, false] },
      { role: 'teacher', perms: [true, true, false, false, false, false] },
      { role: 'service', perms: [true, false, false, false, false, false] },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>👥 Personnel</div>
          {props.staff.length === 0 ? (
            <div style={{ color: gris, textAlign: 'center', padding: 20 }}>Aucun personnel</div>
          ) : props.staff.map(member => {
            const badgeColor = getRoleBadgeColor(member.role)
            const initials = getInitials(member.full_name)
            const color = getColorFromStr(member.full_name)
            return (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: `1px solid ${grisClair}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: blanc, flexShrink: 0,
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>{member.full_name}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                      background: badgeColor.bg, color: badgeColor.color,
                    }}>{getRoleLabel(member.role)}</span>
                  </div>
                </div>
                <Toggle checked={member.is_active} onChange={() => showToast('Statut mis à jour')} />
              </div>
            )
          })}
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>🛡️ Permissions par rôle</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, paddingLeft: 0 }}>Rôle</th>
                  {permissions.map(p => <th key={p} style={{ ...thStyle, textAlign: 'center', fontSize: 10 }}>{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {roles.map(({ role, perms }) => {
                  const badgeColor = getRoleBadgeColor(role)
                  return (
                    <tr key={role}>
                      <td style={{ ...tdStyle, paddingLeft: 0 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: badgeColor.bg, color: badgeColor.color,
                        }}>{getRoleLabel(role)}</span>
                      </td>
                      {perms.map((has, i) => (
                        <td key={i} style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ color: has ? vertMoyen : grisMid, fontSize: 14 }}>{has ? '✓' : '✗'}</span>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderApparence() {
    const swatches = [vert, vertMoyen, bleu, violet, '#be185d', jaune, orange, rouge]
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>🎨 Palette de couleurs</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {swatches.map(color => (
              <div key={color} style={{
                width: 44, height: 44, borderRadius: 10, background: color, cursor: 'pointer',
                border: color === vert ? `3px solid ${noir}` : `2px solid transparent`,
                transition: 'transform .15s',
              }} title={color} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: gris }}>Couleur principale sélectionnée: <strong style={{ color: vert }}>{vert}</strong></div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>⚙️ Paramètres d&apos;interface</div>
          {([
            { label: 'Thème sombre', desc: 'Interface en mode sombre', checked: themeSombre, onChange: setThemeSombre },
            { label: 'Densité compacte', desc: 'Affichage plus condensé', checked: densiteCompacte, onChange: setDensiteCompacte },
            { label: 'Grande police', desc: 'Taille de texte augmentée', checked: grandePolice, onChange: setGrandePolice },
            { label: 'Animations', desc: 'Transitions et animations UI', checked: animations, onChange: setAnimations },
          ] as Array<{ label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }>).map(({ label, desc, checked, onChange }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: `1px solid ${grisClair}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>{label}</div>
                <div style={{ fontSize: 11, color: gris }}>{desc}</div>
              </div>
              <Toggle checked={checked} onChange={onChange} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderCommunications() {
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>📡 Configuration SMS</div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Opérateur SMS</label>
            <select style={{ ...inputStyle }} defaultValue="africas_talking">
              <option value="africas_talking">Africa&apos;s Talking</option>
              <option value="twilio">Twilio</option>
              <option value="orange">Orange SMS API</option>
              <option value="mtn">MTN Business SMS</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Clé API</label>
            <input type="password" style={inputStyle} defaultValue="at_live_xxxxxxxxxxxx" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Expéditeur (Sender ID)</label>
            <input style={inputStyle} defaultValue="SUKULU" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnPrimary} onClick={() => showToast('Test SMS envoyé ✓')}>Envoyer un SMS test</button>
            <button style={btnSecondary} onClick={() => showToast('Configuration sauvegardée ✓')}>Sauvegarder</button>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>📝 Modèles de messages</div>
          {[
            { id: 'paiement', icon: '💰', label: 'Confirmation de paiement', msg: 'Bonjour {parent}, le paiement de {montant} FCFA pour {eleve} a été reçu. Merci.' },
            { id: 'impaye', icon: '⚠️', label: 'Rappel impayé', msg: 'Bonjour {parent}, un rappel de paiement de {montant} FCFA est attendu pour {eleve}.' },
            { id: 'absence', icon: '📋', label: 'Notification d\'absence', msg: 'Bonjour {parent}, votre enfant {eleve} a été absent(e) le {date}.' },
            { id: 'bulletin', icon: '📄', label: 'Bulletin disponible', msg: 'Bonjour {parent}, le bulletin de {eleve} pour le {trimestre} est disponible.' },
            { id: 'inscription', icon: '✅', label: 'Confirmation d\'inscription', msg: 'Bonjour {parent}, l\'inscription de {eleve} en classe {classe} est confirmée.' },
          ].map(({ id, icon, label, msg }) => (
            <div key={id} style={{ background: grisClair, borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: noir }}>{icon} {label}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...btnSecondary, padding: '4px 10px', fontSize: 11 }}
                    onClick={() => showToast('Modèle en édition...')}>Éditer</button>
                  <button style={{ ...btnPrimary, padding: '4px 10px', fontSize: 11 }}
                    onClick={() => showToast('Message test envoyé ✓')}>Tester</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: gris, fontStyle: 'italic' }}>{msg}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderIntegrations() {
    const integrations = [
      { name: 'Africa\'s Talking', icon: '📡', desc: 'SMS & voix', connected: true, color: vertClair, text: vert },
      { name: 'Mailjet', icon: '📧', desc: 'Emails transactionnels', connected: true, color: bleuClair, text: bleu },
      { name: 'WhatsApp Business', icon: '💚', desc: 'Messagerie WhatsApp', connected: false, color: grisClair, text: gris },
      { name: 'MTN MoMo', icon: '📱', desc: 'Paiements mobile money', connected: true, color: jauneClair, text: jaune },
      { name: 'Ecobank', icon: '🏦', desc: 'Paiements bancaires', connected: false, color: grisClair, text: gris },
      { name: 'Google Drive', icon: '💾', desc: 'Sauvegarde cloud', connected: false, color: grisClair, text: gris },
      { name: 'Google Sheets', icon: '📊', desc: 'Export automatique', connected: false, color: grisClair, text: gris },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {integrations.map(({ name, icon, desc, connected, color, text }) => (
          <div key={name} style={{
            background: blanc, border: `1px solid ${bordure}`, borderRadius: 12, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: noir }}>{name}</div>
            <div style={{ fontSize: 11, color: gris }}>{desc}</div>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: connected ? color : grisClair, color: connected ? text : gris,
              width: 'fit-content',
            }}>{connected ? '● Connecté' : '○ Non connecté'}</span>
            <button style={connected ? { ...btnSecondary, marginTop: 4, fontSize: 12, padding: '6px 12px' } : { ...btnPrimary, marginTop: 4, fontSize: 12, padding: '6px 12px' }}
              onClick={() => showToast(connected ? `${name} déconnecté` : `${name} — connexion en cours...`)}>
              {connected ? 'Déconnecter' : 'Connecter'}
            </button>
          </div>
        ))}
      </div>
    )
  }

  function renderDonnees() {
    return (
      <div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>💾 Sauvegarde automatique</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${grisClair}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: noir }}>Sauvegardes automatiques</div>
              <div style={{ fontSize: 11, color: gris }}>Sauvegarde quotidienne de la base de données</div>
            </div>
            <Toggle checked={autoBackup} onChange={setAutoBackup} />
          </div>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>Fréquence</label>
              <select style={{ ...inputStyle }} defaultValue="daily">
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Rétention (jours)</label>
              <select style={{ ...inputStyle }} defaultValue="30">
                <option value="7">7 jours</option>
                <option value="30">30 jours</option>
                <option value="90">90 jours</option>
                <option value="365">1 an</option>
              </select>
            </div>
          </div>
          <button style={btnPrimary} onClick={() => showToast('Sauvegarde lancée ✓')}>
            Sauvegarder maintenant
          </button>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>📤 Exporter les données</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Élèves', icon: '🎓' },
              { label: 'Paiements', icon: '💰' },
              { label: 'Notes', icon: '✏️' },
              { label: 'Absences', icon: '📋' },
              { label: 'Personnel', icon: '👥' },
              { label: 'Tout exporter', icon: '📦' },
            ].map(({ label, icon }) => (
              <button key={label} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                onClick={() => showToast(`Export ${label} en cours...`)}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, border: `1px solid ${rouge}` }}>
          <div style={{ ...cardTitleStyle, color: rouge }}>⚠️ Zone de danger</div>
          <div style={{ fontSize: 13, color: gris, marginBottom: 14 }}>
            Ces actions sont irréversibles. Procédez avec la plus grande prudence.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={btnDanger}
              onClick={() => showToast('⚠️ Action non autorisée — contactez le support')}>
              Réinitialiser les données de l&apos;année
            </button>
            <button style={{ ...btnDanger, background: rouge, color: blanc }}
              onClick={() => showToast('⚠️ Suppression non autorisée — contactez le support')}>
              Supprimer le compte école
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderActivite() {
    const entityIcons: Record<string, string> = {
      student: '🎓', payment: '💰', attendance: '📋', grade: '✏️',
      profile: '👤', school: '🏫', class: '🎒', subject: '📚',
      fee_type: '💸', message: '💬',
    }
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>📋 Journal d&apos;activité</div>
        {props.auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: gris }}>Aucune activité enregistrée</div>
        ) : (
          <div style={{ position: 'relative' }}>
            {props.auditLogs.map((log, i) => {
              const icon = entityIcons[log.entity] ?? '📄'
              const date = new Date(log.created_at)
              const dateStr = `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              const actionColors: Record<string, { bg: string; color: string }> = {
                INSERT: { bg: vertClair, color: vert },
                UPDATE: { bg: bleuClair, color: bleu },
                DELETE: { bg: rougeClair, color: rouge },
              }
              const actionColor = actionColors[log.action] ?? { bg: grisClair, color: gris }
              return (
                <div key={log.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: i < props.auditLogs.length - 1 ? `1px solid ${grisClair}` : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: grisClair,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                        background: actionColor.bg, color: actionColor.color,
                      }}>{log.action}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: noir }}>{log.entity}</span>
                      {log.entity_id && (
                        <span style={{ fontSize: 11, color: gris, fontFamily: 'monospace' }}>#{log.entity_id.slice(0, 8)}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: gris }}>{dateStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── Tab content dispatcher ───────────────────────────────────────────────────
  function renderTab() {
    switch (activeTab) {
      case 'profil': return renderProfil()
      case 'securite': return renderSecurite()
      case 'notifications': return renderNotifications()
      case 'ecole': return renderEcole()
      case 'annee': return renderAnnee()
      case 'frais': return renderFrais()
      case 'classes': return renderClasses()
      case 'matieres': return renderMatieres()
      case 'utilisateurs': return renderUtilisateurs()
      case 'apparence': return renderApparence()
      case 'communications': return renderCommunications()
      case 'integrations': return renderIntegrations()
      case 'donnees': return renderDonnees()
      case 'activite': return renderActivite()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", color: noir, minHeight: '100vh' }}>
      {/* Toast */}
      {toastVisible && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: vert, color: blanc, padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'opacity .3s',
        }}>{toastMsg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24, fontWeight: 700, color: vert, margin: 0,
        }}>Paramètres</h1>
        <div style={{ fontSize: 12, color: gris, marginTop: 2 }}>
          {props.school.name} — Année {props.schoolYear}
          {props.unreadNotifCount > 0 && (
            <span style={{
              marginLeft: 10, background: rouge, color: blanc,
              padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            }}>{props.unreadNotifCount} notif.</span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {tabSections.map((section, si) => (
            <div key={section.label} style={{ display: 'flex', alignItems: 'center' }}>
              {si > 0 && <div style={{ width: 1, background: grisMid, height: 28, margin: '0 8px' }} />}
              <div style={{ fontSize: 10, fontWeight: 700, color: gris, textTransform: 'uppercase', marginRight: 6, letterSpacing: 0.5 }}>
                {section.label}
              </div>
              {section.tabs.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8, border: 'none',
                    background: isActive ? vert : 'transparent',
                    color: isActive ? blanc : vertMoyen,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13, cursor: 'pointer',
                    transition: 'all .15s',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}>
                    <span style={{ fontSize: 14 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>{renderTab()}</div>
    </div>
  )
}
