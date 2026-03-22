'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function PublierResidencePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({ title: '', description: '', type: 'villa', city: '', address: '', price_per_night: '', bedrooms: '1', bathrooms: '1', max_guests: '2', surface: '' })
  const [amenities, setAmenities] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormData, value: string) { setData(prev => ({ ...prev, [field]: value })) }
  function toggleAmenity(val: string) { setAmenities(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]) }
  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10)
    setPhotos(files); setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  async function handleSubmit() {
    if (photos.length < 3) { setError('Minimum 3 photos requises'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    try {
      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('residences').upload(path, photo)
        if (!uploadError) { const { data: urlData } = supabase.storage.from('residences').getPublicUrl(path); photoUrls.push(urlData.publicUrl) }
      }
      const { error: insertError } = await supabase.from('residences').insert({
        owner_id: user.id, title: data.title, description: data.description, type: data.type,
        city: data.city, address: data.address, price_per_night: Number(data.price_per_night),
        bedrooms: Number(data.bedrooms), bathrooms: Number(data.bathrooms), max_guests: Number(data.max_guests),
        surface: Number(data.surface) || null, amenities, photos: photoUrls,
        main_photo: photoUrls[mainPhotoIndex] ?? photoUrls[0] ?? null, status: 'active',
      })
      if (insertError) throw insertError
      router.push('/dashboard')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Une erreur est survenue'); setLoading(false) }
  }

  const STEPS = ['Infos de base', 'Caractéristiques', 'Équipements', 'Photos']

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Publier</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 4 }}>Publier une résidence</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Étape {step} sur 4 — {STEPS[step - 1]}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? accent : 'rgba(255,255,255,0.08)', marginBottom: 8, transition: 'background 0.3s ease' }} />
              <p style={{ fontSize: 10, color: i + 1 === step ? accent : 'rgba(255,255,255,0.25)', fontWeight: i + 1 === step ? 600 : 400 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div><label style={lbl}>Titre de l&apos;annonce</label><input type="text" value={data.title} onChange={e => set('title', e.target.value)} placeholder="Ex : Belle villa avec piscine à Cocody" style={inp} /></div>
              <div>
                <label style={lbl}>Type de bien</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['villa', 'appartement', 'studio'].map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)} style={{ padding: 12, borderRadius: 10, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize', border: data.type === t ? `1.5px solid rgba(34,211,165,0.4)` : '0.5px solid rgba(255,255,255,0.08)', background: data.type === t ? 'rgba(34,211,165,0.1)' : 'rgba(255,255,255,0.03)', color: data.type === t ? accent : 'rgba(255,255,255,0.5)', fontWeight: data.type === t ? 700 : 400 }}>{t}</button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Ville</label><select value={data.city} onChange={e => set('city', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}><option value="">Sélectionner une ville</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Adresse / Quartier</label><input type="text" value={data.address} onChange={e => set('address', e.target.value)} placeholder="Ex : Cocody Riviera 2" style={inp} /></div>
              <div><label style={lbl}>Description</label><textarea value={data.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Décrivez votre bien..." style={{ ...inp, resize: 'none', lineHeight: 1.6 }} /></div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Prix par nuit (FCFA) — minimum 10 000</label>
                <input type="number" value={data.price_per_night} onChange={e => set('price_per_night', e.target.value)} placeholder="Ex : 50 000" style={inp} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Vous recevrez 90% de ce montant</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={lbl}>Chambres</label><select value={data.bedrooms} onChange={e => set('bedrooms', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label style={lbl}>Salles de bain</label><select value={data.bathrooms} onChange={e => set('bathrooms', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                <div><label style={lbl}>Voyageurs max</label><select value={data.max_guests} onChange={e => set('max_guests', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>{[1,2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} voyageurs</option>)}</select></div>
                <div><label style={lbl}>Surface (m²)</label><input type="number" value={data.surface} onChange={e => set('surface', e.target.value)} placeholder="Optionnel" style={inp} /></div>
              </div>
            </div>
          )}

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

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Photos (min 3, max 10)</label>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Cliquez sur une photo pour la définir comme principale</p>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px', cursor: 'pointer', background: 'rgba(34,211,165,0.04)', border: '0.5px dashed rgba(34,211,165,0.25)', borderRadius: 14 }}>
                  <div style={{ fontSize: 28, color: 'rgba(34,211,165,0.4)' }}>⌂</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Ajouter des photos</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>JPG, PNG — min 3 photos</p>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
                </label>
              </div>
              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {previews.map((p, i) => (
                    <div key={i} onClick={() => setMainPhotoIndex(i)} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative', outline: i === mainPhotoIndex ? `2px solid ${accent}` : '2px solid transparent', outlineOffset: 2 }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === mainPhotoIndex && <div style={{ position: 'absolute', bottom: 6, left: 6, background: accent, color: '#0a1a14', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>PRINCIPALE</div>}
                    </div>
                  ))}
                </div>
              )}
              {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}><p style={{ fontSize: 13, color: '#f87171' }}>{error}</p></div>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>← Retour</button>}
            {step < 4
              ? <button type="button" onClick={() => setStep(s => s + 1)} style={{ padding: '12px 28px', background: accent, color: '#0a1a14', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continuer →</button>
              : <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', background: loading ? 'rgba(34,211,165,0.4)' : accent, color: '#0a1a14', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Publication...' : 'Publier l\'annonce'}</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}