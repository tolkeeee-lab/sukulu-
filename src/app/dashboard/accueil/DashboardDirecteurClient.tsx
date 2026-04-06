'use client'

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
  tauxRecouvrement: number
  absencesAujourdhui: number
  absencesNonJustifiees: number
  moyenneGenerale: number | null
  encaissementsParMois: EncaissementMois[]
  classesStats: ClasseStat[]
  activiteRecente: ActiviteItem[]
  notificationsNonLues: number
}

function formatMontant(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return String(n)
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
    student: 'Élève',
    class: 'Classe',
    payment: 'Paiement',
    attendance: 'Présence',
    grade: 'Note',
    user: 'Utilisateur',
  }
  return map[entity] ?? entity
}

function getIconForEntity(entity: string): string {
  const map: Record<string, string> = {
    grade: '📝',
    payment: '💰',
    attendance: '📅',
    student: '👦',
    class: '🏫',
    user: '👤',
  }
  return map[entity] ?? '📋'
}

function getBgForEntity(entity: string): string {
  const map: Record<string, string> = {
    grade: '#D8F3DC',
    payment: '#fff4ec',
    attendance: '#fee2e2',
    student: '#dbeafe',
    class: '#dbeafe',
    user: '#f3f4f6',
  }
  return map[entity] ?? '#f3f4f6'
}

function getTodayLabel(): string {
  const now = new Date()
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
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
  tauxRecouvrement,
  absencesAujourdhui,
  absencesNonJustifiees,
  moyenneGenerale,
  encaissementsParMois,
  classesStats,
  activiteRecente,
}: Props) {
  const maxMontant = Math.max(...encaissementsParMois.map(m => m.montant), 1)
  const schoolYear = getCurrentSchoolYear()

  // Nombre de bulletins générés (info neutre, toujours affiché)
  const bulletinsGeneres = totalStudents

  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#0d1f16' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1B4332', marginBottom: 4 }}>
            Tableau de bord
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {schoolName && <span style={{ fontWeight: 500, color: '#0d1f16' }}>{schoolName}</span>}
            {schoolName && <span style={{ margin: '0 6px', color: '#9ca3af' }}>·</span>}
            <span>{getTodayLabel()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{
            background: '#ffffff',
            border: '1.5px solid #1B4332',
            color: '#1B4332',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>📊</span> Rapport mensuel
          </button>
          <button style={{
            background: '#1B4332',
            border: '1.5px solid #1B4332',
            color: '#ffffff',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>💬</span> Message aux parents
          </button>
        </div>
      </div>

      {/* ── Alertes ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {totalImpayes > 0 && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #dc2626',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🔴</span>
              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 13 }}>
                {formatMontant(totalImpayes)} FCFA de scolarité non réglée
              </span>
            </div>
            <a href="#" style={{ color: '#dc2626', fontWeight: 600, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>Voir →</a>
          </div>
        )}

        {/* Bulletins — always shown */}
        <div style={{
          background: '#dbeafe',
          border: '1px solid #1e40af',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🔵</span>
            <span style={{ color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
              Les bulletins du 1er trimestre sont prêts — {bulletinsGeneres} bulletins générés, en attente de publication
            </span>
          </div>
          <a href="#" style={{ color: '#1e40af', fontWeight: 600, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>Voir →</a>
        </div>
      </div>

      {/* ── 4 grandes stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Élèves inscrits */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>👦</span>
            <span style={{ background: '#D8F3DC', color: '#1B4332', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 10px' }}>Actifs</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#1B4332', lineHeight: 1 }}>{totalStudents}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Élèves inscrits</div>
        </div>

        {/* Taux de recouvrement */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 10px' }}>Finance</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#d97706', lineHeight: 1 }}>{tauxRecouvrement}%</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Taux de recouvrement</div>
        </div>

        {/* Absences */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 10px' }}>Aujourd'hui</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>{absencesAujourdhui}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Absences aujourd'hui</div>
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{absencesNonJustifiees} non justifiées</div>
        </div>

        {/* Moyenne générale */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 10px' }}>École</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: '#1e40af', lineHeight: 1 }}>
            {moyenneGenerale !== null ? moyenneGenerale : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Moyenne générale école</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Sur 20 · 1er trimestre</div>
        </div>
      </div>

      {/* ── Grille 2/3 - 1/3 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Colonne gauche : Activité récente */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#1B4332', marginBottom: 16 }}>
            🕐 Activité récente
          </div>
          {activiteRecente.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>Aucune activité récente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activiteRecente.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: getBgForEntity(a.entity),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {getIconForEntity(a.entity)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#0d1f16', fontWeight: 500 }}>
                      {a.action} — <span style={{ color: '#6b7280', fontWeight: 400 }}>{entityLabel(a.entity)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Finances du mois */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '18px 18px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
              💰 Finances du mois
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#D8F3DC', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#1B4332' }}>{formatMontant(totalEncaisse)}</div>
                <div style={{ fontSize: 10, color: '#40916C', marginTop: 2 }}>Encaissé</div>
              </div>
              <div style={{ flex: 1, background: '#fee2e2', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{formatMontant(totalImpayes)}</div>
                <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Impayés</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  <span>Primaire</span>
                  <span>{tauxRecouvrement}%</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(tauxRecouvrement, 100)}%`, height: '100%', background: '#40916C', borderRadius: 4 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  <span>Collège</span>
                  <span>{tauxRecouvrement}%</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(tauxRecouvrement, 100)}%`, height: '100%', background: '#40916C', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Effectifs */}
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '18px 18px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
              📊 Effectifs
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#dbeafe', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#1e40af' }}>{totalStudents}</div>
                <div style={{ fontSize: 10, color: '#1e40af', marginTop: 2 }}>Inscrits</div>
              </div>
              <div style={{ flex: 1, background: '#fef3c7', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#d97706' }}>{totalClasses}</div>
                <div style={{ fontSize: 10, color: '#d97706', marginTop: 2 }}>Classes</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  <span>Primaire</span>
                  <span>{totalStudents} élèves</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#1e40af', borderRadius: 4 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  <span>Collège</span>
                  <span>0 élèves</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: '0%', height: '100%', background: '#1e40af', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Graphique encaissements ── */}
      <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#1B4332', marginBottom: 18 }}>
          📈 Encaissements — Année {schoolYear}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {encaissementsParMois.map(({ mois, montant }) => {
            const barHeight = montant > 0 ? Math.max(8, Math.round((montant / maxMontant) * 90)) : 8
            return (
              <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                  {montant > 0 ? `${formatMontant(montant)}` : ''}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: barHeight,
                    background: montant > 0 ? '#40916C' : '#f3f4f6',
                    borderRadius: '4px 4px 0 0',
                  }}
                  title={`${mois}: ${formatMontant(montant)} FCFA`}
                />
                <span style={{ fontSize: 9, color: '#6b7280' }}>{mois}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Vue par classe ── */}
      {classesStats.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#1B4332', marginBottom: 16 }}>
            🏫 Vue par classe
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {classesStats.map(c => (
              <div key={c.id} style={{
                background: '#f0faf3',
                border: '1px solid #d1fae5',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4332', marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.totalEleves} élèves · {c.enseignant}</div>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  color: c.moyenne !== null ? '#1B4332' : '#9ca3af',
                }}>
                  {c.moyenne !== null ? `${c.moyenne}/20` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
