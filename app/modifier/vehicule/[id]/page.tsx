'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'berline', label: 'Berline' }, { value: 'suv', label: 'SUV' },
  { value: '4x4', label: '4x4' }, { value: 'utilitaire', label: 'Utilitaire' },
  { value: 'minibus', label: 'Minibus' }, { value: 'pick_up', label: 'Pick-up' },
]
const TRANSMISSIONS = [
  { value: 'automatique', label: 'Automatique' }, { value: 'manuelle', label: 'Manuelle' },
]
const FUELS = [
  { value: 'essence', label: 'Essence' }, { value: 'diesel', label: 'Diesel' },
  { value: 'hybride', label: 'Hybride' }, { value: 'electrique', label: 'Électrique' },
]
const CITIES = ['Abidjan','Bouaké','Daloa','Yamoussoukro','San-Pédro','Korhogo','Man','Divo','Gagnoa','Abengourou']

export default function ModifierVehiculePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState({
    brand: '', model: '', year: new Date().getFullYear(), category: 'berline',
    transmission: 'automatique', fuel_type: 'essence', seats: 5,
    price_per_day: '', price_per_week: '', price_per_month: '',
    city: 'Abidjan', description: '', with_driver: false, is_available: true,
    main_photo: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('vehicles').select('*').eq('id', id).single().then(({ data: v }) => {
      if (v) setData({
        brand: v.brand ?? '', model: v.model ?? '', year: v.year ?? new Date().getFullYear(),
        category: v.category ?? 'berline', transmission: v.transmission ?? 'automatique',
        fuel_type: v.fuel_type ?? 'essence', seats: v.seats ?? 5,
        price_per_day: v.price_per_day ?? '', price_per_week: v.price_per_week ?? '',
        price_per_month: v.price_per_month ?? '', city: v.city ?? 'Abidjan',
        description: v.description ?? '', with_driver: v.with_driver ?? false,
        is_available: v.is_available ?? true, main_photo: v.main_photo ?? '',
      })
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: unknown) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setError('')
    if (!data.brand || !data.model || !data.price_per_day) {
      setError('Marque, modèle et prix par jour sont requis')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('vehicles').update({
      brand: data.brand, model: data.model, year: data.year,
      category: data.category, transmission: data.transmission,
      fuel_type: data.fuel_type, seats: data.seats,
      price_per_day: Number(data.price_per_day),
      price_per_week: data.price_per_week ? Number(data.price_per_week) : null,
      price_per_month: data.price_per_month ? Number(data.price_per_month) : null,
      city: data.city, description: data.description,
      with_driver: data.with_driver, is_available: data.is_available,
      main_photo: data.main_photo || null,
    }).eq('id', id)

    if (err) { setError('Erreur lors de la sauvegarde'); setSaving(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const accent = '#60a5fa'
  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8,
  }
  const sectionStyle = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 24, marginBottom: 20,
  }

  if (loading) return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Modification</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Modifier le véhicule</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>{data.brand} {data.model} {data.year}</p>
        </div>

        {/* Infos véhicule */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Informations du véhicule</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Marque</label>
              <input style={inputStyle} value={data.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota, Renault..." />
            </div>
            <div>
              <label style={labelStyle}>Modèle</label>
              <input style={inputStyle} value={data.model} onChange={e => set('model', e.target.value)} placeholder="Corolla, Duster..." />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Année</label>
              <input type="number" style={inputStyle} value={data.year} onChange={e => set('year', Number(e.target.value))} min={2000} max={2026} />
            </div>
            <div>
              <label style={labelStyle}>Places</label>
              <input type="number" style={inputStyle} value={data.seats} onChange={e => set('seats', Number(e.target.value))} min={2} max={20} />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <select style={{ ...inputStyle, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Catégorie</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => set('category', c.value)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: data.category === c.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${data.category === c.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: data.category === c.value ? accent : '#94a3b8',
                  fontWeight: data.category === c.value ? 600 : 400,
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Transmission</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TRANSMISSIONS.map(t => (
                  <button key={t.value} onClick={() => set('transmission', t.value)} style={{
                    flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    background: data.transmission === t.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${data.transmission === t.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: data.transmission === t.value ? accent : '#94a3b8',
                    fontWeight: data.transmission === t.value ? 600 : 400,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Carburant</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FUELS.map(f => (
                  <button key={f.value} onClick={() => set('fuel_type', f.value)} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    background: data.fuel_type === f.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${data.fuel_type === f.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: data.fuel_type === f.value ? accent : '#94a3b8',
                    fontWeight: data.fuel_type === f.value ? 600 : 400,
                  }}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={data.description}
              onChange={e => set('description', e.target.value)} placeholder="Décrivez le véhicule..." />
          </div>
        </div>

        {/* Tarifs */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Tarifs (FCFA)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { field: 'price_per_day', label: 'Prix / jour *', placeholder: '25 000' },
              { field: 'price_per_week', label: 'Prix / semaine', placeholder: '150 000' },
              { field: 'price_per_month', label: 'Prix / mois', placeholder: '500 000' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label style={labelStyle}>{label}</label>
                <input type="number" style={inputStyle} value={(data as any)[field]}
                  onChange={e => set(field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Options</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { field: 'with_driver', label: '🧑‍✈️ Avec chauffeur', color: accent },
              { field: 'is_available', label: '✅ Disponible', color: '#22d3a5' },
            ].map(({ field, label, color }) => (
              <button key={field} onClick={() => set(field, !(data as any)[field])} style={{
                padding: '12px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                background: (data as any)[field] ? `rgba(${field === 'with_driver' ? '96,165,250' : '34,211,165'},0.12)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(data as any)[field] ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                color: (data as any)[field] ? color : '#64748b',
                fontWeight: (data as any)[field] ? 600 : 400,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Photo principale */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Photo principale (URL)</h2>
          <input style={inputStyle} value={data.main_photo} onChange={e => set('main_photo', e.target.value)} placeholder="https://..." />
          {data.main_photo && (
            <div style={{ marginTop: 12, width: 120, height: 80, borderRadius: 8, overflow: 'hidden' }}>
              <img src={data.main_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#22d3a5', fontSize: 13 }}>
            ✅ Véhicule mis à jour ! Redirection...
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? 'rgba(96,165,250,0.3)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            color: saving ? '#64748b' : '#0a1428', fontWeight: 700, fontSize: 15, cursor: saving ? 'wait' : 'pointer',
          }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}