import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zando CI — Location résidences, véhicules et événements',
  description: 'La plateforme de location multi-services en Côte d\'Ivoire',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.png', // ton logo simplifié
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