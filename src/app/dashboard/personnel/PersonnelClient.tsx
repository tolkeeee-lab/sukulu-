'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

// ─── Types ─────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string
  full_name: string
  role: string
  phone: string | null
  momo_phone: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string
}

interface PersonnelClientProps {
  schoolId: string
  userId: string
  userRole: string
  staff: StaffMember[]
}

// ─── Static fallback data ───────────────────────────────────────────────────────

const STAFF_STATIC = [
  { id: 'komlan',   nom: 'M. Komlan Directeur',     ini: 'MK',  bg: '#D8F3DC',  col: '#1B4332', poste: 'Directeur Général',            cat: 'direction',  sal: 350000, tel: '+229 97 00 00 00', email: 'komlan@ecole.bj',     classes: [] as string[],      presence: 'present', contrat: 'CDI', anciennete: '12 ans', diplome: 'BAPC · ENAM 2014' },
  { id: 'agossou',  nom: 'M. Agossou Didier',        ini: 'AD',  bg: '#dbeafe',  col: '#1e40af', poste: 'Maître de classe CM2-A',        cat: 'enseignant', sal: 155000, tel: '+229 97 12 34 56', email: 'agossou.d@ecole.bj',  classes: ['CM2-A'],           presence: 'present', contrat: 'CDI', anciennete: '6 ans',  diplome: 'CAPEM · INFRE 2018' },
  { id: 'tossou',   nom: 'Mme Tossou Béatrice',      ini: 'TB',  bg: '#fce7f3',  col: '#be185d', poste: 'Maîtresse de classe CM2-B',     cat: 'enseignant', sal: 155000, tel: '+229 97 55 66 77', email: 'tossou.b@ecole.bj',   classes: ['CM2-B'],           presence: 'present', contrat: 'CDI', anciennete: '4 ans',  diplome: 'CAPEM · INFRE 2020' },
  { id: 'dossou',   nom: 'M. Dossou René',            ini: 'DR',  bg: '#dcfce7',  col: '#166534', poste: 'Maître de classe CM1-A',        cat: 'enseignant', sal: 150000, tel: '+229 95 22 33 44', email: 'dossou.r@ecole.bj',   classes: ['CM1-A'],           presence: 'present', contrat: 'CDI', anciennete: '5 ans',  diplome: 'CAPEM · INFRE 2019' },
  { id: 'gnanli',   nom: 'Mme Gnanli Rose',           ini: 'GR2', bg: '#fef9c3',  col: '#854d0e', poste: 'Maîtresse de classe CE2-A',     cat: 'enseignant', sal: 150000, tel: '+229 96 44 55 66', email: 'gnanli.r@ecole.bj',   classes: ['CE2-A'],           presence: 'present', contrat: 'CDI', anciennete: '3 ans',  diplome: 'CAPEM · INFRE 2021' },
  { id: 'sohou',    nom: 'Mme Sohou Alice',           ini: 'SA',  bg: '#ede9fe',  col: '#7c3aed', poste: 'Maîtresse de classe CP',        cat: 'enseignant', sal: 150000, tel: '+229 97 66 77 88', email: 'sohou.a@ecole.bj',    classes: ['CP'],              presence: 'present', contrat: 'CDD', anciennete: '2 ans',  diplome: 'CEAP · INFRE 2022' },
  { id: 'koffi',    nom: 'M. Koffi Marc',             ini: 'KM',  bg: '#cffafe',  col: '#0e7490', poste: 'Professeur Maths · 6e-A',       cat: 'enseignant', sal: 180000, tel: '+229 95 44 55 66', email: 'koffi.m@ecole.bj',    classes: ['6e-A'],            presence: 'present', contrat: 'CDI', anciennete: '7 ans',  diplome: 'CAPES Maths · ENS 2017' },
  { id: 'ahounou',  nom: 'Mme Ahounou Afi',           ini: 'AA',  bg: '#fce7f3',  col: '#be185d', poste: 'Professeure Français · 5e-B',   cat: 'enseignant', sal: 175000, tel: '+229 96 88 99 00', email: 'ahounou.a@ecole.bj',  classes: ['5e-B'],            presence: 'present', contrat: 'CDI', anciennete: '5 ans',  diplome: 'CAPES Lettres · ENS 2019' },
  { id: 'tchekpo',  nom: 'M. Tchékpo Paul',           ini: 'TP',  bg: '#fee2e2',  col: '#dc2626', poste: 'Professeur · 3e-B',             cat: 'enseignant', sal: 175000, tel: '+229 97 11 22 33', email: 'tchekpo.p@ecole.bj',  classes: ['3e-B'],            presence: 'absent',  contrat: 'CDI', anciennete: '3 ans',  diplome: 'CAPES · ENS 2021' },
  { id: 'zannou',   nom: 'M. Zannou Roland',          ini: 'ZR',  bg: '#dcfce7',  col: '#166534', poste: 'Professeur SVT · 4e-A',         cat: 'enseignant', sal: 170000, tel: '+229 95 33 44 55', email: 'zannou.r@ecole.bj',   classes: ['4e-A'],            presence: 'present', contrat: 'CDI', anciennete: '4 ans',  diplome: 'CAPES SVT · ENS 2020' },
  { id: 'gbedji',   nom: 'Mme Gbêdji Rosine',         ini: 'GRo', bg: '#fff4ec',  col: '#9a3412', poste: 'Comptable',                     cat: 'admin',      sal: 120000, tel: '+229 97 11 22 33', email: 'gbedji.r@ecole.bj',   classes: [] as string[],      presence: 'present', contrat: 'CDI', anciennete: '8 ans',  diplome: 'BTS Comptabilité 2016' },
  { id: 'soumanou', nom: 'Mlle Aïda Soumanou',        ini: 'AS',  bg: '#ede9fe',  col: '#7c3aed', poste: 'Secrétaire',                    cat: 'admin',      sal: 90000,  tel: '+229 96 22 33 44', email: 'soumanou.a@ecole.bj', classes: [] as string[],      presence: 'conge',   contrat: 'CDI', anciennete: '3 ans',  diplome: 'BAC · Secrétariat 2021' },
  { id: 'codjo',    nom: 'M. Codjo Bernard',          ini: 'CB',  bg: '#f3f4f6',  col: '#6b7280', poste: 'Gardien',                       cat: 'service',    sal: 60000,  tel: '+229 97 55 66 77', email: '—',                   classes: [] as string[],      presence: 'present', contrat: 'CDD', anciennete: '5 ans',  diplome: 'BEPC' },
  { id: 'houngnibo',nom: 'Mme Houngnibo Clara',       ini: 'HC',  bg: '#fce7f3',  col: '#be185d', poste: 'Femme de ménage',               cat: 'service',    sal: 55000,  tel: '+229 96 44 55 66', email: '—',                   classes: [] as string[],      presence: 'present', contrat: 'CDD', anciennete: '4 ans',  diplome: 'CEP' },
  { id: 'sossou',   nom: 'M. Sossou Irénée',          ini: 'SI',  bg: '#cffafe',  col: '#0e7490', poste: 'Chauffeur bus scolaire',         cat: 'service',    sal: 95000,  tel: '+229 95 77 88 99', email: 'sossou.i@ecole.bj',   classes: [] as string[],      presence: 'present', contrat: 'CDD', anciennete: '2 ans',  diplome: 'Permis C · BAC' },
]

