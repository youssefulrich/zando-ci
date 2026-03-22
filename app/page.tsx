'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80',
    category: 'Résidences',
    title: 'Villas & appartements de luxe',
    sub: 'Séjournez dans les plus belles résidences d\'Abidjan',
    href: '/residences',
  },
  {
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1600&q=80',
    category: 'Véhicules',
    title: 'SUV & berlines premium',
    sub: 'Parcourez la Côte d\'Ivoire en style et confort',
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
    <div style={{ background: '#0a0f1a', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* NAVBAR */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 68,
        background: 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Zando<span style={{ color: '#22d3a5' }}>CI</span>
        </Link>
        <nav style={{ display: 'flex', gap: 32 }}>
          {['/residences', '/vehicles', '/events'].map((href, i) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              {['Résidences', 'Véhicules', 'Événements'][i]}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', padding: '8px 16px', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10 }}>
            Connexion
          </Link>
          <Link href="/register" style={{ fontSize: 13, color: '#0a0f1a', fontWeight: 700, textDecoration: 'none', padding: '9px 18px', background: '#22d3a5', borderRadius: 10 }}>
            S&apos;inscrire
          </Link>
        </div>
      </header>

      {/* HERO SLIDER */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

        {/* Slides */}
        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            transition: 'opacity 0.8s ease',
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
          }}>
            <img
              src={slide.url}
              alt={slide.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay sombre */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,15,26,0.3) 0%, rgba(10,15,26,0.65) 60%, rgba(10,15,26,0.95) 100%)',
            }} />
          </div>
        ))}

        {/* Contenu hero */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 80px 100px',
          maxWidth: 900,
        }}>
          {/* Badge catégorie */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,211,165,0.15)', border: '0.5px solid rgba(34,211,165,0.3)',
            borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#22d3a5',
            marginBottom: 20, width: 'fit-content',
            transition: 'all 0.5s ease',
          }}>
            <span style={{ width: 6, height: 6, background: '#22d3a5', borderRadius: '50%', display: 'inline-block' }} />
            {SLIDES[current].category}
          </div>

          <h1 style={{
            fontSize: 60, fontWeight: 800, color: '#fff', lineHeight: 1.05,
            letterSpacing: -2, marginBottom: 16,
            textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}>
            {SLIDES[current].title}
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.65)', marginBottom: 36,
            maxWidth: 500, lineHeight: 1.6,
          }}>
            {SLIDES[current].sub}
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={SLIDES[current].href} style={{
              padding: '14px 32px', background: '#22d3a5', color: '#0a0f1a',
              borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              Explorer maintenant
            </Link>
            <Link href="/register" style={{
              padding: '14px 28px', background: 'rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: 12, fontSize: 14, textDecoration: 'none',
              border: '0.5px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              Publier une annonce
            </Link>
          </div>
        </div>

        {/* Dots + flèches navigation */}
        <div style={{
          position: 'absolute', bottom: 40, right: 80, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === current ? 28 : 8,
                height: 8, borderRadius: 4,
                background: i === current ? '#22d3a5' : 'rgba(255,255,255,0.3)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
          {/* Flèches */}
          <button onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)} style={{
            width: 40, height: 40, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
            fontSize: 16, backdropFilter: 'blur(8px)',
          }}>←</button>
          <button onClick={() => goTo((current + 1) % SLIDES.length)} style={{
            width: 40, height: 40, borderRadius: '50%', border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
            fontSize: 16, backdropFilter: 'blur(8px)',
          }}>→</button>
        </div>

        {/* Miniatures slides */}
        <div style={{
          position: 'absolute', bottom: 40, left: 80, zIndex: 10,
          display: 'flex', gap: 12,
        }}>
          {SLIDES.map((slide, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: 80, height: 52, borderRadius: 10, overflow: 'hidden',
              border: i === current ? '2px solid #22d3a5' : '2px solid transparent',
              cursor: 'pointer', padding: 0, opacity: i === current ? 1 : 0.5,
              transition: 'all 0.3s ease',
            }}>
              <img src={slide.url} alt={slide.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '64px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden',
        }}>
          {[
            { num: '5 000+', label: 'Utilisateurs inscrits' },
            { num: '200+', label: 'Réservations par mois' },
            { num: '3 M FCFA', label: 'Objectif CA mensuel' },
            { num: '4', label: 'Moyens de paiement' },
          ].map((s, i, arr) => (
            <div key={i} style={{
              padding: '32px 24px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: '0 80px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>Services</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Tout ce dont vous avez besoin</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { href: '/residences', label: 'Résidences', desc: 'Villas, appartements et studios meublés', img: SLIDES[0].url, color: '#22d3a5' },
            { href: '/vehicles', label: 'Véhicules', desc: 'SUV, berlines, 4x4 et minibus', img: SLIDES[1].url, color: '#60a5fa' },
            { href: '/events', label: 'Événements', desc: 'Concerts, festivals, conférences', img: SLIDES[2].url, color: '#a78bfa' },
          ].map(card => (
            <Link key={card.href} href={card.href} style={{ textDecoration: 'none', display: 'block', borderRadius: 20, overflow: 'hidden', position: 'relative', height: 280 }}>
              <img src={card.img} alt={card.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }} />
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
      <section style={{ padding: '0 80px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: '#111827', border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 24, padding: '56px 64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>Paiements</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 14 }}>100% Mobile Money</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 420, marginBottom: 28 }}>
              Payez et recevez en toute sécurité depuis votre téléphone. Sans carte bancaire, sans complications.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Orange Money', 'MTN Money', 'Wave', 'Moov Money'].map(m => (
                <span key={m} style={{
                  padding: '9px 18px', background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  fontSize: 13, color: 'rgba(255,255,255,0.6)',
                }}>{m}</span>
              ))}
            </div>
          </div>
          <div style={{
            width: 160, height: 160, flexShrink: 0,
            background: 'rgba(34,211,165,0.06)', border: '0.5px solid rgba(34,211,165,0.15)',
            borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
          }}>📱</div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 80px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d2d24 0%, #0a1f1a 100%)',
          border: '0.5px solid rgba(34,211,165,0.2)',
          borderRadius: 24, padding: '72px 64px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: -1.5, marginBottom: 16 }}>
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
      <footer style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Zando<span style={{ color: '#22d3a5' }}>CI</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 260, lineHeight: 1.7 }}>
              La plateforme de location multi-services en Côte d&apos;Ivoire.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 64 }}>
            {[
              { title: 'Services', links: [{ href: '/residences', label: 'Résidences' }, { href: '/vehicles', label: 'Véhicules' }, { href: '/events', label: 'Événements' }] },
              { title: 'Compte', links: [{ href: '/register', label: 'S\'inscrire' }, { href: '/login', label: 'Se connecter' }, { href: '/dashboard', label: 'Mon espace' }] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 18 }}>{col.title}</p>
                {col.links.map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 12 }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          © {new Date().getFullYear()} ZandoCI — Abidjan, Côte d&apos;Ivoire
        </div>
      </footer>

    </div>
  )
}