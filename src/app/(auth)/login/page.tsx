export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e8f5ec',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(27,67,50,0.10)',
          width: 360,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: '#F4A261',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 22,
            color: '#ffffff',
          }}
        >
          S
        </div>
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 22,
            fontWeight: 700,
            color: '#1B4332',
            marginBottom: 4,
          }}
        >
          Sukulu
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 28 }}>
          Connexion à votre espace
        </div>
        <div
          style={{
            background: '#f0faf3',
            border: '1px solid #d1fae5',
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 13,
            color: '#40916C',
          }}
        >
          Page en cours de construction...
        </div>
      </div>
    </div>
  )
}
