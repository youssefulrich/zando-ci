import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const code = formData.get('code') as string

    if (!code) {
      return NextResponse.redirect(new URL('/verify/invalid', req.url))
    }

    const admin = createAdminClient() as any

    // Vérifier que le ticket existe et est valide
    const { data: ticket } = await admin
      .from('tickets')
      .select('id, status, code')
      .eq('code', code)
      .single()

    if (!ticket) {
      return NextResponse.redirect(new URL(`/verify/${code}`, req.url))
    }

    if (ticket.status !== 'valid') {
      // Déjà utilisé ou annulé → rediriger vers la page de vérification
      return NextResponse.redirect(new URL(`/verify/${code}`, req.url))
    }

    // Marquer comme utilisé
    await admin
      .from('tickets')
      .update({
        status: 'used',
        scanned_at: new Date().toISOString(),
      })
      .eq('code', code)

    // Rediriger vers la page de vérification (qui affichera "DÉJÀ SCANNÉ")
    return NextResponse.redirect(new URL(`/verify/${code}`, req.url))

  } catch (err) {
    console.error('Erreur scan ticket:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}