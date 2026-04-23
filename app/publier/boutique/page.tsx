'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou']
const CATEGORIES = [
  { value: 'mode', label: '👗 Mode & Vêtements' },
  { value: 'electronique', label: '📱 Électronique' },
  { value: 'alimentaire', label: '🍽️ Alimentaire' },
  { value: 'beaute', label: '💄 Beauté & Cosmétiques' },
  { value: 'maison', label: '🏠 Maison & Déco' },
  { value: 'service', label: '⚙️ Services' },
  { value: 'art', label: '🎨 Art & Artisanat' },
  { value: 'sport', label: '⚽ Sport & Loisirs' },
  { value: 'autre', label: '📦 Autre' },
]

const accent = '#fb923c'
const inp = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none',
  colorScheme: 'dark' as const, boxSizing: 'border-box' as const,
}
const lbl = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }

export default function CreerBoutiquePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [data, setData] = useState({
    name: '', description: '', category: 'mode', city: 'Abidjan',
    address: '', phone: '', whatsapp: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router])

  function set(field: string, value: string) { setData(prev => ({ ...prev, [field]: value })) }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!data.name || !data.category || !data.city || !data.phone) {
      setError('Nom, catégorie, ville et téléphone sont requis')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let logoUrl = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/logo-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, logoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }
    }

    const { error: shopError } = await (supabase as any).from('shops').insert({
      owner_id: user.id,
      name: data.name,
      description: data.description,
      category: data.category,
      city: data.city,
      address: data.address,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      logo_url: logoUrl,
      status: 'pending',
    })

    if (shopError) {
      setError('Erreur lors de la création de la boutique')
      setLoading(false)
      return
    }

    // Mettre à jour account_type en seller
    await supabase.from('profiles').update({ account_type: 'seller' }).eq('id', user.id)

    // ✅ Rediriger vers le dashboard, pas vers la page boutique
    router.push('/dashboard')
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Marketplace</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 8 }}>
            Créer ma boutique
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Exposez vos produits et services à des milliers de clients sur Zando CI. C'est gratuit !
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Logo */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <label style={{ ...lbl, marginBottom: 16 }}>Logo de la boutique</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: '#1a2236', border: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.15)' }}>🏪</span>
                }
              </div>
              <label style={{ padding: '10px 18px', background: `rgba(251,146,60,0.08)`, border: `0.5px solid rgba(251,146,60,0.2)`, borderRadius: 10, cursor: 'pointer', fontSize: 13, color: accent, fontWeight: 600 }}>
                {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
                <input type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Infos principales */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Informations</h2>

            <div>
              <label style={lbl}>Nom de la boutique *</label>
              <input style={inp} value={data.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Mode Élégance CI" />
            </div>

            <div>
              <label style={lbl}>Description</label>
              <textarea
                style={{ ...inp, minHeight: 90, resize: 'vertical' as const, lineHeight: 1.6 }}
                value={data.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Décrivez votre boutique en quelques mots..."
              />
            </div>

            <div>
              <label style={lbl}>Catégorie *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => set('category', c.value)} style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const, fontSize: 13,
                    border: data.category === c.value ? `1.5px solid rgba(251,146,60,0.4)` : '0.5px solid rgba(255,255,255,0.08)',
                    background: data.category === c.value ? `rgba(251,146,60,0.08)` : 'rgba(255,255,255,0.02)',
                    color: data.category === c.value ? accent : 'rgba(255,255,255,0.5)',
                    fontWeight: data.category === c.value ? 600 : 400,
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Ville *</label>
                <select style={{ ...inp, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Adresse / Quartier</label>
                <input style={inp} value={data.address} onChange={e => set('address', e.target.value)} placeholder="Cocody, Plateau..." />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Contact</h2>
            <div>
              <label style={lbl}>Téléphone *</label>
              <input style={inp} type="tel" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+225 07 00 00 00 00" />
            </div>
            <div>
              <label style={lbl}>WhatsApp <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(si différent)</span></label>
              <input style={inp} type="tel" value={data.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+225 07 00 00 00 00" />
            </div>
          </div>

          {/* Note */}
          <div style={{ background: `rgba(251,146,60,0.05)`, border: `0.5px solid rgba(251,146,60,0.15)`, borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              ⏳ <strong style={{ color: accent }}>Validation sous 24h</strong> — Votre boutique sera vérifiée par l'équipe ZandoCI avant publication. Vous recevrez une notification.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#f87171' }}>⚠️ {error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '16px',
            background: loading ? `rgba(251,146,60,0.4)` : accent,
            color: '#fff', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: -0.3,
          }}>
            {loading ? 'Création en cours...' : 'Créer ma boutique →'}
          </button>
        </div>
      </div>
    </div>
  )
}