'use client';

import { useEffect, useState } from 'react';
import { technicianServicesService } from '@/services/technician-services.service';
import { Clock, MapPin, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TechnicianHistoryPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    technicianServicesService.getMyServices()
      .then(data => {
        // Filter only past services
        const pastServices = data.filter((s: any) => 
          ['COMPLETED', 'PAID', 'RATED', 'CANCELLED_BY_TECHNICIAN', 'CANCELLED_BY_CLIENT'].includes(s.status)
        );
        // Sort by date descending
        pastServices.sort((a: any, b: any) => new Date(b.serviceRequest.scheduledDate).getTime() - new Date(a.serviceRequest.scheduledDate).getTime());
        setServices(pastServices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = services.filter((s: any) => 
    s.serviceRequest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.serviceRequest.client.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED': 
      case 'PAID': 
      case 'RATED': 
        return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Finalizado</span>;
      case 'CANCELLED_BY_TECHNICIAN':
      case 'CANCELLED_BY_CLIENT':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Cancelado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de Servicios</h1>
        <p className="text-gray-500">Revisa tus trabajos anteriores.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por título o cliente..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron servicios en tu historial.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map(srv => (
            <div key={srv.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{srv.serviceRequest.title}</h3>
                {getStatusBadge(srv.status)}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(srv.serviceRequest.scheduledDate), "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{srv.serviceRequest.addressText || srv.serviceRequest.city}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {srv.serviceRequest.client.firstName[0]}
                  </div>
                  <span className="font-medium text-sm text-gray-700">{srv.serviceRequest.client.firstName}</span>
                </div>
                {srv.serviceRequest.budget && (
                  <span className="font-bold text-gray-900">${srv.serviceRequest.budget}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
