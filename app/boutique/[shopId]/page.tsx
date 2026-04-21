import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

export default async function BoutiqueProfilePage({ params }: { params: Promise<{ shopId: string }> }) {

  const { shopId } = await params

  const supabase = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single()
  if (!shop) notFound()

  const { data: productsRaw } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'active')
    .eq('available', true)
    .order('created_at', { ascending: false })

  const products = (productsRaw ?? []) as any[]

  function formatPhone(phone: string): string {
    let p = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '')
    if (p.startsWith('+')) p = p.slice(1)
    if (p.startsWith('0')) p = '225' + p
    else if (!p.startsWith('225')) p = '225' + p
    return p
  }

  const waUrl = shop.whatsapp || shop.phone
    ? `https://wa.me/${formatPhone(shop.whatsapp || shop.phone)}?text=${encodeURIComponent(`Bonjour, j'ai trouvé votre boutique "${shop.name}" sur Zando CI !`)}`
    : null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .bp { background: #0a0f1a; min-height: 100vh; }
        .bp-wrap { max-width: 1100px; margin: 0 auto; padding: 0 20px 80px; }
        .bp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (min-width: 640px) { .bp-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1024px) { .bp-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }
      `}</style>

      <div className="bp">
        <Navbar />

        {/* Header boutique */}
        <div style={{ background: 'linear-gradient(135deg, #0d1520, #111827)', borderBottom: '0.5px solid rgba(255,255,255,0.06)', padding: '40px 20px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
              ← Retour à la marketplace
            </Link>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Logo */}
              <div style={{ width: 80, height: 80, borderRadius: 18, overflow: 'hidden', background: '#1a2236', border: '0.5px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {shop.logo_url ? <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)' }}>🏪</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{shop.name}</h1>
                  {shop.is_verified && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,211,165,0.15)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.3)' }}>✓ Vérifié</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📍 {shop.city}{shop.address ? ` · ${shop.address}` : ''}</p>
                {shop.description && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12, maxWidth: 500 }}>{shop.description}</p>}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    {products.length} produit{products.length > 1 ? 's' : ''}
                  </span>
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 12, padding: '4px 14px', borderRadius: 20,
                      background: 'rgba(37,211,102,0.12)', color: '#25D366',
                      border: '0.5px solid rgba(37,211,102,0.25)', textDecoration: 'none', fontWeight: 600,
                    }}>
                      💬 WhatsApp
                    </a>
                  )}
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} style={{
                      fontSize: 12, padding: '4px 14px', borderRadius: 20,
                      background: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                      border: '0.5px solid rgba(96,165,250,0.2)', textDecoration: 'none', fontWeight: 600,
                    }}>
                      📞 Appeler
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bp-wrap" style={{ paddingTop: 32 }}>
          {products.length > 0 ? (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
                {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </p>
              <div className="bp-grid">
                {products.map((p: any) => (
                  <Link key={p.id} href={`/boutique/produit/${p.id}`} style={{
                    background: '#111827', border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, overflow: 'hidden', textDecoration: 'none', display: 'block',
                    transition: 'all 0.2s',
                  }}>
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '1', background: '#1a2236', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,255,255,0.1)' }}>📦</div>
                    )}
                    <div style={{ padding: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#22d3a5' }}>{formatPrice(p.price)}</span>
                        {p.type === 'service' && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>SERVICE</span>}
                      </div>
                      {p.compare_price && p.compare_price > p.price && (
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>{formatPrice(p.compare_price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>📦</div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Aucun produit pour l'instant</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}