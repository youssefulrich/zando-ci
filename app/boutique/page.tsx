import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all',          label: 'Tout',         emoji: '🏠' },
  { value: 'mode',         label: 'Mode',          emoji: '👗' },
  { value: 'electronique', label: 'Électronique',  emoji: '📱' },
  { value: 'alimentaire',  label: 'Alimentation',  emoji: '🍽️' },
  { value: 'beaute',       label: 'Beauté',         emoji: '💄' },
  { value: 'maison',       label: 'Maison',         emoji: '🏡' },
  { value: 'service',      label: 'Services',       emoji: '⚙️' },
  { value: 'sport',        label: 'Sport',          emoji: '⚽' },
  { value: 'autre',        label: 'Autre',          emoji: '📦' },
]

const BANNERS = [
  { bg: 'linear-gradient(120deg,#FF6B00,#FF9240)', label: 'PROMO DU JOUR',  title: "Jusqu'à -50%\nsur la mode",     sub: 'Offres limitées',   emoji: '👗' },
  { bg: 'linear-gradient(120deg,#00897B,#00BCD4)', label: 'NOUVEAUTÉ',      title: 'Tech & Gadgets\narrivée fraîche', sub: 'Livraison express', emoji: '📱' },
  { bg: 'linear-gradient(120deg,#7B1FA2,#E040FB)', label: 'EXCLUSIF',        title: 'Beauté premium\nprix imbattable', sub: 'Vendeurs vérifiés', emoji: '💄' },
]

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; q?: string }>
}) {
  const sp = await searchParams
  const category = sp.category ?? 'all'
  const city     = sp.city     ?? ''
  const q        = sp.q        ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, shops(name, city, logo_url)')
    .eq('status', 'active')
    .eq('available', true)
    .order('created_at', { ascending: false })
    .limit(48)

  if (category !== 'all') query = query.eq('category', category)
  if (city)               query = query.eq('city', city)
  if (q)                  query = query.ilike('name', `%${q}%`)

  const { data: productsRaw } = await query
  const products = (productsRaw ?? []) as any[]

  const { count: totalProducts } = await supabase
    .from('products').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: totalShops } = await supabase
    .from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active')

  const flash = products.filter((p: any) => p.compare_price && p.compare_price > p.price).slice(0, 8)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0E0E12;
          --bg2:     #16161C;
          --bg3:     #1E1E26;
          --card:    #1A1A22;
          --border:  rgba(255,255,255,0.07);
          --orange:  #FF6B00;
          --text:    #F0F0F0;
          --muted:   #888;
          --muted2:  #444;
        }

        .bl { background: var(--bg); min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); }

        /* TOP BAR */
        .bl-topbar {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 0 16px; display: flex; align-items: center; gap: 10px;
          height: 54px; position: sticky; top: 0; z-index: 100;
        }
        .bl-logo { font-size: 22px; font-weight: 900; color: var(--orange); letter-spacing: -1px; flex-shrink: 0; text-decoration: none; }
        .bl-logo span { color: rgba(255,255,255,0.35); }
        .bl-search-bar { flex: 1; display: flex; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; max-width: 500px; height: 38px; }
        .bl-search-bar form { display: flex; width: 100%; }
        .bl-search-in { flex: 1; border: none; outline: none; padding: 0 14px; font-size: 13px; background: transparent; color: var(--text); min-width: 0; }
        .bl-search-in::placeholder { color: var(--muted2); }
        .bl-search-btn { padding: 0 16px; background: var(--orange); color: #fff; border: none; font-size: 14px; cursor: pointer; flex-shrink: 0; }
        .bl-topbar-right { margin-left: auto; flex-shrink: 0; }
        .bl-sell-btn { padding: 8px 18px; background: var(--orange); color: #fff; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; }

        /* CATS */
        .bl-cats-bar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 12px; display: flex; overflow-x: auto; scrollbar-width: none; }
        .bl-cats-bar::-webkit-scrollbar { display: none; }
        .bl-cat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 16px; text-decoration: none; white-space: nowrap; font-size: 11px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; flex-shrink: 0; transition: color 0.15s, border-color 0.15s; }
        .bl-cat-item.active { color: var(--orange); border-bottom-color: var(--orange); }
        .bl-cat-item:hover { color: var(--text); }
        .bl-cat-ico { font-size: 18px; line-height: 1; }

        /* BANNERS */
        .bl-banners { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 16px 12px 12px; scroll-snap-type: x mandatory; }
        .bl-banners::-webkit-scrollbar { display: none; }
        .bl-banner { flex-shrink: 0; width: 82vw; max-width: 320px; min-height: 128px; border-radius: 14px; padding: 20px 22px; position: relative; overflow: hidden; scroll-snap-align: start; display: flex; flex-direction: column; justify-content: space-between; }
        .bl-banner-deco { position: absolute; right: -30px; top: -30px; width: 130px; height: 130px; border-radius: 50%; background: rgba(255,255,255,0.12); pointer-events: none; }
        .bl-banner-tag { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; color: rgba(255,255,255,0.65); margin-bottom: 4px; position: relative; z-index: 1; }
        .bl-banner-title { font-size: 18px; font-weight: 900; color: #fff; line-height: 1.15; white-space: pre-line; position: relative; z-index: 1; }
        .bl-banner-sub { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; position: relative; z-index: 1; }
        .bl-banner-emoji { position: absolute; right: 16px; bottom: 12px; font-size: 48px; opacity: 0.85; z-index: 1; line-height: 1; }

        /* SECTION HEADER */
        .bl-sec { padding: 18px 12px 10px; display: flex; align-items: center; justify-content: space-between; }
        .bl-sec-title { font-size: 15px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
        .bl-sec-pill { font-size: 11px; background: rgba(255,107,0,0.15); color: var(--orange); padding: 2px 9px; border-radius: 20px; font-weight: 700; }
        .bl-sec-all { font-size: 12px; color: var(--orange); font-weight: 600; text-decoration: none; }

        /* FLASH STRIP */
        .bl-flash-strip { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 0 12px 16px; }
        .bl-flash-strip::-webkit-scrollbar { display: none; }
        .bl-flash-card { flex-shrink: 0; width: 148px; background: var(--card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; text-decoration: none; display: block; transition: transform 0.2s, border-color 0.2s; }
        .bl-flash-card:hover { transform: translateY(-2px); border-color: var(--orange); }
        .bl-flash-img { width: 100%; height: 115px; object-fit: cover; display: block; }
        .bl-flash-img-ph { width: 100%; height: 115px; background: var(--bg3); display: flex; align-items: center; justify-content: center; font-size: 34px; }
        .bl-flash-body { padding: 9px 10px 11px; }
        .bl-flash-name { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bl-flash-price { font-size: 13px; font-weight: 900; color: var(--orange); }
        .bl-flash-old { font-size: 11px; color: var(--muted2); text-decoration: line-through; margin-left: 4px; }
        .bl-flash-badge { display: inline-block; margin-top: 5px; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 20px; background: #FF3B30; color: #fff; }

        /* MID BANNER */
        .bl-mid-banner { margin: 4px 12px 4px; border-radius: 14px; background: linear-gradient(110deg, #FF6B00 0%, #FF9240 100%); padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .bl-mid-title { font-size: 15px; font-weight: 900; color: #fff; margin-bottom: 3px; }
        .bl-mid-sub   { font-size: 12px; color: rgba(255,255,255,0.72); }
        .bl-mid-btn   { padding: 10px 20px; background: #fff; color: var(--orange); border-radius: 8px; font-size: 13px; font-weight: 800; text-decoration: none; white-space: nowrap; flex-shrink: 0; }

        /* GRID */
        .bl-grid-wrap { padding: 0 12px 100px; }
        .bl-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media (min-width:480px)  { .bl-grid { grid-template-columns: repeat(3,1fr); } }
        @media (min-width:720px)  { .bl-grid { grid-template-columns: repeat(4,1fr); } }
        @media (min-width:1080px) { .bl-grid { grid-template-columns: repeat(5,1fr); } }

        /* CARD — calqué sur screenshot */
        .bl-card { background: var(--card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; text-decoration: none; display: block; transition: transform 0.2s, border-color 0.2s; }
        .bl-card:hover { transform: translateY(-3px); border-color: rgba(255,107,0,0.4); }

        .bl-card-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--bg3); }
        .bl-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
        .bl-card:hover .bl-card-img { transform: scale(1.05); }
        .bl-card-ph { width: 100%; aspect-ratio: 1; background: var(--bg3); display: flex; align-items: center; justify-content: center; font-size: 40px; }

        .bl-bdiscount { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 20px; background: #FF3B30; color: #fff; }
        .bl-bdelivery { position: absolute; bottom: 8px; left: 8px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: rgba(0,200,83,0.9); color: #fff; }
        .bl-bservice  { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: rgba(124,58,237,0.9); color: #fff; }

        .bl-card-body { padding: 10px 12px 13px; }
        .bl-card-shop { font-size: 11px; color: var(--muted); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: space-between; }
        .bl-card-shop-arrow { color: var(--orange); font-size: 10px; }
        .bl-card-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .bl-card-price { font-size: 15px; font-weight: 900; color: var(--orange); }
        .bl-card-compare { font-size: 11px; color: var(--muted2); text-decoration: line-through; margin-left: 5px; }
        .bl-card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 7px; }
        .bl-card-sold { font-size: 10px; color: var(--muted2); }
        .bl-card-cart { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; transition: background 0.15s; }
        .bl-card:hover .bl-card-cart { background: var(--orange); }

        /* EMPTY */
        .bl-empty { background: var(--card); border-radius: 14px; border: 1px solid var(--border); padding: 60px 20px; text-align: center; }

        /* BOTTOM NAV */
        .bl-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg2); border-top: 1px solid var(--border); display: flex; z-index: 50; }
        .bl-bnav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 0 6px; font-size: 10px; color: var(--muted); text-decoration: none; gap: 2px; position: relative; }
        .bl-bnav-item.active { color: var(--orange); }
        .bl-bnav-ico { font-size: 20px; line-height: 1; }
        .bl-bnav-fab { width: 46px; height: 46px; border-radius: 50%; background: var(--orange); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; position: absolute; top: -22px; box-shadow: 0 4px 16px rgba(255,107,0,0.5); }
        .bl-bnav-fab-lbl { margin-top: 26px; font-size: 10px; color: var(--muted); }

        @media (min-width:768px) {
          .bl-bottom-nav { display: none; }
          .bl-topbar { padding: 0 28px; }
          .bl-banners .bl-banner { max-width: 360px; }
          .bl-banners { padding: 20px 28px 14px; }
          .bl-sec { padding: 20px 28px 10px; }
          .bl-flash-strip { padding: 0 28px 18px; }
          .bl-grid-wrap { padding: 0 28px 60px; }
          .bl-mid-banner { margin: 4px 28px 4px; }
        }
      `}</style>

      <div className="bl">
        <Navbar />

        {/* TOP BAR */}
        <div className="bl-topbar">
          <Link href="/" className="bl-logo">zando<span>.ci</span></Link>
          <div className="bl-search-bar">
            <form method="GET" action="/boutique">
              <input className="bl-search-in" name="q" defaultValue={q} placeholder="Rechercher un produit…" />
              {category !== 'all' && <input type="hidden" name="category" value={category} />}
              <button type="submit" className="bl-search-btn">🔍</button>
            </form>
          </div>
          <div className="bl-topbar-right">
            <Link href="/publier/boutique" className="bl-sell-btn">+ Vendre</Link>
          </div>
        </div>

        {/* CATS */}
        <div className="bl-cats-bar">
          {CATEGORIES.map(c => (
            <Link key={c.value} href={`/boutique?category=${c.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`bl-cat-item${category === c.value ? ' active' : ''}`}>
              <span className="bl-cat-ico">{c.emoji}</span>
              {c.label}
            </Link>
          ))}
        </div>

        {/* BANNERS */}
        {!q && category === 'all' && (
          <div className="bl-banners">
            {BANNERS.map((b, i) => (
              <div key={i} className="bl-banner" style={{ background: b.bg }}>
                <div className="bl-banner-deco" />
                <div>
                  <div className="bl-banner-tag">{b.label}</div>
                  <div className="bl-banner-title">{b.title}</div>
                  <div className="bl-banner-sub">{b.sub}</div>
                </div>
                <div className="bl-banner-emoji">{b.emoji}</div>
              </div>
            ))}
            <div className="bl-banner" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', minWidth: 170, maxWidth: 200 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>MARKETPLACE</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{totalProducts ?? 0}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginBottom: 12 }}>produits actifs</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--orange)', lineHeight: 1 }}>{totalShops ?? 0}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>boutiques</div>
              </div>
            </div>
          </div>
        )}

        {/* FLASH SALES */}
        {!q && flash.length > 0 && (
          <>
            <div className="bl-sec">
              <div className="bl-sec-title">⚡ Ventes flash <span className="bl-sec-pill">{flash.length}</span></div>
              <Link href="/boutique" className="bl-sec-all">Voir tout →</Link>
            </div>
            <div className="bl-flash-strip">
              {flash.map((p: any) => {
                const discount = Math.round((1 - p.price / p.compare_price) * 100)
                const photo    = p.photos?.[0] || p.main_photo
                return (
                  <Link key={p.id} href={`/boutique/produit/${p.id}`} className="bl-flash-card">
                    {photo ? <img src={photo} alt={p.name} className="bl-flash-img" /> : <div className="bl-flash-img-ph">📦</div>}
                    <div className="bl-flash-body">
                      <div className="bl-flash-name">{p.name}</div>
                      <span className="bl-flash-price">{formatPrice(p.price)}</span>
                      <span className="bl-flash-old">{formatPrice(p.compare_price)}</span>
                      <div><span className="bl-flash-badge">-{discount}%</span></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* MID PROMO */}
        {!q && category === 'all' && (
          <div className="bl-mid-banner">
            <div>
              <div className="bl-mid-title">🏪 Ouvrez votre boutique</div>
              <div className="bl-mid-sub">Rejoignez {totalShops ?? 0}+ vendeurs — gratuit</div>
            </div>
            <Link href="/publier/boutique" className="bl-mid-btn">Commencer</Link>
          </div>
        )}

        {/* PRODUITS */}
        <div className="bl-sec">
          <div className="bl-sec-title">
            {q ? `🔍 "${q}"` : category !== 'all' ? `${CATEGORIES.find(c => c.value === category)?.emoji} ${CATEGORIES.find(c => c.value === category)?.label}` : '🛍️ Tous les produits'}
            <span className="bl-sec-pill">{products.length}</span>
          </div>
        </div>

        <div className="bl-grid-wrap">
          {products.length > 0 ? (
            <div className="bl-grid">
              {products.map((p: any) => {
                const hasDiscount = p.compare_price && p.compare_price > p.price
                const discount    = hasDiscount ? Math.round((1 - p.price / p.compare_price) * 100) : 0
                const photo       = p.photos?.[0] || p.main_photo
                const isService   = p.type === 'service'
                return (
                  <Link key={p.id} href={`/boutique/produit/${p.id}`} className="bl-card">
                    <div className="bl-card-img-wrap">
                      {photo ? <img src={photo} alt={p.name} className="bl-card-img" /> : <div className="bl-card-ph">📦</div>}
                      {hasDiscount && <span className="bl-bdiscount">-{discount}%</span>}
                      {p.delivery_available && !isService && <span className="bl-bdelivery">🚚 Livraison</span>}
                      {isService && <span className="bl-bservice">SERVICE</span>}
                    </div>
                    <div className="bl-card-body">
                      <div className="bl-card-shop">
                        {(p.shops as any)?.name ?? 'Boutique'}
                        <span className="bl-card-shop-arrow">✦</span>
                      </div>
                      <div className="bl-card-name">{p.name}</div>
                      <div>
                        <span className="bl-card-price">{formatPrice(p.price)}</span>
                        {hasDiscount && <span className="bl-card-compare">{formatPrice(p.compare_price)}</span>}
                      </div>
                      <div className="bl-card-foot">
                        <span className="bl-card-sold">{p.sales_count > 0 ? `${p.sales_count} vendus` : ''}</span>
                        <div className="bl-card-cart">🛒</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bl-empty">
              <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Aucun produit trouvé</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Soyez le premier à vendre sur ZandoCI</p>
              <Link href="/publier/boutique" style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--orange)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                Ouvrir ma boutique →
              </Link>
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <nav className="bl-bottom-nav">
          <Link href="/boutique" className={`bl-bnav-item${!q && category === 'all' ? ' active' : ''}`}>
            <span className="bl-bnav-ico">🏠</span>Accueil
          </Link>
          <Link href="/boutique?category=mode" className={`bl-bnav-item${category === 'mode' ? ' active' : ''}`}>
            <span className="bl-bnav-ico">👗</span>Mode
          </Link>
          <Link href="/boutique" className="bl-bnav-item">
            <div className="bl-bnav-fab">🛍️</div>
            <span className="bl-bnav-fab-lbl">Boutique</span>
          </Link>
          <Link href="/boutique?category=electronique" className={`bl-bnav-item${category === 'electronique' ? ' active' : ''}`}>
            <span className="bl-bnav-ico">📱</span>Tech
          </Link>
          <Link href="/publier/boutique" className="bl-bnav-item">
            <span className="bl-bnav-ico">➕</span>Vendre
          </Link>
        </nav>
      </div>
    </>
  )
}