const FICHE_DATA: Record<string, {
  mat: string; ddn: string; dde: string; tel: string; email: string; sal: string
  diplome: string; cl: string; contrat: string; anciennete: string; absences: string
  note: string; effectif: string; bg: string; col: string; ini: string
  name: string; poste: string
}> = {
  agossou: { mat: 'ENS-2019-001', ddn: '12 Mars 1985',  dde: '01 Sept. 2019', tel: '+229 97 12 34 56', email: 'agossou.d@ecole.bj',  sal: '155 000 FCFA', diplome: 'CAPEM · INFRE 2018',       cl: 'CM2-A · 38 élèves', contrat: 'CDI · Actif', anciennete: '6 ans',  absences: '2', note: '4,2/5', effectif: '38', bg: '#dbeafe',  col: '#1e40af', ini: 'AD',  name: 'M. Agossou Didier',     poste: 'Maître de classe · CM2-A' },
  komlan:  { mat: 'DIR-2013-001', ddn: '05 Juin 1972',  dde: '01 Sept. 2013', tel: '+229 97 00 00 00', email: 'komlan@ecole.bj',      sal: '350 000 FCFA', diplome: 'BAPC · ENAM 2014',         cl: 'École entière',     contrat: 'CDI · Actif', anciennete: '12 ans', absences: '0', note: '—',    effectif: '255',bg: '#D8F3DC',  col: '#1B4332', ini: 'MK',  name: 'M. Komlan Directeur',   poste: 'Directeur Général' },
  tossou:  { mat: 'ENS-2021-002', ddn: '18 Juil. 1988', dde: '01 Sept. 2021', tel: '+229 97 55 66 77', email: 'tossou.b@ecole.bj',    sal: '155 000 FCFA', diplome: 'CAPEM · INFRE 2020',       cl: 'CM2-B · 36 élèves', contrat: 'CDI · Actif', anciennete: '4 ans',  absences: '1', note: '4,0/5', effectif: '36', bg: '#fce7f3',  col: '#be185d', ini: 'TB',  name: 'Mme Tossou Béatrice',   poste: 'Maîtresse de classe · CM2-B' },
  koffi:   { mat: 'ENS-2018-003', ddn: '22 Nov. 1980',  dde: '01 Sept. 2018', tel: '+229 95 44 55 66', email: 'koffi.m@ecole.bj',     sal: '180 000 FCFA', diplome: 'CAPES Maths · ENS 2017',   cl: '6e-A · 42 élèves',  contrat: 'CDI · Actif', anciennete: '7 ans',  absences: '0', note: '4,5/5', effectif: '42', bg: '#cffafe',  col: '#0e7490', ini: 'KM',  name: 'M. Koffi Marc',         poste: 'Professeur Mathématiques · 6e-A' },
  gbedji:  { mat: 'ADM-2017-001', ddn: '14 Mars 1983',  dde: '01 Janv. 2017', tel: '+229 97 11 22 33', email: 'gbedji.r@ecole.bj',    sal: '120 000 FCFA', diplome: 'BTS Comptabilité 2016',    cl: '—',                 contrat: 'CDI · Actif', anciennete: '8 ans',  absences: '0', note: '4,8/5', effectif: '—', bg: '#fff4ec',  col: '#9a3412', ini: 'GRo', name: 'Mme Gbêdji Rosine',     poste: 'Comptable · Administration' },
  tchekpo: { mat: 'ENS-2022-004', ddn: '07 Avr. 1991',  dde: '01 Sept. 2022', tel: '+229 97 11 22 33', email: 'tchekpo.p@ecole.bj',   sal: '175 000 FCFA', diplome: 'CAPES · ENS 2021',         cl: '3e-B · 36 élèves',  contrat: 'CDI · Actif', anciennete: '3 ans',  absences: '3', note: '3,8/5', effectif: '36', bg: '#fee2e2',  col: '#dc2626', ini: 'TP',  name: 'M. Tchékpo Paul',       poste: 'Professeur · 3e-B (ABSENT)' },
}

