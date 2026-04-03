'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

type Step = 'school' | 'director'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('school')

  // School fields
  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')

  // Director fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [directorPhone, setDirectorPhone] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStep('director')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          schoolCode,
          schoolAddress,
          schoolPhone,
          fullName,
          email,
          password,
          directorPhone,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error ?? "Erreur lors de l'inscription.")
        return
      }

      // Connecter l'utilisateur après inscription réussie
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Compte créé, mais erreur de connexion automatique. Veuillez vous connecter manuellement.')
        router.push('/login')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1fae5',
    borderRadius: 8,
    fontSize: 13,
    color: '#1B4332',
    background: '#f9fafb',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1B4332',
    marginBottom: 6,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e8f5ec',
        fontFamily: 'Source Sans 3, sans-serif',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(27,67,50,0.10)',
          width: 420,
          border: '1px solid #d1fae5',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 8,
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
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: 22,
              color: '#ffffff',
              flexShrink: 0,
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
            }}
          >
            Sukulu
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 15,
            color: '#6b7280',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          Inscrire votre école
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 28,
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: step === 'school' ? '#1B4332' : '#40916C',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {step === 'director' ? '✓' : '1'}
            </div>
            <span style={{ fontSize: 12, color: step === 'school' ? '#1B4332' : '#40916C', fontWeight: 600 }}>
              École
            </span>
          </div>

          <div style={{ width: 32, height: 2, background: step === 'director' ? '#40916C' : '#d1fae5' }} />

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: step === 'director' ? '#1B4332' : '#d1fae5',
                color: step === 'director' ? '#fff' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              2
            </div>
            <span style={{ fontSize: 12, color: step === 'director' ? '#1B4332' : '#6b7280', fontWeight: 600 }}>
              Directeur
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: '#fff5f5',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#dc2626',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1 — School info */}
        {step === 'school' && (
          <form onSubmit={handleNextStep}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="schoolName" style={labelStyle}>
                Nom de l&apos;école *
              </label>
              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                placeholder="Ex : Collège Saint-Joseph"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="schoolCode" style={labelStyle}>
                Code de l&apos;école *
              </label>
              <input
                id="schoolCode"
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.replace(/\s/g, ''))}
                required
                placeholder="Ex : CSJ-ABJ"
                maxLength={20}
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                Code unique pour identifier votre école (sans espaces)
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="schoolAddress" style={labelStyle}>
                Adresse
              </label>
              <input
                id="schoolAddress"
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Ex : Quartier Cocody, Abidjan"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="schoolPhone" style={labelStyle}>
                Téléphone de l&apos;école
              </label>
              <input
                id="schoolPhone"
                type="tel"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                placeholder="Ex : +225 07 07 07 07 07"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#1B4332',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              Suivant →
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              Déjà inscrit ?{' '}
              <a
                href="/login"
                style={{ color: '#F4A261', textDecoration: 'underline', fontWeight: 600 }}
              >
                Se connecter
              </a>
            </div>
          </form>
        )}

        {/* Step 2 — Director info */}
        {step === 'director' && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="fullName" style={labelStyle}>
                Nom complet du directeur *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ex : M. Komlan Agbeko"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={labelStyle}>
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="directeur@ecole.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="directorPhone" style={labelStyle}>
                Téléphone
              </label>
              <input
                id="directorPhone"
                type="tel"
                value={directorPhone}
                onChange={(e) => setDirectorPhone(e.target.value)}
                placeholder="Ex : +225 07 07 07 07 07"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="password" style={labelStyle}>
                Mot de passe *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 caractères"
                  style={{ ...inputStyle, padding: '10px 40px 10px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setStep('school'); setError('') }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f9fafb',
                  color: '#1B4332',
                  border: '1px solid #d1fae5',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: loading ? '#40916C' : '#1B4332',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Inscription...' : 'Créer mon compte'}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
              Déjà inscrit ?{' '}
              <a
                href="/login"
                style={{ color: '#F4A261', textDecoration: 'underline', fontWeight: 600 }}
              >
                Se connecter
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
