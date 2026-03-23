'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80',
    category: 'Résidences',
    title: 'Villas & appartements de luxe',
    sub: "Séjournez dans les plus belles résidences d'Abidjan",
    href: '/residences',
  },
  {
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1600&q=80',
    category: 'Véhicules',
    title: 'SUV & berlines premium',
    sub: "Parcourez la Côte d'Ivoire en style et confort",
    href: '/vehicles',
  },
  {
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80',
    category: 'Événements',
    title: 'Concerts & festivals',
    sub: 'Vivez les meilleures expériences culturelles ivoiriennes',
    href: '/events',
  },
]

export default function HomePage() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => goTo((current + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [current])

  function goTo(idx: number) {
    if (animating || idx === current) return
    setAnimating(true)
    setPrev(current)
    setCurrent(idx)
    setTimeout(() => { setPrev(null); setAnimating(false) }, 800)
  }

  return (
    <>
      <style>{`
        /* Reset débordement */
        *, *::before, *::after { box-sizing: border-box; }
        body { overflow-x: hidden; margin: 0; }

        /* NAVBAR */
        .nav-links { display: flex; gap: 32px; }
        .nav-actions { display: flex; gap: 10px; }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }

        /* HERO */
        .hero-content {
          position: absolute; inset: 0; z-index: 10;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 0 80px 100px;
          max-width: 900px;
        }
        .hero-title { font-size: 60px; font-weight: 800; color: #fff; line-height: 1.05; letter-spacing: -2px; margin-bottom: 16px; text-shadow: 0 2px 20px rgba(0,0,0,0.4); }
        .hero-sub { font-size: 17px; color: rgba(255,255,255,0.65); margin-bottom: 36px; max-width: 500px; line-height: 1.6; }
        .hero-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-nav-bottom { position: absolute; bottom: 40px; right: 80px; z-index: 10; display: flex; align-items: center; gap: 16px; }
        .hero-thumbs { position: absolute; bottom: 40px; left: 80px; z-index: 10; display: flex; gap: 12px; }

        /* STATS */
        .stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border: 0.5px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden;
        }

        /* SERVICES */
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        /* PAIEMENT */
        .payment-card {
          background: #111827; border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 24px; padding: 56px 64px;
          display: flex; align-items: center; justify-content: space-between; gap: 48px;
        }

        /* FOOTER */
        .footer-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 40px; }
        .footer-cols { display: flex; gap: 64px; }

        /* SECTION PADDING */
        .section-pad { padding: 0 80px 80px; max-width: 1200px; margin: 0 auto; }

        /* ===== MOBILE ===== */
        @media (max-width: 767px) {
          /* Navbar */
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .nav-hamburger { display: flex; flex-direction: column; gap: 5px; }
          .nav-hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; }
          .mobile-menu {
            position: fixed; top: 68px; left: 0; right: 0; z-index: 99;
            background: rgba(10,15,26,0.97); backdrop-filter: blur(16px);
            padding: 24px 24px 32px;
            display: flex; flex-direction: column; gap: 0;
            border-bottom: 0.5px solid rgba(255,255,255,0.08);
          }
          .mobile-menu a {
            font-size: 16px; color: rgba(255,255,255,0.7); text-decoration: none;
            padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.06);
            display: block;
          }
          .mobile-menu-actions { display: flex; gap: 10px; margin-top: 20px; }

          /* Hero */
          .hero-content { padding: 0 20px 80px; max-width: 100%; }
          .hero-title { font-size: clamp(28px, 8vw, 44px); letter-spacing: -1px; margin-bottom: 12px; }
          .hero-sub { font-size: 14px; margin-bottom: 24px; }
          .hero-nav-bottom { bottom: 20px; right: 20px; gap: 10px; }
          .hero-nav-bottom button { width: 34px; height: 34px; font-size: 14px; }
          .hero-thumbs { display: none; }

          /* Stats */
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-right: none !important; border-bottom: 0.5px solid rgba(255,255,255,0.08); }
          .stat-item:nth-child(odd) { border-right: 0.5px solid rgba(255,255,255,0.08) !important; }
          .stat-item:nth-last-child(-n+2) { border-bottom: none; }

          /* Services */
          .services-grid { grid-template-columns: 1fr; }
          .service-card { height: 220px !important; }

          /* Payment */
          .payment-card { flex-direction: column; padding: 32px 24px; gap: 28px; text-align: center; }
          .payment-emoji { width: 100px !important; height: 100px !important; font-size: 44px !important; border-radius: 20px !important; }
          .payment-tags { justify-content: center; }

          /* CTA */
          .cta-card { padding: 40px 24px !important; }
          .cta-title { font-size: clamp(24px, 7vw, 36px) !important; }

          /* Footer */
          .footer-inner { flex-direction: column; gap: 24px; }
          .footer-cols { gap: 32px; }

          /* Section padding */
          .section-pad { padding: 0 16px 48px; }
          .stats-section { padding: 40px 16px; }
        }

        /* TABLET */
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-content { padding: 0 40px 80px; }
          .hero-title { font-size: 42px; }
          .hero-thumbs { left: 40px; }
          .hero-nav-bottom { right: 40px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .payment-card { padding: 40px 40px; }
          .section-pad { padding: 0 40px 60px; }
          .stats-section { padding: 40px 40px; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)' }}>

        {/* NAVBAR */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 68,
          background: 'rgba(10,15,26,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px' }}>
            Zando<span style={{ color: '#22d3a5' }}>CI</span>
          </Link>

          {/* Nav desktop */}
          <nav className="nav-links">
            {['/residences', '/vehicles', '/events'].map((href, i) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                {['Résidences', 'Véhicules', 'Événements'][i]}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="nav-actions">
            <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', padding: '8px 16px', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10 }}>
              Connexion
            </Link>
            <Link href="/register" style={{ fontSize: 13, color: '#0a0f1a', fontWeight: 700, textDecoration: 'none', padding: '9px 18px', background: '#22d3a5', borderRadius: 10 }}>
              S&apos;inscrire
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transition: '0.2s' }} />
            <span style={{ opacity: menuOpen ? 0 : 1, transition: '0.2s' }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transition: '0.2s' }} />
          </button>
        </header>

        {/* MENU MOBILE */}
        {menuOpen && (
          <div className="mobile-menu">
            {['/residences', '/vehicles', '/events'].map((href, i) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                {['Résidences', 'Véhicules', 'Événements'][i]}
              </Link>
            ))}
            <div className="mobile-menu-actions">
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
            </div>
          </div>
        )}

        {/* HERO SLIDER */}
        <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          {SLIDES.map((slide, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              transition: 'opacity 0.8s ease',
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 2 : i === prev ? 1 : 0,
            }}>
              <img src={slide.url} alt={slide.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(10,15,26,0.3) 0%, rgba(10,15,26,0.65) 60%, rgba(10,15,26,0.95) 100%)',
              }} />
            </div>
          ))}

          {/* Contenu hero */}
          <div className="hero-content">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(34,211,165,0.15)', border: '0.5px solid rgba(34,211,165,0.3)',
              borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#22d3a5',
              marginBottom: 20, width: 'fit-content', transition: 'all 0.5s ease',
            }}>
              <span style={{ width: 6, height: 6, background: '#22d3a5', borderRadius: '50%', display: 'inline-block' }} />
              {SLIDES[current].category}
            </div>
            <h1 className="hero-title">{SLIDES[current].title}</h1>
            <p className="hero-sub">{SLIDES[current].sub}</p>
            <div className="hero-buttons">
              <Link href={SLIDES[current].href} style={{
                padding: '14px 28px', background: '#22d3a5', color: '#0a0f1a',
                borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Explorer maintenant
              </Link>
              <Link href="/register" style={{
                padding: '14px 24px', background: 'rgba(255,255,255,0.1)',
                color: '#fff', borderRadius: 12, fontSize: 14, textDecoration: 'none',
                border: '0.5px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              }}>
                Publier une annonce
              </Link>
            </div>
          </div>

          {/* Navigation dots + flèches */}
          <div className="hero-nav-bottom">
            <div style={{ display: 'flex', gap: 8 }}>
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  width: i === current ? 28 : 8, height: 8, borderRadius: 4,
                  background: i === current ? '#22d3a5' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
            <button onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)} style={{
              width: 40, height: 40, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 16, backdropFilter: 'blur(8px)',
            }}>←</button>
            <button onClick={() => goTo((current + 1) % SLIDES.length)} style={{
              width: 40, height: 40, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 16, backdropFilter: 'blur(8px)',
            }}>→</button>
          </div>

          {/* Miniatures */}
          <div className="hero-thumbs">
            {SLIDES.map((slide, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: 80, height: 52, borderRadius: 10, overflow: 'hidden',
                border: i === current ? '2px solid #22d3a5' : '2px solid transparent',
                cursor: 'pointer', padding: 0, opacity: i === current ? 1 : 0.5, transition: 'all 0.3s ease',
              }}>
                <img src={slide.url} alt={slide.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="stats-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="stats-grid">
            {[
              { num: '5 000+', label: 'Utilisateurs inscrits' },
              { num: '200+', label: 'Réservations par mois' },
              { num: '3 M FCFA', label: 'Objectif CA mensuel' },
              { num: '4', label: 'Moyens de paiement' },
            ].map((s, i, arr) => (
              <div key={i} className="stat-item" style={{
                padding: '32px 24px', textAlign: 'center',
                borderRight: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="section-pad">
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>Services</div>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, color: '#fff', letterSpacing: -1, margin: 0 }}>Tout ce dont vous avez besoin</h2>
          </div>
          <div className="services-grid">
            {[
              { href: '/residences', label: 'Résidences', desc: 'Villas, appartements et studios meublés', img: SLIDES[0].url, color: '#22d3a5' },
              { href: '/vehicles', label: 'Véhicules', desc: 'SUV, berlines, 4x4 et minibus', img: SLIDES[1].url, color: '#60a5fa' },
              { href: '/events', label: 'Événements', desc: 'Concerts, festivals, conférences', img: SLIDES[2].url, color: '#a78bfa' },
            ].map(card => (
              <Link key={card.href} href={card.href} className="service-card" style={{
                textDecoration: 'none', display: 'block', borderRadius: 20,
                overflow: 'hidden', position: 'relative', height: 280,
              }}>
                <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,26,0.9) 0%, rgba(10,15,26,0.2) 60%)' }} />
                <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                  <div style={{ fontSize: 11, color: card.color, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{card.desc}</div>
                  <div style={{ marginTop: 12, fontSize: 13, color: card.color }}>Explorer →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PAIEMENT */}
        <section className="section-pad">
          <div className="payment-card">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>Paiements</div>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 14 }}>100% Mobile Money</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 420, marginBottom: 28 }}>
                Payez et recevez en toute sécurité depuis votre téléphone. Sans carte bancaire, sans complications.
              </p>
              <div className="payment-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['Orange Money', 'MTN Money', 'Wave', 'Moov Money'].map(m => (
                  <span key={m} style={{
                    padding: '9px 18px', background: 'rgba(255,255,255,0.05)',
                    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    fontSize: 13, color: 'rgba(255,255,255,0.6)',
                  }}>{m}</span>
                ))}
              </div>
            </div>
            <div className="payment-emoji" style={{
              width: 160, height: 160, flexShrink: 0,
              background: 'rgba(34,211,165,0.06)', border: '0.5px solid rgba(34,211,165,0.15)',
              borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
            }}>📱</div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-pad">
          <div className="cta-card" style={{
            background: 'linear-gradient(135deg, #0d2d24 0%, #0a1f1a 100%)',
            border: '0.5px solid rgba(34,211,165,0.2)',
            borderRadius: 24, padding: '72px 64px', textAlign: 'center',
          }}>
            <h2 className="cta-title" style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 800, color: '#fff', letterSpacing: -1.5, marginBottom: 16 }}>
              Vous avez un bien à louer ?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
              Publiez gratuitement et recevez vos paiements directement sur votre Mobile Money.
            </p>
            <Link href="/register" style={{
              display: 'inline-block', padding: '15px 36px', background: '#22d3a5',
              color: '#0a0f1a', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              Commencer gratuitement
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', maxWidth: 1200, margin: '0 auto' }}>
          <div className="section-pad" style={{ paddingTop: 48, paddingBottom: 0 }}>
            <div className="footer-inner">
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                  Zando<span style={{ color: '#22d3a5' }}>CI</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 260, lineHeight: 1.7, margin: 0 }}>
                  La plateforme de location multi-services en Côte d&apos;Ivoire.
                </p>
              </div>
              <div className="footer-cols">
                {[
                  { title: 'Services', links: [{ href: '/residences', label: 'Résidences' }, { href: '/vehicles', label: 'Véhicules' }, { href: '/events', label: 'Événements' }] },
                  { title: 'Compte', links: [{ href: '/register', label: "S'inscrire" }, { href: '/login', label: 'Se connecter' }, { href: '/dashboard', label: 'Mon espace' }] },
                ].map(col => (
                  <div key={col.title}>
                    <p style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 18, marginTop: 0 }}>{col.title}</p>
                    {col.links.map(l => (
                      <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 12 }}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', marginTop: 40, paddingTop: 24, paddingBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              © {new Date().getFullYear()} ZandoCI — Abidjan, Côte d&apos;Ivoire
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}