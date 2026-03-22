'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  itemId: string
  itemType: 'residence' | 'vehicle'
  ownerId: string
  readOnly?: boolean
}

type BlockedRange = {
  id: string
  start_date: string
  end_date: string
  reason: string
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function CalendrierDisponibilites({ itemId, itemType, ownerId, readOnly = false }: Props) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([])
  const [selectStart, setSelectStart] = useState<string | null>(null)
  const [selectEnd, setSelectEnd] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBlockedDates()
  }, [itemId])

  async function loadBlockedDates() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .order('start_date')
    setBlockedRanges(data ?? [])
    setLoading(false)
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year: number, month: number) {
    let day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Lundi = 0
  }

  function formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function isBlocked(dateStr: string): string | null {
    for (const r of blockedRanges) {
      if (dateStr >= r.start_date && dateStr <= r.end_date) return r.id
    }
    return null
  }

  function isPast(dateStr: string): boolean {
    return dateStr < today.toISOString().split('T')[0]
  }

  function isInSelection(dateStr: string): boolean {
    if (!selectStart) return false
    const end = selectEnd || hoveredDate || selectStart
    const [a, b] = [selectStart, end].sort()
    return dateStr >= a && dateStr <= b
  }

  function isSelectionStart(dateStr: string): boolean {
    if (!selectStart) return false
    const end = selectEnd || hoveredDate || selectStart
    const [a] = [selectStart, end].sort()
    return dateStr === a
  }

  function isSelectionEnd(dateStr: string): boolean {
    if (!selectStart) return false
    const end = selectEnd || hoveredDate || selectStart
    const [, b] = [selectStart, end].sort()
    return dateStr === b
  }

  function handleDayClick(dateStr: string) {
    if (readOnly || isPast(dateStr)) return

    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(dateStr)
      setSelectEnd(null)
    } else {
      const [start, end] = [selectStart, dateStr].sort()
      setSelectStart(start)
      setSelectEnd(end)
    }
  }

  async function handleBlock() {
    if (!selectStart || !selectEnd) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('blocked_dates').insert({
      item_id: itemId,
      item_type: itemType,
      owner_id: ownerId,
      start_date: selectStart,
      end_date: selectEnd,
      reason: 'blocked',
    })
    setSelectStart(null)
    setSelectEnd(null)
    await loadBlockedDates()
    setSaving(false)
  }

  async function handleUnblock(id: string) {
    const supabase = createClient()
    await supabase.from('blocked_dates').delete().eq('id', id)
    setBlockedRanges(prev => prev.filter(r => r.id !== id))
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const accent = itemType === 'residence' ? '#22d3a5' : '#60a5fa'
  const accentRgb = itemType === 'residence' ? '34,211,165' : '96,165,250'

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {readOnly ? '📅 Disponibilités' : '📅 Gérer les disponibilités'}
        </h3>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.6)' }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Bloqué</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(${accentRgb},0.4)` }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Sélectionné</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation mois */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} style={{
          width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: 14,
        }}>‹</button>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button onClick={nextMonth} style={{
          width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: 14,
        }}>›</button>
      </div>

      {/* Jours de la semaine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#475569', fontWeight: 600, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const dateStr = formatDate(currentYear, currentMonth, day)
          const blockedId = isBlocked(dateStr)
          const past = isPast(dateStr)
          const inSel = isInSelection(dateStr)
          const isStart = isSelectionStart(dateStr)
          const isEnd = isSelectionEnd(dateStr)

          let bg = 'transparent'
          let color = '#94a3b8'
          let border = 'transparent'

          if (past) {
            color = '#1e293b'
          } else if (blockedId) {
            bg = 'rgba(248,113,113,0.2)'
            color = '#f87171'
            border = 'rgba(248,113,113,0.3)'
          } else if (isStart || isEnd) {
            bg = accent
            color = '#0a0f1a'
            border = accent
          } else if (inSel) {
            bg = `rgba(${accentRgb},0.15)`
            color = accent
            border = `rgba(${accentRgb},0.2)`
          } else {
            color = '#cbd5e1'
          }

          return (
            <div
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              onMouseEnter={() => !readOnly && selectStart && !selectEnd && setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{
                textAlign: 'center', padding: '7px 2px', borderRadius: 6,
                fontSize: 12, fontWeight: inSel || blockedId ? 600 : 400,
                background: bg, color, border: `1px solid ${border}`,
                cursor: readOnly || past ? 'default' : 'pointer',
                transition: 'all 0.1s',
                userSelect: 'none',
              }}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Actions de blocage */}
      {!readOnly && (
        <div style={{ marginTop: 20 }}>
          {selectStart && !selectEnd && (
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, textAlign: 'center' }}>
              Cliquez sur une date de fin pour sélectionner la période
            </p>
          )}
          {selectStart && selectEnd && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                flex: 1, background: `rgba(${accentRgb},0.08)`, border: `1px solid rgba(${accentRgb},0.2)`,
                borderRadius: 10, padding: '10px 14px',
              }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  Du <strong style={{ color: accent }}>{selectStart}</strong> au <strong style={{ color: accent }}>{selectEnd}</strong>
                </span>
              </div>
              <button onClick={handleBlock} disabled={saving} style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: saving ? 'rgba(248,113,113,0.3)' : '#f87171',
                color: saving ? '#64748b' : '#fff', fontWeight: 600, fontSize: 13,
                cursor: saving ? 'wait' : 'pointer',
              }}>
                {saving ? '...' : '🔒 Bloquer'}
              </button>
              <button onClick={() => { setSelectStart(null); setSelectEnd(null) }} style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                color: '#64748b', fontSize: 13, cursor: 'pointer',
              }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* Liste des périodes bloquées */}
      {!readOnly && blockedRanges.filter(r => r.reason === 'blocked').length > 0 && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Périodes bloquées</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blockedRanges.filter(r => r.reason === 'blocked').map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                borderRadius: 8, padding: '8px 12px',
              }}>
                <span style={{ fontSize: 12, color: '#f87171' }}>
                  {r.start_date} → {r.end_date}
                </span>
                <button onClick={() => handleUnblock(r.id)} style={{
                  background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 6, color: '#f87171', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
                }}>Débloquer</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 12 }}>Chargement...</p>
      )}
    </div>
  )
}