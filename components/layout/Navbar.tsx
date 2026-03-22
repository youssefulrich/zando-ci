'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // La landing page a sa propre navbar intégrée
  if (pathname === '/') return null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header style={{
      background: '#0a0f1a',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 48px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Zando<span style={{ color: '#22d3a5' }}>CI</span>
        </Link>

        <nav style={{ display: 'flex', gap: 28 }}>
          {[
            { href: '/residences', label: 'Résidences' },
            { href: '/vehicles', label: 'Véhicules' },
            { href: '/events', label: 'Événements' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              fontSize: 13, color: pathname.startsWith(item.href) ? '#22d3a5' : 'rgba(255,255,255,0.55)',
              textDecoration: 'none', fontWeight: pathname.startsWith(item.href) ? 600 : 400,
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                padding: '8px 16px', borderRadius: 10,
              }}>
                Mon espace
              </Link>
              <button onClick={handleLogout} style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '8px 16px',
                borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.12)',
                background: 'transparent', cursor: 'pointer',
              }}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                padding: '8px 16px',
              }}>
                Connexion
              </Link>
              <Link href="/register" style={{
                fontSize: 13, color: '#0a0f1a', padding: '9px 18px',
                borderRadius: 10, background: '#22d3a5', textDecoration: 'none', fontWeight: 700,
              }}>
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}