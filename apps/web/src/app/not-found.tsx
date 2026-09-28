import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Página no encontrada</h2>
      <p className="text-gray-500 max-w-md mb-8">
        La página que estás buscando no existe o ha sido movida. Por favor, verifica la URL o vuelve al inicio.
      </p>
      <Link href="/" className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
        Volver al inicio
      </Link>
    </div>
  );
}
