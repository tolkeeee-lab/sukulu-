'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

type EncaissementMois = { mois: string; montant: number }
type ClasseStat = { id: string; name: string; totalEleves: number; enseignant: string; moyenne: number | null }
type ActiviteItem = { id: string; action: string; entity: string; entity_id: string | null; created_at: string }

interface Props {
  schoolName: string
  totalStudents: number
  totalClasses: number
  totalPersonnel: number
  totalEncaisse: number
  totalImpayes: number
  nbImpayes: number
  tauxRecouvrement: number
  absencesAujourdhui: number
  absencesNonJustifiees: number
  moyenneGenerale: number | null
  encaissementsParMois: EncaissementMois[]
  classesStats: ClasseStat[]
  activiteRecente: ActiviteItem[]
  notificationsNonLues: number
  inscriptionsEnAttente: number
}

function formatMontant(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return String(n)
}

function formatMontantFull(n: number): string {
  return n.toLocaleString('fr-FR')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)}j`
}

function entityLabel(entity: string): string {
  const map: Record<string, string> = {
    student: 'Élève', class: 'Classe', payment: 'Paiement',
    attendance: 'Présence', grade: 'Note', user: 'Utilisateur',
  }
  return map[entity] ?? entity
}

function getIconForEntity(entity: string): string {
  const map: Record<string, string> = {
    grade: '📝', payment: '💰', attendance: '📅',
    student: '👦', class: '🏫', user: '👤',
  }
  return map[entity] ?? '📋'
}

function getBgForEntity(entity: string): string {
  const map: Record<string, string> = {
    grade: '#D8F3DC', payment: '#fff4ec', attendance: '#fee2e2',
    student: '#dbeafe', class: '#dbeafe', user: '#f3f4f6',
  }
  return map[entity] ?? '#f3f4f6'
}

function getTodayLabel(): string {
  const now = new Date()
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${jours[now.getDay()]} ${now.getDate()} ${mois[now.getMonth()]} ${now.getFullYear()}`
}

function getCurrentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 9) return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