const PLANNING_DATA = [
  { id: 'agossou', ini: 'AD',  bg: '#dbeafe',  col: '#1e40af', nom: 'M. Agossou',  j1: 'CM2-A · Français', j2: 'CM2-A · Maths',   j3: 'CM2-A · EST',   j4: 'CM2-A · SVT',  j5: 'CM2-A · Éveil' },
  { id: 'tossou',  ini: 'TB',  bg: '#fce7f3',  col: '#be185d', nom: 'Mme Tossou',  j1: 'CM2-B · Français', j2: 'CM2-B · Français', j3: 'CM2-B · Maths', j4: 'CM2-B · LN',   j5: 'CM2-B · EPS' },
  { id: 'dossou',  ini: 'DR',  bg: '#dcfce7',  col: '#166534', nom: 'M. Dossou',   j1: 'CM1-A · Maths',   j2: 'CM1-A · Français', j3: 'CM1-A · SVT',   j4: 'CM1-A · EST',  j5: 'CM1-A · Éveil' },
  { id: 'koffi',   ini: 'KM',  bg: '#cffafe',  col: '#0e7490', nom: 'M. Koffi',    j1: '6e-A · Maths',    j2: '6e-A · Maths',     j3: 'Libre',         j4: '6e-A · Maths', j5: '6e-A · Maths' },
  { id: 'tchekpo', ini: 'TP',  bg: '#fee2e2',  col: '#dc2626', nom: 'M. Tchékpo',  j1: 'ABSENT',          j2: 'ABSENT',           j3: 'ABSENT',        j4: 'ABSENT',       j5: 'ABSENT' },
  { id: 'zannou',  ini: 'ZR',  bg: '#dcfce7',  col: '#166534', nom: 'M. Zannou',   j1: '4e-A · SVT',      j2: '4e-A · SVT',       j3: 'Libre',         j4: '4e-A · SVT',   j5: 'Réunion péda.' },
  { id: 'komlan',  ini: 'MK',  bg: '#D8F3DC',  col: '#1B4332', nom: 'M. Komlan',   j1: 'Admin',           j2: 'Admin',            j3: 'Réunion péda.', j4: 'Admin',        j5: 'Réunion CCIB' },
  { id: 'gbedji',  ini: 'GRo', bg: '#fff4ec',  col: '#9a3412', nom: 'Mme Gbêdji',  j1: 'Comptabilité',    j2: 'Comptabilité',     j3: 'CONGÉ',         j4: 'Comptabilité', j5: 'Comptabilité' },
]

const POSTES_OUVERTS = [
  { id: 'p1', titre: 'Professeur de Physique-Chimie', niveau: 'Collège · 3e-A et 4e-B', urgence: 'urgent',    deadline: '15 Mai 2025',  candidatures: 3 },
  { id: 'p2', titre: 'Enseignant(e) de classe CE1',   niveau: 'Primaire · CE1-B',        urgence: 'reflexion', deadline: '01 Juin 2025', candidatures: 1 },
  { id: 'p3', titre: 'Agent de sécurité',             niveau: 'Personnel de service',    urgence: 'reflexion', deadline: '01 Juil. 2025',candidatures: 5 },
]

