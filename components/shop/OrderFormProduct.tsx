'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

type Product = {
  id: string
  name: string
  price: number
  type: string
  delivery_available: boolean
  delivery_price: number
  pickup_available: boolean
  shop_id: string
  owner_id: string
  stock: number
  city: string
  shop_phone?: string
  shop_whatsapp?: string
  shop_name?: string
}

const CITIES_CI = [
  'Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro',
  'Korhogo', 'Man', 'Gagnoa', 'Abengourou', 'Divo',
  'Soubré', 'Bondoukou', 'Agboville', 'Dimbokro', 'Odienné',
]

export default function OrderFormProduct({ product, isLoggedIn }: { product: Product; isLoggedIn: boolean }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>(
    product.delivery_available ? 'delivery' : 'pickup'
  )
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const COMMISSION = 0.10
  const subTotal = product.price * quantity
  const deliveryCost = deliveryType === 'delivery' ? (product.delivery_price ?? 0) : 0
  const total = subTotal + deliveryCost
  const commission = Math.round(total * COMMISSION)
  const sellerAmount = total - commission

  async function handleOrder() {
    setError('')
    if (!isLoggedIn) { router.push('/login'); return }
    if (deliveryType === 'delivery' && !deliveryCity) { setError('Choisissez votre ville de livraison'); return }
    if (deliveryType === 'delivery' && !deliveryAddress) { setError('Entrez votre adresse de livraison'); return }
    if (product.type === 'physical' && product.stock > 0 && quantity > product.stock) {
      setError(`Stock insuffisant (${product.stock} disponibles)`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()

    const reference = `ZND-SHOP-${Date.now()}`

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        reference,
        product_id: product.id,
        shop_id: product.shop_id,
        buyer_id: user.id,
        seller_id: product.owner_id,
        quantity,
        unit_price: product.price,
        total_price: total,
        commission_amount: commission,
        seller_amount: sellerAmount,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        delivery_city: deliveryType === 'delivery' ? deliveryCity : product.city,
        delivery_price: deliveryCost,
        buyer_name: (profile as any)?.full_name ?? '',
        buyer_phone: (profile as any)?.phone ?? '',
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      setError('Erreur lors de la commande')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const inp = {
    width: '100%' as const,
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    colorScheme: 'dark' as const,
  }

  if (success) {
    const wa = product.shop_whatsapp ?? product.shop_phone
    const waMsg = encodeURIComponent(`Bonjour ! Je viens de passer une commande sur ZandoCI.\n\nProduit: ${product.name}\nQté: ${quantity}\nTotal: ${formatPrice(total)}\nRef: ZND-SHOP-...`)
    return (
      <div style={{ background: 'rgba(34,211,165,0.06)', border: '0.5px solid rgba(34,211,165,0.25)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#22d3a5', marginBottom: 8 }}>Commande enregistrée !</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
          Votre commande a été transmise à <strong style={{ color: '#fff' }}>{product.shop_name}</strong>.<br />
          Contactez le vendeur pour finaliser le paiement.
        </p>
        {wa && (
          <a
            href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}?text=${waMsg}`}
            target="_blank"
            style={{ display: 'block', padding: '13px', background: '#25d366', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 10 }}
          >
            💬 Contacter sur WhatsApp
          </a>
        )}
        {product.shop_phone && (
          <a
            href={`tel:${product.shop_phone}`}
            style={{ display: 'block', padding: '13px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            📞 Appeler le vendeur
          </a>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(251,146,60,0.2)', borderRadius: 20, padding: 22 }}>

      {/* Quantité */}
      {product.type === 'physical' && (
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quantité</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', minWidth: 24, textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(q => product.stock > 0 ? Math.min(product.stock, q + 1) : q + 1)} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer' }}>+</button>
            {product.stock > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{product.stock} en stock</span>}
          </div>
        </div>
      )}

      {/* Mode livraison */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mode de réception</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {product.delivery_available && (
            <button
              onClick={() => setDeliveryType('delivery')}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `0.5px solid ${deliveryType === 'delivery' ? 'rgba(34,211,165,0.4)' : 'rgba(255,255,255,0.1)'}`, background: deliveryType === 'delivery' ? 'rgba(34,211,165,0.08)' : 'rgba(255,255,255,0.03)', color: deliveryType === 'delivery' ? '#22d3a5' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🚚 Livraison{product.delivery_price > 0 ? ` +${formatPrice(product.delivery_price)}` : ' gratuite'}
            </button>
          )}
          {product.pickup_available && (
            <button
              onClick={() => setDeliveryType('pickup')}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `0.5px solid ${deliveryType === 'pickup' ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.1)'}`, background: deliveryType === 'pickup' ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.03)', color: deliveryType === 'pickup' ? '#fb923c' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🏪 Retrait ({product.city})
            </button>
          )}
        </div>
      </div>

      {/* Adresse livraison */}
      {deliveryType === 'delivery' && (
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ville de livraison</label>
          <select value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
            <option value="">Choisir une ville...</option>
            {CITIES_CI.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Adresse complète (quartier, rue...)" style={inp} />
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notes (optionnel)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Couleur, taille, précisions..." rows={2} style={{ ...inp, resize: 'none' as const }} />
      </div>

      {/* Récap */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{formatPrice(product.price)} × {quantity}</span>
          <span style={{ fontSize: 12, color: '#e2e8f0' }}>{formatPrice(subTotal)}</span>
        </div>
        {deliveryCost > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Frais de livraison</span>
            <span style={{ fontSize: 12, color: '#e2e8f0' }}>{formatPrice(deliveryCost)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fb923c' }}>{formatPrice(total)}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleOrder}
        disabled={loading}
        style={{
          width: '100%', padding: '15px',
          background: loading ? 'rgba(251,146,60,0.3)' : 'linear-gradient(135deg, #fb923c, #f97316)',
          border: 'none', borderRadius: 12,
          color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
          fontWeight: 800, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
          letterSpacing: -0.3,
        }}
      >
        {loading ? 'Commande en cours...' : `Commander — ${formatPrice(total)}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>
        Le vendeur vous contactera pour finaliser le paiement
      </p>
    </div>
  )
}