export default function DashboardDirecteurClient({
  schoolName,
  totalStudents,
  totalClasses,
  totalEncaisse,
  totalImpayes,
  nbImpayes,
  tauxRecouvrement,
  absencesAujourdhui,
  absencesNonJustifiees,
  moyenneGenerale,
  encaissementsParMois,
  classesStats,
  activiteRecente,
  inscriptionsEnAttente,
}: Props) {
  const isMobile = useIsMobile()
  const maxMontant = Math.max(...encaissementsParMois.map(m => m.montant), 1)
  const schoolYear = getCurrentSchoolYear()

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: '#0d1f16', padding: isMobile ? '12px 8px' : undefined }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 20, fontWeight: 600, color: '#1B4332', marginBottom: 3 }}>
            Tableau de bord
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {schoolName && <span style={{ fontWeight: 500, color: '#0d1f16' }}>{schoolName}</span>}
            {schoolName && <span style={{ margin: '0 6px', color: '#9ca3af' }}>·</span>}
            <span>{getTodayLabel()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : undefined }}>
          <button style={{ background: '#ffffff', border: '1px solid #d1fae5', color: '#6b7280', borderRadius: 7, padding: '7px 13px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : undefined }}>
            📊 Rapport mensuel
          </button>
          <button style={{ background: '#1B4332', border: 'none', color: '#ffffff', borderRadius: 7, padding: '7px 13px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : undefined }}>
            💬 Message aux parents
          </button>
        </div>
      </div>

      {/* ── Alertes — toujours visibles ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>

        {/* Rouge — impayés */}
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#dc2626' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{nbImpayes} impayés</strong> — {formatMontantFull(totalImpayes)} FCFA de scolarité non réglée
          </span>
          <a href="/dashboard/finances" style={{ color: '#dc2626', textDecoration: 'underline', whiteSpace: 'nowrap', fontSize: 12 }}>
            Voir →
          </a>
        </div>

        {/* Orange — inscriptions en attente */}
        <div style={{ background: '#fff4ec', border: '1px solid #fed7aa', borderRadius: 8, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#9a3412' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4A261', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{inscriptionsEnAttente} demande{inscriptionsEnAttente > 1 ? 's' : ''} d&apos;inscription</strong> en attente de validation
          </span>
          <a href="/dashboard/eleves" style={{ color: '#9a3412', textDecoration: 'underline', whiteSpace: 'nowrap', fontSize: 12 }}>
            Valider →
          </a>
        </div>

        {/* Bleu — bulletins */}
        <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#1e40af' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1e40af', flexShrink: 0 }} />
          <span>
            Les bulletins du <strong>1er trimestre</strong> sont prêts — {totalStudents} bulletins générés, en attente de publication
          </span>
        </div>

      </div>

      {/* ── 4 grandes stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>

        {/* Élèves */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>👦</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: '#1B4332', lineHeight: 1, marginBottom: 4 }}>
            {totalStudents}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Élèves inscrits</div>
        </div>

        {/* Recouvrement */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: '#d97706', lineHeight: 1, marginBottom: 4 }}>
            {tauxRecouvrement}%
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Taux de recouvrement</div>
          <div style={{ fontSize: 10, color: '#d97706', marginTop: 4, fontWeight: 500 }}>
            {formatMontantFull(totalEncaisse)} FCFA encaissés
          </div>
        </div>

        {/* Absences */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📅</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: '#dc2626', lineHeight: 1, marginBottom: 4 }}>
            {absencesAujourdhui}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Absences aujourd&apos;hui</div>
          <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>
            {absencesNonJustifiees} non justifiées
          </div>
        </div>

        {/* Moyenne */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📊</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: '#1e40af', lineHeight: 1, marginBottom: 4 }}>
            {moyenneGenerale !== null ? moyenneGenerale : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Moy. générale école</div>
          <div style={{ fontSize: 10, color: '#1e40af', marginTop: 4, fontWeight: 500 }}>Sur 20 · 1er trimestre</div>
        </div>

      </div>

      {/* ── Grille 2/3 - 1/3 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Activité récente */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #d1fae5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>🕐 Activité récente</div>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Aujourd&apos;hui</span>
          </div>
          <div style={{ padding: 14 }}>
            {activiteRecente.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
                Aucune activité récente.
              </div>
            ) : (
              activiteRecente.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: getBgForEntity(a.entity), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {getIconForEntity(a.entity)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#0d1f16', lineHeight: 1.4 }}>
                      {a.action} — <span style={{ color: '#6b7280' }}>{entityLabel(a.entity)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Finances du mois */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
              💰 Finances du mois
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#1B4332' }}>
                    {formatMontant(totalEncaisse)}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Encaissé (FCFA)</div>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#dc2626' }}>
                    {formatMontant(totalImpayes)}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Impayés (FCFA)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 11 }}>
                <div style={{ width: 55, color: '#6b7280', flexShrink: 0 }}>Primaire</div>
                <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(tauxRecouvrement, 100)}%`, height: '100%', background: '#1B4332', borderRadius: 4 }} />
                </div>
                <div style={{ width: 32, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: '#1B4332', fontSize: 11 }}>
                  {tauxRecouvrement}%
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 55, color: '#6b7280', flexShrink: 0 }}>Collège</div>
                <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(tauxRecouvrement, 100)}%`, height: '100%', background: '#40916C', borderRadius: 4 }} />
                </div>
                <div style={{ width: 32, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: '#1B4332', fontSize: 11 }}>
                  {tauxRecouvrement}%
                </div>
              </div>
            </div>
          </div>

          {/* Effectifs */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
              📊 Effectifs
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#1B4332' }}>
                    {totalStudents}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Inscrits</div>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: '#d97706' }}>
                    {inscriptionsEnAttente}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>En attente</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 11 }}>
                <div style={{ width: 55, color: '#6b7280', flexShrink: 0 }}>Primaire</div>
                <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: totalStudents > 0 ? '60%' : '0%', height: '100%', background: '#1e40af', borderRadius: 4 }} />
                </div>
                <div style={{ width: 32, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: '#1B4332', fontSize: 11 }}>
                  {Math.round(totalStudents * 0.6)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 55, color: '#6b7280', flexShrink: 0 }}>Collège</div>
                <div style={{ flex: 1, height: 7, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: totalStudents > 0 ? '40%' : '0%', height: '100%', background: '#7c3aed', borderRadius: 4 }} />
                </div>
                <div style={{ width: 32, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: '#1B4332', fontSize: 11 }}>
                  {Math.round(totalStudents * 0.4)}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Graphique encaissements ── */}
      <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #d1fae5' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            📈 Encaissements — Année {schoolYear}
          </div>
          <span style={{ fontSize: 11, color: '#6b7280' }}>en milliers de FCFA</span>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, paddingBottom: 2 }}>
            {encaissementsParMois.map(({ mois, montant }) => {
              const pct = montant > 0 ? Math.max(4, Math.round((montant / maxMontant) * 100)) : 0
              return (
                <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1B4332', fontWeight: 500, minHeight: 12 }}>
                    {montant > 0 ? formatMontant(montant) : ''}
                  </div>
                  <div
                    style={{ width: '100%', height: `${pct}%`, minHeight: montant > 0 ? 4 : 16, background: montant > 0 ? '#1B4332' : '#f3f4f6', borderRadius: '3px 3px 0 0', cursor: 'pointer' }}
                    title={`${mois} : ${formatMontantFull(montant)} FCFA`}
                  />
                  <div style={{ fontSize: 9, color: '#6b7280' }}>{mois}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Vue par classe ── */}
      <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #d1fae5' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>🏫 Vue par classe</div>
          <button style={{ background: 'transparent', border: '1px solid #d1fae5', color: '#6b7280', borderRadius: 7, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            Voir tout →
          </button>
        </div>
        <div style={{ padding: 14 }}>
          {classesStats.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
              Aucune classe trouvée pour cette année scolaire.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
              {classesStats.map(c => (
                <div key={c.id} style={{ background: '#f0faf3', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>
                      {c.totalEleves > 0 ? `${c.totalEleves} élèves` : '—'}
                      {c.enseignant !== '—' ? ` · ${c.enseignant}` : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 500, color: '#1B4332' }}>
                    {c.moyenne !== null ? c.moyenne : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
