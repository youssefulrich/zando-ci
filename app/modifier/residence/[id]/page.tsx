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
    surface: '', price_per_night: '', amenities: [] as string[],
  })

  // Photos state
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])  // URLs Supabase existantes
  const [newFiles, setNewFiles] = useState<File[]>([])                // Nouveaux fichiers
  const [newPreviews, setNewPreviews] = useState<string[]>([])        // Previews nouveaux fichiers
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)             // Index dans le tableau final
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.from('residences').select('*').eq('id', id).single().then(({ data: r }: any) => {
      if (r) {
        setData({
          title: r.title ?? '', type: r.type ?? 'apartment',
          description: r.description ?? '', address: r.address ?? '',
          city: r.city ?? 'Abidjan', bedrooms: r.bedrooms ?? 1,
          bathrooms: r.bathrooms ?? 1, max_guests: r.max_guests ?? 2,
          surface: r.surface ?? '', price_per_night: r.price_per_night ?? '',
          amenities: Array.isArray(r.amenities) ? r.amenities : [],
        })
        setExistingPhotos(Array.isArray(r.photos) ? r.photos : (r.main_photo ? [r.main_photo] : []))
      }
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

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - existingPhotos.length)
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

  // Total photos = existantes + nouvelles
  const totalCount = existingPhotos.length + newFiles.length

  async function handleSave() {
    setError('')
    if (!data.title || !data.price_per_night) { setError('Titre et prix par nuit requis'); return }
    setSaving(true)
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    let allPhotoUrls = [...existingPhotos]

    // Upload les nouvelles photos
    if (newFiles.length > 0 && user) {
      setUploadingPhotos(true)
      for (const file of newFiles) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('residences').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('residences').getPublicUrl(path)
          allPhotoUrls.push(urlData.publicUrl)
        }
      }
      setUploadingPhotos(false)
    }

    const mainPhoto = allPhotoUrls[mainPhotoIndex] ?? allPhotoUrls[0] ?? null

    const { error: err } = await supabase.from('residences').update({
      title: data.title, type: data.type, description: data.description,
      address: data.address, city: data.city, bedrooms: data.bedrooms,
      bathrooms: data.bathrooms, max_guests: data.max_guests,
      surface: data.surface ? Number(data.surface) : null,
      price_per_night: Number(data.price_per_night),
      amenities: data.amenities, photos: allPhotoUrls, main_photo: mainPhoto,
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
              { field: 'surface', label: '📐 Surface (m²)', min: 0, max: 9999 },
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
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Tarif (FCFA)</h2>
          <div style={{ maxWidth: 240 }}>
            <label style={labelStyle}>Prix / nuit *</label>
            <input type="number" style={inputStyle} value={data.price_per_night}
              onChange={e => set('price_per_night', e.target.value)} placeholder="30 000" />
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
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Photos</h2>
          <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Cliquez sur une photo pour la définir comme principale</p>

          {/* Grille photos existantes */}
          {existingPhotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              {existingPhotos.map((url, i) => (
                <div key={i} onClick={() => setMainPhotoIndex(i)} style={{
                  aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  outline: i === mainPhotoIndex ? `2px solid ${accent}` : '2px solid transparent', outlineOffset: 2,
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === mainPhotoIndex && (
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: accent, color: '#0a1a14', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>PRINCIPALE</div>
                  )}
                  <button onClick={e => { e.stopPropagation(); removeExistingPhoto(i) }} style={{
                    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer',
                    fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Nouvelles photos (preview) */}
          {newPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              {newPreviews.map((url, i) => (
                <div key={i} onClick={() => setMainPhotoIndex(existingPhotos.length + i)} style={{
                  aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  outline: (existingPhotos.length + i) === mainPhotoIndex ? `2px solid ${accent}` : '2px solid rgba(167,139,250,0.3)', outlineOffset: 2,
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(167,139,250,0.9)', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: '#fff', fontWeight: 700 }}>NOUVEAU</div>
                  <button onClick={e => { e.stopPropagation(); removeNewPhoto(i) }} style={{
                    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', cursor: 'pointer',
                    fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Bouton ajouter */}
          {totalCount < 10 && (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 20px', cursor: 'pointer',
              background: 'rgba(34,211,165,0.04)', border: '1px dashed rgba(34,211,165,0.25)',
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 18, color: 'rgba(34,211,165,0.5)' }}>+</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Ajouter des photos ({totalCount}/10)
              </span>
              <input type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{ display: 'none' }} />
            </label>
          )}
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
          }}>{saving ? (uploadingPhotos ? 'Upload photos...' : 'Sauvegarde...') : 'Enregistrer les modifications'}</button>
        </div>
      </div>
    </div>
  )
}