const CANDIDATURES = [
  { id: 'c1', nom: 'M. Ahouandjinou Sylvain', poste: 'Professeur Physique-Chimie', date: '02 Avr. 2025', statut: 'nouveau',   ini: 'AS', bg: '#dbeafe',  col: '#1e40af' },
  { id: 'c2', nom: 'Mme Dèdé Clarisse',       poste: 'Professeur Physique-Chimie', date: '29 Mars 2025', statut: 'entretien', ini: 'DC', bg: '#fce7f3',  col: '#be185d' },
  { id: 'c3', nom: 'M. Hounsou Victor',        poste: 'Enseignant CE1',             date: '25 Mars 2025', statut: 'nouveau',   ini: 'HV', bg: '#dcfce7',  col: '#166534' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function catColor(cat: string): { bg: string; col: string; label: string } {
  if (cat === 'direction')  return { bg: '#D8F3DC',  col: '#1B4332', label: 'Direction' }
  if (cat === 'enseignant') return { bg: '#dbeafe',  col: '#1e40af', label: 'Enseignant' }
  if (cat === 'admin')      return { bg: '#ede9fe',  col: '#7c3aed', label: 'Admin' }
  if (cat === 'service')    return { bg: '#f3f4f6',  col: '#6b7280', label: 'Service' }
  return { bg: '#f3f4f6', col: '#6b7280', label: cat }
}

function presenceInfo(p: string): { bg: string; col: string; label: string; icon: string } {
  if (p === 'present') return { bg: '#dcfce7', col: '#166534', label: 'Présent',   icon: '✓' }
  if (p === 'absent')  return { bg: '#fee2e2', col: '#991b1b', label: 'Absent',    icon: '✗' }
  if (p === 'conge')   return { bg: '#fef3c7', col: '#854d0e', label: 'Congé',     icon: '🏖' }
  return { bg: '#f3f4f6', col: '#6b7280', label: p, icon: '?' }
}

function getRoleColor(role: string): { bg: string; col: string; label: string } {
  if (role === 'director')    return { bg: '#D8F3DC',  col: '#1B4332', label: 'Directeur' }
  if (role === 'teacher')     return { bg: '#dbeafe',  col: '#1e40af', label: 'Enseignant' }
  if (role === 'accountant')  return { bg: '#ede9fe',  col: '#7c3aed', label: 'Comptable' }
  if (role === 'admin')       return { bg: '#fff4ec',  col: '#9a3412', label: 'Admin' }
  if (role === 'service')     return { bg: '#f3f4f6',  col: '#6b7280', label: 'Service' }
  return { bg: '#f3f4f6', col: '#6b7280', label: role }
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')
  return (name[0] ?? '').toUpperCase()
}

function planningCellStyle(val: string): React.CSSProperties {
  if (val === 'ABSENT')        return { background: '#fee2e2', color: '#991b1b' }
  if (val === 'CONGÉ')         return { background: '#fef3c7', color: '#854d0e' }
  if (val === 'Libre')         return { background: '#f3f4f6', color: '#6b7280' }
  if (val.startsWith('Réunion')) return { background: '#dbeafe', color: '#1e40af' }
  if (val.startsWith('Admin') || val.startsWith('Compt')) return { background: '#ede9fe', color: '#7c3aed' }
  return { background: '#dcfce7', color: '#166534' }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PersonnelClient({
  schoolId: _schoolId,
  userId: _userId,
  userRole: _userRole,
  staff,
}: PersonnelClientProps) {
  const isMobile = useIsMobile()

  // ── Merge real data with static fallback ──────────────────────────────────
  const staffData = useMemo(() => {
    if (staff.length > 0) {
      return staff.map(s => {
        const initials = getInitialsFromName(s.full_name)
        const rc = getRoleColor(s.role)
        return {
          id: s.id,
          nom: s.full_name,
          ini: initials,
          bg: rc.bg,
          col: rc.col,
          poste: getRoleColor(s.role).label,
          cat: s.role === 'teacher' ? 'enseignant' : s.role === 'director' ? 'direction' : s.role === 'accountant' ? 'admin' : s.role,
          sal: 0,
          tel: s.phone ?? '—',
          email: '—',
          classes: [] as string[],
          presence: s.is_active ? 'present' : 'absent',
          contrat: 'CDI',
          anciennete: '—',
          diplome: '—',
        }
      })
    }
    return STAFF_STATIC
  }, [staff])

  // ── UI State ──────────────────────────────────────────────────────────────
  type Tab = 'annuaire' | 'fiche' | 'presences' | 'planning' | 'organigramme' | 'recrutement'
  const [activeTab, setActiveTab] = useState<Tab>('annuaire')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [ficheSubTab, setFicheSubTab] = useState<'infos' | 'salaires' | 'absences'>('infos')

  // Présences optimistic
  const [presences, setPresences] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const s of STAFF_STATIC) map[s.id] = s.presence
    return map
  })

  // ── Modals ────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<string | null>(null)
  const closeModal = useCallback(() => setModal(null), [])

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])
  useEffect(() => { return () => { if (toastTimer.current) clearTimeout(toastTimer.current) } }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, string>>({})

  // ── Filtered staff ────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    return staffData.filter(s => {
      const matchQ = s.nom.toLowerCase().includes(searchQ.toLowerCase()) || s.poste.toLowerCase().includes(searchQ.toLowerCase())
      const matchCat = filterCat === 'all' || s.cat === filterCat
      return matchQ && matchCat
    })
  }, [staffData, searchQ, filterCat])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = staffData.length
    const presents = staffData.filter(s => presences[s.id] === 'present').length
    const absents = staffData.filter(s => presences[s.id] === 'absent').length
    const conges = staffData.filter(s => presences[s.id] === 'conge').length
    const masse = staffData.reduce((sum, s) => sum + (s.sal ?? 0), 0)
    return { total, presents, absents, conges, masse }
  }, [staffData, presences])

  const selectedStaff = useMemo(() =>
    staffData.find(s => s.id === selectedStaffId) ?? staffData[0],
    [staffData, selectedStaffId]
  )
  const ficheInfo = selectedStaff ? FICHE_DATA[selectedStaff.id] : null

  // ─── Styles ────────────────────────────────────────────────────────────────

  const container: React.CSSProperties = {
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: 13,
    color: '#0d1f16',
    padding: isMobile ? '12px 8px' : '20px 24px',
    maxWidth: 1200,
    margin: '0 auto',
  }

  const header: React.CSSProperties = {
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  }

  const title: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: isMobile ? 20 : 24,
    fontWeight: 700,
    color: '#1B4332',
    margin: 0,
  }

  const subtitle: React.CSSProperties = {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  }

  const btnPrimary: React.CSSProperties = {
    background: '#1B4332',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const btnSecondary: React.CSSProperties = {
    background: '#f0faf3',
    color: '#1B4332',
    border: '1px solid #d1fae5',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #d1fae5',
    borderRadius: 12,
    padding: isMobile ? 12 : 16,
  }

  const selectStyle: React.CSSProperties = {
    border: '1px solid #d1fae5',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: '#0d1f16',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #d1fae5',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: '#0d1f16',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const tabsContainer: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    background: '#f0faf3',
    border: '1px solid #d1fae5',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  }

  function tabStyle(t: Tab): React.CSSProperties {
    const isActive = activeTab === t
    return {
      padding: isMobile ? '9px 10px' : '8px 14px',
      borderRadius: 8,
      border: 'none',
      background: isActive ? '#1B4332' : 'transparent',
      color: isActive ? '#fff' : '#40916C',
      fontWeight: isActive ? 700 : 500,
      fontSize: isMobile ? 11 : 13,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }
  }

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
    padding: isMobile ? '12px' : '24px',
  }

  const modalBox: React.CSSProperties = {
    background: '#fff',
    borderRadius: 14,
    padding: isMobile ? '20px 16px' : '28px 32px',
    width: isMobile ? '95vw' : '480px',
    maxWidth: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  }

  const modalTitle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#1B4332',
    marginBottom: 20,
  }

  const formRow: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 14,
  }

  const formLabel: React.CSSProperties = {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  // ─── Stat Cards ──────────────────────────────────────────────────────────────

  function renderStatCards() {
    const items = [
      { label: 'Total Personnel', value: stats.total,    bg: '#f0faf3', col: '#1B4332',  icon: '👥' },
      { label: 'Présents',        value: stats.presents, bg: '#dcfce7', col: '#166534',  icon: '✓' },
      { label: 'Absents',         value: stats.absents,  bg: '#fee2e2', col: '#991b1b',  icon: '✗' },
      { label: 'Congés',          value: stats.conges,   bg: '#fef3c7', col: '#854d0e',  icon: '🏖' },
      { label: 'Masse salariale', value: stats.masse > 0 ? `${(stats.masse / 1000).toFixed(0)}k` : '—', bg: '#ede9fe', col: '#7c3aed', icon: '💰' },
    ]

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {items.map(item => (
          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: item.col, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>{item.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: item.col, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.icon} {item.value}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── Tab 1 — Annuaire ────────────────────────────────────────────────────────

  function renderAnnuaire() {
    return (
      <div>
        {renderStatCards()}

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 10,
          marginBottom: 16,
          alignItems: isMobile ? 'stretch' : 'center',
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un membre..."
            style={{ ...inputStyle, flex: 1 }}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <select style={selectStyle} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">Toutes catégories</option>
            <option value="direction">Direction</option>
            <option value="enseignant">Enseignants</option>
            <option value="admin">Administration</option>
            <option value="service">Services</option>
          </select>
          {/* Toggle view mode */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              style={{ ...btnSecondary, background: viewMode === 'cards' ? '#1B4332' : '#f0faf3', color: viewMode === 'cards' ? '#fff' : '#1B4332', padding: '7px 12px' }}
              onClick={() => setViewMode('cards')}
            >⊞</button>
            <button
              style={{ ...btnSecondary, background: viewMode === 'list' ? '#1B4332' : '#f0faf3', color: viewMode === 'list' ? '#fff' : '#1B4332', padding: '7px 12px' }}
              onClick={() => setViewMode('list')}
            >☰</button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {filteredStaff.map(s => {
              const pi = presenceInfo(presences[s.id] ?? s.presence)
              const ci = catColor(s.cat)
              return (
                <div
                  key={s.id}
                  style={{ ...card, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onClick={() => { setSelectedStaffId(s.id); setActiveTab('fiche') }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: s.bg, color: s.col,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, flexShrink: 0,
                      border: `2px solid ${s.col}22`,
                    }}>
                      {s.ini}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0d1f16' }}>{s.nom}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{s.poste}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: ci.bg, color: ci.col, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{ci.label}</span>
                    <span style={{ background: pi.bg, color: pi.col, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{pi.icon} {pi.label}</span>
                    {s.classes.length > 0 && (
                      <span style={{ background: '#f3f4f6', color: '#374151', padding: '3px 8px', borderRadius: 8, fontSize: 11 }}>{s.classes[0]}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', display: 'flex', gap: 12 }}>
                    <span>📞 {s.tel}</span>
                    <span>📅 {s.anciennete}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredStaff.map(s => {
                  const pi = presenceInfo(presences[s.id] ?? s.presence)
                  return (
                    <div
                      key={s.id}
                      style={{ ...card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      onClick={() => { setSelectedStaffId(s.id); setActiveTab('fiche') }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.bg, color: s.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.ini}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.nom}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{s.poste}</div>
                      </div>
                      <span style={{ background: pi.bg, color: pi.col, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{pi.icon}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f0faf3' }}>
                    {['Membre', 'Catégorie', 'Poste', 'Téléphone', 'Ancienneté', 'Statut', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(s => {
                    const pi = presenceInfo(presences[s.id] ?? s.presence)
                    const ci = catColor(s.cat)
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f0faf3' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.bg, color: s.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{s.ini}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.nom}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{s.diplome}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: ci.bg, color: ci.col, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{ci.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>{s.poste}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{s.tel}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{s.anciennete}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: pi.bg, color: pi.col, padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>{pi.icon} {pi.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            style={{ ...btnSecondary, fontSize: 12, padding: '5px 10px' }}
                            onClick={() => { setSelectedStaffId(s.id); setActiveTab('fiche') }}
                          >
                            Fiche →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Tab 2 — Fiche Détaillée ─────────────────────────────────────────────────

  function renderFiche() {
    const s = selectedStaff
    if (!s) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontWeight: 600 }}>Sélectionnez un membre depuis l&apos;Annuaire</div>
        </div>
      )
    }

    const fi = ficheInfo
    const pi = presenceInfo(presences[s.id] ?? s.presence)

    return (
      <div>
        {/* Back */}
        <button
          style={{ ...btnSecondary, marginBottom: 16, fontSize: 12 }}
          onClick={() => setActiveTab('annuaire')}
        >
          ← Retour à l&apos;annuaire
        </button>

        {/* Hero card */}
        <div style={{ ...card, background: s.bg, border: `1px solid ${s.col}22`, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', color: s.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, border: `3px solid ${s.col}`, flexShrink: 0 }}>
              {s.ini}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: s.col }}>{s.nom}</div>
              <div style={{ fontSize: 13, color: s.col, opacity: 0.8, marginTop: 2 }}>{s.poste}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ background: pi.bg, color: pi.col, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{pi.icon} {pi.label}</span>
                <span style={{ background: '#fff', color: s.col, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{s.contrat}</span>
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              {isMobile ? (
                <>
                  <button style={{ ...btnPrimary, flex: 1 }} onClick={() => { setFormData({ id: s.id, nom: s.nom, tel: s.tel }); setModal('edit') }}>✏️ Modifier</button>
                  <button style={{ ...btnSecondary, flex: 1 }} onClick={() => setModal('abs')}>📅 Absence</button>
                </>
              ) : (
                <>
                  <button style={btnPrimary} onClick={() => { setFormData({ id: s.id, nom: s.nom, tel: s.tel }); setModal('edit') }}>✏️ Modifier</button>
                  <button style={btnSecondary} onClick={() => setModal('eval')}>⭐ Évaluer</button>
                  <button style={btnSecondary} onClick={() => setModal('abs')}>📅 Absence</button>
                  <button style={btnSecondary} onClick={() => setModal('msg-one')}>💬 Message</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mini stats */}
        {fi && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Ancienneté',   value: fi.anciennete, bg: '#f0faf3', col: '#1B4332' },
              { label: 'Absences',     value: fi.absences,   bg: '#fee2e2', col: '#991b1b' },
              { label: 'Évaluation',   value: fi.note,       bg: '#fef3c7', col: '#854d0e' },
              { label: 'Élèves',       value: fi.effectif,   bg: '#dbeafe', col: '#1e40af' },
            ].map(item => (
              <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: item.col, fontWeight: 600, opacity: 0.8 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.col, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #d1fae5', marginBottom: 16 }}>
          {(['infos', 'salaires', 'absences'] as const).map(t => (
            <button
              key={t}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: 'transparent',
                color: ficheSubTab === t ? '#1B4332' : '#6b7280',
                fontWeight: ficheSubTab === t ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                borderBottom: ficheSubTab === t ? '3px solid #1B4332' : '3px solid transparent',
                marginBottom: -2,
              }}
              onClick={() => setFicheSubTab(t)}
            >
              {t === 'infos' ? '📋 Infos perso' : t === 'salaires' ? '💰 Salaires' : '📅 Absences'}
            </button>
          ))}
        </div>

        {ficheSubTab === 'infos' && fi && (
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Matricule', value: fi.mat },
                { label: 'Date de naissance', value: fi.ddn },
                { label: 'Date d\'entrée', value: fi.dde },
                { label: 'Téléphone', value: fi.tel },
                { label: 'Email', value: fi.email },
                { label: 'Diplôme', value: fi.diplome },
                { label: 'Classe(s)', value: fi.cl },
                { label: 'Contrat', value: fi.contrat },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1f16' }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ficheSubTab === 'salaires' && fi && (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1B4332', marginBottom: 14, fontFamily: "'Playfair Display', serif" }}>
              💰 Salaire mensuel : <span style={{ color: '#7c3aed' }}>{fi.sal}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Nov 2024', 'Déc 2024', 'Jan 2025', 'Fév 2025', 'Mars 2025', 'Avr 2025'].map((mois, i) => (
                <div key={mois} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0faf3', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600 }}>{mois}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>{fi.sal}</span>
                  <span style={{ background: i < 5 ? '#dcfce7' : '#fef3c7', color: i < 5 ? '#166534' : '#854d0e', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {i < 5 ? '✓ Payé' : '⏳ En attente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ficheSubTab === 'absences' && fi && (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1B4332', marginBottom: 14, fontFamily: "'Playfair Display', serif" }}>
              📅 Historique des absences
            </div>
            {parseInt(fi.absences) === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#166534' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 600 }}>Aucune absence enregistrée</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: parseInt(fi.absences) }, (_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fee2e2', borderRadius: 8 }}>
                    <span style={{ color: '#991b1b', fontWeight: 700 }}>✗</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>Absence #{i + 1}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Mars 2025 · Non excusée</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Tab 3 — Présences ───────────────────────────────────────────────────────

  function renderPresences() {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const absentsToday = staffData.filter(s => presences[s.id] === 'absent')

    return (
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332', marginBottom: 4 }}>
          📋 Présences du jour
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, textTransform: 'capitalize' }}>{today}</div>

        {/* Alert absents */}
        {absentsToday.length > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>{absentsToday.length} membre{absentsToday.length > 1 ? 's' : ''} absent{absentsToday.length > 1 ? 's' : ''} aujourd&apos;hui</div>
              <div style={{ fontSize: 11, color: '#dc2626' }}>{absentsToday.map(a => a.nom).join(', ')}</div>
            </div>
            <button style={{ ...btnPrimary, background: '#dc2626', marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }} onClick={() => setModal('suppleant')}>
              Affecter suppléant
            </button>
          </div>
        )}

        {/* Staff presence list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {staffData.map(s => {
            const pi = presenceInfo(presences[s.id] ?? s.presence)
            return (
              <div key={s.id} style={{
                ...card,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 10 : 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.bg, color: s.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.ini}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.nom}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{s.poste}</div>
                  </div>
                </div>
                {/* Status toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, width: isMobile ? '100%' : 'auto' }}>
                  {(['present', 'absent', 'conge'] as const).map(status => {
                    const info = presenceInfo(status)
                    const isActive = (presences[s.id] ?? s.presence) === status
                    return (
                      <button
                        key={status}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: isActive ? `2px solid ${info.col}` : '1px solid #d1fae5',
                          background: isActive ? info.bg : '#f9fafb',
                          color: isActive ? info.col : '#6b7280',
                          fontSize: 11,
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setPresences(prev => ({ ...prev, [s.id]: status }))
                          showToast(`✓ ${s.nom} : ${info.label}`)
                        }}
                      >
                        {info.icon} {info.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Tab 4 — Planning ────────────────────────────────────────────────────────

  function renderPlanning() {
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

    return (
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          📅 Planning hebdomadaire
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PLANNING_DATA.map(p => {
              const days = [p.j1, p.j2, p.j3, p.j4, p.j5]
              return (
                <div key={p.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.bg, color: p.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{p.ini}</div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.nom}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {days.map((d, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#6b7280', width: 58, flexShrink: 0 }}>{jours[i]}</span>
                        <span style={{ ...planningCellStyle(d), padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, flex: 1 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0faf3' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5', minWidth: 140 }}>Membre</th>
                  {jours.map(j => (
                    <th key={j} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#1B4332', borderBottom: '1px solid #d1fae5' }}>{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLANNING_DATA.map(p => {
                  const days = [p.j1, p.j2, p.j3, p.j4, p.j5]
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0faf3' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.bg, color: p.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{p.ini}</div>
                          <span style={{ fontWeight: 600 }}>{p.nom}</span>
                        </div>
                      </td>
                      {days.map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ ...planningCellStyle(d), padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, display: 'inline-block' }}>{d}</span>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Cours', bg: '#dcfce7',  col: '#166534' },
            { label: 'Réunion', bg: '#dbeafe',  col: '#1e40af' },
            { label: 'Admin', bg: '#ede9fe',  col: '#7c3aed' },
            { label: 'Absent', bg: '#fee2e2',  col: '#991b1b' },
            { label: 'Congé', bg: '#fef3c7',  col: '#854d0e' },
            { label: 'Libre', bg: '#f3f4f6',  col: '#6b7280' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1px solid ${l.col}44`, display: 'inline-block' }} />
              <span style={{ color: '#6b7280' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Tab 5 — Organigramme ────────────────────────────────────────────────────

  function renderOrganigramme() {
    const direction = staffData.filter(s => s.cat === 'direction')
    const enseignants = staffData.filter(s => s.cat === 'enseignant')
    const admin = staffData.filter(s => s.cat === 'admin')
    const services = staffData.filter(s => s.cat === 'service')

    function OrgCard({ s, size = 'normal' }: { s: typeof staffData[0]; size?: 'big' | 'normal' | 'small' }) {
      return (
        <div
          style={{
            background: s.bg, border: `2px solid ${s.col}33`,
            borderRadius: size === 'big' ? 14 : 10,
            padding: size === 'big' ? '14px 18px' : size === 'small' ? '8px 12px' : '10px 14px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: size === 'big' ? 12 : 8,
            minWidth: size === 'big' ? 200 : 140,
            transition: 'box-shadow 0.15s',
          }}
          onClick={() => { setSelectedStaffId(s.id); setActiveTab('fiche') }}
        >
          <div style={{
            width: size === 'big' ? 44 : 32, height: size === 'big' ? 44 : 32,
            borderRadius: '50%', background: '#fff', color: s.col,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size === 'big' ? 16 : 12, fontWeight: 700, flexShrink: 0,
          }}>{s.ini}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: size === 'big' ? 14 : 12, color: s.col }}>{s.nom.replace(/^M\.?\s*|^Mme\.?\s*|^Mlle\.?\s*/i, '')}</div>
            <div style={{ fontSize: size === 'big' ? 11 : 10, color: s.col, opacity: 0.7, marginTop: 1 }}>{s.poste.split(' · ')[0]}</div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          🏛️ Organigramme
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* Direction */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
            {direction.map(s => <OrgCard key={s.id} s={s} size="big" />)}
          </div>

          {/* Connector */}
          <div style={{ width: 2, height: 28, background: '#d1fae5' }} />

          {/* Middle row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
            {/* Enseignants */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700 }}>📚 Enseignants</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: isMobile ? 300 : 600 }}>
                {enseignants.map(s => <OrgCard key={s.id} s={s} size="small" />)}
              </div>
            </div>

            {/* Admin & Services */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {admin.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700 }}>🏢 Administration</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {admin.map(s => <OrgCard key={s.id} s={s} size="small" />)}
                  </div>
                </div>
              )}
              {services.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700 }}>🔧 Services</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {services.map(s => <OrgCard key={s.id} s={s} size="small" />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Direction',      bg: '#D8F3DC', col: '#1B4332' },
            { label: 'Enseignants',    bg: '#dbeafe', col: '#1e40af' },
            { label: 'Administration', bg: '#ede9fe', col: '#7c3aed' },
            { label: 'Services',       bg: '#f3f4f6', col: '#6b7280' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: `1.5px solid ${l.col}44`, display: 'inline-block' }} />
              <span style={{ color: '#374151', fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Tab 6 — Recrutement ─────────────────────────────────────────────────────

  function renderRecrutement() {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332' }}>💼 Postes ouverts</div>
          <button style={btnPrimary} onClick={() => setModal('poste')}>+ Publier un poste</button>
        </div>

        {/* Postes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {POSTES_OUVERTS.map(p => {
            const isUrgent = p.urgence === 'urgent'
            return (
              <div key={p.id} style={{ ...card, borderLeft: `4px solid ${isUrgent ? '#dc2626' : '#d97706'}` }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{p.titre}</span>
                      <span style={{ background: isUrgent ? '#fee2e2' : '#fef3c7', color: isUrgent ? '#dc2626' : '#d97706', padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        {isUrgent ? '🔴 Urgent' : '🟡 En réflexion'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.niveau} · Deadline : {p.deadline}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                      {p.candidatures} candidature{p.candidatures > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Candidatures */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1B4332', marginBottom: 14 }}>
          📥 Candidatures reçues
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANDIDATURES.map(c => (
            <div key={c.id} style={card}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.bg, color: c.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{c.ini}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.nom}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.poste} · Reçue le {c.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: c.statut === 'entretien' ? '#dcfce7' : '#dbeafe', color: c.statut === 'entretien' ? '#166534' : '#1e40af', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {c.statut === 'entretien' ? '✓ Entretien' : '📩 Nouveau'}
                  </span>
                  <button style={{ ...btnSecondary, fontSize: 11, padding: '5px 10px' }} onClick={() => showToast('📄 CV téléchargé')}>CV</button>
                  <button style={{ ...btnPrimary, fontSize: 11, padding: '5px 10px' }} onClick={() => showToast('📅 Entretien planifié')}>Entretien</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Modals ──────────────────────────────────────────────────────────────────

  function renderModal() {
    if (!modal) return null

    const modals: Record<string, { title: string; content: React.ReactNode }> = {
      'add': {
        title: '👤 Ajouter un membre',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Nom complet *</label>
              <input style={inputStyle} placeholder="Prénom Nom" value={formData.nom ?? ''} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Rôle *</label>
              <select style={inputStyle} value={formData.role ?? ''} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                <option value="">-- Choisir --</option>
                <option value="direction">Direction</option>
                <option value="enseignant">Enseignant</option>
                <option value="admin">Administration</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div style={formRow}>
              <label style={formLabel}>Téléphone</label>
              <input style={inputStyle} placeholder="+229 XX XX XX XX" value={formData.tel ?? ''} onChange={e => setFormData(p => ({ ...p, tel: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Email</label>
              <input style={inputStyle} type="email" placeholder="prenom.nom@ecole.bj" value={formData.email ?? ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Salaire mensuel (FCFA)</label>
              <input style={inputStyle} type="number" placeholder="150000" value={formData.sal ?? ''} onChange={e => setFormData(p => ({ ...p, sal: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Type de contrat</label>
              <select style={inputStyle} value={formData.contrat ?? 'CDI'} onChange={e => setFormData(p => ({ ...p, contrat: e.target.value }))}>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Vacataire">Vacataire</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Membre ajouté avec succès'); closeModal() }}>Ajouter</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'edit': {
        title: '✏️ Modifier le profil',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Nom complet</label>
              <input style={inputStyle} value={formData.nom ?? ''} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Téléphone</label>
              <input style={inputStyle} value={formData.tel ?? ''} onChange={e => setFormData(p => ({ ...p, tel: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Email</label>
              <input style={inputStyle} type="email" value={formData.email ?? ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Profil mis à jour'); closeModal() }}>Sauvegarder</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'abs': {
        title: '📅 Déclarer une absence',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Date</label>
              <input type="date" style={inputStyle} value={formData.date ?? new Date().toISOString().split('T')[0]} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Motif</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Motif de l'absence..." value={formData.motif ?? ''} onChange={e => setFormData(p => ({ ...p, motif: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Type</label>
              <select style={inputStyle} value={formData.type ?? 'absent'} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                <option value="absent">Absence</option>
                <option value="conge">Congé</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Absence enregistrée'); closeModal() }}>Enregistrer</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'eval': {
        title: '⭐ Évaluation',
        content: (
          <div>
            {['Ponctualité', 'Pédagogie', 'Comportement', 'Résultats élèves', 'Travail d\'équipe', 'Initiative'].map(critere => (
              <div key={critere} style={formRow}>
                <label style={formLabel}>{critere}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: (parseInt(formData[critere] ?? '0') >= n) ? 'none' : '1px solid #d1fae5',
                        background: (parseInt(formData[critere] ?? '0') >= n) ? '#fbbf24' : '#f9fafb',
                        cursor: 'pointer', fontSize: 16,
                      }}
                      onClick={() => setFormData(p => ({ ...p, [critere]: String(n) }))}
                    >⭐</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Évaluation enregistrée'); closeModal() }}>Valider</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'msg-one': {
        title: '💬 Envoyer un message',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Canal</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Sukulu', 'SMS', 'Email'].map(c => (
                  <button
                    key={c}
                    style={{ ...btnSecondary, flex: 1, justifyContent: 'center', background: formData.canal === c ? '#1B4332' : '#f0faf3', color: formData.canal === c ? '#fff' : '#1B4332' }}
                    onClick={() => setFormData(p => ({ ...p, canal: c }))}
                  >{c}</button>
                ))}
              </div>
            </div>
            <div style={formRow}>
              <label style={formLabel}>Message</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} placeholder="Votre message..." value={formData.msg ?? ''} onChange={e => setFormData(p => ({ ...p, msg: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Message envoyé'); closeModal() }}>Envoyer</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'msg-all': {
        title: '📢 Message à toute l\'équipe',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Canal</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Sukulu', 'SMS', 'Email'].map(c => (
                  <button
                    key={c}
                    style={{ ...btnSecondary, flex: 1, justifyContent: 'center', background: formData.canal === c ? '#1B4332' : '#f0faf3', color: formData.canal === c ? '#fff' : '#1B4332' }}
                    onClick={() => setFormData(p => ({ ...p, canal: c }))}
                  >{c}</button>
                ))}
              </div>
            </div>
            <div style={formRow}>
              <label style={formLabel}>Sujet</label>
              <input style={inputStyle} placeholder="Sujet du message" value={formData.sujet ?? ''} onChange={e => setFormData(p => ({ ...p, sujet: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Message</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} placeholder="Votre message à toute l'équipe..." value={formData.msg ?? ''} onChange={e => setFormData(p => ({ ...p, msg: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast(`✓ Message envoyé à ${stats.total} membres`); closeModal() }}>Envoyer à tous</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'suppleant': {
        title: '🔄 Affecter un suppléant',
        content: (
          <div>
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#991b1b' }}>
              ⚠️ M. Tchékpo Paul est absent — 3e-B sans enseignant
            </div>
            <div style={formRow}>
              <label style={formLabel}>Suppléant</label>
              <select style={inputStyle} value={formData.suppleant ?? ''} onChange={e => setFormData(p => ({ ...p, suppleant: e.target.value }))}>
                <option value="">-- Choisir un suppléant --</option>
                {staffData.filter(s => s.cat === 'enseignant' && (presences[s.id] ?? s.presence) === 'present').map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
            <div style={formRow}>
              <label style={formLabel}>Période</label>
              <input style={inputStyle} placeholder="ex: 08h–10h" value={formData.periode ?? ''} onChange={e => setFormData(p => ({ ...p, periode: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Suppléant affecté'); closeModal() }}>Confirmer</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
      'poste': {
        title: '📋 Publier un poste',
        content: (
          <div>
            <div style={formRow}>
              <label style={formLabel}>Intitulé du poste *</label>
              <input style={inputStyle} placeholder="ex: Professeur de Mathématiques" value={formData.poste_titre ?? ''} onChange={e => setFormData(p => ({ ...p, poste_titre: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Niveau / Classe</label>
              <input style={inputStyle} placeholder="ex: Collège · 3e-A" value={formData.poste_niveau ?? ''} onChange={e => setFormData(p => ({ ...p, poste_niveau: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Urgence</label>
              <select style={inputStyle} value={formData.poste_urgence ?? 'reflexion'} onChange={e => setFormData(p => ({ ...p, poste_urgence: e.target.value }))}>
                <option value="urgent">🔴 Urgent</option>
                <option value="reflexion">🟡 En réflexion</option>
              </select>
            </div>
            <div style={formRow}>
              <label style={formLabel}>Date limite de candidature</label>
              <input type="date" style={inputStyle} value={formData.poste_deadline ?? ''} onChange={e => setFormData(p => ({ ...p, poste_deadline: e.target.value }))} />
            </div>
            <div style={formRow}>
              <label style={formLabel}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Profil recherché..." value={formData.poste_desc ?? ''} onChange={e => setFormData(p => ({ ...p, poste_desc: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isMobile ? 'column' : 'row' }}>
              <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => { showToast('✓ Poste publié'); closeModal() }}>Publier</button>
              <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={closeModal}>Annuler</button>
            </div>
          </div>
        ),
      },
    }

    const m = modals[modal]
    if (!m) return null

    return (
      <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
        <div style={modalBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={modalTitle}>{m.title}</div>
            <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }} onClick={closeModal}>✕</button>
          </div>
          {m.content}
        </div>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={title}>👥 Gestion du Personnel</h1>
          <div style={subtitle}>{staffData.length} membres · Année scolaire en cours</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button style={{ ...btnSecondary, flex: isMobile ? 1 : 'unset' }} onClick={() => setModal('msg-all')}>
            📢 Message équipe
          </button>
          <button style={{ ...btnPrimary, flex: isMobile ? 1 : 'unset', justifyContent: 'center' }} onClick={() => { setFormData({}); setModal('add') }}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsContainer}>
        <button style={tabStyle('annuaire')}     onClick={() => setActiveTab('annuaire')}>👥 {isMobile ? 'Annuaire' : 'Annuaire'}</button>
        <button style={tabStyle('fiche')}        onClick={() => setActiveTab('fiche')}>👤 {isMobile ? 'Fiche' : 'Fiche détaillée'}</button>
        <button style={tabStyle('presences')}    onClick={() => setActiveTab('presences')}>✓ {isMobile ? 'Présences' : 'Présences'}</button>
        <button style={tabStyle('planning')}     onClick={() => setActiveTab('planning')}>📅 Planning</button>
        <button style={tabStyle('organigramme')} onClick={() => setActiveTab('organigramme')}>🏛️ {isMobile ? 'Orga.' : 'Organigramme'}</button>
        <button style={tabStyle('recrutement')}  onClick={() => setActiveTab('recrutement')}>💼 Recrutement</button>
      </div>

      {/* Tab content */}
      {activeTab === 'annuaire'     && renderAnnuaire()}
      {activeTab === 'fiche'        && renderFiche()}
      {activeTab === 'presences'    && renderPresences()}
      {activeTab === 'planning'     && renderPlanning()}
      {activeTab === 'organigramme' && renderOrganigramme()}
      {activeTab === 'recrutement'  && renderRecrutement()}

      {/* Modals */}
      {renderModal()}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: isMobile ? 12 : 24,
          left: isMobile ? 12 : 'auto',
          background: toast.startsWith('✗') ? '#dc2626' : '#1B4332',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
