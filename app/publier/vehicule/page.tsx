'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']

type FormData = {
  title: string; description: string; brand: string; model: string; year: string
  type: string; transmission: string; fuel: string; seats: string; mileage: string
  city: string; price_per_day: string
  min_age: string; min_license_years: string; deposit: string; max_km_per_day: string; insurance_included: boolean
}

const accent = '#60a5fa'
const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', colorScheme: 'dark' as const }
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

export default function PublierVehiculePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({ title: '', description: '', brand: '', model: '', year: String(new Date().getFullYear()), type: 'berline', transmission: 'manuelle', fuel: 'essence', seats: '5', mileage: '', city: '', price_per_day: '', min_age: '21', min_license_years: '2', deposit: '100000', max_km_per_day: '200', insurance_included: true })
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormData, value: string | boolean) { setData(prev => ({ ...prev, [field]: value })) }
  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) { const files = Array.from(e.target.files ?? []).slice(0, 8); setPhotos(files); setPreviews(files.map(f => URL.createObjectURL(f))) }

  async function handleSubmit() {
    setLoading(true); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    try {
      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('vehicles').upload(path, photo)
        if (!uploadError) { const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path); photoUrls.push(urlData.publicUrl) }
      }
      const { error: insertError } = await supabase.from('vehicles').insert({
        owner_id: user.id, title: data.title || `${data.brand} ${data.model} ${data.year}`,
        description: data.description, brand: data.brand, model: data.model, year: Number(data.year),
        type: data.type, transmission: data.transmission, fuel: data.fuel, seats: Number(data.seats),
        mileage: Number(data.mileage) || 0, city: data.city, price_per_day: Number(data.price_per_day),
        photos: photoUrls, main_photo: photoUrls[0] ?? null,
        rental_conditions: { min_age: Number(data.min_age), min_license_years: Number(data.min_license_years), deposit: Number(data.deposit), max_km_per_day: Number(data.max_km_per_day), insurance_included: data.insurance_included },
        status: 'active',
      })
      if (insertError) throw insertError
      router.push('/dashboard')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Une erreur est survenue'); setLoading(false) }
  }

  const STEPS = ['Infos véhicule', 'Conditions', 'Photos']

  function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <button key={o} type="button" onClick={() => onChange(o)} style={{ padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', border: value === o ? `1.5px solid rgba(96,165,250,0.4)` : '0.5px solid rgba(255,255,255,0.08)', background: value === o ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)', color: value === o ? accent : 'rgba(255,255,255,0.5)', fontWeight: value === o ? 700 : 400, transition: 'all 0.15s ease' }}>{o}</button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Publier</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 4 }}>Publier un véhicule</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Étape {step} sur 3 — {STEPS[step - 1]}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? accent : 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
              <p style={{ fontSize: 10, color: i + 1 === step ? accent : 'rgba(255,255,255,0.25)', fontWeight: i + 1 === step ? 600 : 400 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={lbl}>Marque</label><input type="text" value={data.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota, BMW..." style={inp} /></div>
                <div><label style={lbl}>Modèle</label><input type="text" value={data.model} onChange={e => set('model', e.target.value)} placeholder="Corolla, X5..." style={inp} /></div>
                <div><label style={lbl}>Année</label><input type="number" value={data.year} onChange={e => set('year', e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Kilométrage</label><input type="number" value={data.mileage} onChange={e => set('mileage', e.target.value)} placeholder="Ex : 45 000" style={inp} /></div>
              </div>
              <div><label style={lbl}>Type</label><ChipGroup options={['suv','berline','4x4','citadine','minibus']} value={data.type} onChange={v => set('type', v)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={lbl}>Transmission</label><ChipGroup options={['manuelle','automatique']} value={data.transmission} onChange={v => set('transmission', v)} /></div>
                <div><label style={lbl}>Carburant</label><ChipGroup options={['essence','diesel','hybride']} value={data.fuel} onChange={v => set('fuel', v)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={lbl}>Places</label><select value={data.seats} onChange={e => set('seats', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}>{[2,4,5,7,8,9,15,20].map(n => <option key={n} value={n}>{n} places</option>)}</select></div>
                <div><label style={lbl}>Ville</label><select value={data.city} onChange={e => set('city', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}><option value="">Sélectionner</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div>
                <label style={lbl}>Prix par jour (FCFA)</label>
                <input type="number" value={data.price_per_day} onChange={e => set('price_per_day', e.target.value)} placeholder="Ex : 25 000" style={inp} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Vous recevrez 90% de ce montant</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={lbl}>Âge minimum conducteur</label><input type="number" value={data.min_age} onChange={e => set('min_age', e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Permis minimum (ans)</label><input type="number" value={data.min_license_years} onChange={e => set('min_license_years', e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Caution (FCFA)</label><input type="number" value={data.deposit} onChange={e => set('deposit', e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Km max / jour</label><input type="number" value={data.max_km_per_day} onChange={e => set('max_km_per_day', e.target.value)} style={inp} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div onClick={() => set('insurance_included', !data.insurance_included)} style={{ width: 20, height: 20, borderRadius: 6, border: data.insurance_included ? 'none' : '0.5px solid rgba(255,255,255,0.2)', background: data.insurance_included ? accent : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}>
                  {data.insurance_included && <span style={{ fontSize: 11, color: '#0a1428', fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Assurance incluse dans le prix</span>
              </label>
              <div><label style={lbl}>Description (optionnel)</label><textarea value={data.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Informations supplémentaires..." style={{ ...inp, resize: 'none', lineHeight: 1.6 }} /></div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={lbl}>Photos du véhicule</label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px', cursor: 'pointer', background: 'rgba(96,165,250,0.04)', border: '0.5px dashed rgba(96,165,250,0.25)', borderRadius: 14 }}>
                  <div style={{ fontSize: 28, color: 'rgba(96,165,250,0.4)' }}>◈</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Ajouter des photos</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>JPG, PNG — max 8 photos</p>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
                </label>
              </div>
              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#1a2236' }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
              {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}><p style={{ fontSize: 13, color: '#f87171' }}>{error}</p></div>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>← Retour</button>}
            {step < 3
              ? <button type="button" onClick={() => setStep(s => s + 1)} style={{ padding: '12px 28px', background: accent, color: '#0a1428', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continuer →</button>
              : <button type="button" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 28px', background: loading ? 'rgba(96,165,250,0.4)' : accent, color: '#0a1428', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Publication...' : 'Publier le véhicule'}</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}