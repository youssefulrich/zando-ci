'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const step1Schema = z.object({ full_name: z.string().min(3, 'Minimum 3 caractères') })
const step2Schema = z.object({
  account_type: z.string().min(1),
  phone: z.string().min(10, 'Numéro invalide'),
  city: z.string().min(2, 'Ville requise'),
})
const step3Schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']
const ACCOUNT_TYPES = [
  { value: 'client', label: 'Client', desc: 'Je veux louer', icon: '◎' },
  { value: 'owner_residence', label: 'Propriétaire', desc: 'Je loue des résidences', icon: '⌂' },
  { value: 'owner_vehicle', label: 'Loueur véhicule', desc: 'Je loue des véhicules', icon: '◈' },
  { value: 'owner_event', label: 'Organisateur', desc: 'Je crée des événements', icon: '◉' },
]

type FormData = {
  full_name: string
  account_type: string
  phone: string
  city: string
  orange_money: string
  mtn_money: string
  wave: string
  moov_money: string
  email: string
  password: string
}

const STEPS = [
  { num: 1, label: 'Identité' },
  { num: 2, label: 'Profil' },
  { num: 3, label: 'Accès' },
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({
    full_name: '',
    account_type: 'client',
    phone: '',
    city: '',
    orange_money: '',
    mtn_money: '',
    wave: '',
    moov_money: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isOwner = data.account_type !== 'client'

  function set(field: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(s: number): boolean {
    try {
      if (s === 1) step1Schema.parse({ full_name: data.full_name })
      if (s === 2) {
        step2Schema.parse({ account_type: data.account_type, phone: data.phone, city: data.city })
        if (isOwner && !data.orange_money && !data.mtn_money && !data.wave && !data.moov_money) {
          setErrors({ mobile_money: 'Au moins un numéro Mobile Money requis' })
          return false
        }
      }
      if (s === 3) step3Schema.parse({ email: data.email, password: data.password })
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        const e: Record<string, string> = {}
        err.issues.forEach(ze => { if (ze.path?.[0]) e[ze.path[0] as string] = ze.message })
        setErrors(e)
      }
      return false
    }
  }

  function nextStep() {
    if (validate(step)) setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!validate(3)) return
    setLoading(true)
    setGlobalError('')
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            account_type: data.account_type,
            orange_money: data.orange_money || null,
            mtn_money: data.mtn_money || null,
            wave: data.wave || null,
            moov_money: data.moov_money || null,
          },
        },
      })
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setGlobalError(msg.includes('already registered') ? 'Cet email est déjà utilisé.' : msg)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    colorScheme: 'dark',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 600,
    marginBottom: 8,
  }

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#f87171',
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div style={{
      background: '#0a0f1a',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(34,211,165,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
              Zando<span style={{ color: '#22d3a5' }}>CI</span>
            </div>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step > s.num ? '#22d3a5' : step === s.num ? 'rgba(34,211,165,0.15)' : 'rgba(255,255,255,0.05)',
                  border: step === s.num ? '1.5px solid #22d3a5' : step > s.num ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: step > s.num ? '#0a1a14' : step === s.num ? '#22d3a5' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.3s ease',
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{
                  fontSize: 10, color: step === s.num ? '#22d3a5' : 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600,
                  transition: 'color 0.3s ease',
                }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 80, height: 0.5,
                  background: step > s.num ? 'rgba(34,211,165,0.4)' : 'rgba(255,255,255,0.08)',
                  margin: '0 8px', marginBottom: 22,
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: '#111827',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>

          {/* Step 1 — Identité */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 6 }}>Étape 1</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, margin: 0 }}>Comment vous appelez-vous ?</h2>
              </div>

              <div>
                <label style={labelStyle}>Nom complet</label>
                <input
                  style={inputStyle}
                  placeholder="Ex: Kouassi Jean-Baptiste"
                  value={data.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nextStep()}
                  autoFocus
                />
                {errors.full_name && <p style={errorStyle}>⚠ {errors.full_name}</p>}
              </div>
            </div>
          )}

          {/* Step 2 — Profil */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 6 }}>Étape 2</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, margin: 0 }}>Votre profil</h2>
              </div>

              {/* Type de compte */}
              <div>
                <label style={labelStyle}>Je suis</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ACCOUNT_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => set('account_type', t.value)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: data.account_type === t.value ? '1.5px solid rgba(34,211,165,0.5)' : '0.5px solid rgba(255,255,255,0.08)',
                        background: data.account_type === t.value ? 'rgba(34,211,165,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: data.account_type === t.value ? '#22d3a5' : '#fff' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input
                  style={inputStyle}
                  placeholder="+225 07 00 00 00 00"
                  value={data.phone}
                  onChange={e => set('phone', e.target.value)}
                  type="tel"
                />
                {errors.phone && <p style={errorStyle}>⚠ {errors.phone}</p>}
              </div>

              {/* Ville */}
              <div>
                <label style={labelStyle}>Ville</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={data.city}
                  onChange={e => set('city', e.target.value)}
                >
                  <option value="">Sélectionner une ville</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p style={errorStyle}>⚠ {errors.city}</p>}
              </div>

              {/* Mobile Money — owners uniquement */}
              {isOwner && (
                <div>
                  <label style={labelStyle}>Numéros Mobile Money <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(au moins 1)</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { field: 'orange_money' as const, label: 'Orange Money', color: '#ff6b00', placeholder: '+225 07 ...' },
                      { field: 'mtn_money' as const, label: 'MTN Money', color: '#fbbf24', placeholder: '+225 05 ...' },
                      { field: 'wave' as const, label: 'Wave', color: '#60a5fa', placeholder: '+225 01 ...' },
                      { field: 'moov_money' as const, label: 'Moov Money', color: '#22d3a5', placeholder: '+225 01 ...' },
                    ].map(m => (
                      <div key={m.field} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                          width: 8, height: 8, borderRadius: '50%', background: m.color, opacity: 0.7,
                        }} />
                        <input
                          style={{ ...inputStyle, paddingLeft: 30, fontSize: 13 }}
                          placeholder={`${m.label} — ${m.placeholder}`}
                          value={data[m.field]}
                          onChange={e => set(m.field, e.target.value)}
                          type="tel"
                        />
                      </div>
                    ))}
                  </div>
                  {errors.mobile_money && <p style={errorStyle}>⚠ {errors.mobile_money}</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Accès */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 6 }}>Étape 3</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, margin: 0 }}>Vos identifiants</h2>
              </div>

              {/* Récap */}
              <div style={{
                background: 'rgba(34,211,165,0.05)',
                border: '0.5px solid rgba(34,211,165,0.15)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(34,211,165,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: '#22d3a5', flexShrink: 0,
                }}>
                  {ACCOUNT_TYPES.find(t => t.value === data.account_type)?.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{data.full_name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {ACCOUNT_TYPES.find(t => t.value === data.account_type)?.label} · {data.city}
                  </p>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Adresse email</label>
                <input
                  style={inputStyle}
                  placeholder="votre@email.com"
                  value={data.email}
                  onChange={e => set('email', e.target.value)}
                  type="email"
                  autoFocus
                />
                {errors.email && <p style={errorStyle}>⚠ {errors.email}</p>}
              </div>

              <div>
                <label style={labelStyle}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 44 }}
                    placeholder="Minimum 6 caractères"
                    value={data.password}
                    onChange={e => set('password', e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 0,
                    }}
                  >
                    {showPassword ? '◎' : '○'}
                  </button>
                </div>
                {errors.password && <p style={errorStyle}>⚠ {errors.password}</p>}
              </div>

              {globalError && (
                <div style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '0.5px solid rgba(248,113,113,0.2)',
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>⚠ {globalError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, color: 'rgba(255,255,255,0.6)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ← Retour
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                style={{
                  flex: 2, padding: '14px',
                  background: '#22d3a5',
                  border: 'none', borderRadius: 12,
                  color: '#0a1a14', fontSize: 15, fontWeight: 800,
                  cursor: 'pointer', letterSpacing: -0.3,
                  fontFamily: 'inherit', transition: 'opacity 0.15s ease',
                }}
              >
                Continuer →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2, padding: '14px',
                  background: loading ? 'rgba(34,211,165,0.4)' : '#22d3a5',
                  border: 'none', borderRadius: 12,
                  color: '#0a1a14', fontSize: 15, fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: -0.3, fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 24 }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#22d3a5', textDecoration: 'none', fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}