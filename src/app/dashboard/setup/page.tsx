export default function SetupPage() {
  return (
    <div>
      <div
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 20,
          fontWeight: 600,
          color: '#1B4332',
        }}
      >
        Configuration de votre école
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        Votre compte n&apos;est pas encore associé à une école. Veuillez contacter votre administrateur.
      </div>
      <div style={{ marginTop: 24 }}>
        <a
          href="/auth/signout"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#fff5f5',
            border: '1px solid #fecaca',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            color: '#dc2626',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          🚪 Se déconnecter
        </a>
      </div>
    </div>
  )
}
