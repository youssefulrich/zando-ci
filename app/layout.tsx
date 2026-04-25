import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zando CI — Location résidences, véhicules et événements',
  description: 'La plateforme de location multi-services en Côte d\'Ivoire',
  viewport: 'width=device-width, initial-scale=1',

  icons: {
    icon: '/favicon.png',
  },

openGraph: {
  title: 'Zando CI',
  description: 'Location de résidences, véhicules, événements et boutiques',
  url: 'https://zando-ci.vercel.app',
  siteName: 'ZandoCI',
  images: [
    {
      url: 'https://zando-ci.vercel.app/og-v2.png',
      width: 1200,
      height: 630,
    },
  ],
  locale: 'fr_FR',
  type: 'website',
},
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}