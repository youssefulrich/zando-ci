import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardRouter from './DashboardRouter'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <DashboardRouter
      profile={{
        full_name: profile.full_name,
        city: profile.city ?? '',
        account_type: profile.account_type,
      }}
      userId={user.id}
    />
  )
}