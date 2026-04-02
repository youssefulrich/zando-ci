'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']
const AMENITIES = [
  { value: 'piscine', label: 'Piscine' }, { value: 'wifi', label: 'WiFi' },
  { value: 'parking', label: 'Parking' }, { value: 'climatisation', label: 'Climatisation' },
  { value: 'tv', label: 'TV' }, { value: 'cuisine', label: 'Cuisine équipée' },
  { value: 'lave_linge', label: 'Lave-linge' }, { value: 'jardin', label: 'Jardin' },
  { value: 'terrasse', label: 'Terrasse' }, { value: 'securite', label: 'Sécurité 24h' },
]

type FormData = {
  title: string; description: string; type: string; city: string; address: string
  price_per_night: string; bedrooms: string; bathrooms: string; max_guests: string; surface: string
}

const accent = '#22d3a5'
const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', colorScheme: 'dark' as const }
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

export default function ModifierResidencePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [data, setData] = useState<FormData>({
    title: '', description: '', type: 'villa', city: '', address: '',
    price_per_night: '', bedrooms: '1', bathrooms: '1', max_guests: '2', surface: ''
  })
  const [amenities, setAmenities] = useState<string[]>([])

  // Photos existantes (URLs)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  // Nouvelles photos (fichiers)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Charger la résidence existante
  useEffect(() => {
    const supabase = createClient() as any
    supabase.from('residences').select('*').eq('id', id).single().then(({ data: r }: any) => {
      if (r) {
        setData({
          title: r.title ?? '',
          description: r.description ?? '',
          type: r.type ?? 'villa',
          city: r.city ?? '',
          address: r.address ?? '',
          price_per_night: r.price_per_night ?? '',
          bedrooms: String(r.bedrooms ?? 1),
          bathrooms: String(r.bathrooms ?? 1),
          max_guests: String(r.max_guests ?? 2),
          surface: r.surface ? String(r.surface) : '',
        })
        setAmenities(Array.isArray(r.amenities) ? r.amenities : [])
        setExistingPhotos(Array.isArray(r.photos) ? r.photos : (r.main_photo ? [r.main_photo] : []))
      }
      setLoading(false)
    })
  }, [id])

  function set(field: keyof FormData, value: string) { setData(prev => ({ ...prev, [field]: value })) }
  function toggleAmenity(val: string) { setAmenities(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]) }

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

  const totalPhotos = existingPhotos.length + newFiles.length

  async function handleSubmit() {
    if (totalPhotos < 3) { setError('Minimum 3 photos requises'); return }
    setSaving(true); setError('')

    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    try {
      let allPhotoUrls = [...existingPhotos]

      if (newFiles.length > 0) {
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

      const { error: updateError } = await supabase.from('residences').update({
        title: data.title,
        description: data.description,
        type: data.type,
        city: data.city,
        address: data.address,
        price_per_night: Number(data.price_per_night),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        max_guests: Number(data.max_guests),
        surface: Number(data.surface) || null,
        amenities,
        photos: allPhotoUrls,
        main_photo: mainPhoto,
      }).eq('id', id)

      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setSaving(false)
    }
  }

  const STEPS = ['Infos de base', 'Caractéristiques', 'Équipements', 'Photos']

  if (loading) return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Modification</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 4 }}>Modifier la résidence</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Étape {step} sur 4 — {STEPS[step - 1]}</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? accent : 'rgba(255,255,255,0.08)', marginBottom: 8, transition: 'background 0.3s ease' }} />
              <p style={{ fontSize: 10, color: i + 1 === step ? accent : 'rgba(255,255,255,0.25)', fontWeight: i + 1 === step ? 600 : 400 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          {/* Étape 1 — Infos de base */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Titre de l&apos;annonce</label>
                <input type="text" value={data.title} onChange={e => set('title', e.target.value)} placeholder="Ex : Belle villa avec piscine à Cocody" style={inp} />
              </div>
              <div>
                <label style={lbl}>Type de bien</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['villa', 'appartement', 'studio'].map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)} style={{
                      padding: 12, borderRadius: 10, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
                      border: data.type === t ? `1.5px solid rgba(34,211,165,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                      background: data.type === t ? 'rgba(34,211,165,0.1)' : 'rgba(255,255,255,0.03)',
                      color: data.type === t ? accent : 'rgba(255,255,255,0.5)',
                      fontWeight: data.type === t ? 700 : 400,
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Ville</label>
                <select value={data.city} onChange={e => set('city', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                  <option value="">Sélectionner une ville</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Adresse / Quartier</label>
                <input type="text" value={data.address} onChange={e => set('address', e.target.value)} placeholder="Ex : Cocody Riviera 2" style={inp} />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={data.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Décrivez votre bien..." style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          {/* Étape 2 — Caractéristiques */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Prix par nuit (FCFA) — minimum 10 000</label>
                <input type="number" value={data.price_per_night} onChange={e => set('price_per_night', e.target.value)} placeholder="Ex : 50 000" style={inp} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Vous recevrez 90% de ce montant</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Chambres</label>
                  <select value={data.bedrooms} onChange={e => set('bedrooms', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Salles de bain</label>
                  <select value={data.bathrooms} onChange={e => set('bathrooms', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Voyageurs max</label>
                  <select value={data.max_guests} onChange={e => set('max_guests', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                    {[1,2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} voyageurs</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Surface (m²)</label>
                  <input type="number" value={data.surface} onChange={e => set('surface', e.target.value)} placeholder="Optionnel" style={inp} />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 — Équipements */}
          {step === 3 && (
            <div>
              <label style={{ ...lbl, marginBottom: 16 }}>Équipements disponibles</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {AMENITIES.map(a => (
                  <button key={a.value} type="button" onClick={() => toggleAmenity(a.value)} style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 13,
                    border: amenities.includes(a.value) ? `1.5px solid rgba(34,211,165,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                    background: amenities.includes(a.value) ? 'rgba(34,211,165,0.1)' : 'rgba(255,255,255,0.03)',
                    color: amenities.includes(a.value) ? accent : 'rgba(255,255,255,0.5)',
                    fontWeight: amenities.includes(a.value) ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}>
                    {amenities.includes(a.value) && <span style={{ marginRight: 6 }}>✓</span>}{a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 4 — Photos */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Photos (min 3, max 10)</label>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Cliquez sur une photo pour la définir comme principale</p>

                {/* Photos existantes */}
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

                {/* Nouvelles photos */}
                {newPreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                    {newPreviews.map((url, i) => (
                      <div key={i} onClick={() => setMainPhotoIndex(existingPhotos.length + i)} style={{
                        aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                        outline: (existingPhotos.length + i) === mainPhotoIndex ? `2px solid ${accent}` : '2px solid rgba(34,211,165,0.3)', outlineOffset: 2,
                      }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(34,211,165,0.9)', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: '#fff', fontWeight: 700 }}>NOUVEAU</div>
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
                {totalPhotos < 10 && (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '24px 20px', cursor: 'pointer',
                    background: 'rgba(34,211,165,0.04)', border: '0.5px dashed rgba(34,211,165,0.25)', borderRadius: 14,
                  }}>
                    <div style={{ fontSize: 24, color: 'rgba(34,211,165,0.4)' }}>+</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Ajouter des photos ({totalPhotos}/10)</p>
                    <input type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {error && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(34,211,165,0.08)', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: accent }}>✅ Résidence mise à jour ! Redirection...</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)} style={{
                padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12,
                fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              }}>← Retour</button>
            )}
            {step < 4
              ? (
                <button type="button" onClick={() => setStep(s => s + 1)} style={{
                  padding: '12px 28px', background: accent, color: '#0a1a14',
                  borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>Continuer →</button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={saving} style={{
                  padding: '12px 28px',
                  background: saving ? 'rgba(34,211,165,0.4)' : accent,
                  color: '#0a1a14', borderRadius: 12, border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? (uploadingPhotos ? 'Upload photos...' : 'Sauvegarde...') : 'Enregistrer les modifications'}
                </button>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}