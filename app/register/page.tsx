'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const step1Schema = z.object({ full_name: z.string().min(3, 'Minimum 3 caractères') })
const step2Schema = z.object({ account_type: z.string().min(1), phone: z.string().min(10, 'Numéro invalide'), city: z.string().min(2, 'Ville requise') })
const step3Schema = z.object({ email: z.string().email('Email invalide'), password: z.string().min(6, 'Minimum 6 caractères') })

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']
const ACCOUNT_TYPES = [
  { value: 'client', label: 'Client', desc: 'Je veux louer' },
  { value: 'owner_residence', label: 'Propriétaire', desc: 'Je loue des résidences' },
  { value: 'owner_vehicle', label: 'Loueur véhicule', desc: 'Je loue des véhicules' },
  { value: 'owner_event', label: 'Organisateur', desc: 'Je crée des événements' },
]

type FormData = { full_name: string; account_type: string; phone: string; city: string; orange_money: string; mtn_money: string; wave: string; moov_money: string; email: string; password: string }

const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 14, color: '#fff', outline: 'none', colorScheme: 'dark' as const }
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({ full_name: '', account_type: 'client', phone: '', city: '', orange_money: '', mtn_money: '', wave: '', moov_money: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

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
          setErrors({ mobile_money: 'Au moins un numéro Mobile Money requis' }); return false
        }
      }
      if (s === 3) step3Schema.parse({ email: data.email, password: data.password })
      setErrors({}); return true
    } catch (err) {
      if (err instanceof z.ZodError && Array.isArray(err.errors)) {
        const e: Record<string, string> = {}
        err.errors.forEach(ze => { if (ze.path && ze.path.length > 0) e[ze.path[0] as string] = ze.message })
        setErrors(e)
      }
      return false
    }
  }

  async function handleSubmit() {
    if (!validate(3)) return
    setLoading(true); setGlobalError('')
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email, password: data.password,
        options: { data: { full_name: data.full_name, phone: data.phone, city: data.city, account_type: data.account_type, orange_money: data.orange_money || null, mtn_money: data.mtn_money || null, wave: data.wave || null, moov_money: data.moov_money || null } },
      })
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setGlobalError(msg.includes('already registered') ? 'Cet email est déjà utilisé.' : msg)
      setLoading(false)
    }
  }

  const STEPS = ['Identité', 'Profil', 'Accès']
  const STEP_COLORS = ['#22d3a5', '#a78bfa', '#60a5fa']
  const accent = STEP_COLORS[step - 1]

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ fontSize: 26, fontWeight: 800, color: '#fff', textDecoration: 'none', letterSpacing: -0.5 }}>
            Zando<span style={{ color: '#22d3a5' }}>CI</span>
          </Link>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Créer votre compte</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? STEP_COLORS[i] : 'rgba(255,255,255,0.08)', marginBottom: 6, transition: 'background 0.3s' }} />
              <p style={{ fontSize: 10, color: i + 1 === step ? STEP_COLORS[i] : 'rgba(255,255,255,0.25)', fontWeight: i + 1 === step ? 600 : 400 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#111827', border: `0.5px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: 32 }}>

          {/* Étape 1 — Identité */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Votre identité</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Comment devons-nous vous appeler ?</p>
              </div>
              <div>
                <label style={lbl}>Prénom et nom complet</label>
                <input type="text" value={data.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ex : Konan Kouassi" style={inp} />
                {errors.full_name && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.full_name}</p>}
              </div>
            </div>
          )}

          {/* Étape 2 — Profil */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Votre profil</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Comment utiliserez-vous Zando CI ?</p>
              </div>

              {/* Type de compte */}
              <div>
                <label style={lbl}>Type de compte</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ACCOUNT_TYPES.map(opt => (
                    <button key={opt.value} type="button" onClick={() => set('account_type', opt.value)} style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      border: data.account_type === opt.value ? `1.5px solid rgba(167,139,250,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                      background: data.account_type === opt.value ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.15s ease',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: data.account_type === opt.value ? '#a78bfa' : '#fff', marginBottom: 2 }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label style={lbl}>Téléphone WhatsApp</label>
                <input type="tel" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+225 07 00 00 00 00" style={inp} />
                {errors.phone && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.phone}</p>}
              </div>

              {/* Ville */}
              <div>
                <label style={lbl}>Ville</label>
                <select value={data.city} onChange={e => set('city', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                  <option value="">Sélectionner une ville</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.city}</p>}
              </div>

              {/* Mobile Money */}
              {isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={lbl}>Numéros Mobile Money</label>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>Pour recevoir vos paiements — au moins un requis</p>
                  </div>
                  {errors.mobile_money && (
                    <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, color: '#f87171' }}>{errors.mobile_money}</p>
                    </div>
                  )}
                  {[
                    { field: 'orange_money' as const, label: 'Orange Money', placeholder: '+225 07...' },
                    { field: 'mtn_money' as const, label: 'MTN Money', placeholder: '+225 05...' },
                    { field: 'wave' as const, label: 'Wave', placeholder: '+225 01...' },
                    { field: 'moov_money' as const, label: 'Moov Money', placeholder: '+225 01...' },
                  ].map(({ field, label, placeholder }) => (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 96, flexShrink: 0 }}>{label}</span>
                      <input type="tel" value={data[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={{ ...inp, flex: 1 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Étape 3 — Accès */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Vos identifiants</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Email et mot de passe pour vous connecter</p>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="vous@exemple.com" style={inp} />
                {errors.email && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.email}</p>}
              </div>
              <div>
                <label style={lbl}>Mot de passe</label>
                <input type="password" value={data.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 caractères" style={inp} />
                {errors.password && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.password}</p>}
              </div>
              {globalError && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#f87171' }}>{globalError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                ← Retour
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => validate(step) && setStep(s => s + 1)} style={{ padding: '12px 28px', background: accent, color: step === 1 ? '#0a1a14' : step === 2 ? '#1a0a3d' : '#0a1428', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                Continuer →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', background: loading ? 'rgba(96,165,250,0.4)' : accent, color: '#0a1428', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#22d3a5', textDecoration: 'none', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}