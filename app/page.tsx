'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80',
    category: 'Résidences',
    badge: '🏠',
    title: 'Villas & appartements',
    titleAccent: 'de luxe',
    sub: "Les plus belles résidences d'Abidjan, disponibles maintenant",
    href: '/residences',
    accent: '#22d3a5',
  },
  {
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1600&q=80',
    category: 'Véhicules',
    badge: '🚗',
    title: 'SUV & berlines',
    titleAccent: 'premium',
    sub: "Parcourez la Côte d'Ivoire en style et en confort absolu",
    href: '/vehicles',
    accent: '#60a5fa',
  },
  {
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80',
    category: 'Événements',
    badge: '🎭',
    title: 'Concerts & festivals',
    titleAccent: 'ivoiriens',
    sub: 'Vivez les meilleures expériences culturelles de Côte d\'Ivoire',
    href: '/events',
    accent: '#a78bfa',
  },
]

export default function HomePage() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.15 }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!animating) goTo((current + 1) % SLIDES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [current, animating])

  function goTo(idx: number) {
    if (animating || idx === current) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 900)
  }

  function setRef(id: string) {
    return (el: HTMLElement | null) => { sectionRefs.current[id] = el }
  }

  const slide = SLIDES[current]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; background: #060b14; font-family: 'DM Sans', sans-serif; }

        :root {
          --accent: #22d3a5;
          --bg: #060b14;
          --surface: #0d1520;
          --border: rgba(255,255,255,0.07);
          --text-dim: rgba(255,255,255,0.38);
        }

        /* ── CURSOR ── */
        .cursor-dot {
          width: 8px; height: 8px; background: var(--accent);
          border-radius: 50%; position: fixed; pointer-events: none;
          z-index: 9999; transition: transform 0.1s; mix-blend-mode: difference;
        }

        /* ── NOISE OVERLAY ── */
        .noise {
          position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* ── NAVBAR ── */
        .nav-wrap {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-wrap.scrolled {
          background: rgba(6,11,20,0.88);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 32px; height: 72px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #fff; text-decoration: none; letter-spacing: -0.5px; }
        .nav-logo span { color: var(--accent); }
        .nav-links { display: flex; gap: 36px; }
        .nav-link {
          font-size: 13px; color: rgba(255,255,255,0.5); text-decoration: none;
          letter-spacing: 0.02em; transition: color 0.2s; position: relative;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 1px; background: var(--accent); transform: scaleX(0); transition: transform 0.25s;
        }
        .nav-link:hover { color: #fff; }
        .nav-link:hover::after { transform: scaleX(1); }
        .nav-actions { display: flex; gap: 10px; align-items: center; }
        .btn-ghost {
          font-size: 13px; color: rgba(255,255,255,0.55); text-decoration: none;
          padding: 9px 18px; border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 10px; transition: all 0.2s; background: transparent;
        }
        .btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
        .btn-primary {
          font-size: 13px; font-weight: 700; color: #060b14; text-decoration: none;
          padding: 9px 20px; background: var(--accent); border-radius: 10px;
          transition: all 0.2s; box-shadow: 0 0 20px rgba(34,211,165,0.25);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(34,211,165,0.4); }
        .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; flex-direction: column; gap: 5px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: 0.25s; }
        .mobile-menu {
          position: fixed; top: 72px; left: 0; right: 0; z-index: 99;
          background: rgba(6,11,20,0.97); backdrop-filter: blur(20px);
          border-bottom: 0.5px solid var(--border);
          padding: 20px 24px 28px;
          display: flex; flex-direction: column; gap: 0;
          animation: slideDown 0.25s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .mobile-link { font-size: 16px; color: rgba(255,255,255,0.65); text-decoration: none; padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.06); display: block; }
        .mobile-actions { display: flex; gap: 10px; margin-top: 20px; }

        /* ── HERO ── */
        .hero { position: relative; height: 100vh; min-height: 600px; overflow: hidden; }
        .hero-slide {
          position: absolute; inset: 0;
          transition: opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hero-slide img { width: 100%; height: 100%; object-fit: cover; display: block; transform: scale(1.05); transition: transform 8s ease; }
        .hero-slide.active img { transform: scale(1); }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(6,11,20,0.75) 0%, rgba(6,11,20,0.3) 50%, rgba(6,11,20,0.7) 100%);
        }
        .hero-overlay::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(6,11,20,1) 0%, transparent 50%);
        }
        .hero-content {
          position: absolute; inset: 0; z-index: 5;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 0 80px 100px; max-width: 860px;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 30px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; width: fit-content;
          margin-bottom: 24px;
          animation: fadeUp 0.6s ease both;
        }
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(38px, 6vw, 72px); font-weight: 800;
          color: #fff; line-height: 1.0; letter-spacing: -2.5px;
          margin-bottom: 18px;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero-title-accent { display: block; }
        .hero-sub {
          font-size: clamp(14px, 1.8vw, 17px); color: rgba(255,255,255,0.55);
          max-width: 460px; line-height: 1.7; margin-bottom: 40px;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-ctas {
          display: flex; gap: 12px; flex-wrap: wrap;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .cta-main {
          padding: 15px 32px; font-size: 14px; font-weight: 700;
          color: #060b14; text-decoration: none; border-radius: 12px;
          transition: all 0.25s; display: inline-block;
        }
        .cta-main:hover { transform: translateY(-2px); }
        .cta-secondary {
          padding: 15px 24px; font-size: 14px; color: #fff; text-decoration: none;
          border-radius: 12px; border: 0.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08); backdrop-filter: blur(8px);
          transition: all 0.25s;
        }
        .cta-secondary:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.35); }

        /* Hero controls */
        .hero-controls {
          position: absolute; bottom: 44px; right: 80px; z-index: 10;
          display: flex; align-items: center; gap: 14px;
        }
        .hero-dots { display: flex; gap: 8px; align-items: center; }
        .hero-dot {
          height: 4px; border-radius: 2px; border: none; cursor: pointer; padding: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hero-arrow {
          width: 42px; height: 42px; border-radius: 50%; border: 0.5px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06); color: #fff; font-size: 15px;
          cursor: pointer; backdrop-filter: blur(8px); transition: all 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .hero-arrow:hover { background: rgba(255,255,255,0.14); transform: scale(1.08); }
        .hero-thumbs { position: absolute; bottom: 44px; left: 80px; z-index: 10; display: flex; gap: 10px; }
        .hero-thumb {
          width: 72px; height: 48px; border-radius: 8px; overflow: hidden;
          cursor: pointer; padding: 0; transition: all 0.3s; opacity: 0.4;
        }
        .hero-thumb.active { opacity: 1; }
        .hero-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ── SCROLL REVEAL ── */
        .reveal {
          opacity: 0; transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        /* ── STATS ── */
        .stats-band { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
        .stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border: 0.5px solid var(--border); border-radius: 20px;
          overflow: hidden; background: var(--surface);
        }
        .stat-cell {
          padding: 36px 28px; text-align: center;
          border-right: 0.5px solid var(--border);
          position: relative; overflow: hidden;
          transition: background 0.3s;
        }
        .stat-cell:last-child { border-right: none; }
        .stat-cell::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(34,211,165,0.06) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s;
        }
        .stat-cell:hover::before { opacity: 1; }
        .stat-num { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .stat-label { font-size: 11px; color: var(--text-dim); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.08em; }

        /* ── SERVICES ── */
        .services-section { max-width: 1280px; margin: 0 auto; padding: 80px 32px; }
        .section-eyebrow { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.18em; font-weight: 600; margin-bottom: 12px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: clamp(26px, 4vw, 40px); font-weight: 800; color: #fff; letter-spacing: -1.5px; margin-bottom: 48px; }
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .service-card {
          position: relative; height: 300px; border-radius: 20px; overflow: hidden;
          text-decoration: none; display: block;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .service-card:hover { transform: translateY(-6px); }
        .service-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .service-card:hover img { transform: scale(1.06); }
        .service-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(6,11,20,0.92) 0%, rgba(6,11,20,0.15) 60%);
        }
        .service-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px; }
        .service-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin-bottom: 8px; }
        .service-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .service-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
        .service-arrow {
          display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
          padding: 7px 14px; border-radius: 8px; border: 0.5px solid currentColor;
          transition: all 0.2s; background: transparent;
        }
        .service-card:hover .service-arrow { padding-left: 18px; }

        /* ── PAYMENT ── */
        .payment-section { max-width: 1280px; margin: 0 auto; padding: 0 32px 80px; }
        .payment-card {
          background: var(--surface); border: 0.5px solid var(--border);
          border-radius: 28px; padding: 64px;
          display: flex; align-items: center; justify-content: space-between; gap: 60px;
          position: relative; overflow: hidden;
        }
        .payment-card::before {
          content: ''; position: absolute; top: -80px; right: -80px;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,165,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .payment-text { flex: 1; }
        .payment-title { font-family: 'Syne', sans-serif; font-size: clamp(26px, 3.5vw, 38px); font-weight: 800; color: #fff; letter-spacing: -1.5px; margin: 16px 0; }
        .payment-desc { font-size: 15px; color: rgba(255,255,255,0.42); line-height: 1.75; max-width: 400px; margin-bottom: 32px; }
        .payment-tags { display: flex; flex-wrap: wrap; gap: 10px; }
        .payment-tag { padding: 9px 18px; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.09); border-radius: 10px; font-size: 13px; color: rgba(255,255,255,0.55); transition: all 0.2s; }
        .payment-tag:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .payment-visual {
          width: 180px; height: 180px; flex-shrink: 0; border-radius: 32px;
          background: linear-gradient(135deg, rgba(34,211,165,0.1), rgba(34,211,165,0.04));
          border: 0.5px solid rgba(34,211,165,0.15);
          display: flex; align-items: center; justify-content: center; font-size: 72px;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

        /* ── CTA ── */
        .cta-section { max-width: 1280px; margin: 0 auto; padding: 0 32px 80px; }
        .cta-card {
          border-radius: 28px; padding: 80px 72px; text-align: center;
          background: linear-gradient(135deg, #0a2019 0%, #060b14 60%, #0a1228 100%);
          border: 0.5px solid rgba(34,211,165,0.15);
          position: relative; overflow: hidden;
        }
        .cta-card::before {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 600px; height: 300px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(34,211,165,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-title { font-family: 'Syne', sans-serif; font-size: clamp(26px, 4.5vw, 48px); font-weight: 800; color: #fff; letter-spacing: -2px; margin-bottom: 18px; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.4); margin-bottom: 40px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.7; }
        .cta-btn {
          display: inline-block; padding: 17px 44px; background: var(--accent);
          color: #060b14; border-radius: 14px; font-size: 15px; font-weight: 700;
          text-decoration: none; transition: all 0.25s; position: relative;
          box-shadow: 0 0 40px rgba(34,211,165,0.3), inset 0 0 0 0.5px rgba(255,255,255,0.1);
        }
        .cta-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 48px rgba(34,211,165,0.45); }

        /* ── FOOTER ── */
        .footer { border-top: 0.5px solid var(--border); max-width: 1280px; margin: 0 auto; }
        .footer-inner { padding: 56px 32px 24px; display: flex; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
        .footer-brand p { font-size: 13px; color: var(--text-dim); max-width: 240px; line-height: 1.7; margin-top: 12px; }
        .footer-cols { display: flex; gap: 64px; }
        .footer-col-title { font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 20px; }
        .footer-col-link { display: block; font-size: 13px; color: var(--text-dim); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
        .footer-col-link:hover { color: rgba(255,255,255,0.8); }
        .footer-bottom { padding: 20px 32px; border-top: 0.5px solid var(--border); text-align: center; font-size: 12px; color: rgba(255,255,255,0.18); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* ── RESPONSIVE MOBILE ── */
        @media (max-width: 767px) {
          .nav-links, .nav-actions { display: none; }
          .hamburger { display: flex; }
          .nav-inner { padding: 0 20px; }

          .hero-content { padding: 0 20px 72px; max-width: 100%; }
          .hero-thumbs { display: none; }
          .hero-controls { right: 20px; bottom: 24px; }
          .hero-title { letter-spacing: -1.5px; }

          .stats-band { padding: 0 16px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-cell:nth-child(2) { border-right: none; }
          .stat-cell:nth-child(3) { border-top: 0.5px solid var(--border); }
          .stat-cell:nth-child(4) { border-top: 0.5px solid var(--border); border-right: none; }

          .services-section { padding: 56px 16px; }
          .services-grid { grid-template-columns: 1fr; }
          .service-card { height: 240px; }

          .payment-section { padding: 0 16px 56px; }
          .payment-card { flex-direction: column; padding: 36px 28px; gap: 32px; text-align: center; }
          .payment-tags { justify-content: center; }
          .payment-visual { width: 120px; height: 120px; font-size: 48px; }

          .cta-section { padding: 0 16px 56px; }
          .cta-card { padding: 48px 28px; }

          .footer-inner { flex-direction: column; gap: 32px; }
          .footer-cols { gap: 36px; }
          .footer-inner, .footer-bottom { padding-left: 16px; padding-right: 16px; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-content { padding: 0 40px 80px; }
          .hero-thumbs { left: 40px; }
          .hero-controls { right: 40px; }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .payment-card { padding: 44px 44px; }
          .stats-band, .services-section, .payment-section, .cta-section { padding-left: 24px; padding-right: 24px; }
        }
      `}</style>

      <div className="noise" />

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* ── NAVBAR ── */}
        <header className={`nav-wrap${scrolled ? ' scrolled' : ''}`}>
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Zando<span>CI</span></Link>

            <nav className="nav-links">
              {['/residences', '/vehicles', '/events'].map((href, i) => (
                <Link key={href} href={href} className="nav-link">
                  {['Résidences', 'Véhicules', 'Événements'][i]}
                </Link>
              ))}
            </nav>

            <div className="nav-actions">
              <Link href="/login" className="btn-ghost">Connexion</Link>
              <Link href="/register" className="btn-primary">S&apos;inscrire</Link>
            </div>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="mobile-menu">
            {['/residences', '/vehicles', '/events'].map((href, i) => (
              <Link key={href} href={href} className="mobile-link" onClick={() => setMenuOpen(false)}>
                {['Résidences', 'Véhicules', 'Événements'][i]}
              </Link>
            ))}
            <div className="mobile-actions">
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '11px 16px', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 10 }}>
                Connexion
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: 14, color: '#060b14', fontWeight: 700, textDecoration: 'none', padding: '11px 16px', background: 'var(--accent)', borderRadius: 10 }}>
                S&apos;inscrire
              </Link>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <section className="hero">
          {SLIDES.map((s, i) => (
            <div key={i} className={`hero-slide${i === current ? ' active' : ''}`} style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 2 : 1 }}>
              <img src={s.url} alt={s.title} />
              <div className="hero-overlay" />
            </div>
          ))}

          <div className="hero-content">
            <div className="hero-badge" style={{ background: `${slide.accent}18`, border: `0.5px solid ${slide.accent}40`, color: slide.accent }}>
              <span style={{ width: 6, height: 6, background: slide.accent, borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              {slide.category}
            </div>
            <h1 className="hero-title" key={`title-${current}`}>
              {slide.title}
              <span className="hero-title-accent" style={{ color: slide.accent }}>{slide.titleAccent}</span>
            </h1>
            <p className="hero-sub" key={`sub-${current}`}>{slide.sub}</p>
            <div className="hero-ctas">
              <Link href={slide.href} className="cta-main" style={{ background: slide.accent, boxShadow: `0 0 30px ${slide.accent}35` }}>
                Explorer maintenant
              </Link>
              <Link href="/register" className="cta-secondary">
                Publier une annonce
              </Link>
            </div>
          </div>

          {/* Dots + arrows */}
          <div className="hero-controls">
            <div className="hero-dots">
              {SLIDES.map((s, i) => (
                <button key={i} className="hero-dot" onClick={() => goTo(i)} style={{
                  width: i === current ? 32 : 8, background: i === current ? s.accent : 'rgba(255,255,255,0.28)',
                }} />
              ))}
            </div>
            <button className="hero-arrow" onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}>←</button>
            <button className="hero-arrow" onClick={() => goTo((current + 1) % SLIDES.length)}>→</button>
          </div>

          {/* Thumbs */}
          <div className="hero-thumbs">
            {SLIDES.map((s, i) => (
              <button key={i} className={`hero-thumb${i === current ? ' active' : ''}`} onClick={() => goTo(i)}
                style={{ border: i === current ? `2px solid ${s.accent}` : '2px solid transparent' }}>
                <img src={s.url} alt={s.category} />
              </button>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <div id="stats" ref={setRef('stats')} className={`stats-band reveal${visibleSections.has('stats') ? ' visible' : ''}`} style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="stats-grid">
            {[
              { num: '5 000+', label: 'Utilisateurs inscrits', accent: '#22d3a5' },
              { num: '200+', label: 'Réservations / mois', accent: '#60a5fa' },
              { num: '3', label: 'Modules disponibles', accent: '#a78bfa' },
              { num: '4', label: 'Moyens de paiement', accent: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} className="stat-cell">
                <div className="stat-num" style={{ color: s.accent }}>{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SERVICES ── */}
        <div id="services" ref={setRef('services')}>
          <section className="services-section">
            <div className={`reveal${visibleSections.has('services') ? ' visible' : ''}`}>
              <div className="section-eyebrow">Services</div>
              <h2 className="section-title">Tout ce dont vous avez besoin</h2>
            </div>
            <div className="services-grid">
              {[
                { href: '/residences', label: 'Résidences', desc: 'Villas, appartements et studios meublés', img: SLIDES[0].url, accent: '#22d3a5', delay: '0s' },
                { href: '/vehicles', label: 'Véhicules', desc: 'SUV, berlines, 4x4 et minibus', img: SLIDES[1].url, accent: '#60a5fa', delay: '0.12s' },
                { href: '/events', label: 'Événements', desc: 'Concerts, festivals, conférences', img: SLIDES[2].url, accent: '#a78bfa', delay: '0.24s' },
              ].map(card => (
                <Link key={card.href} href={card.href} className={`service-card reveal${visibleSections.has('services') ? ' visible' : ''}`} style={{ transitionDelay: card.delay }}>
                  <img src={card.img} alt={card.label} />
                  <div className="service-overlay" style={{ background: `linear-gradient(to top, rgba(6,11,20,0.95) 0%, ${card.accent}08 100%)` }} />
                  <div className="service-content">
                    <div className="service-tag" style={{ color: card.accent }}>{card.label}</div>
                    <div className="service-name">{card.desc}</div>
                    <span className="service-arrow" style={{ color: card.accent }}>Explorer →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── PAYMENT ── */}
        <div id="payment" ref={setRef('payment')}>
          <section className="payment-section">
            <div className={`payment-card reveal${visibleSections.has('payment') ? ' visible' : ''}`}>
              <div className="payment-text">
                <div className="section-eyebrow">Paiements</div>
                <h2 className="payment-title">100% Mobile Money</h2>
                <p className="payment-desc">Payez et recevez en toute sécurité depuis votre téléphone. Sans carte bancaire, sans complications.</p>
                <div className="payment-tags">
                  {['Orange Money', 'MTN Money', 'Wave', 'Moov Money'].map(m => (
                    <span key={m} className="payment-tag">{m}</span>
                  ))}
                </div>
              </div>
              <div className="payment-visual">📱</div>
            </div>
          </section>
        </div>

        {/* ── CTA ── */}
        <div id="cta" ref={setRef('cta')}>
          <section className="cta-section">
            <div className={`cta-card reveal${visibleSections.has('cta') ? ' visible' : ''}`}>
              <h2 className="cta-title">Vous avez un bien à louer&nbsp;?</h2>
              <p className="cta-sub">Publiez gratuitement et recevez vos paiements directement sur votre Mobile Money.</p>
              <Link href="/register" className="cta-btn">Commencer gratuitement</Link>
            </div>
          </section>
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <Link href="/" className="nav-logo" style={{ display: 'inline-block', marginBottom: 0 }}>Zando<span style={{ color: 'var(--accent)' }}>CI</span></Link>
              <p>La plateforme de location multi-services en Côte d&apos;Ivoire.</p>
            </div>
            <div className="footer-cols">
              {[
                { title: 'Services', links: [{ href: '/residences', label: 'Résidences' }, { href: '/vehicles', label: 'Véhicules' }, { href: '/events', label: 'Événements' }] },
                { title: 'Compte', links: [{ href: '/register', label: "S'inscrire" }, { href: '/login', label: 'Se connecter' }, { href: '/dashboard', label: 'Mon espace' }] },
              ].map(col => (
                <div key={col.title}>
                  <div className="footer-col-title">{col.title}</div>
                  {col.links.map(l => <Link key={l.href} href={l.href} className="footer-col-link">{l.label}</Link>)}
                </div>
              ))}
            </div>
          </div>
          <div className="footer-bottom">© {new Date().getFullYear()} ZandoCI — Abidjan, Côte d&apos;Ivoire</div>
        </footer>

      </div>
    </>
  )
}