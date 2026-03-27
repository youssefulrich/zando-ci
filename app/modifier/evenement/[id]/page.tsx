'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'concert', label: 'Concert' }, { value: 'festival', label: 'Festival' },
  { value: 'conference', label: 'Conférence' }, { value: 'sport', label: 'Sport' },
  { value: 'soiree', label: 'Soirée' }, { value: 'formation', label: 'Formation' },
  { value: 'autre', label: 'Autre' },
]
const CITIES = ['Abidjan','Bouaké','Daloa','Yamoussoukro','San-Pédro','Korhogo','Man','Divo','Gagnoa','Abengourou']

export default function ModifierEvenementPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState({
    title: '', category: 'concert', description: '',
    event_date: '', event_time: '', venue_name: '', venue_address: '',
    ticket_price: '', total_tickets: '',
  })

  // Photo state
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null) // URL existante
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)   // Nouveau fichier
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.from('events').select('*').eq('id', id).single().then(({ data: e }: any) => {
      if (e) {
        setData({
          title: e.title ?? '',
          category: e.category ?? 'concert',
          description: e.description ?? '',
          event_date: e.event_date ? e.event_date.split('T')[0] : '',
          event_time: e.event_time ? e.event_time.slice(0, 5) : '20:00',
          venue_name: e.venue_name ?? '',
          venue_address: e.venue_address ?? '',
          ticket_price: e.price_per_ticket ?? '',
          total_tickets: e.total_capacity ?? '',
        })
        setCurrentPhoto(e.main_photo ?? null)
      }
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: unknown) { setData(prev => ({ ...prev, [field]: value })) }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNewPhotoFile(file)
    setNewPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    setCurrentPhoto(null)
  }

  async function handleSave() {
    setError('')
    if (!data.title || !data.event_date || !data.ticket_price || !data.total_tickets) {
      setError('Titre, date, prix et nombre de billets sont requis')
      return
    }
    setSaving(true)
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    let finalPhotoUrl = currentPhoto

    // Upload nouvelle photo si sélectionnée
    if (newPhotoFile && user) {
      setUploadingPhoto(true)
      const ext = newPhotoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('events').upload(path, newPhotoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('events').getPublicUrl(path)
        finalPhotoUrl = urlData.publicUrl
      }
      setUploadingPhoto(false)
    }

    const eventDatetime = `${data.event_date}T${data.event_time || '20:00'}:00`
    const { error: err } = await supabase.from('events').update({
      title: data.title,
      category: data.category,
      description: data.description,
      event_date: eventDatetime,
      event_time: data.event_time || '20:00',
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      price_per_ticket: Number(data.ticket_price),
      total_capacity: Number(data.total_tickets),
      main_photo: finalPhotoUrl,
    }).eq('id', id)

    if (err) { setError('Erreur lors de la sauvegarde'); setSaving(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const accent = '#a78bfa'
  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const, colorScheme: 'dark' as const,
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

  const displayPhoto = newPhotoPreview ?? currentPhoto

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Modification</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Modifier l'événement</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>{data.title}</p>
        </div>

        {/* Infos générales */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Informations générales</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Titre de l'événement *</label>
            <input style={inputStyle} value={data.title} onChange={e => set('title', e.target.value)} placeholder="Nom de l'événement..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Catégorie</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => set('category', c.value)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: data.category === c.value ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${data.category === c.value ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: data.category === c.value ? accent : '#94a3b8',
                  fontWeight: data.category === c.value ? 600 : 400,
                }}>{c.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={data.description}
              onChange={e => set('description', e.target.value)} placeholder="Décrivez l'événement..." />
          </div>
        </div>

        {/* Date & Lieu */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Date & Lieu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" style={inputStyle} value={data.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Heure</label>
              <input type="time" style={inputStyle} value={data.event_time} onChange={e => set('event_time', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Salle / Lieu</label>
              <input style={inputStyle} value={data.venue_name} onChange={e => set('venue_name', e.target.value)} placeholder="Sofitel, Stade..." />
            </div>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={data.venue_address} onChange={e => set('venue_address', e.target.value)} placeholder="Plateau, Cocody..." />
            </div>
          </div>
        </div>

        {/* Billets */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Billets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Prix du billet (FCFA) *</label>
              <input type="number" style={inputStyle} value={data.ticket_price} onChange={e => set('ticket_price', e.target.value)} placeholder="5 000" />
            </div>
            <div>
              <label style={labelStyle}>Nombre total de billets *</label>
              <input type="number" style={inputStyle} value={data.total_tickets} onChange={e => set('total_tickets', e.target.value)} placeholder="500" />
            </div>
          </div>
        </div>

        {/* Photo */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Photo principale</h2>

          {displayPhoto ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={displayPhoto} alt="" style={{ width: 200, height: 130, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                {/* Bouton changer */}
                <label style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: 'rgba(167,139,250,0.9)', color: '#fff', backdropFilter: 'blur(4px)',
                }}>
                  Changer
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
                {/* Bouton supprimer */}
                <button onClick={removePhoto} style={{
                  padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', backdropFilter: 'blur(4px)',
                }}>✕</button>
              </div>
              {newPhotoPreview && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(167,139,250,0.9)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#fff', fontWeight: 600 }}>
                  Nouvelle photo
                </div>
              )}
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '32px 20px', cursor: 'pointer',
              background: 'rgba(167,139,250,0.04)', border: '1px dashed rgba(167,139,250,0.25)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 32, color: 'rgba(167,139,250,0.4)' }}>🖼️</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0 }}>
                Cliquez pour ajouter une photo
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>JPG, PNG</p>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: accent, fontSize: 13 }}>✅ Événement mis à jour ! Redirection...</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: saving ? '#64748b' : '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'wait' : 'pointer',
          }}>{saving ? (uploadingPhoto ? 'Upload photo...' : 'Sauvegarde...') : 'Enregistrer les modifications'}</button>
        </div>
      </div>
    </div>
  )
}