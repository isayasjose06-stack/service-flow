'use client';

import { useEffect, useState } from 'react';
import { technicianRequestsService } from '@/services/technician-requests.service';
import { technicianServicesService } from '@/services/technician-services.service';
import Link from 'next/link';
import { MapPin, Calendar, Clock, DollarSign, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TechnicianDashboardPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedMatches, fetchedServices] = await Promise.all([
        technicianRequestsService.getMyMatches(),
        technicianServicesService.getMyServices()
      ]);
      setMatches(fetchedMatches);
      setServices(fetchedServices);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRespond = async (id: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await technicianRequestsService.respond(id, action);
      fetchData();
    } catch (err) {
      console.error('Error al responder:', err);
      alert('Error al enviar respuesta');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Filter lists
  const pendingMatches = matches.filter(m => m.status === 'MATCHED' || m.status === 'VIEWED');
  
  // Categorize services
  const activeServices = services.filter(s => ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(s.status));
  const upcomingServices = services.filter(s => s.status === 'CONFIRMED');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ON_THE_WAY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ARRIVED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'ON_THE_WAY': return 'En camino';
      case 'ARRIVED': return 'Llegaste';
      case 'IN_PROGRESS': return 'En progreso';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, Técnico</h1>
        <p className="text-gray-500">Aquí tienes un resumen de tu actividad.</p>
      </div>

      {/* Active Services (High Priority) */}
      {activeServices.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-6 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-gray-900">Servicios en Curso</h2>
          </div>
          <div className="space-y-4">
            {activeServices.map(srv => (
              <Link key={srv.id} href={`/technician/services/${srv.id}`} className="block">
                <div className="bg-white border-2 border-primary-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary-100 text-primary-800 px-3 py-1 rounded-bl-lg font-semibold text-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
                    {getStatusText(srv.status)}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1 pr-24">{srv.serviceRequest.title}</h3>
                  <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{srv.serviceRequest.addressText || srv.serviceRequest.city}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {srv.serviceRequest.client.firstName[0]}
                      </div>
                      <span className="font-medium text-sm text-gray-700">{srv.serviceRequest.client.firstName}</span>
                    </div>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group">
                      Ver detalles
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Matches (Requests) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900">Nuevas Solicitudes</h2>
          {pendingMatches.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingMatches.length}
            </span>
          )}
        </div>
        
        {pendingMatches.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Estás al día.</p>
            <p className="text-sm text-gray-400">No hay nuevas solicitudes en tu zona.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingMatches.map(match => (
              <div key={match.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{match.serviceRequest.title}</h3>
                  {match.serviceRequest.budget && (
                    <span className="bg-green-50 text-green-700 font-bold px-2 py-1 rounded text-sm whitespace-nowrap">
                      ${match.serviceRequest.budget}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{format(new Date(match.serviceRequest.scheduledDate), "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-600 gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{match.serviceRequest.addressText || match.serviceRequest.city}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleRespond(match.serviceRequestId, 'REJECT')}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleRespond(match.serviceRequestId, 'ACCEPT')}
                    className="flex-1 py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                  >
                    Me interesa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Services */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Próximos Servicios</h2>
        </div>
        
        {upcomingServices.length === 0 ? (
          <p className="text-gray-500 text-sm">No tienes servicios confirmados próximos.</p>
        ) : (
          <div className="space-y-4">
            {upcomingServices.map(srv => (
              <Link key={srv.id} href={`/technician/services/${srv.id}`} className="block">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-primary-300 transition-colors flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{srv.serviceRequest.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(srv.serviceRequest.scheduledDate), "d MMM", { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{srv.serviceRequest.addressText || srv.serviceRequest.city}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      
    </div>
  );
}
