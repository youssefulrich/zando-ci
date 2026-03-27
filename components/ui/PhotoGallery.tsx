'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  photos: string[]
  title: string
  accent?: string
}

export default function PhotoGallery({ photos, title, accent = '#22d3a5' }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const open = (i: number) => { setCurrentIndex(i); setLightboxOpen(true) }
  const close = () => setLightboxOpen(false)
  const prev = useCallback(() => setCurrentIndex(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setCurrentIndex(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, prev, next])

  if (!photos.length) return null

  const mainPhoto = photos[0]
  const extraPhotos = photos.slice(1, 5)
  const remaining = photos.length - 5

  return (
    <>
      <style>{`
        .pg-grid {
          display: grid;
          gap: 4px;
          height: 480px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
        }
        .pg-grid-1 { grid-template-columns: 1fr; }
        .pg-grid-2 { grid-template-columns: 2fr 1fr; }
        .pg-grid-3 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; }
        .pg-grid-4 { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; }
        .pg-grid-5 { grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .pg-main { grid-row: 1 / -1; }
        .pg-thumb { position: relative; overflow: hidden; }
        .pg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
        .pg-thumb:hover img { transform: scale(1.05); }
        .pg-overlay { position: absolute; inset: 0; background: rgba(10,15,26,0); transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
        .pg-thumb:hover .pg-overlay { background: rgba(10,15,26,0.2); }
        .pg-more { position: absolute; inset: 0; background: rgba(10,15,26,0.65); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .pg-btn-all {
          position: absolute; bottom: 16px; right: 16px; z-index: 10;
          background: rgba(10,15,26,0.85); backdrop-filter: blur(8px);
          border: 0.5px solid rgba(255,255,255,0.2); color: #fff;
          padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: background 0.2s;
        }
        .pg-btn-all:hover { background: rgba(10,15,26,0.95); }

        /* Lightbox */
        .lb-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(5, 8, 16, 0.97);
          display: flex; flex-direction: column;
          animation: lb-in 0.2s ease;
        }
        @keyframes lb-in { from { opacity: 0 } to { opacity: 1 } }
        .lb-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; flex-shrink: 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
        }
        .lb-main {
          flex: 1; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; padding: 16px 80px;
          min-height: 0;
        }
        .lb-img {
          max-width: 100%; max-height: 100%;
          object-fit: contain; border-radius: 8px;
          animation: lb-slide 0.2s ease;
          user-select: none;
        }
        @keyframes lb-slide { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
        .lb-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 0.5px solid rgba(255,255,255,0.15);
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; z-index: 10;
          backdrop-filter: blur(8px);
        }
        .lb-arrow:hover { background: rgba(255,255,255,0.16); }
        .lb-arrow-prev { left: 16px; }
        .lb-arrow-next { right: 16px; }
        .lb-thumbs {
          display: flex; gap: 8px; padding: 12px 24px;
          overflow-x: auto; flex-shrink: 0;
          scrollbar-width: none; border-top: 0.5px solid rgba(255,255,255,0.08);
        }
        .lb-thumbs::-webkit-scrollbar { display: none; }
        .lb-thumb-item {
          width: 64px; height: 44px; border-radius: 6px; overflow: hidden;
          flex-shrink: 0; cursor: pointer; transition: all 0.15s;
          border: 2px solid transparent;
        }
        .lb-thumb-item.active { border-color: var(--accent); }
        .lb-thumb-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .lb-close {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(255,255,255,0.08); border: 0.5px solid rgba(255,255,255,0.12);
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .lb-close:hover { background: rgba(248,113,113,0.2); color: #f87171; }

        @media (max-width: 767px) {
          .pg-grid { height: 260px; }
          .pg-grid-3, .pg-grid-4, .pg-grid-5 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
          .pg-main { grid-column: 1 / -1; grid-row: 1; }
          .lb-main { padding: 12px 56px; }
          .lb-arrow { width: 40px; height: 40px; font-size: 16px; }
          .lb-arrow-prev { left: 8px; }
          .lb-arrow-next { right: 8px; }
          .lb-thumb-item { width: 52px; height: 36px; }
        }
      `}</style>

      {/* GRILLE */}
      <div style={{ position: 'relative' }}>
        <div className={`pg-grid pg-grid-${Math.min(photos.length, 5)}`}>

          {/* Photo principale */}
          <div className="pg-thumb pg-main" onClick={() => open(0)}>
            <img src={mainPhoto} alt={title} />
            <div className="pg-overlay" />
          </div>

          {/* Photos secondaires */}
          {extraPhotos.map((p, i) => {
            const isLast = i === extraPhotos.length - 1 && remaining > 0
            return (
              <div key={i} className="pg-thumb" onClick={() => open(i + 1)}>
                <img src={p} alt={`${title} ${i + 2}`} />
                {isLast ? (
                  <div className="pg-more">
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>+{remaining + 1}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>photos</span>
                  </div>
                ) : (
                  <div className="pg-overlay" />
                )}
              </div>
            )
          })}
        </div>

        {/* Bouton "Voir toutes les photos" */}
        {photos.length > 1 && (
          <button className="pg-btn-all" onClick={() => open(0)}>
            <span>⊞</span>
            Voir les {photos.length} photos
          </button>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="lb-backdrop" onClick={e => { if (e.target === e.currentTarget) close() }}>

          {/* Header */}
          <div className="lb-header">
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{title}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{currentIndex + 1} / {photos.length}</p>
            </div>
            <button className="lb-close" onClick={close}>✕</button>
          </div>

          {/* Image principale */}
          <div className="lb-main">
            <button className="lb-arrow lb-arrow-prev" onClick={prev}>‹</button>
            <img
              key={currentIndex}
              className="lb-img"
              src={photos[currentIndex]}
              alt={`${title} ${currentIndex + 1}`}
            />
            <button className="lb-arrow lb-arrow-next" onClick={next}>›</button>
          </div>

          {/* Miniatures */}
          <div className="lb-thumbs">
            {photos.map((p, i) => (
              <div
                key={i}
                className={`lb-thumb-item ${i === currentIndex ? 'active' : ''}`}
                style={{ '--accent': accent } as any}
                onClick={() => setCurrentIndex(i)}
              >
                <img src={p} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}