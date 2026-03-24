'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  if (pathname === '/') return null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { href: '/residences', label: 'Résidences', accent: '#22d3a5' },
    { href: '/vehicles', label: 'Véhicules', accent: '#60a5fa' },
    { href: '/events', label: 'Événements', accent: '#a78bfa' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        .znb-wrap {
          position: sticky; top: 0; z-index: 50;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          background: rgba(6,11,20,${scrolled ? '0.92' : '1'});
        }
        .znb-wrap.scrolled {
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
          box-shadow: 0 4px 32px rgba(0,0,0,0.3);
        }
        .znb-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 32px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .znb-logo {
          font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800;
          color: #fff; text-decoration: none; letter-spacing: -0.5px;
          transition: opacity 0.2s;
        }
        .znb-logo:hover { opacity: 0.85; }
        .znb-logo span { color: #22d3a5; }

        .znb-nav { display: flex; gap: 32px; align-items: center; }
        .znb-link {
          font-size: 13px; color: rgba(255,255,255,0.48); text-decoration: none;
          letter-spacing: 0.01em; transition: color 0.2s; position: relative;
          padding-bottom: 2px;
        }
        .znb-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; border-radius: 1px;
          transform: scaleX(0); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .znb-link:hover { color: #fff; }
        .znb-link:hover::after, .znb-link.active::after { transform: scaleX(1); }
        .znb-link.active { color: #fff; font-weight: 500; }

        .znb-actions { display: flex; gap: 8px; align-items: center; }
        .znb-btn-ghost {
          font-size: 13px; color: rgba(255,255,255,0.5); text-decoration: none;
          padding: 8px 16px; border-radius: 10px; transition: all 0.2s;
          border: 0.5px solid rgba(255,255,255,0.09); background: transparent;
          cursor: pointer;
        }
        .znb-btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.2); }
        .znb-btn-primary {
          font-size: 13px; font-weight: 700; color: #060b14; text-decoration: none;
          padding: 9px 18px; background: #22d3a5; border-radius: 10px;
          transition: all 0.22s; box-shadow: 0 0 20px rgba(34,211,165,0.22);
          display: inline-block;
        }
        .znb-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(34,211,165,0.38); background: #28e6b0; }

        .znb-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          padding: 8px; flex-direction: column; gap: 5px;
        }
        .znb-hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: 0.25s; }

        .znb-mobile {
          position: fixed; top: 64px; left: 0; right: 0; z-index: 49;
          background: rgba(6,11,20,0.97); backdrop-filter: blur(24px);
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
          padding: 16px 20px 28px;
          animation: nbSlide 0.22s ease;
        }
        @keyframes nbSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .znb-mobile-link {
          font-size: 16px; color: rgba(255,255,255,0.65); text-decoration: none;
          padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          transition: color 0.2s;
        }
        .znb-mobile-link:hover { color: #fff; }
        .znb-mobile-link span.dot {
          width: 6px; height: 6px; border-radius: 50%; display: inline-block;
        }
        .znb-mobile-actions { display: flex; gap: 10px; margin-top: 20px; }

        @media (max-width: 767px) {
          .znb-nav, .znb-actions { display: none !important; }
          .znb-hamburger { display: flex; }
          .znb-inner { padding: 0 20px; }
        }
        @media (min-width: 768px) { .znb-hamburger { display: none; } }
      `}</style>

      <header className={`znb-wrap${scrolled ? ' scrolled' : ''}`}>
        <div className="znb-inner">
          <Link href="/" className="znb-logo">Zando<span>CI</span></Link>

          <nav className="znb-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className={`znb-link${pathname.startsWith(item.href) ? ' active' : ''}`}
                style={{ ['--link-color' as string]: item.accent } as React.CSSProperties}>
                <style>{`.znb-link[href="${item.href}"]::after { background: ${item.accent}; }`}</style>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="znb-actions">
            {user ? (
              <>
                <Link href="/dashboard" className="znb-btn-ghost">Mon espace</Link>
                <button onClick={handleLogout} className="znb-btn-ghost">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/login" className="znb-btn-ghost">Connexion</Link>
                <Link href="/register" className="znb-btn-primary">S&apos;inscrire</Link>
              </>
            )}
          </div>

          <button className="znb-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="znb-mobile">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="znb-mobile-link" onClick={() => setMenuOpen(false)}>
              {item.label}
              <span className="dot" style={{ background: item.accent }} />
            </Link>
          ))}
          <div className="znb-mobile-actions">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '12px 16px', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12 }}>
                  Mon espace
                </Link>
                <button onClick={() => { setMenuOpen(false); handleLogout() }} style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.7)', padding: '12px 16px', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12, background: 'transparent', cursor: 'pointer' }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '12px 16px', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 12 }}>
                  Connexion
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 14, color: '#060b14', fontWeight: 700, textDecoration: 'none', padding: '12px 16px', background: '#22d3a5', borderRadius: 12 }}>
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