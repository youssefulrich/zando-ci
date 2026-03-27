'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const TYPES = [
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
    brand: '', model: '', year: new Date().getFullYear(), type: 'berline',
    transmission: 'automatique', fuel: 'essence', seats: 5,
    price_per_day: '', city: 'Abidjan', description: '', is_available: true,
  })

  // Photos state
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.from('vehicles').select('*').eq('id', id).single().then(({ data: v }: any) => {
      if (v) {
        setData({
          brand: v.brand ?? '', model: v.model ?? '', year: v.year ?? new Date().getFullYear(),
          type: v.type ?? 'berline', transmission: v.transmission ?? 'automatique',
          fuel: v.fuel ?? 'essence', seats: v.seats ?? 5,
          price_per_day: v.price_per_day ?? '', city: v.city ?? 'Abidjan',
          description: v.description ?? '', is_available: v.is_available ?? true,
        })
        setExistingPhotos(Array.isArray(v.photos) ? v.photos : (v.main_photo ? [v.main_photo] : []))
      }
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: unknown) { setData(prev => ({ ...prev, [field]: value })) }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 8 - existingPhotos.length)
    setNewFiles(prev => [...prev, ...files])
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index))
    if (mainPhotoIndex === index) setMainPhotoIndex(0)
  }

  function removeNewPhoto(index: number) {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const totalCount = existingPhotos.length + newFiles.length

  async function handleSave() {
    setError('')
    if (!data.brand || !data.model || !data.price_per_day) {
      setError('Marque, modèle et prix par jour sont requis')
      return
    }
    setSaving(true)
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    let allPhotoUrls = [...existingPhotos]

    if (newFiles.length > 0 && user) {
      setUploadingPhotos(true)
      for (const file of newFiles) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('vehicles').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path)
          allPhotoUrls.push(urlData.publicUrl)
        }
      }
      setUploadingPhotos(false)
    }

    const mainPhoto = allPhotoUrls[mainPhotoIndex] ?? allPhotoUrls[0] ?? null

    const { error: err } = await supabase.from('vehicles').update({
      brand: data.brand, model: data.model, year: data.year,
      type: data.type, transmission: data.transmission,
      fuel: data.fuel, seats: data.seats,
      price_per_day: Number(data.price_per_day),
      city: data.city, description: data.description,
      is_available: data.is_available,
      photos: allPhotoUrls, main_photo: mainPhoto,
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
            <div><label style={labelStyle}>Marque</label><input style={inputStyle} value={data.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota, Renault..." /></div>
            <div><label style={labelStyle}>Modèle</label><input style={inputStyle} value={data.model} onChange={e => set('model', e.target.value)} placeholder="Corolla, Duster..." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Année</label><input type="number" style={inputStyle} value={data.year} onChange={e => set('year', Number(e.target.value))} min={2000} max={2026} /></div>
            <div><label style={labelStyle}>Places</label><input type="number" style={inputStyle} value={data.seats} onChange={e => set('seats', Number(e.target.value))} min={2} max={20} /></div>
            <div><label style={labelStyle}>Ville</label><select style={{ ...inputStyle, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: data.type === t.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${data.type === t.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: data.type === t.value ? accent : '#94a3b8', fontWeight: data.type === t.value ? 600 : 400,
                }}>{t.label}</button>
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
                    color: data.transmission === t.value ? accent : '#94a3b8', fontWeight: data.transmission === t.value ? 600 : 400,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Carburant</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FUELS.map(f => (
                  <button key={f.value} onClick={() => set('fuel', f.value)} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    background: data.fuel === f.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${data.fuel === f.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: data.fuel === f.value ? accent : '#94a3b8', fontWeight: data.fuel === f.value ? 600 : 400,
                  }}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={data.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez le véhicule..." /></div>
        </div>

        {/* Tarif */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Tarif (FCFA)</h2>
          <div style={{ maxWidth: 240 }}>
            <label style={labelStyle}>Prix / jour *</label>
            <input type="number" style={inputStyle} value={data.price_per_day} onChange={e => set('price_per_day', e.target.value)} placeholder="25 000" />
          </div>
        </div>

        {/* Options */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Options</h2>
          <button onClick={() => set('is_available', !data.is_available)} style={{
            padding: '12px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
            background: data.is_available ? 'rgba(34,211,165,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${data.is_available ? '#22d3a555' : 'rgba(255,255,255,0.08)'}`,
            color: data.is_available ? '#22d3a5' : '#64748b', fontWeight: data.is_available ? 600 : 400,
          }}>✅ Disponible à la location</button>
        </div>

        {/* Photos */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Photos</h2>
          <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Cliquez sur une photo pour la définir comme principale</p>

          {existingPhotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              {existingPhotos.map((url, i) => (
                <div key={i} onClick={() => setMainPhotoIndex(i)} style={{
                  aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  outline: i === mainPhotoIndex ? `2px solid ${accent}` : '2px solid transparent', outlineOffset: 2,
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === mainPhotoIndex && <div style={{ position: 'absolute', bottom: 6, left: 6, background: accent, color: '#0a1428', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>PRINCIPALE</div>}
                  <button onClick={e => { e.stopPropagation(); removeExistingPhoto(i) }} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {newPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              {newPreviews.map((url, i) => (
                <div key={i} onClick={() => setMainPhotoIndex(existingPhotos.length + i)} style={{
                  aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  outline: (existingPhotos.length + i) === mainPhotoIndex ? `2px solid ${accent}` : '2px solid rgba(96,165,250,0.3)', outlineOffset: 2,
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(96,165,250,0.9)', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: '#fff', fontWeight: 700 }}>NOUVEAU</div>
                  <button onClick={e => { e.stopPropagation(); removeNewPhoto(i) }} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {totalCount < 8 && (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 20px', cursor: 'pointer',
              background: 'rgba(96,165,250,0.04)', border: '1px dashed rgba(96,165,250,0.25)', borderRadius: 12,
            }}>
              <span style={{ fontSize: 18, color: 'rgba(96,165,250,0.5)' }}>+</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Ajouter des photos ({totalCount}/8)</span>
              <input type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#22d3a5', fontSize: 13 }}>✅ Véhicule mis à jour ! Redirection...</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? 'rgba(96,165,250,0.3)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            color: saving ? '#64748b' : '#0a1428', fontWeight: 700, fontSize: 15, cursor: saving ? 'wait' : 'pointer',
          }}>{saving ? (uploadingPhotos ? 'Upload photos...' : 'Sauvegarde...') : 'Enregistrer les modifications'}</button>
        </div>
      </div>
    </div>
  )
}