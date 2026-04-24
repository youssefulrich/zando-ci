'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85',
    category: 'Résidences',
    title: 'Villas & appartements',
    accent: 'de prestige',
    sub: "Découvrez les plus belles résidences d'Abidjan et de toute la Côte d'Ivoire",
    href: '/residences',
    color: '#22d3a5',
  },
  {
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&q=85',
    category: 'Véhicules',
    title: 'Location de voitures',
    accent: 'premium',
    sub: "Voyagez confortablement avec notre flotte de véhicules haut de gamme",
    href: '/vehicles',
    color: '#60a5fa',
  },
  {
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=85',
    category: 'Événements',
    title: 'Concerts & festivals',
    accent: 'ivoiriens',
    sub: "Réservez vos billets pour les meilleurs événements culturels",
    href: '/events',
    color: '#c084fc',
  },
]

export default function HomePage() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => goTo((c: number) => (c + 1) % SLIDES.length), 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function goTo(idxOrFn: number | ((c: number) => number)) {
    if (animating) return
    setAnimating(true)
    setCurrent(typeof idxOrFn === 'function' ? idxOrFn : () => idxOrFn)
    setTimeout(() => setAnimating(false), 800)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = setInterval(() => goTo((c: number) => (c + 1) % SLIDES.length), 6000) }
  }

  const slide = SLIDES[current]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0b0f19; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; overflow-x: hidden; }

        /* NAVBAR */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px; display: flex; align-items: center;
          transition: background 0.3s, border-color 0.3s;
        }
        .nav.solid {
          background: rgba(11,15,25,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
        }
        .nav-inner {
          width: 100%; max-width: 1200px; margin: 0 auto;
          padding: 0 24px; display: flex; align-items: center; justify-content: space-between;
        }
        .logo { font-size: 19px; font-weight: 800; color: #fff; text-decoration: none; letter-spacing: -0.5px; }
        .logo em { color: #22d3a5; font-style: normal; }
        .nav-links { display: flex; gap: 28px; }
        .nav-links a { font-size: 13.5px; color: rgba(255,255,255,0.55); text-decoration: none; letter-spacing: 0.01em; transition: color 0.2s; }
        .nav-links a:hover { color: #fff; }
        .nav-right { display: flex; gap: 10px; align-items: center; }
        .btn-outline { font-size: 13px; color: rgba(255,255,255,0.6); padding: 8px 18px; border: 0.5px solid rgba(255,255,255,0.15); border-radius: 8px; text-decoration: none; transition: all 0.2s; background: transparent; }
        .btn-outline:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .btn-fill { font-size: 13px; font-weight: 600; color: #0b0f19; padding: 8px 18px; background: #22d3a5; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
        .btn-fill:hover { background: #1fbf94; }
        .ham { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
        .ham span { display: block; width: 20px; height: 1.5px; background: rgba(255,255,255,0.7); border-radius: 2px; transition: 0.2s; }
        .mob-menu { position: fixed; top: 64px; left: 0; right: 0; z-index: 99; background: rgba(11,15,25,0.98); backdrop-filter: blur(16px); border-bottom: 0.5px solid rgba(255,255,255,0.07); padding: 16px 24px 24px; }
        .mob-menu a { display: block; font-size: 15px; color: rgba(255,255,255,0.65); text-decoration: none; padding: 13px 0; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .mob-btns { display: flex; gap: 10px; margin-top: 18px; }
        .mob-btns a { flex: 1; text-align: center; font-size: 14px; font-weight: 600; padding: 12px; border-radius: 10px; text-decoration: none; }

        /* HERO */
        .hero { position: relative; height: 100svh; min-height: 580px; overflow: hidden; }
        .hslide { position: absolute; inset: 0; transition: opacity 0.85s ease; }
        .hslide img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hslide::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(11,15,25,0.25) 0%, rgba(11,15,25,0.1) 40%, rgba(11,15,25,0.85) 100%);
        }
        .hero-body {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
          padding: 0 40px 80px; max-width: 700px;
        }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 30px; margin-bottom: 18px;
        }
        .hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; }
        .hero-h1 {
          font-size: clamp(32px, 5.5vw, 60px);
          font-weight: 700; color: #fff; line-height: 1.1;
          letter-spacing: -1.5px; margin-bottom: 14px;
        }
        .hero-h1 span { display: block; }
        .hero-p { font-size: clamp(14px, 1.8vw, 16px); color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 32px; max-width: 460px; }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .hbtn-main { padding: 13px 28px; font-size: 14px; font-weight: 600; color: #0b0f19; border-radius: 10px; text-decoration: none; transition: all 0.2s; display: inline-block; }
        .hbtn-sec { padding: 13px 22px; font-size: 14px; color: rgba(255,255,255,0.8); border-radius: 10px; text-decoration: none; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border: 0.5px solid rgba(255,255,255,0.18); transition: all 0.2s; display: inline-block; }
        .hbtn-sec:hover { background: rgba(255,255,255,0.16); }

        /* Hero nav */
        .hnav { position: absolute; bottom: 28px; right: 40px; z-index: 10; display: flex; align-items: center; gap: 12px; }
        .hdot { height: 3px; border-radius: 2px; border: none; padding: 0; cursor: pointer; transition: all 0.35s ease; }
        .harrow { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 0.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
        .harrow:hover { background: rgba(255,255,255,0.16); }
        .hthumbs { position: absolute; bottom: 28px; left: 40px; z-index: 10; display: flex; gap: 8px; }
        .hthumb { width: 68px; height: 44px; border-radius: 7px; overflow: hidden; padding: 0; cursor: pointer; opacity: 0.4; transition: all 0.3s; }
        .hthumb.on { opacity: 1; }
        .hthumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* STATS */
        .stats { max-width: 1100px; margin: 0 auto; padding: 56px 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; background: #131926; }
        .stat { padding: 28px 20px; text-align: center; border-right: 0.5px solid rgba(255,255,255,0.07); }
        .stat:last-child { border-right: none; }
        .stat-n { font-size: 26px; font-weight: 700; letter-spacing: -1px; }
        .stat-l { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

        /* SERVICES */
        .svc { max-width: 1100px; margin: 0 auto; padding: 0 24px 72px; }
        .sec-label { font-size: 11px; color: #22d3a5; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; margin-bottom: 10px; }
        .sec-title { font-size: clamp(22px, 3.5vw, 34px); font-weight: 700; color: #fff; letter-spacing: -1px; margin-bottom: 36px; }
        .svc-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .svc-card { position: relative; height: 280px; border-radius: 16px; overflow: hidden; text-decoration: none; display: block; }
        .svc-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .svc-card:hover img { transform: scale(1.04); }
        .svc-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(11,15,25,0.92) 0%, rgba(11,15,25,0.1) 55%); }
        .svc-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 22px; z-index: 2; }
        .svc-cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
        .svc-name { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 12px; }
        .svc-link { font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 7px; border: 0.5px solid currentColor; display: inline-block; }

        /* PAYMENT */
        .pay { max-width: 1100px; margin: 0 auto; padding: 0 24px 72px; }
        .pay-card { background: #131926; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 52px 56px; display: flex; align-items: center; gap: 56px; }
        .pay-text { flex: 1; }
        .pay-title { font-size: clamp(22px, 3vw, 32px); font-weight: 700; color: #fff; letter-spacing: -1px; margin: 12px 0; }
        .pay-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.75; max-width: 400px; margin-bottom: 28px; }
        .pay-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pay-chip { font-size: 13px; color: rgba(255,255,255,0.55); padding: 7px 16px; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 8px; }
        .pay-icon { width: 140px; height: 140px; flex-shrink: 0; border-radius: 24px; background: rgba(34,211,165,0.08); border: 0.5px solid rgba(34,211,165,0.15); display: flex; align-items: center; justify-content: center; font-size: 56px; }

        /* CTA */
        .cta { max-width: 1100px; margin: 0 auto; padding: 0 24px 72px; }
        .cta-box { border-radius: 20px; padding: 64px 56px; text-align: center; background: linear-gradient(135deg, #0d2218 0%, #0b0f19 50%, #0d1628 100%); border: 0.5px solid rgba(34,211,165,0.14); }
        .cta-title { font-size: clamp(22px, 4vw, 40px); font-weight: 700; color: #fff; letter-spacing: -1.5px; margin-bottom: 14px; }
        .cta-sub { font-size: 15px; color: rgba(255,255,255,0.42); margin-bottom: 34px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.7; }
        .cta-btn { display: inline-block; padding: 14px 36px; background: #22d3a5; color: #0b0f19; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .cta-btn:hover { background: #1fbf94; transform: translateY(-1px); }

        /* FOOTER */
        .foot { border-top: 0.5px solid rgba(255,255,255,0.07); max-width: 1100px; margin: 0 auto; }
        .foot-in { padding: 48px 24px 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; }
        .foot-brand p { font-size: 13px; color: rgba(255,255,255,0.35); max-width: 230px; line-height: 1.7; margin-top: 10px; }
        .foot-cols { display: flex; gap: 56px; }
        .foot-col-t { font-size: 10px; color: #22d3a5; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; margin-bottom: 16px; }
        .foot-col a { display: block; font-size: 13px; color: rgba(255,255,255,0.38); text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .foot-col a:hover { color: rgba(255,255,255,0.75); }
        .foot-bottom { padding: 16px 24px; border-top: 0.5px solid rgba(255,255,255,0.06); text-align: center; font-size: 12px; color: rgba(255,255,255,0.2); }

        /* RESPONSIVE */
        @media (max-width: 767px) {
          .nav-links, .nav-right { display: none; }
          .ham { display: flex; }
          .hero-body { padding: 0 20px 72px; max-width: 100%; }
          .hthumbs { display: none; }
          .hnav { right: 20px; bottom: 20px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stat:nth-child(2) { border-right: none; }
          .stat:nth-child(3) { border-top: 0.5px solid rgba(255,255,255,0.07); }
          .stat:nth-child(4) { border-top: 0.5px solid rgba(255,255,255,0.07); border-right: none; }
          .svc-grid { grid-template-columns: 1fr; }
          .svc-card { height: 220px; }
          .pay-card { flex-direction: column; padding: 32px 24px; gap: 28px; text-align: center; }
          .pay-chips { justify-content: center; }
          .pay-icon { width: 100px; height: 100px; font-size: 40px; }
          .cta-box { padding: 44px 24px; }
          .foot-in { flex-direction: column; gap: 28px; }
          .foot-cols { gap: 32px; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-body { padding: 0 32px 72px; }
          .hthumbs { left: 32px; }
          .hnav { right: 32px; }
          .svc-grid { grid-template-columns: 1fr 1fr; }
          .pay-card { padding: 40px 40px; }
        }
      `}</style>

      <div style={{ background: '#0b0f19', minHeight: '100vh' }}>

        {/* NAVBAR */}
        <header className={`nav${scrolled ? ' solid' : ''}`}>
          <div className="nav-inner">
            <Link href="/" className="logo">Zando<em>CI</em></Link>
            <nav className="nav-links">
              {['/residences','/vehicles','/events','/boutique'].map((href, i) => (
                <Link key={href} href={href}>{['Résidences','Véhicules','Événements','Boutique'][i]}</Link>
              ))}
            </nav>
            <div className="nav-right">
              <Link href="/login" className="btn-outline">Connexion</Link>
              <Link href="/register" className="btn-fill">S&apos;inscrire</Link>
            </div>
            <button className="ham" onClick={() => setMenuOpen(!menuOpen)}>
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="mob-menu">
            {['/residences','/vehicles','/events','/boutique'].map((href, i) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                {['Résidences','Véhicules','Événements','Boutique'][i]}
              </Link>
            ))}
            <div className="mob-btns">
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent' }}>Connexion</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ color: '#0b0f19', background: '#22d3a5' }}>S&apos;inscrire</Link>
            </div>
          </div>
        )}

        {/* HERO */}
        <section className="hero">
          {SLIDES.map((s, i) => (
            <div key={i} className="hslide" style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 2 : 1 }}>
              <img src={s.url} alt={s.title} />
            </div>
          ))}

          <div className="hero-body" style={{ zIndex: 5 }}>
            <div className="hero-tag" style={{ background: `${slide.color}18`, border: `0.5px solid ${slide.color}35`, color: slide.color }}>
              <span className="hero-tag-dot" style={{ background: slide.color }} />
              {slide.category}
            </div>
            <h1 className="hero-h1" key={`h-${current}`}>
              {slide.title}
              <span style={{ color: slide.color }}>{slide.accent}</span>
            </h1>
            <p className="hero-p" key={`p-${current}`}>{slide.sub}</p>
            <div className="hero-btns">
              <Link href={slide.href} className="hbtn-main" style={{ background: slide.color, boxShadow: `0 4px 24px ${slide.color}30` }}>
                Découvrir
              </Link>
              <Link href="/register" className="hbtn-sec">
                Publier une annonce
              </Link>
            </div>
          </div>

          {/* Contrôles */}
          <div className="hnav">
            <div style={{ display: 'flex', gap: 6 }}>
              {SLIDES.map((s, i) => (
                <button key={i} className="hdot" onClick={() => goTo(i)} style={{ width: i === current ? 28 : 8, background: i === current ? s.color : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
            <button className="harrow" onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}>←</button>
            <button className="harrow" onClick={() => goTo((current + 1) % SLIDES.length)}>→</button>
          </div>

          <div className="hthumbs">
            {SLIDES.map((s, i) => (
              <button key={i} className={`hthumb${i === current ? ' on' : ''}`} onClick={() => goTo(i)}
                style={{ border: i === current ? `2px solid ${s.color}` : '2px solid transparent' }}>
                <img src={s.url} alt="" />
              </button>
            ))}
          </div>
        </section>

        {/* STATS */}
        <div className="stats">
          <div className="stats-grid">
            {[
              { n: '5 000+', l: 'Utilisateurs', c: '#22d3a5' },
              { n: '200+', l: 'Réservations / mois', c: '#60a5fa' },
              { n: '4', l: 'Services', c: '#c084fc' },
              { n: '4', l: 'Moyens de paiement', c: '#fb923c' },
            ].map((s, i) => (
              <div key={i} className="stat">
                <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <section className="svc">
          <div className="sec-label">Nos services</div>
          <h2 className="sec-title">Tout ce dont vous avez besoin</h2>
          <div className="svc-grid">
            {[
              { href: '/residences', cat: 'Résidences', name: 'Villas, apparts & studios', img: SLIDES[0].url, color: '#22d3a5' },
              { href: '/vehicles', cat: 'Véhicules', name: 'SUV, berlines & 4x4', img: SLIDES[1].url, color: '#60a5fa' },
              { href: '/events', cat: 'Événements', name: 'Concerts & festivals', img: SLIDES[2].url, color: '#c084fc' },
            ].map(c => (
              <Link key={c.href} href={c.href} className="svc-card">
                <img src={c.img} alt={c.cat} />
                <div className="svc-info">
                  <div className="svc-cat" style={{ color: c.color }}>{c.cat}</div>
                  <div className="svc-name">{c.name}</div>
                  <span className="svc-link" style={{ color: c.color }}>Explorer →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PAYMENT */}
        <section className="pay">
          <div className="pay-card">
            <div className="pay-text">
              <div className="sec-label">Paiements</div>
              <h2 className="pay-title">100% Mobile Money</h2>
              <p className="pay-desc">Payez et recevez en toute sécurité depuis votre téléphone. Sans carte bancaire, sans complications.</p>
              <div className="pay-chips">
                {['Orange Money','MTN Money','Wave','Moov Money'].map(m => (
                  <span key={m} className="pay-chip">{m}</span>
                ))}
              </div>
            </div>
            <div className="pay-icon">📱</div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="cta-box">
            <h2 className="cta-title">Vous avez un bien à louer&nbsp;?</h2>
            <p className="cta-sub">Publiez gratuitement et recevez vos paiements directement sur votre Mobile Money.</p>
            <Link href="/register" className="cta-btn">Commencer gratuitement</Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="foot">
          <div className="foot-in">
            <div className="foot-brand">
              <Link href="/" className="logo" style={{ display: 'inline-block' }}>Zando<em>CI</em></Link>
              <p>La plateforme de location multi-services en Côte d&apos;Ivoire.</p>
            </div>
            <div className="foot-cols">
              {[
                { t: 'Services', links: [{ href: '/residences', l: 'Résidences' }, { href: '/vehicles', l: 'Véhicules' }, { href: '/events', l: 'Événements' }, { href: '/boutique', l: 'Boutique' }] },
                { t: 'Compte', links: [{ href: '/register', l: "S'inscrire" }, { href: '/login', l: 'Se connecter' }, { href: '/dashboard', l: 'Mon espace' }] },
              ].map(col => (
                <div key={col.t} className="foot-col">
                  <div className="foot-col-t">{col.t}</div>
                  {col.links.map(l => <Link key={l.href} href={l.href}>{l.l}</Link>)}
                </div>
              ))}
            </div>
          </div>
          <div className="foot-bottom">© {new Date().getFullYear()} ZandoCI — Abidjan, Côte d&apos;Ivoire</div>
        </footer>

      </div>
    </>
  )
}