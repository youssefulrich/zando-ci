// app/boutique/produit/[id]/page.tsx
// Ce fichier est SERVER — il gère uniquement le metadata
// Le composant client est dans ProduitDetailClient.tsx

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import ProduitDetailClient from './ProduitDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: p } = await (supabase as any)
    .from('products')
    .select('name, description, photos, price, shops(name, city)')
    .eq('id', id)
    .single()

  if (!p) return {}

  const photo = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null
  const shop = p.shops as any

  return {
    title: `${p.name} — ${formatPrice(p.price)} | ${shop?.name ?? 'Zando CI'}`,
    description: p.description ?? `Achetez ${p.name} sur Zando CI`,
    openGraph: {
      title: `${p.name} — ${formatPrice(p.price)} FCFA`,
      description: p.description ?? `Disponible chez ${shop?.name} sur Zando CI`,
      images: photo ? [{ url: photo, width: 1200, height: 630 }] : [],
      type: 'website',
    },
  }
}

export default function ProduitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProduitDetailClient params={params} />
}