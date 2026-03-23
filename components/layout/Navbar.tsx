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

  const navItems = [
    { href: '/residences', label: 'Résidences' },
    { href: '/vehicles', label: 'Véhicules' },
    { href: '/events', label: 'Événements' },
  ]

  return (
    <>
      <style>{`
        .nb-desktop-nav { display: flex; gap: 28px; }
        .nb-desktop-actions { display: flex; gap: 10px; align-items: center; }
        .nb-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          padding: 8px; flex-direction: column; gap: 5px;
        }
        .nb-hamburger span {
          display: block; width: 22px; height: 2px;
          background: #fff; border-radius: 2px; transition: 0.25s;
        }
        .nb-mobile-menu {
          position: fixed; top: 64px; left: 0; right: 0; z-index: 49;
          background: rgba(10,15,26,0.97); backdrop-filter: blur(16px);
          padding: 20px 20px 28px;
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
          display: flex; flex-direction: column; gap: 0;
        }
        .nb-mobile-link {
          font-size: 16px; color: rgba(255,255,255,0.7); text-decoration: none;
          padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.06);
          display: block;
        }
        .nb-mobile-actions { display: flex; gap: 10px; margin-top: 20px; }

        @media (max-width: 767px) {
          .nb-desktop-nav { display: none; }
          .nb-desktop-actions { display: none; }
          .nb-hamburger { display: flex; }
        }
      `}</style>

      <header style={{
        background: '#0a0f1a',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px' }}>
            Zando<span style={{ color: '#22d3a5' }}>CI</span>
          </Link>

          {/* Nav desktop */}
          <nav className="nb-desktop-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} style={{
                fontSize: 13,
                color: pathname.startsWith(item.href) ? '#22d3a5' : 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                fontWeight: pathname.startsWith(item.href) ? 600 : 400,
              }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="nb-desktop-actions">
            {user ? (
              <>
                <Link href="/dashboard" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '8px 16px', borderRadius: 10 }}>
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
                <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '8px 16px' }}>
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

          {/* Hamburger mobile */}
          <button
            className="nb-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Menu mobile déroulant */}
      {menuOpen && (
        <div className="nb-mobile-menu">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="nb-mobile-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className="nb-mobile-actions">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', padding: '11px 16px',
                  border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10,
                }}>
                  Mon espace
                </Link>
                <button onClick={() => { setMenuOpen(false); handleLogout() }} style={{
                  flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.7)',
                  padding: '11px 16px', border: '0.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, background: 'transparent', cursor: 'pointer',
                }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', padding: '11px 16px',
                  border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10,
                }}>
                  Connexion
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textAlign: 'center', fontSize: 14, color: '#0a0f1a',
                  fontWeight: 700, textDecoration: 'none', padding: '11px 16px',
                  background: '#22d3a5', borderRadius: 10,
                }}>
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}