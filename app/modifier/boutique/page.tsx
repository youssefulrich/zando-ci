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

export default function ModifierBoutiquePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [shopId, setShopId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [data, setData] = useState({
    name: '', description: '', category: 'mode', city: 'Abidjan',
    address: '', phone: '', whatsapp: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: shopRaw } = await (supabase as any)
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!shopRaw) { router.push('/creer-boutique'); return }

      setShopId(shopRaw.id)
      setData({
        name: shopRaw.name ?? '',
        description: shopRaw.description ?? '',
        category: shopRaw.category ?? 'mode',
        city: shopRaw.city ?? 'Abidjan',
        address: shopRaw.address ?? '',
        phone: shopRaw.phone ?? '',
        whatsapp: shopRaw.whatsapp ?? '',
      })
      if (shopRaw.logo_url) setLogoPreview(shopRaw.logo_url)
      setFetching(false)
    }
    load()
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
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Upload nouveau logo si changé
    let logoUrl = logoPreview // garde l'ancien par défaut
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/logo-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, logoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }
    }

    const { error: shopError } = await (supabase as any)
      .from('shops')
      .update({
        name: data.name,
        description: data.description,
        category: data.category,
        city: data.city,
        address: data.address,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        logo_url: logoUrl,
      })
      .eq('id', shopId)

    if (shopError) {
      setError('Erreur lors de la mise à jour de la boutique')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (fetching) {
    return (
      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Marketplace</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 8 }}>
            Modifier ma boutique
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Mettez à jour les informations de votre boutique.
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
              {logoPreview && (
                <button
                  onClick={() => { setLogoPreview(null); setLogoFile(null) }}
                  style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#f87171', fontWeight: 600 }}
                >
                  Supprimer
                </button>
              )}
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

          {/* Messages */}
          {error && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#f87171' }}>⚠️ {error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(34,211,165,0.08)', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#22d3a5' }}>✓ Boutique mise à jour avec succès ! Redirection...</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.1)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, padding: '16px', background: loading ? `rgba(251,146,60,0.4)` : accent, color: '#fff', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: -0.3 }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}