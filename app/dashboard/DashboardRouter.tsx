'use client'

import DashboardClient from './DashboardClient'
import DashboardResidence from './DashboardResidence'
import DashboardVehicule from './DashboardVehicule'
import DashboardEvenement from './DashboardEvenement'
import DashboardVendeur from './DashboardVendeur'



type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardRouter({ profile, userId }: { profile: Profile; userId: string }) {
  switch (profile.account_type) {
    case 'owner_residence':
      return <DashboardResidence profile={profile} userId={userId} />
    case 'owner_vehicle':
      return <DashboardVehicule profile={profile} userId={userId} />
    case 'owner_event':
      return <DashboardEvenement profile={profile} userId={userId} />
    case 'owner_all':
      return <DashboardResidence profile={profile} userId={userId} showAll />
    default:
      return <DashboardClient profile={profile} userId={userId} />
    case 'seller':
      return <DashboardVendeur profile={profile} userId={userId} />
  }
}