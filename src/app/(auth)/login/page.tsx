'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou mot de passe incorrect.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
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
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(27,67,50,0.10)',
          width: 380,
          textAlign: 'center',
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

        {/* Subtitle */}
        <div
          style={{
            fontSize: 15,
            color: '#6b7280',
            marginBottom: 28,
          }}
        >
          Connexion à votre espace
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
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#1B4332',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1fae5',
                borderRadius: 8,
                fontSize: 13,
                color: '#1B4332',
                background: '#f9fafb',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#1B4332',
                marginBottom: 6,
              }}
            >
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #d1fae5',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#1B4332',
                  background: '#f9fafb',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#40916C' : '#1B4332',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 16,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          {/* Forgot password */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => alert('Fonctionnalité bientôt disponible.')}
              style={{
                background: 'none',
                border: 'none',
                color: '#F4A261',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
