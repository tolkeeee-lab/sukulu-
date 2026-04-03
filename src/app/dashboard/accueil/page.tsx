import StatCard from '@/components/ui/StatCard'

export default function AccueilPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 20,
            fontWeight: 700,
            color: '#1B4332',
          }}
        >
          Tableau de bord
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
          Bienvenue, M. Komlan — Vue d&apos;ensemble de l&apos;école
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard icon="👦" label="Élèves inscrits" value="342" sub="+12 ce mois" variant="vert" />
        <StatCard icon="🏫" label="Classes actives" value="14" variant="bleu" />
        <StatCard icon="👥" label="Personnel" value="28" variant="orange" />
        <StatCard icon="💰" label="Recettes du mois" value="1.2M" sub="FCFA" variant="violet" />
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d1fae5',
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#1B4332',
            marginBottom: 8,
          }}
        >
          Activité récente
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Page en cours de construction...
        </div>
      </div>
    </div>
  )
}
