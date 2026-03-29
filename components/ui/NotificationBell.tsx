'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  link: string | null
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  success: '#22d3a5',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  // Charger user + notifications initiales
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setNotifications(data as Notification[])
    })
  }, [])

  // Supabase Realtime — nouvelles notifications en temps réel
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev])
          // Toast rapide
          showToast(newNotif)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Toast notification
  function showToast(notif: Notification) {
    const toast = document.createElement('div')
    const color = TYPE_COLORS[notif.type] ?? '#60a5fa'
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #111827; border: 0.5px solid ${color}40;
      border-left: 3px solid ${color};
      border-radius: 12px; padding: 14px 18px;
      max-width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `
    toast.innerHTML = `
      <style>@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }</style>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fff;">${notif.title}</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.4;">${notif.message}</p>
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s ease'
      setTimeout(() => toast.remove(), 300)
    }, 4000)
  }

  async function markAsRead(notif: Notification) {
    if (!notif.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    if (notif.link) {
      router.push(notif.link)
      setOpen(false)
    }
  }

  async function markAllAsRead() {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function deleteNotif(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          width: 38, height: 38,
          borderRadius: 10,
          background: open ? 'rgba(34,211,165,0.1)' : 'rgba(255,255,255,0.05)',
          border: open ? '0.5px solid rgba(34,211,165,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          transition: 'all 0.15s ease',
          color: open ? '#22d3a5' : 'rgba(255,255,255,0.6)',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18,
            background: '#f87171',
            borderRadius: 9, border: '2px solid #0a0f1a',
            fontSize: 10, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 340, maxHeight: 480,
          background: '#111827',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          zIndex: 1000,
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 600,
                  color: '#22d3a5', background: 'rgba(34,211,165,0.1)',
                  padding: '2px 8px', borderRadius: 20,
                }}>
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.4)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0,
                }}
              >
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => {
                const color = TYPE_COLORS[notif.type] ?? '#60a5fa'
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                      cursor: notif.link ? 'pointer' : 'default',
                      background: notif.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Indicateur non lu */}
                    {!notif.read && (
                      <div style={{
                        position: 'absolute', left: 8, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6, height: 6, borderRadius: '50%',
                        background: color,
                      }} />
                    )}

                    {/* Dot couleur type */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${color}15`,
                      border: `0.5px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, marginLeft: notif.read ? 0 : 8,
                    }}>
                      {notif.type === 'success' ? '✓' : notif.type === 'error' ? '✕' : notif.type === 'warning' ? '⚠' : 'ℹ'}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: notif.read ? 500 : 700,
                        color: notif.read ? 'rgba(255,255,255,0.6)' : '#fff',
                        margin: '0 0 3px', lineHeight: 1.3,
                      }}>
                        {notif.title}
                      </p>
                      <p style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.35)',
                        margin: '0 0 4px', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={(e) => deleteNotif(e, notif.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.15)', fontSize: 14,
                        padding: '2px 4px', flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              <button
                onClick={() => { router.push('/dashboard/notifications'); setOpen(false) }}
                style={{
                  fontSize: 12, color: '#22d3a5',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Voir toutes les notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}