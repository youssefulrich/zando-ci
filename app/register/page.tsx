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

const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 16px', fontSize: 14, color: '#fff', outline: 'none', colorScheme: 'dark' as const }
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

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

  const isOwner = data.account_type !== 'client'

  function set(field: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate(s: number): boolean {
    try {
      if (s === 1) step1Schema.parse({ full_name: data.full_name })

      if (s === 2) {
        step2Schema.parse({
          account_type: data.account_type,
          phone: data.phone,
          city: data.city,
        })

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

        err.issues.forEach((ze) => {
          if (ze.path && ze.path.length > 0) {
            e[ze.path[0] as string] = ze.message
          }
        })

        setErrors(e)
      }

      return false
    }
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

  return (
    <div style={{ padding: 40, color: 'white' }}>
      <h1>Test rapide (formulaire OK)</h1>

      <input
        placeholder="Nom"
        value={data.full_name}
        onChange={e => set('full_name', e.target.value)}
      />
      {errors.full_name && <p>{errors.full_name}</p>}

      <input
        placeholder="Email"
        value={data.email}
        onChange={e => set('email', e.target.value)}
      />
      {errors.email && <p>{errors.email}</p>}

      <input
        placeholder="Password"
        type="password"
        value={data.password}
        onChange={e => set('password', e.target.value)}
      />
      {errors.password && <p>{errors.password}</p>}

      <button onClick={handleSubmit}>
        Créer
      </button>

      {globalError && <p>{globalError}</p>}
    </div>
  )
}