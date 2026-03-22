'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Email et mot de passe requis'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12,
    padding: '14px 16px', fontSize: 14, color: '#fff',
    outline: 'none', colorScheme: 'dark' as const,
    transition: 'border-color 0.15s ease',
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 26, fontWeight: 800, color: '#fff', textDecoration: 'none', letterSpacing: -0.5 }}>
            Zando<span style={{ color: '#22d3a5' }}>CI</span>
          </Link>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="vous@exemple.com"
                style={inp}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={inp}
              />
            </div>

            {/* Erreur */}
            {error && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
              </div>
            )}

            {/* Bouton */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(34,211,165,0.4)' : '#22d3a5',
                color: '#0a1a14', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, letterSpacing: -0.2,
              }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </div>

        {/* Lien inscription */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: '#22d3a5', textDecoration: 'none', fontWeight: 600 }}>
            S&apos;inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  )
}