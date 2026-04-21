'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

export default function ProduitDetailPage({ params }: { params: { id: string } }) {
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

    supabase.from('products').select('*, shops(*)').eq('id', params.id).single()
      .then(({ data }) => {
        if (data) {
          setProduct(data)
          setShop((data as any).shops)
          // Incrémenter les vues
          supabase.from('products').update({ views: ((data as any).views ?? 0) + 1 }).eq('id', params.id)
        }
        setLoading(false)
      })
  }, [params.id])

  function formatPhone(phone: string): string {
    let p = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '')
    if (p.startsWith('+')) p = p.slice(1)
    if (p.startsWith('0')) p = '225' + p
    else if (!p.startsWith('225')) p = '225' + p
    return p
  }

  async function handleOrder() {
    if (!user) { router.push('/login'); return }
    if (!product) return

    setOrderLoading(true)
    const supabase = createClient()

    const total = product.price * quantity
    const deliveryTotal = product.delivery_available ? (product.delivery_price ?? 0) : 0
    const grandTotal = total + deliveryTotal

    // Créer la commande
    const ref = 'ZDO-' + Math.random().toString(36).slice(2, 10).toUpperCase()

    const { data: order, error } = await supabase.from('orders').insert({
      reference: ref,
      product_id: product.id,
      shop_id: product.shop_id,
      buyer_id: user.id,
      seller_id: product.owner_id,
      quantity,
      unit_price: product.price,
      total_price: grandTotal,
      commission_amount: Math.round(grandTotal * 0),
      seller_amount: grandTotal,
      buyer_name: profile?.full_name ?? '',
      buyer_phone: profile?.phone ?? '',
      status: 'pending',
    }).select().single()

    if (error || !order) {
      setOrderLoading(false)
      return
    }

    // Notification vendeur
    await supabase.from('notifications').insert({
      user_id: product.owner_id,
      title: '🛍️ Nouvelle commande !',
      message: `${profile?.full_name ?? 'Un client'} veut commander "${product.name}" (x${quantity})`,
      type: 'success',
      link: `/dashboard/vendeur/commandes/${order.id}`,
    })

    // Rediriger vers confirmation avec WhatsApp
    const wp = shop?.whatsapp || shop?.phone || ''
    const msg = encodeURIComponent(
      `Bonjour, je viens de passer une commande sur Zando CI pour "${product.name}" x${quantity}.\n` +
      `Référence : ${ref}\nMontant : ${formatPrice(grandTotal)}\n` +
      `Mon nom : ${profile?.full_name ?? ''} — ${profile?.phone ?? ''}`
    )
    const waUrl = wp ? `https://wa.me/${formatPhone(wp)}?text=${msg}` : ''

    router.push(`/boutique/commande-confirmee?ref=${ref}&wa=${encodeURIComponent(waUrl)}&shop=${encodeURIComponent(shop?.name ?? '')}`)
  }

  if (loading) return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Chargement...</p>
    </div>
  )

  if (!product) return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Produit introuvable</p>
    </div>
  )

  const photos = product.photos?.length > 0 ? product.photos : (product.main_photo ? [product.main_photo] : [])
  const isService = product.type === 'service'
  const isOutOfStock = !isService && product.stock !== null && product.stock <= 0

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pd { background: #0a0f1a; min-height: 100vh; }
        .pd-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px 80px; }
        .pd-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        .pd-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; }
        .pd-thumb { width: 60px; height: 60px; border-radius: 8px; overflow: hidden; cursor: pointer; flex-shrink: 0; border: 2px solid transparent; }
        .pd-thumb.active { border-color: #22d3a5; }
        @media (min-width: 768px) { .pd-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="pd">
        <Navbar />
        <div className="pd-wrap">

          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Boutique</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>→</span>
            {shop && <Link href={`/boutique/${product.shop_id}`} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{shop.name}</Link>}
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>→</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{product.name}</span>
          </div>

          <div className="pd-grid">

            {/* Photos */}
            <div>
              <div style={{ borderRadius: 16, overflow: 'hidden', background: '#111827', aspectRatio: '1' }}>
                {photos.length > 0 ? (
                  <img src={photos[selectedPhoto]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: 'rgba(255,255,255,0.1)' }}>📦</div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="pd-thumbs">
                  {photos.map((p: string, i: number) => (
                    <div key={i} className={`pd-thumb${i === selectedPhoto ? ' active' : ''}`} onClick={() => setSelectedPhoto(i)}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Infos */}
            <div>
              {/* Boutique */}
              {shop && (
                <Link href={`/boutique/${product.shop_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, textDecoration: 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                    {shop.logo_url ? <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏪</div>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{shop.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{shop.city}</p>
                  </div>
                </Link>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isService ? 'rgba(167,139,250,0.15)' : 'rgba(34,211,165,0.1)', color: isService ? '#a78bfa' : '#22d3a5' }}>
                  {isService ? '⚙️ SERVICE' : '📦 PRODUIT'}
                </span>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  {product.category}
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}>{product.name}</h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#22d3a5' }}>{formatPrice(product.price)}</span>
                {product.compare_price && product.compare_price > product.price && (
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>{formatPrice(product.compare_price)}</span>
                )}
                {!isService && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/ {product.unit ?? 'pièce'}</span>}
              </div>

              {product.description && (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>{product.description}</p>
              )}

              {/* Livraison */}
              {!isService && (
                <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {product.delivery_available && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🚚</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Livraison disponible</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            {product.delivery_price > 0 ? `+${formatPrice(product.delivery_price)}` : 'Gratuite'}
                          </p>
                        </div>
                      </div>
                    )}
                    {product.pickup_available && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>📍</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Retrait possible</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{product.city}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {product.delivery_info && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                      {product.delivery_info}
                    </p>
                  )}
                </div>
              )}

              {/* Stock */}
              {!isService && product.stock !== null && (
                <p style={{ fontSize: 12, color: product.stock > 0 ? '#22d3a5' : '#f87171', marginBottom: 16 }}>
                  {product.stock > 0 ? `✓ ${product.stock} en stock` : '✕ Rupture de stock'}
                </p>
              )}

              {/* Quantité */}
              {!isService && !isOutOfStock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Quantité</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#111827', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>−</button>
                    <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>{quantity}</span>
                    <button onClick={() => setQuantity(q => product.stock ? Math.min(product.stock, q + 1) : q + 1)} style={{ width: 36, height: 36, background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#22d3a5' }}>{formatPrice(product.price * quantity)}</span>
                </div>
              )}

              {/* Boutons */}
              {isOutOfStock ? (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Produit indisponible</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={handleOrder} disabled={orderLoading} style={{
                    width: '100%', padding: '15px', background: orderLoading ? 'rgba(34,211,165,0.4)' : '#22d3a5',
                    color: '#0a1a14', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800,
                    cursor: orderLoading ? 'not-allowed' : 'pointer',
                  }}>
                    {orderLoading ? 'Traitement...' : isService ? 'Contacter le prestataire' : `Commander — ${formatPrice(product.price * quantity)}`}
                  </button>

                  {(shop?.whatsapp || shop?.phone) && (
                    <a
                      href={`https://wa.me/${formatPhone(shop.whatsapp || shop.phone)}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${product.name}" sur Zando CI. Pouvez-vous me donner plus d'informations ?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '14px', background: 'rgba(37,211,102,0.1)', border: '0.5px solid rgba(37,211,102,0.25)',
                        borderRadius: 12, color: '#25D366', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Poser une question
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}