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
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => goTo((c: number) => (c + 1) % SLIDES.length), 6000)
    }
  }

  const slide = SLIDES[current]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #070b12;
          font-family: 'DM Sans', -apple-system, sans-serif;
          overflow-x: hidden;
          color: #e2e8f0;
        }

        /* ── NAVBAR ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 68px; display: flex; align-items: center;
          transition: all 0.4s;
        }
        .nav.solid {
          background: rgba(7,11,18,0.88);
          backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .nav-inner {
          width: 100%; max-width: 1240px; margin: 0 auto;
          padding: 0 28px; display: flex; align-items: center; justify-content: space-between;
        }
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800; color: #fff;
          text-decoration: none; letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 2px;
        }
        .logo-dot { width: 7px; height: 7px; border-radius: 50%; background: #22d3a5; margin-left: 1px; margin-bottom: 8px; display: inline-block; }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a {
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.5); text-decoration: none;
          letter-spacing: 0.01em; transition: color 0.2s;
          position: relative;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 1px; background: #22d3a5; transform: scaleX(0);
          transition: transform 0.2s; transform-origin: left;
        }
        .nav-links a:hover { color: #fff; }
        .nav-links a:hover::after { transform: scaleX(1); }
        .nav-right { display: flex; gap: 10px; align-items: center; }
        .btn-outline {
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.65);
          padding: 8px 20px; border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 100px; text-decoration: none; transition: all 0.2s;
        }
        .btn-outline:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .btn-fill {
          font-size: 13px; font-weight: 600; color: #070b12;
          padding: 8px 20px; background: #22d3a5;
          border-radius: 100px; text-decoration: none; transition: all 0.2s;
        }
        .btn-fill:hover { background: #1ec99c; transform: translateY(-1px); }
        .ham { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
        .ham span { display: block; width: 20px; height: 1.5px; background: rgba(255,255,255,0.7); border-radius: 2px; transition: 0.25s; }
        .mob-menu {
          position: fixed; top: 68px; left: 0; right: 0; z-index: 99;
          background: rgba(7,11,18,0.97); backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          padding: 16px 28px 28px;
        }
        .mob-menu a { display: block; font-size: 15px; color: rgba(255,255,255,0.6); text-decoration: none; padding: 13px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .mob-btns { display: flex; gap: 10px; margin-top: 20px; }
        .mob-btns a { flex: 1; text-align: center; font-size: 14px; font-weight: 600; padding: 12px; border-radius: 100px; text-decoration: none; }

        /* ── HERO ── */
        .hero { position: relative; height: 100svh; min-height: 600px; overflow: hidden; }
        .hslide { position: absolute; inset: 0; transition: opacity 0.9s ease; }
        .hslide img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hslide::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(7,11,18,0.3) 0%,
            rgba(7,11,18,0.05) 35%,
            rgba(7,11,18,0.7) 70%,
            rgba(7,11,18,0.97) 100%
          );
        }

        /* Slogan bar */
        .slogan-bar {
          position: absolute; top: 90px; left: 0; right: 0; z-index: 6;
          display: flex; justify-content: center;
          animation: fadeDown 1s ease both;
        }
        .slogan-pill {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(34,211,165,0.08);
          border: 0.5px solid rgba(34,211,165,0.25);
          border-radius: 100px; padding: 8px 20px;
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7);
          letter-spacing: 0.04em;
          backdrop-filter: blur(8px);
        }
        .slogan-accent { color: #22d3a5; font-weight: 700; }
        .slogan-sep { width: 1px; height: 12px; background: rgba(255,255,255,0.2); }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-body {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
          padding: 0 48px 100px; max-width: 760px;
        }

        .hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 100px; margin-bottom: 20px;
        }
        .hero-tag-dot { width: 5px; height: 5px; border-radius: 50%; }

        .hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 5.5vw, 66px);
          font-weight: 800; color: #fff; line-height: 1.05;
          letter-spacing: -2px; margin-bottom: 16px;
        }
        .hero-h1 .accent { display: block; }

        .hero-p {
          font-size: clamp(14px, 1.6vw, 15px);
          color: rgba(255,255,255,0.5); line-height: 1.75;
          margin-bottom: 36px; max-width: 440px;
          font-weight: 300;
        }

        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .hbtn-main {
          padding: 14px 30px; font-size: 14px; font-weight: 600;
          color: #070b12; border-radius: 100px; text-decoration: none;
          transition: all 0.25s; display: inline-block;
          font-family: 'DM Sans', sans-serif;
        }
        .hbtn-main:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .hbtn-sec {
          padding: 14px 24px; font-size: 14px; color: rgba(255,255,255,0.75);
          border-radius: 100px; text-decoration: none;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
          border: 0.5px solid rgba(255,255,255,0.14);
          transition: all 0.25s; display: inline-block;
        }
        .hbtn-sec:hover { background: rgba(255,255,255,0.12); transform: translateY(-1px); }

        /* Hero controls */
        .hnav { position: absolute; bottom: 36px; right: 48px; z-index: 10; display: flex; align-items: center; gap: 12px; }
        .hdot { height: 3px; border-radius: 2px; border: none; padding: 0; cursor: pointer; transition: all 0.35s ease; }
        .harrow {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.07); border: 0.5px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8); font-size: 14px; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(6px);
        }
        .harrow:hover { background: rgba(255,255,255,0.15); }
        .hthumbs { position: absolute; bottom: 36px; left: 48px; z-index: 10; display: flex; gap: 8px; }
        .hthumb {
          width: 72px; height: 46px; border-radius: 8px; overflow: hidden;
          padding: 0; cursor: pointer; opacity: 0.35; transition: all 0.3s;
        }
        .hthumb.on { opacity: 1; }
        .hthumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ── SLOGAN SECTION ── */
        .slogan-section {
          max-width: 1240px; margin: 0 auto;
          padding: 80px 28px 24px;
          display: flex; align-items: center; gap: 32px;
        }
        .slogan-line { flex: 1; height: 0.5px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); }
        .slogan-main {
          font-family: 'Syne', sans-serif;
          font-size: clamp(18px, 2.5vw, 28px);
          font-weight: 700; color: #fff;
          letter-spacing: -0.5px; text-align: center;
          white-space: nowrap;
        }
        .slogan-main em { color: #22d3a5; font-style: normal; }

        /* ── STATS ── */
        .stats { max-width: 1240px; margin: 0 auto; padding: 40px 28px 72px; }
        .stats-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          background: linear-gradient(135deg, #0e1420 0%, #0a0f19 100%);
        }
        .stat {
          padding: 32px 20px; text-align: center;
          border-right: 0.5px solid rgba(255,255,255,0.06);
          transition: background 0.3s;
        }
        .stat:last-child { border-right: none; }
        .stat:hover { background: rgba(255,255,255,0.02); }
        .stat-n {
          font-family: 'Syne', sans-serif;
          font-size: 30px; font-weight: 800; letter-spacing: -1px;
          margin-bottom: 4px;
        }
        .stat-l { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; }

        /* ── SERVICES ── */
        .svc { max-width: 1240px; margin: 0 auto; padding: 0 28px 80px; }
        .sec-label {
          font-size: 10px; color: #22d3a5; text-transform: uppercase;
          letter-spacing: 0.16em; font-weight: 700; margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .sec-label::before { content: ''; width: 20px; height: 1px; background: #22d3a5; }
        .sec-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(24px, 3.5vw, 38px); font-weight: 800;
          color: #fff; letter-spacing: -1.5px; margin-bottom: 40px;
          line-height: 1.1;
        }
        .svc-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

        /* Big card + 2 small */
        .svc-grid-inner { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
        .svc-col { display: flex; flex-direction: column; gap: 16px; }

        .svc-card {
          position: relative; border-radius: 20px; overflow: hidden;
          text-decoration: none; display: block;
          border: 0.5px solid rgba(255,255,255,0.06);
        }
        .svc-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
        .svc-card:hover img { transform: scale(1.05); }
        .svc-card::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,11,18,0.95) 0%, rgba(7,11,18,0.1) 55%);
        }
        .svc-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px; z-index: 2; }
        .svc-cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 6px; }
        .svc-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 14px; line-height: 1.2; }
        .svc-link {
          font-size: 12px; font-weight: 600; padding: 6px 14px;
          border-radius: 100px; border: 0.5px solid currentColor;
          display: inline-block; transition: all 0.2s;
        }
        .svc-card:hover .svc-link { padding-left: 18px; }

        /* Boutique banner */
        .boutique-banner {
          margin-top: 16px;
          background: linear-gradient(135deg, #1a1020 0%, #0e0a18 100%);
          border: 0.5px solid rgba(251,146,60,0.15);
          border-radius: 20px; padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          text-decoration: none; transition: all 0.3s;
        }
        .boutique-banner:hover { border-color: rgba(251,146,60,0.35); transform: translateY(-2px); }
        .boutique-banner-left { display: flex; align-items: center; gap: 20px; }
        .boutique-icon { font-size: 40px; }
        .boutique-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 4px; }
        .boutique-sub { font-size: 13px; color: rgba(255,255,255,0.4); }
        .boutique-cta { font-size: 13px; font-weight: 600; color: #fb923c; padding: 10px 22px; border-radius: 100px; border: 0.5px solid rgba(251,146,60,0.3); background: rgba(251,146,60,0.08); white-space: nowrap; transition: all 0.2s; }
        .boutique-banner:hover .boutique-cta { background: rgba(251,146,60,0.15); }

        /* ── PAYMENT ── */
        .pay { max-width: 1240px; margin: 0 auto; padding: 0 28px 80px; }
        .pay-card {
          background: linear-gradient(135deg, #0e1420 0%, #080c14 100%);
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 56px 60px;
          display: flex; align-items: center; gap: 60px;
          position: relative; overflow: hidden;
        }
        .pay-card::before {
          content: ''; position: absolute; top: -60px; right: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,165,0.06) 0%, transparent 70%);
        }
        .pay-text { flex: 1; position: relative; z-index: 1; }
        .pay-title { font-family: 'Syne', sans-serif; font-size: clamp(24px, 3vw, 36px); font-weight: 800; color: #fff; letter-spacing: -1.5px; margin: 12px 0 16px; line-height: 1.1; }
        .pay-desc { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.8; max-width: 380px; margin-bottom: 28px; font-weight: 300; }
        .pay-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pay-chip { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6); padding: 8px 18px; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 100px; }
        .pay-visual {
          width: 160px; height: 160px; flex-shrink: 0;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(34,211,165,0.12), rgba(34,211,165,0.04));
          border: 0.5px solid rgba(34,211,165,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 64px; position: relative; z-index: 1;
          box-shadow: 0 0 60px rgba(34,211,165,0.08);
        }

        /* ── HOW IT WORKS ── */
        .how { max-width: 1240px; margin: 0 auto; padding: 0 28px 80px; }
        .how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 40px; }
        .how-card {
          background: linear-gradient(135deg, #0e1420, #080c14);
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 32px 28px;
          position: relative; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
        }
        .how-card:hover { border-color: rgba(34,211,165,0.2); transform: translateY(-3px); }
        .how-num {
          font-family: 'Syne', sans-serif;
          font-size: 64px; font-weight: 800;
          color: rgba(255,255,255,0.04);
          position: absolute; top: 12px; right: 20px;
          line-height: 1; letter-spacing: -3px;
        }
        .how-icon { font-size: 32px; margin-bottom: 20px; display: block; }
        .how-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 10px; letter-spacing: -0.3px; }
        .how-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.75; font-weight: 300; }

        /* ── CTA ── */
        .cta { max-width: 1240px; margin: 0 auto; padding: 0 28px 80px; }
        .cta-box {
          border-radius: 24px; padding: 80px 60px; text-align: center;
          background: linear-gradient(135deg, #0a1f16 0%, #070b12 40%, #0a1020 100%);
          border: 0.5px solid rgba(34,211,165,0.12);
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 500px; height: 300px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(34,211,165,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-slogan {
          font-size: 11px; color: rgba(34,211,165,0.8); text-transform: uppercase;
          letter-spacing: 0.2em; font-weight: 700; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: center; gap: 12px;
        }
        .cta-slogan::before, .cta-slogan::after { content: ''; width: 32px; height: 0.5px; background: rgba(34,211,165,0.4); }
        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(26px, 4.5vw, 48px); font-weight: 800;
          color: #fff; letter-spacing: -2px; margin-bottom: 16px; line-height: 1.1;
          position: relative; z-index: 1;
        }
        .cta-sub {
          font-size: 15px; color: rgba(255,255,255,0.38); margin-bottom: 40px;
          max-width: 420px; margin-left: auto; margin-right: auto;
          line-height: 1.75; font-weight: 300; position: relative; z-index: 1;
        }
        .cta-btn {
          display: inline-block; padding: 15px 40px;
          background: #22d3a5; color: #070b12;
          border-radius: 100px; font-size: 14px; font-weight: 700;
          text-decoration: none; transition: all 0.25s;
          position: relative; z-index: 1; font-family: 'DM Sans', sans-serif;
        }
        .cta-btn:hover { background: #1ec99c; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(34,211,165,0.25); }

        /* ── FOOTER ── */
        .foot { border-top: 0.5px solid rgba(255,255,255,0.06); max-width: 1240px; margin: 0 auto; }
        .foot-in { padding: 56px 28px 24px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 40px; }
        .foot-brand p { font-size: 13px; color: rgba(255,255,255,0.3); max-width: 240px; line-height: 1.75; margin-top: 12px; font-weight: 300; }
        .foot-slogan { font-size: 11px; color: rgba(34,211,165,0.6); margin-top: 8px; letter-spacing: 0.05em; font-style: italic; }
        .foot-cols { display: flex; gap: 64px; }
        .foot-col-t { font-size: 10px; color: rgba(34,211,165,0.7); text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; margin-bottom: 18px; }
        .foot-col a { display: block; font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; margin-bottom: 12px; transition: color 0.2s; }
        .foot-col a:hover { color: rgba(255,255,255,0.75); }
        .foot-bottom {
          padding: 18px 28px; border-top: 0.5px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; color: rgba(255,255,255,0.2);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .nav-links, .nav-right { display: none; }
          .ham { display: flex; }
          .hero-body { padding: 0 20px 80px; max-width: 100%; }
          .hthumbs { display: none; }
          .hnav { right: 20px; bottom: 24px; }
          .slogan-section { padding: 56px 20px 16px; }
          .slogan-main { font-size: 16px; white-space: normal; text-align: center; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stat:nth-child(2) { border-right: none; }
          .stat:nth-child(3) { border-top: 0.5px solid rgba(255,255,255,0.06); }
          .stat:nth-child(4) { border-top: 0.5px solid rgba(255,255,255,0.06); border-right: none; }
          .svc-grid-inner { grid-template-columns: 1fr; }
          .svc-card:first-child { height: 260px !important; }
          .pay-card { flex-direction: column; padding: 36px 28px; gap: 32px; text-align: center; }
          .pay-chips { justify-content: center; }
          .pay-visual { width: 120px; height: 120px; font-size: 48px; }
          .how-grid { grid-template-columns: 1fr; gap: 14px; }
          .cta-box { padding: 52px 28px; }
          .cta-slogan::before, .cta-slogan::after { display: none; }
          .foot-in { flex-direction: column; gap: 32px; }
          .foot-cols { gap: 36px; }
          .foot-bottom { flex-direction: column; gap: 6px; text-align: center; }
          .boutique-banner { flex-direction: column; text-align: center; }
          .boutique-banner-left { flex-direction: column; gap: 12px; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-body { padding: 0 36px 80px; }
          .hthumbs { left: 36px; }
          .hnav { right: 36px; }
          .svc-grid-inner { grid-template-columns: 1fr; }
          .pay-card { padding: 44px; }
          .how-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ background: '#070b12', minHeight: '100vh' }}>

        {/* ── NAVBAR ── */}
        <header className={`nav${scrolled ? ' solid' : ''}`}>
          <div className="nav-inner">
            <Link href="/" className="logo">
              Zando<span style={{ color: '#22d3a5' }}>CI</span>
              <span className="logo-dot" />
            </Link>
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
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ color: '#070b12', background: '#22d3a5' }}>S&apos;inscrire</Link>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <section className="hero">
          {SLIDES.map((s, i) => (
            <div key={i} className="hslide" style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 2 : 1 }}>
              <img src={s.url} alt={s.title} />
            </div>
          ))}

          {/* Slogan pill */}
          <div className="slogan-bar">
            <div className="slogan-pill">
              <span>Soyez au bon endroit</span>
              <span className="slogan-sep" />
              <span>Soyez <span className="slogan-accent">Zando</span></span>
            </div>
          </div>

          <div className="hero-body" style={{ zIndex: 5 }}>
            <div className="hero-tag" style={{ background: `${slide.color}18`, border: `0.5px solid ${slide.color}35`, color: slide.color }}>
              <span className="hero-tag-dot" style={{ background: slide.color }} />
              {slide.category}
            </div>
            <h1 className="hero-h1" key={`h-${current}`}>
              {slide.title}
              <span className="accent" style={{ color: slide.color }}>{slide.accent}</span>
            </h1>
            <p className="hero-p" key={`p-${current}`}>{slide.sub}</p>
            <div className="hero-btns">
              <Link href={slide.href} className="hbtn-main" style={{ background: slide.color, boxShadow: `0 6px 28px ${slide.color}30` }}>
                Découvrir
              </Link>
              <Link href="/register" className="hbtn-sec">
                Publier une annonce
              </Link>
            </div>
          </div>

          <div className="hnav">
            <div style={{ display: 'flex', gap: 6 }}>
              {SLIDES.map((s, i) => (
                <button key={i} className="hdot" onClick={() => goTo(i)}
                  style={{ width: i === current ? 28 : 8, background: i === current ? s.color : 'rgba(255,255,255,0.25)' }} />
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

        {/* ── SLOGAN ── */}
        <div className="slogan-section">
          <div className="slogan-line" />
          <p className="slogan-main">
            Soyez au bon endroit — Soyez <em>Zando</em>
          </p>
          <div className="slogan-line" />
        </div>

        {/* ── STATS ── */}
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

        {/* ── SERVICES ── */}
        <section className="svc">
          <div className="sec-label">Nos services</div>
          <h2 className="sec-title">Tout ce dont vous<br />avez besoin</h2>

          <div className="svc-grid-inner">
            {/* Grande carte résidence */}
            <Link href="/residences" className="svc-card" style={{ height: 480 }}>
              <img src={SLIDES[0].url} alt="Résidences" />
              <div className="svc-info">
                <div className="svc-cat" style={{ color: '#22d3a5' }}>Résidences</div>
                <div className="svc-name">Villas, appartements<br />& studios</div>
                <span className="svc-link" style={{ color: '#22d3a5' }}>Explorer →</span>
              </div>
            </Link>

            {/* Colonne droite */}
            <div className="svc-col">
              <Link href="/vehicles" className="svc-card" style={{ height: 232 }}>
                <img src={SLIDES[1].url} alt="Véhicules" />
                <div className="svc-info">
                  <div className="svc-cat" style={{ color: '#60a5fa' }}>Véhicules</div>
                  <div className="svc-name">SUV, berlines & 4x4</div>
                  <span className="svc-link" style={{ color: '#60a5fa' }}>Explorer →</span>
                </div>
              </Link>
              <Link href="/events" className="svc-card" style={{ height: 232 }}>
                <img src={SLIDES[2].url} alt="Événements" />
                <div className="svc-info">
                  <div className="svc-cat" style={{ color: '#c084fc' }}>Événements</div>
                  <div className="svc-name">Concerts & festivals</div>
                  <span className="svc-link" style={{ color: '#c084fc' }}>Explorer →</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Boutique banner */}
          <Link href="/boutique" className="boutique-banner">
            <div className="boutique-banner-left">
              <span className="boutique-icon">🛍️</span>
              <div>
                <div className="boutique-title">Boutique Zando CI</div>
                <div className="boutique-sub">Produits & services de vendeurs ivoiriens · Mode, électronique, beauté…</div>
              </div>
            </div>
            <span className="boutique-cta">Découvrir la boutique →</span>
          </Link>
        </section>

        {/* ── COMMENT ÇA MARCHE ── */}
        <section className="how">
          <div className="sec-label">Simple & rapide</div>
          <h2 className="sec-title">Comment ça marche ?</h2>
          <div className="how-grid">
            {[
              { n: '01', icon: '🔍', title: 'Cherchez', desc: "Parcourez résidences, véhicules, événements et produits disponibles en Côte d'Ivoire." },
              { n: '02', icon: '📅', title: 'Réservez', desc: "Choisissez vos dates, quantités ou billets et confirmez en quelques secondes." },
              { n: '03', icon: '📱', title: 'Payez Mobile Money', desc: "Orange Money, MTN, Wave ou Moov — payez depuis votre téléphone, sans carte bancaire." },
            ].map(h => (
              <div key={h.n} className="how-card">
                <span className="how-num">{h.n}</span>
                <span className="how-icon">{h.icon}</span>
                <div className="how-title">{h.title}</div>
                <p className="how-desc">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PAIEMENT ── */}
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
            <div className="pay-visual">📱</div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta">
          <div className="cta-box">
            <div className="cta-slogan">Soyez au bon endroit — Soyez Zando</div>
            <h2 className="cta-title">Vous avez un bien à louer&nbsp;?</h2>
            <p className="cta-sub">Publiez gratuitement et recevez vos paiements directement sur votre Mobile Money.</p>
            <Link href="/register" className="cta-btn">Commencer gratuitement</Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="foot">
          <div className="foot-in">
            <div className="foot-brand">
              <Link href="/" className="logo" style={{ display: 'inline-block' }}>
                Zando<span style={{ color: '#22d3a5' }}>CI</span>
                <span className="logo-dot" />
              </Link>
              <p>La plateforme de location multi-services en Côte d&apos;Ivoire.</p>
              <p className="foot-slogan">Soyez au bon endroit — Soyez Zando</p>
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
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} ZandoCI — Abidjan, Côte d&apos;Ivoire</span>
            <span>Soyez au bon endroit — Soyez Zando</span>
          </div>
        </footer>

      </div>
    </>
  )
}