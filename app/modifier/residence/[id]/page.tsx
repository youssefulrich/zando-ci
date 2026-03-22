'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const TYPES = [
  { value: 'apartment', label: 'Appartement' }, { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' }, { value: 'house', label: 'Maison' },
  { value: 'room', label: 'Chambre' },
]
const AMENITIES_LIST = ['wifi','piscine','parking','climatisation','cuisine','tv','lave_linge','sécurité','gardien','générateur','eau_chaude','balcon']
const CITIES = ['Abidjan','Bouaké','Daloa','Yamoussoukro','San-Pédro','Korhogo','Man','Divo','Gagnoa','Abengourou']

export default function ModifierResidencePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState({
    title: '', type: 'apartment', description: '', address: '',
    city: 'Abidjan', bedrooms: 1, bathrooms: 1, max_guests: 2,
    surface_area: '', price_per_night: '', price_per_week: '', price_per_month: '',
    amenities: [] as string[], photos: [] as string[],
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('residences').select('*').eq('id', id).single().then(({ data: r }) => {
      if (r) setData({
        title: r.title ?? '', type: r.type ?? 'apartment',
        description: r.description ?? '', address: r.address ?? '',
        city: r.city ?? 'Abidjan', bedrooms: r.bedrooms ?? 1,
        bathrooms: r.bathrooms ?? 1, max_guests: r.max_guests ?? 2,
        surface_area: r.surface_area ?? '', price_per_night: r.price_per_night ?? '',
        price_per_week: r.price_per_week ?? '', price_per_month: r.price_per_month ?? '',
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
        photos: Array.isArray(r.photos) ? r.photos : [],
      })
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: unknown) { setData(prev => ({ ...prev, [field]: value })) }

  function toggleAmenity(a: string) {
    setData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a],
    }))
  }

  async function handleSave() {
    setError('')
    if (!data.title || !data.price_per_night) { setError('Titre et prix par nuit requis'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('residences').update({
      title: data.title, type: data.type, description: data.description,
      address: data.address, city: data.city, bedrooms: data.bedrooms,
      bathrooms: data.bathrooms, max_guests: data.max_guests,
      surface_area: data.surface_area ? Number(data.surface_area) : null,
      price_per_night: Number(data.price_per_night),
      price_per_week: data.price_per_week ? Number(data.price_per_week) : null,
      price_per_month: data.price_per_month ? Number(data.price_per_month) : null,
      amenities: data.amenities, photos: data.photos,
    }).eq('id', id)

    if (err) { setError('Erreur lors de la sauvegarde'); setSaving(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const accent = '#22d3a5'
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Modifier la résidence</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>{data.title}</p>
        </div>

        {/* Infos générales */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Informations générales</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Titre de l'annonce *</label>
            <input style={inputStyle} value={data.title} onChange={e => set('title', e.target.value)} placeholder="Villa moderne avec piscine..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Type de bien</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: data.type === t.value ? 'rgba(34,211,165,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${data.type === t.value ? 'rgba(34,211,165,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: data.type === t.value ? accent : '#94a3b8',
                  fontWeight: data.type === t.value ? 600 : 400,
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={data.address} onChange={e => set('address', e.target.value)} placeholder="Cocody, Riviera 3..." />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <select style={{ ...inputStyle, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={data.description}
              onChange={e => set('description', e.target.value)} placeholder="Décrivez votre bien..." />
          </div>
        </div>

        {/* Capacité */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Capacité</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { field: 'bedrooms', label: '🛏️ Chambres', min: 0, max: 20 },
              { field: 'bathrooms', label: '🚿 SDB', min: 1, max: 10 },
              { field: 'max_guests', label: '👥 Personnes max', min: 1, max: 50 },
              { field: 'surface_area', label: '📐 Surface (m²)', min: 0, max: 9999 },
            ].map(({ field, label, min, max }) => (
              <div key={field}>
                <label style={labelStyle}>{label}</label>
                <input type="number" style={inputStyle} value={(data as any)[field]}
                  onChange={e => set(field, e.target.value)} min={min} max={max} />
              </div>
            ))}
          </div>
        </div>

        {/* Tarifs */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Tarifs (FCFA)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { field: 'price_per_night', label: 'Prix / nuit *', placeholder: '30 000' },
              { field: 'price_per_week', label: 'Prix / semaine', placeholder: '180 000' },
              { field: 'price_per_month', label: 'Prix / mois', placeholder: '600 000' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label style={labelStyle}>{label}</label>
                <input type="number" style={inputStyle} value={(data as any)[field]}
                  onChange={e => set(field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Équipements */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Équipements</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES_LIST.map(a => (
              <button key={a} onClick={() => toggleAmenity(a)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                background: data.amenities.includes(a) ? 'rgba(34,211,165,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${data.amenities.includes(a) ? 'rgba(34,211,165,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: data.amenities.includes(a) ? accent : '#94a3b8',
                fontWeight: data.amenities.includes(a) ? 600 : 400,
              }}>{a.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Photos (URLs)</h2>
          {data.photos.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={p}
                onChange={e => { const arr = [...data.photos]; arr[i] = e.target.value; set('photos', arr) }}
                placeholder="https://..." />
              <button onClick={() => set('photos', data.photos.filter((_, j) => j !== i))} style={{
                padding: '0 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: 16,
              }}>×</button>
            </div>
          ))}
          <button onClick={() => set('photos', [...data.photos, ''])} style={{
            marginTop: 8, padding: '10px 18px', borderRadius: 10, border: '1px dashed rgba(34,211,165,0.3)',
            background: 'rgba(34,211,165,0.05)', color: '#22d3a5', cursor: 'pointer', fontSize: 13,
          }}>+ Ajouter une photo</button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#22d3a5', fontSize: 13 }}>✅ Résidence mise à jour ! Redirection...</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? 'rgba(34,211,165,0.3)' : 'linear-gradient(135deg, #22d3a5, #0891b2)',
            color: saving ? '#64748b' : '#0a1428', fontWeight: 700, fontSize: 15, cursor: saving ? 'wait' : 'pointer',
          }}>{saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}</button>
        </div>
      </div>
    </div>
  )
}