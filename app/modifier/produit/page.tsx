'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']
const CATEGORIES = [
  { value: 'mode', label: '👗 Mode' }, { value: 'electronique', label: '📱 Électronique' },
  { value: 'alimentaire', label: '🍽️ Alimentaire' }, { value: 'beaute', label: '💄 Beauté' },
  { value: 'maison', label: '🏠 Maison' }, { value: 'service', label: '⚙️ Service' },
  { value: 'art', label: '🎨 Art' }, { value: 'sport', label: '⚽ Sport' },
  { value: 'autre', label: '📦 Autre' },
]

const accent = '#fb923c'
const inp = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none',
  colorScheme: 'dark' as const, boxSizing: 'border-box' as const,
}
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

function ModifierProduitContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [shopId, setShopId] = useState<string | null>(null)

  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)

  const [data, setData] = useState({
    name: '', description: '', category: 'mode', type: 'physical',
    price: '', compare_price: '', stock: '', unit: 'pièce',
    city: 'Abidjan', delivery_available: true, delivery_price: '0',
    pickup_available: true,
  })

  useEffect(() => {
    if (!id) { router.push('/dashboard'); return }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prodRaw } = await (supabase as any)
        .from('products').select('*').eq('id', id).single()

      if (!prodRaw) { router.push('/dashboard'); return }
      if (prodRaw.owner_id !== user.id) { router.push('/dashboard'); return }

      const prod = prodRaw as any
      setShopId(prod.shop_id)
      setExistingPhotos(Array.isArray(prod.photos) ? prod.photos : [])
      setData({
        name: prod.name ?? '',
        description: prod.description ?? '',
        category: prod.category ?? 'mode',
        type: prod.type ?? 'physical',
        price: prod.price?.toString() ?? '',
        compare_price: prod.compare_price?.toString() ?? '',
        stock: prod.stock?.toString() ?? '',
        unit: prod.unit ?? 'pièce',
        city: prod.city ?? 'Abidjan',
        delivery_available: prod.delivery_available ?? true,
        delivery_price: prod.delivery_price?.toString() ?? '0',
        pickup_available: prod.pickup_available ?? true,
      })
      setFetching(false)
    }
    load()
  }, [id, router])

  function set(field: string, value: unknown) { setData(prev => ({ ...prev, [field]: value })) }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - existingPhotos.length)
    setNewPhotos(files)
    setNewPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index))
    if (mainPhotoIndex >= index && mainPhotoIndex > 0) setMainPhotoIndex(prev => prev - 1)
  }

  async function handleSubmit() {
    if (!id) return
    if (!data.name || !data.price || !data.category) { setError('Nom, prix et catégorie sont requis'); return }
    if (existingPhotos.length === 0 && newPhotos.length === 0) { setError('Au moins 1 photo est requise'); return }

    setSaving(true); setError(''); setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const newUrls: string[] = []
    for (const file of newPhotos) {
      const ext = file.name.split('.').pop()
      const path = `products/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path)
        newUrls.push(urlData.publicUrl)
      }
    }

    const reordered = [...existingPhotos]
    if (mainPhotoIndex !== 0 && reordered.length > 1) {
      const main = reordered.splice(mainPhotoIndex, 1)[0]
      reordered.unshift(main)
    }
    const finalPhotos = [...reordered, ...newUrls]

    const { error: updateError } = await (supabase as any).from('products').update({
      name: data.name,
      description: data.description || null,
      category: data.category,
      type: data.type,
      price: Number(data.price),
      compare_price: data.compare_price ? Number(data.compare_price) : null,
      stock: data.type === 'physical' && data.stock ? Number(data.stock) : 0,
      unit: data.unit,
      photos: finalPhotos,
      city: data.city,
      delivery_available: data.type === 'physical' ? data.delivery_available : false,
      delivery_price: Number(data.delivery_price) || 0,
      pickup_available: data.type === 'physical' ? data.pickup_available : true,
    }).eq('id', id)

    if (updateError) { setError(`Erreur : ${updateError.message}`); setSaving(false); return }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push(`/boutique/produit/${id}`), 1500)
  }

  if (fetching) return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Chargement...</p>
    </div>
  )

  const totalPhotos = existingPhotos.length + newPreviews.length

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Marketplace</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8 }}>Modifier le produit</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Type */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <label style={{ ...lbl, marginBottom: 12 }}>Type de produit</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'physical', label: '📦 Produit physique', desc: 'Article avec stock et livraison' },
                { value: 'service', label: '⚙️ Service', desc: 'Prestation, formation, conseil...' },
              ].map(t => (
                <button key={t.value} onClick={() => set('type', t.value)} style={{
                  padding: '14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left' as const,
                  border: data.type === t.value ? `1.5px solid rgba(251,146,60,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                  background: data.type === t.value ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.02)',
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: data.type === t.value ? accent : '#fff', marginBottom: 4 }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Infos */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Nom du produit *</label>
              <input style={inp} value={data.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Robe ankara..." />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' as const, lineHeight: 1.6 }} value={data.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez votre produit..." />
            </div>
            <div>
              <label style={lbl}>Catégorie *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => set('category', c.value)} style={{
                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, textAlign: 'center' as const,
                    border: data.category === c.value ? `1.5px solid rgba(251,146,60,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                    background: data.category === c.value ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.02)',
                    color: data.category === c.value ? accent : 'rgba(255,255,255,0.5)',
                    fontWeight: data.category === c.value ? 600 : 400,
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Prix */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Prix</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Prix (FCFA) *</label>
                <input type="number" style={inp} value={data.price} onChange={e => set('price', e.target.value)} placeholder="5 000" />
              </div>
              <div>
                <label style={lbl}>Prix barré <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(optionnel)</span></label>
                <input type="number" style={inp} value={data.compare_price} onChange={e => set('compare_price', e.target.value)} placeholder="8 000" />
              </div>
            </div>
            {data.type === 'physical' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Stock disponible</label>
                  <input type="number" style={inp} value={data.stock} onChange={e => set('stock', e.target.value)} placeholder="Laisser vide = illimité" />
                </div>
                <div>
                  <label style={lbl}>Unité</label>
                  <input style={inp} value={data.unit} onChange={e => set('unit', e.target.value)} placeholder="pièce, kg, litre..." />
                </div>
              </div>
            )}
          </div>

          {/* Livraison */}
          {data.type === 'physical' && (
            <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Livraison</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { field: 'delivery_available', label: '🚚 Livraison à domicile' },
                  { field: 'pickup_available', label: '📍 Retrait en boutique' },
                ].map(opt => (
                  <button key={opt.field} onClick={() => set(opt.field, !(data as any)[opt.field])} style={{
                    padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const, fontSize: 13,
                    border: (data as any)[opt.field] ? `1.5px solid rgba(251,146,60,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                    background: (data as any)[opt.field] ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.02)',
                    color: (data as any)[opt.field] ? accent : 'rgba(255,255,255,0.5)',
                    fontWeight: (data as any)[opt.field] ? 600 : 400,
                  }}>{opt.label}</button>
                ))}
              </div>
              {data.delivery_available && (
                <div>
                  <label style={lbl}>Frais de livraison (0 = gratuit)</label>
                  <input type="number" style={inp} value={data.delivery_price} onChange={e => set('delivery_price', e.target.value)} placeholder="0" />
                </div>
              )}
              <div>
                <label style={lbl}>Ville</label>
                <select style={{ ...inp, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Photos */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <label style={{ ...lbl, marginBottom: 4 }}>Photos</label>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>
              Cliquez sur une photo pour la définir comme principale · Croix pour supprimer
            </p>

            {existingPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                {existingPhotos.map((ph, i) => (
                  <div key={i} onClick={() => setMainPhotoIndex(i)} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative', outline: i === mainPhotoIndex ? `2px solid ${accent}` : '2px solid transparent', outlineOffset: 2 }}>
                    <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === mainPhotoIndex && (
                      <div style={{ position: 'absolute', bottom: 6, left: 6, background: accent, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>PRINCIPALE</div>
                    )}
                    <button onClick={e => { e.stopPropagation(); removeExistingPhoto(i) }} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(248,113,113,0.9)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                {newPreviews.map((p, i) => (
                  <div key={`new-${i}`} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', position: 'relative', outline: '2px solid rgba(34,211,165,0.4)', outlineOffset: 2 }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#22d3a5', color: '#0a1a14', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>NOUVELLE</div>
                  </div>
                ))}
              </div>
            )}

            {totalPhotos < 6 && (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 20px', cursor: 'pointer', background: `rgba(251,146,60,0.04)`, border: `0.5px dashed rgba(251,146,60,0.25)`, borderRadius: 14 }}>
                <div style={{ fontSize: 24, color: `rgba(251,146,60,0.4)` }}>+</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Ajouter des photos</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{totalPhotos}/6 photos</p>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#f87171' }}>⚠️ {error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(34,211,165,0.08)', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#22d3a5' }}>✓ Produit mis à jour ! Redirection...</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => router.push(`/boutique/produit/${id}`)} style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.1)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '16px', background: saving ? `rgba(251,146,60,0.4)` : accent, color: '#fff', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: -0.3 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ModifierProduitPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Chargement...</p>
      </div>
    }>
      <ModifierProduitContent />
    </Suspense>
  )
}