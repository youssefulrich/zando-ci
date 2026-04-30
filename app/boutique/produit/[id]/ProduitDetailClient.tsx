'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

export default function ProduitDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [orderLoading, setOrderLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
    ;(supabase as any).from('products').select('*, shops(*)').eq('id', id).single()
      .then(({ data }: any) => {
        if (data) {
          setProduct(data)
          setShop(data.shops)
          supabase.from('products').update({ views: (data.views ?? 0) + 1 }).eq('id', id)
        }
        setLoading(false)
      })
  }, [id])

  function formatPhone(phone: string): string {
    let p = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '')
    if (p.startsWith('+')) p = p.slice(1)
    if (p.startsWith('225')) return p
    return '225' + p
  }

  async function handleOrder() {
    if (!user) { router.push('/login'); return }
    if (!product) return
    setOrderLoading(true)
    const supabase = createClient()
    const total = product.price * quantity
    const deliveryTotal = product.delivery_available ? (product.delivery_price ?? 0) : 0
    const grandTotal = total + deliveryTotal
    const commission = Math.round(grandTotal * 0.10)
    const sellerAmount = grandTotal - commission
    const ref = 'ZDO-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    const { data: order, error } = await (supabase as any).from('orders').insert({
      reference: ref, product_id: product.id, shop_id: product.shop_id,
      buyer_id: user.id, seller_id: product.owner_id, quantity,
      unit_price: product.price, total_price: grandTotal,
      commission_amount: commission, seller_amount: sellerAmount,
      buyer_name: profile?.full_name ?? '', buyer_phone: profile?.phone ?? '',
      delivery_price: deliveryTotal, status: 'pending',
    }).select().single()
    if (error || !order) { setOrderLoading(false); return }
    await (supabase as any).from('notifications').insert({
      user_id: product.owner_id, title: '🛍️ Nouvelle commande !',
      message: `${profile?.full_name ?? 'Un client'} veut commander "${product.name}" (x${quantity})`,
      type: 'success',
    })
    const wp = shop?.whatsapp || shop?.phone || ''
    const msg = encodeURIComponent(
      `Bonjour, je viens de passer une commande sur Zando CI pour "${product.name}" x${quantity}.\n` +
      `Référence : ${ref}\nMontant : ${formatPrice(grandTotal)}\n` +
      `Mon nom : ${profile?.full_name ?? ''} — ${profile?.phone ?? ''}`
    )
    const waUrl = wp ? `https://wa.me/${formatPhone(wp)}?text=${msg}` : ''
    router.push(`/boutique/commande-confirmee?ref=${ref}&wa=${encodeURIComponent(waUrl)}&shop=${encodeURIComponent(shop?.name ?? '')}`)
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#0E0E12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div>
        <p style={{ color: '#555', fontSize: 14 }}>Chargement du produit…</p>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ background: '#0E0E12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
        <p style={{ color: '#888', fontSize: 15, marginBottom: 20 }}>Produit introuvable</p>
        <Link href="/boutique" style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Retour à la boutique
        </Link>
      </div>
    </div>
  )

  const photos    = product.photos?.length > 0 ? product.photos : (product.main_photo ? [product.main_photo] : [])
  const isService = product.type === 'service'
  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discount  = hasDiscount ? Math.round((1 - product.price / product.compare_price) * 100) : 0
  const grandTotal = product.price * quantity + (product.delivery_available ? (product.delivery_price ?? 0) : 0)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:     #0E0E12;
          --bg2:    #16161C;
          --bg3:    #1E1E26;
          --card:   #1A1A22;
          --border: rgba(255,255,255,0.07);
          --orange: #FF6B00;
          --text:   #F0F0F0;
          --muted:  #888;
          --muted2: #444;
        }

        .pd { background: var(--bg); min-height: 100vh; color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; }

        /* ── TOP BAR ── */
        .pd-topbar {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 0 16px; display: flex; align-items: center; gap: 10px;
          height: 54px; position: sticky; top: 0; z-index: 100;
        }
        .pd-logo { font-size: 22px; font-weight: 900; color: var(--orange); letter-spacing: -1px; flex-shrink: 0; text-decoration: none; }
        .pd-logo span { color: rgba(255,255,255,0.35); }
        .pd-back { font-size: 13px; color: var(--muted); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
        .pd-back:hover { color: var(--text); }

        /* ── BREADCRUMB ── */
        .pd-breadcrumb {
          padding: 14px 16px; display: flex; align-items: center; gap: 6px;
          overflow-x: auto; scrollbar-width: none; white-space: nowrap;
          border-bottom: 1px solid var(--border);
        }
        .pd-breadcrumb::-webkit-scrollbar { display: none; }
        .pd-bc-link { font-size: 12px; color: var(--muted); text-decoration: none; }
        .pd-bc-link:hover { color: var(--orange); }
        .pd-bc-sep { font-size: 12px; color: var(--muted2); }
        .pd-bc-cur { font-size: 12px; color: var(--text); overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

        /* ── MAIN LAYOUT ── */
        .pd-wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 120px; }
        .pd-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
        @media (min-width: 768px) { .pd-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }
        @media (min-width: 1024px) { .pd-grid { grid-template-columns: 55% 1fr; } }

        /* ── GALERIE ── */
        .pd-gallery {}
        .pd-main-img {
          border-radius: 16px; overflow: hidden; background: var(--bg3);
          aspect-ratio: 1; position: relative;
        }
        .pd-main-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pd-main-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 72px; }
        .pd-discount-badge {
          position: absolute; top: 12px; left: 12px;
          background: #FF3B30; color: #fff; font-size: 13px; font-weight: 800;
          padding: 4px 12px; border-radius: 20px;
        }
        .pd-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
        .pd-thumbs::-webkit-scrollbar { display: none; }
        .pd-thumb {
          width: 64px; height: 64px; border-radius: 10px; overflow: hidden;
          cursor: pointer; flex-shrink: 0; border: 2px solid transparent;
          background: var(--bg3); transition: border-color 0.15s;
        }
        .pd-thumb.active { border-color: var(--orange); }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* ── INFOS PRODUIT ── */
        .pd-info {}

        /* Lien boutique */
        .pd-shop-link {
          display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
          text-decoration: none; padding: 10px 14px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; transition: border-color 0.15s;
        }
        .pd-shop-link:hover { border-color: rgba(255,107,0,0.35); }
        .pd-shop-avatar {
          width: 38px; height: 38px; border-radius: 10px; overflow: hidden;
          background: rgba(255,107,0,0.12); border: 1px solid rgba(255,107,0,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .pd-shop-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pd-shop-name { font-size: 13px; font-weight: 700; color: var(--text); }
        .pd-shop-city { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .pd-shop-arrow { margin-left: auto; font-size: 14px; color: var(--orange); }

        /* Badges type/catégorie */
        .pd-badges { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
        .pd-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .pd-badge-product { background: rgba(255,107,0,0.12); color: var(--orange); }
        .pd-badge-service { background: rgba(167,139,250,0.15); color: #a78bfa; }
        .pd-badge-cat     { background: rgba(255,255,255,0.05); color: var(--muted); text-transform: capitalize; }

        /* Nom */
        .pd-name { font-size: 22px; font-weight: 900; color: var(--text); letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 12px; }

        /* Prix */
        .pd-price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .pd-price { font-size: 30px; font-weight: 900; color: var(--orange); }
        .pd-price-old { font-size: 16px; color: var(--muted2); text-decoration: line-through; }
        .pd-price-unit { font-size: 13px; color: var(--muted); }

        /* Description */
        .pd-desc { font-size: 14px; color: var(--muted); line-height: 1.75; margin-bottom: 20px; }

        /* Infos livraison */
        .pd-delivery-card {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;
          display: flex; flex-wrap: wrap; gap: 16px;
        }
        .pd-delivery-item { display: flex; align-items: center; gap: 8px; }
        .pd-delivery-ico  { font-size: 18px; }
        .pd-delivery-label { font-size: 12px; font-weight: 600; color: var(--text); }
        .pd-delivery-sub   { font-size: 11px; color: var(--muted); margin-top: 1px; }

        /* Stock */
        .pd-stock { font-size: 13px; margin-bottom: 18px; font-weight: 600; }
        .pd-stock.ok  { color: #22C55E; }
        .pd-stock.low { color: #F59E0B; }

        /* Quantité */
        .pd-qty-row { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
        .pd-qty-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .pd-qty-ctrl {
          display: flex; align-items: center;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 10px; overflow: hidden;
        }
        .pd-qty-btn {
          width: 38px; height: 38px; background: none; border: none;
          color: var(--text); font-size: 20px; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: background 0.15s;
        }
        .pd-qty-btn:hover { background: rgba(255,107,0,0.1); color: var(--orange); }
        .pd-qty-val { width: 40px; text-align: center; font-size: 15px; font-weight: 700; color: var(--text); }
        .pd-qty-total { font-size: 16px; font-weight: 900; color: var(--orange); }

        /* CTA buttons */
        .pd-ctas { display: flex; flex-direction: column; gap: 10px; }
        .pd-btn-order {
          width: 100%; padding: 16px; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 800; cursor: pointer;
          background: var(--orange); color: #fff;
          transition: background 0.2s, opacity 0.2s;
        }
        .pd-btn-order:disabled { opacity: 0.5; cursor: not-allowed; }
        .pd-btn-order:not(:disabled):hover { background: #E85F00; }
        .pd-btn-wa {
          width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(37,211,102,0.3);
          background: rgba(37,211,102,0.08); color: #25D366;
          font-size: 14px; font-weight: 700; text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s;
        }
        .pd-btn-wa:hover { background: rgba(37,211,102,0.15); }

        /* ── BOTTOM NAV ── */
        .pd-bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg2); border-top: 1px solid var(--border);
          padding: 10px 16px; display: flex; gap: 10px; align-items: center;
          z-index: 50;
        }
        .pd-bottom-price { font-size: 18px; font-weight: 900; color: var(--orange); flex: 1; }
        .pd-bottom-price small { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }
        .pd-bottom-order {
          padding: 13px 28px; background: var(--orange); color: #fff;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 800;
          cursor: pointer; transition: background 0.2s;
        }
        .pd-bottom-order:disabled { opacity: 0.5; cursor: not-allowed; }
        .pd-bottom-order:not(:disabled):hover { background: #E85F00; }
        .pd-bottom-wa {
          width: 46px; height: 46px; border-radius: 10px; border: 1px solid rgba(37,211,102,0.3);
          background: rgba(37,211,102,0.08); color: #25D366;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; text-decoration: none; flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .pd-topbar  { padding: 0 28px; }
          .pd-breadcrumb { padding: 14px 28px; }
          .pd-wrap    { padding: 32px 28px 80px; }
          .pd-bottom-bar { display: none; }
        }
      `}</style>

      <div className="pd">
        <Navbar />

        {/* ── TOP BAR ── */}
        <div className="pd-topbar">
          <Link href="/" className="pd-logo">zando<span>.ci</span></Link>
          <Link href="/boutique" className="pd-back">← Boutique</Link>
        </div>

        {/* ── BREADCRUMB ── */}
        <div className="pd-breadcrumb">
          <Link href="/boutique" className="pd-bc-link">Boutique</Link>
          <span className="pd-bc-sep">›</span>
          {shop && (
            <>
              <Link href={`/shops/${product.shop_id}`} className="pd-bc-link">{shop.name}</Link>
              <span className="pd-bc-sep">›</span>
            </>
          )}
          <span className="pd-bc-cur">{product.name}</span>
        </div>

        <div className="pd-wrap">
          <div className="pd-grid">

            {/* ── GALERIE ── */}
            <div className="pd-gallery">
              <div className="pd-main-img">
                {photos.length > 0
                  ? <img src={photos[selectedPhoto]} alt={product.name} />
                  : <div className="pd-main-img-ph">📦</div>
                }
                {hasDiscount && <div className="pd-discount-badge">-{discount}%</div>}
              </div>
              {photos.length > 1 && (
                <div className="pd-thumbs">
                  {photos.map((p: string, i: number) => (
                    <div
                      key={i}
                      className={`pd-thumb${i === selectedPhoto ? ' active' : ''}`}
                      onClick={() => setSelectedPhoto(i)}
                    >
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── INFOS ── */}
            <div className="pd-info">

              {/* Boutique */}
              {shop && (
                <Link href={`/shops/${product.shop_id}`} className="pd-shop-link">
                  <div className="pd-shop-avatar">
                    {shop.logo_url
                      ? <img src={shop.logo_url} alt="" />
                      : '🏪'
                    }
                  </div>
                  <div>
                    <div className="pd-shop-name">{shop.name}</div>
                    <div className="pd-shop-city">📍 {shop.city}</div>
                  </div>
                  <span className="pd-shop-arrow">›</span>
                </Link>
              )}

              {/* Badges */}
              <div className="pd-badges">
                <span className={`pd-badge ${isService ? 'pd-badge-service' : 'pd-badge-product'}`}>
                  {isService ? '⚙️ SERVICE' : '📦 PRODUIT'}
                </span>
                <span className="pd-badge pd-badge-cat">{product.category}</span>
              </div>

              {/* Nom */}
              <h1 className="pd-name">{product.name}</h1>

              {/* Prix */}
              <div className="pd-price-row">
                <span className="pd-price">{formatPrice(product.price)}</span>
                {hasDiscount && <span className="pd-price-old">{formatPrice(product.compare_price)}</span>}
                {!isService && <span className="pd-price-unit">/ {product.unit ?? 'pièce'}</span>}
              </div>

              {/* Description */}
              {product.description && (
                <p className="pd-desc">{product.description}</p>
              )}

              {/* Livraison / Retrait */}
              {!isService && (product.delivery_available || product.pickup_available) && (
                <div className="pd-delivery-card">
                  {product.delivery_available && (
                    <div className="pd-delivery-item">
                      <span className="pd-delivery-ico">🚚</span>
                      <div>
                        <div className="pd-delivery-label">Livraison disponible</div>
                        <div className="pd-delivery-sub">
                          {product.delivery_price > 0 ? `+${formatPrice(product.delivery_price)}` : 'Gratuite'}
                        </div>
                      </div>
                    </div>
                  )}
                  {product.pickup_available && (
                    <div className="pd-delivery-item">
                      <span className="pd-delivery-ico">📍</span>
                      <div>
                        <div className="pd-delivery-label">Retrait possible</div>
                        <div className="pd-delivery-sub">{product.city}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock */}
              {!isService && product.stock !== null && (
                <p className={`pd-stock ${product.stock > 0 ? 'ok' : 'low'}`}>
                  {product.stock > 0 ? `✓ ${product.stock} en stock` : '📦 Sur commande'}
                </p>
              )}

              {/* Quantité */}
              {!isService && (
                <div className="pd-qty-row">
                  <span className="pd-qty-label">Qté</span>
                  <div className="pd-qty-ctrl">
                    <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span className="pd-qty-val">{quantity}</span>
                    <button className="pd-qty-btn" onClick={() => setQuantity(q => product.stock > 0 ? Math.min(product.stock, q + 1) : q + 1)}>+</button>
                  </div>
                  <span className="pd-qty-total">{formatPrice(product.price * quantity)}</span>
                </div>
              )}

              {/* CTAs — desktop */}
              <div className="pd-ctas">
                <button
                  onClick={handleOrder}
                  disabled={orderLoading}
                  className="pd-btn-order"
                >
                  {orderLoading
                    ? 'Traitement…'
                    : isService
                      ? 'Contacter le prestataire'
                      : `Commander — ${formatPrice(grandTotal)}`
                  }
                </button>

                {(shop?.whatsapp || shop?.phone) && (
                  <a
                    href={`https://wa.me/${formatPhone(shop.whatsapp || shop.phone)}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${product.name}" sur Zando CI.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pd-btn-wa"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Poser une question
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR MOBILE (sticky) ── */}
        <div className="pd-bottom-bar">
          <div className="pd-bottom-price">
            {formatPrice(grandTotal)}
            {!isService && <small>pour {quantity} {quantity > 1 ? 'pièces' : 'pièce'}</small>}
          </div>
          {(shop?.whatsapp || shop?.phone) && (
            <a
              href={`https://wa.me/${formatPhone(shop.whatsapp || shop.phone)}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${product.name}" sur Zando CI.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-bottom-wa"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
          <button
            onClick={handleOrder}
            disabled={orderLoading}
            className="pd-bottom-order"
          >
            {orderLoading ? '…' : isService ? 'Contacter' : 'Commander'}
          </button>
        </div>
      </div>
    </>
  )
}