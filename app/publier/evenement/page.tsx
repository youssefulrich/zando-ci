'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'concert', label: 'Concert' },
  { value: 'festival', label: 'Festival' },
  { value: 'sport', label: 'Sport' },
  { value: 'conference', label: 'Conférence' },
  { value: 'theatre', label: 'Théâtre' },
  { value: 'autre', label: 'Autre' },
]

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']

type FormData = {
  title: string; description: string; category: string
  event_date: string; event_time: string; venue_name: string
  venue_address: string; city: string; price_per_ticket: string; total_capacity: string
}

const accent = '#a78bfa'

const inp = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12,
  padding: '12px 16px', fontSize: 14, color: '#fff',
  outline: 'none', colorScheme: 'dark' as const,
}

const lbl = {
  display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8,
}

export default function PublierEvenementPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({
    title: '', description: '', category: 'concert',
    event_date: '', event_time: '', venue_name: '',
    venue_address: '', city: '', price_per_ticket: '', total_capacity: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    try {
      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('events').upload(path, photo)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('events').getPublicUrl(path)
          photoUrls.push(urlData.publicUrl)
        }
      }

      const { error: insertError } = await supabase.from('events').insert({
        owner_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        event_date: data.event_date,
        event_time: data.event_time,
        venue_name: data.venue_name,
        venue_address: data.venue_address,
        price_per_ticket: Number(data.price_per_ticket) || 0,
        total_capacity: Number(data.total_capacity),
        photos: photoUrls,
        main_photo: photoUrls[0] ?? null,
        status: 'active',
      })

      if (insertError) throw insertError
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const STEPS = ['Infos de base', 'Date & lieu', 'Photos']

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
            Publier
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 4 }}>
            Créer un événement
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Étape {step} sur 3 — {STEPS[step - 1]}</p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{
                height: 3, borderRadius: 2,
                background: i + 1 <= step ? accent : 'rgba(255,255,255,0.08)',
                marginBottom: 8, transition: 'background 0.3s ease',
              }} />
              <p style={{ fontSize: 11, color: i + 1 === step ? accent : 'rgba(255,255,255,0.25)', fontWeight: i + 1 === step ? 600 : 400 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          {/* Étape 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={lbl}>Titre de l&apos;événement</label>
                <input type="text" value={data.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ex : Concert Afrobeat 2025" style={inp} />
              </div>

              <div>
                <label style={lbl}>Catégorie</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => set('category', c.value)} style={{
                      padding: '11px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                      border: data.category === c.value ? `1.5px solid rgba(167,139,250,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                      background: data.category === c.value ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                      color: data.category === c.value ? accent : 'rgba(255,255,255,0.5)',
                      fontWeight: data.category === c.value ? 700 : 400,
                      transition: 'all 0.15s ease',
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea value={data.description} onChange={e => set('description', e.target.value)}
                  rows={5} placeholder="Décrivez votre événement, les artistes, le programme..."
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          {/* Étape 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" value={data.event_date} onChange={e => set('event_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Heure</label>
                  <input type="time" value={data.event_time} onChange={e => set('event_time', e.target.value)} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Nom du lieu</label>
                <input type="text" value={data.venue_name} onChange={e => set('venue_name', e.target.value)}
                  placeholder="Ex : Palais de la Culture, Stade Félix Houphouët" style={inp} />
              </div>

              <div>
                <label style={lbl}>Adresse complète</label>
                <input type="text" value={data.venue_address} onChange={e => set('venue_address', e.target.value)}
                  placeholder="Rue, quartier..." style={inp} />
              </div>

              <div>
                <label style={lbl}>Ville</label>
                <select value={data.city} onChange={e => set('city', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>
                  <option value="">Sélectionner une ville</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Prix par billet (FCFA)</label>
                  <input type="number" value={data.price_per_ticket} onChange={e => set('price_per_ticket', e.target.value)}
                    placeholder="0 = gratuit" style={inp} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                    Vous recevrez 90% du prix
                  </p>
                </div>
                <div>
                  <label style={lbl}>Capacité totale</label>
                  <input type="number" value={data.total_capacity} onChange={e => set('total_capacity', e.target.value)}
                    placeholder="Ex : 500" style={inp} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                    Nombre max de billets
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Affiche ou photos (max 5)</label>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '32px 20px', cursor: 'pointer',
                  background: 'rgba(167,139,250,0.04)', border: '0.5px dashed rgba(167,139,250,0.25)',
                  borderRadius: 14,
                }}>
                  <div style={{ fontSize: 28, color: 'rgba(167,139,250,0.4)' }}>◉</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    Cliquez pour ajouter des photos
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>JPG, PNG — max 5 photos</p>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
                </label>
              </div>

              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1a2236' }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
                </div>
              )}

              <div style={{ background: 'rgba(167,139,250,0.06)', border: '0.5px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 12, color: 'rgba(167,139,250,0.8)', lineHeight: 1.6 }}>
                  Votre événement sera publié immédiatement. Vous recevrez 90% des ventes de billets directement sur votre Mobile Money.
                </p>
              </div>
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
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} style={{
                padding: '12px 28px', background: accent, color: '#1a0a3d',
                borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Continuer →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} style={{
                padding: '12px 28px',
                background: loading ? 'rgba(167,139,250,0.4)' : accent,
                color: '#1a0a3d', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Publication...' : 'Publier l\'événement'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}