'use client';

import { useEffect, useState } from 'react';
import { ServiceManager } from '@/services/service.service';
import { useRouter } from 'next/navigation';

export default function ClientServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    ServiceManager.getMyServices().then(setServices).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mis Servicios Confirmados</h1>
      
      {services.length === 0 ? (
        <p className="text-gray-500">No tienes servicios.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(srv => (
            <div key={srv.id} className="p-4 border rounded shadow-sm bg-white">
              <h2 className="text-lg font-bold">{srv.serviceRequest.title}</h2>
              <p className="text-sm text-gray-500">Técnico: {srv.technician.firstName} {srv.technician.lastName}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {srv.status}
                </span>
                <button 
                  onClick={() => router.push(`/client/services/${srv.id}`)}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                >
                  Ver / Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
