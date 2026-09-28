import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Acceso denegado</h2>
      <p className="text-gray-500 max-w-md mb-8">
        No tienes los permisos necesarios para acceder a esta sección.
      </p>
      <Link href="/login" className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
        Volver a Iniciar Sesión
      </Link>
    </div>
  );
}
