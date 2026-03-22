import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <p className="font-bold text-orange-500 text-lg mb-3">Zando CI</p>
            <p className="text-gray-500 leading-relaxed">
              La plateforme de location multi-services en Côte d&apos;Ivoire.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-3">Services</p>
            <div className="space-y-2">
              <Link href="/residences" className="block text-gray-500 hover:text-gray-900 transition-colors">Résidences</Link>
              <Link href="/vehicles" className="block text-gray-500 hover:text-gray-900 transition-colors">Véhicules</Link>
              <Link href="/events" className="block text-gray-500 hover:text-gray-900 transition-colors">Événements</Link>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-3">Compte</p>
            <div className="space-y-2">
              <Link href="/register" className="block text-gray-500 hover:text-gray-900 transition-colors">S&apos;inscrire</Link>
              <Link href="/login" className="block text-gray-500 hover:text-gray-900 transition-colors">Se connecter</Link>
              <Link href="/dashboard" className="block text-gray-500 hover:text-gray-900 transition-colors">Mon espace</Link>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-3">Paiements acceptés</p>
            <div className="space-y-2 text-gray-500">
              <p>Orange Money</p>
              <p>MTN Money</p>
              <p>Wave</p>
              <p>Moov Money</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-10 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Zando CI — Abidjan, Côte d&apos;Ivoire
        </div>
      </div>
    </footer>
  )
}