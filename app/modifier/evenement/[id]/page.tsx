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
    event_date: '', event_time: '', end_date: '', end_time: '',
    venue_name: '', address: '', city: 'Abidjan',
    ticket_price: '', total_tickets: '', cover_image: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('events').select('*').eq('id', id).single().then(({ data: e }) => {
      if (e) {
        const startDate = e.event_date ? e.event_date.split('T')[0] : ''
        const startTime = e.event_date ? e.event_date.split('T')[1]?.slice(0, 5) : ''
        const endDate = e.end_date ? e.end_date.split('T')[0] : ''
        const endTime = e.end_date ? e.end_date.split('T')[1]?.slice(0, 5) : ''
        setData({
          title: e.title ?? '', category: e.category ?? 'concert',
          description: e.description ?? '', event_date: startDate,
          event_time: startTime ?? '20:00', end_date: endDate, end_time: endTime ?? '23:00',
          venue_name: e.venue_name ?? '', address: e.address ?? '',
          city: e.city ?? 'Abidjan', ticket_price: e.ticket_price ?? '',
          total_tickets: e.total_tickets ?? '', cover_image: e.cover_image ?? '',
        })
      }
      setLoading(false)
    })
  }, [id])

  function set(field: string, value: unknown) { setData(prev => ({ ...prev, [field]: value })) }

  async function handleSave() {
    setError('')
    if (!data.title || !data.event_date || !data.ticket_price || !data.total_tickets) {
      setError('Titre, date, prix et nombre de billets sont requis')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const eventDatetime = `${data.event_date}T${data.event_time || '20:00'}:00`
    const endDatetime = data.end_date ? `${data.end_date}T${data.end_time || '23:00'}:00` : null

    const { error: err } = await supabase.from('events').update({
      title: data.title, category: data.category, description: data.description,
      event_date: eventDatetime, end_date: endDatetime,
      venue_name: data.venue_name, address: data.address, city: data.city,
      ticket_price: Number(data.ticket_price),
      total_tickets: Number(data.total_tickets),
      cover_image: data.cover_image || null,
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Date début *</label>
              <input type="date" style={inputStyle} value={data.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Heure début</label>
              <input type="time" style={inputStyle} value={data.event_time} onChange={e => set('event_time', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Date fin</label>
              <input type="date" style={inputStyle} value={data.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Heure fin</label>
              <input type="time" style={inputStyle} value={data.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Salle / Lieu</label>
              <input style={inputStyle} value={data.venue_name} onChange={e => set('venue_name', e.target.value)} placeholder="Sofitel, Stade..." />
            </div>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={data.address} onChange={e => set('address', e.target.value)} placeholder="Plateau, Cocody..." />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <select style={{ ...inputStyle, background: '#0f172a' }} value={data.city} onChange={e => set('city', e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Billets */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Billets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Prix du billet (FCFA) *</label>
              <input type="number" style={inputStyle} value={data.ticket_price}
                onChange={e => set('ticket_price', e.target.value)} placeholder="5 000" />
            </div>
            <div>
              <label style={labelStyle}>Nombre total de billets *</label>
              <input type="number" style={inputStyle} value={data.total_tickets}
                onChange={e => set('total_tickets', e.target.value)} placeholder="500" />
            </div>
          </div>
        </div>

        {/* Affiche */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Affiche / Photo de couverture (URL)</h2>
          <input style={inputStyle} value={data.cover_image} onChange={e => set('cover_image', e.target.value)} placeholder="https://..." />
          {data.cover_image && (
            <div style={{ marginTop: 12, width: 160, height: 100, borderRadius: 8, overflow: 'hidden' }}>
              <img src={data.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
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
          }}>{saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}</button>
        </div>
      </div>
    </div>
  )
}