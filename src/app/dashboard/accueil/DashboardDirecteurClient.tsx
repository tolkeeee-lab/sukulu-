'use client'

import StatCard from '@/components/ui/StatCard'

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

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular
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

export default function DashboardDirecteurClient({
  schoolName,
  totalStudents,
  totalClasses,
  totalPersonnel,
  totalEncaisse,
  totalImpayes,
  tauxRecouvrement,
  absencesAujourdhui,
  absencesNonJustifiees,
  moyenneGenerale,
  encaissementsParMois,
  classesStats,
  activiteRecente,
  notificationsNonLues,
}: Props) {
  const maxMontant = Math.max(...encaissementsParMois.map(m => m.montant), 1)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1B4332' }}>
            Tableau de bord
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            {schoolName ? `${schoolName} — Vue d'ensemble` : "Vue d'ensemble de l'école"}
          </div>
        </div>
        {notificationsNonLues > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff4ec', border: '1px solid #F4A261',
            borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#c05621',
          }}>
            <span>🔔</span>
            <span>{notificationsNonLues} {pluralize(notificationsNonLues, 'notification non lue', 'notifications non lues')}</span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👦" label="Élèves inscrits" value={String(totalStudents)} variant="vert" />
        <StatCard icon="🏫" label="Classes actives" value={String(totalClasses)} variant="bleu" />
        <StatCard icon="👥" label="Personnel" value={String(totalPersonnel)} variant="orange" />
        <StatCard icon="💰" label="Encaissé" value={formatMontant(totalEncaisse)} sub="FCFA" variant="violet" />
      </div>

      {/* Finance + Absences row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Finance card */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
            Finances
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Encaissé</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: '#1B4332' }}>
                {formatMontant(totalEncaisse)} FCFA
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Impayés</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: '#dc2626' }}>
                {formatMontant(totalImpayes)} FCFA
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Taux de recouvrement</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: tauxRecouvrement >= 75 ? '#1B4332' : '#d97706' }}>
                {tauxRecouvrement}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 4 }}>
              <div style={{ background: '#e8f5ec', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(tauxRecouvrement, 100)}%`, height: '100%', background: tauxRecouvrement >= 75 ? '#1B4332' : '#d97706', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Absences card */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
            Absences du jour
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: '#fee2e2', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{absencesAujourdhui}</div>
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Total</div>
            </div>
            <div style={{ flex: 1, background: '#fef3c7', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#d97706' }}>{absencesNonJustifiees}</div>
              <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>Non justifiées</div>
            </div>
            {moyenneGenerale !== null && (
              <div style={{ flex: 1, background: '#dbeafe', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#1e40af' }}>{moyenneGenerale}</div>
                <div style={{ fontSize: 11, color: '#1e40af', marginTop: 2 }}>Moyenne /20</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '18px 20px', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 14 }}>
          Encaissements par mois
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {encaissementsParMois.map(({ mois, montant }) => (
            <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: '100%',
                  height: montant > 0 ? Math.max(4, Math.round((montant / maxMontant) * 60)) : 4,
                  background: montant > 0 ? '#1B4332' : '#e8f5ec',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s',
                }}
                title={`${mois}: ${formatMontant(montant)} FCFA`}
              />
              <span style={{ fontSize: 9, color: '#6b7280' }}>{mois}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Classes + Activity row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Classes */}
        {classesStats.length > 0 && (
          <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 12 }}>
              Classes ({classesStats.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {classesStats.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0faf3' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1f16' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{c.enseignant}</div>
                  </div>
                  {c.moyenne !== null && (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#1B4332' }}>{c.moyenne}/20</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activité récente */}
        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: '#1B4332', marginBottom: 12 }}>
            Activité récente
          </div>
          {activiteRecente.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6b7280' }}>Aucune activité récente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activiteRecente.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#40916C', marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#0d1f16', fontWeight: 500 }}>
                      {a.action} — <span style={{ color: '#6b7280', fontWeight: 400 }}>{entityLabel(a.entity)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{timeAgo(a.created_at)}</div>
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
