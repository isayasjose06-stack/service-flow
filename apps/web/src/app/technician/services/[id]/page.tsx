'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { technicianServicesService } from '@/services/technician-services.service';
import { ServiceManager } from '@/services/service.service';
import { ChatBox } from '@/components/ChatBox';
import { ArrowLeft, MapPin, Phone, MessageCircle, Navigation, CheckCircle, Clock, Star, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const fetchService = async () => {
    try {
      const services = await technicianServicesService.getMyServices();
      const found = services.find((s: any) => s.id === params.id);
      if (found) {
        setService(found);
      } else {
        router.push('/technician/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchService();
    }
  }, [params.id]);

  const handleStatusChange = async (status: string) => {
    setActionLoading(true);
    try {
      await technicianServicesService.updateStatus(service.id, status);
      await fetchService();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRateClient = async () => {
    const score = prompt('Califica al cliente del 1 al 5:');
    if (!score) return;
    if (Number(score) < 1 || Number(score) > 5) return alert('Puntaje inválido');
    const comment = prompt('Deja un comentario (opcional):') || '';
    
    setActionLoading(true);
    try {
      await ServiceManager.submitRating(service.id, Number(score), comment);
      alert('Calificación enviada con éxito');
      await fetchService();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al enviar calificación');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!service) return null;

  const getStatusDisplay = () => {
    switch(service.status) {
      case 'CONFIRMED': return { text: 'Confirmado', color: 'bg-blue-100 text-blue-800' };
      case 'ON_THE_WAY': return { text: 'En camino', color: 'bg-indigo-100 text-indigo-800' };
      case 'ARRIVED': return { text: 'En el lugar', color: 'bg-purple-100 text-purple-800' };
      case 'IN_PROGRESS': return { text: 'En progreso', color: 'bg-amber-100 text-amber-800' };
      case 'COMPLETED': return { text: 'Completado (Pendiente de pago)', color: 'bg-green-100 text-green-800' };
      case 'PAID': return { text: 'Pagado', color: 'bg-emerald-100 text-emerald-800' };
      case 'RATED': return { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' };
      default: return { text: service.status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = getStatusDisplay();
  const token = typeof window !== 'undefined' ? (document.cookie.split('jwt=')[1]?.split(';')[0] || '') : '';

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-20 shadow-sm flex items-center gap-3">
        <Link href="/technician/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight line-clamp-1">{service.serviceRequest.title}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Client Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold">
                {service.serviceRequest.client.firstName[0]}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{service.serviceRequest.client.firstName} {service.serviceRequest.client.lastName}</h2>
                <p className="text-sm text-gray-500">Cliente</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showChat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showChat && (
            <div className="mt-4 border-t pt-4">
              <div className="h-[400px] border rounded-xl overflow-hidden bg-gray-50">
                <ChatBox 
                  serviceId={service.id} 
                  currentUserId={service.technicianId} 
                  token={token} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Location & Time */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Dirección del servicio</p>
              <p className="font-medium text-gray-900">{service.serviceRequest.addressText || service.serviceRequest.city}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Fecha programada</p>
              <p className="font-medium text-gray-900">
                {format(new Date(service.serviceRequest.scheduledDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
          {service.serviceRequest.budget && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-0.5">Presupuesto acordado</p>
                <p className="font-bold text-green-700">${service.serviceRequest.budget}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Detalles del problema</h3>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{service.serviceRequest.description}</p>
        </div>

      </div>

      {/* Action Buttons (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe z-30">
        <div className="max-w-md mx-auto">
          {service.status === 'CONFIRMED' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleStatusChange('ON_THE_WAY')} 
              className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-primary-700 disabled:opacity-70 transition-colors shadow-lg shadow-primary-200"
            >
              <Navigation className="w-5 h-5" />
              Voy en camino
            </button>
          )}
          
          {service.status === 'ON_THE_WAY' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleStatusChange('ARRIVED')} 
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-indigo-700 disabled:opacity-70 transition-colors shadow-lg shadow-indigo-200"
            >
              <MapPin className="w-5 h-5" />
              Ya llegué
            </button>
          )}

          {service.status === 'ARRIVED' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleStatusChange('IN_PROGRESS')} 
              className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-amber-600 disabled:opacity-70 transition-colors shadow-lg shadow-amber-200"
            >
              <Clock className="w-5 h-5" />
              Iniciar trabajo
            </button>
          )}

          {service.status === 'IN_PROGRESS' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleStatusChange('COMPLETED')} 
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-green-700 disabled:opacity-70 transition-colors shadow-lg shadow-green-200"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar trabajo
            </button>
          )}

          {service.status === 'COMPLETED' && (
            <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
              <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="font-bold text-gray-700">Esperando pago del cliente</p>
              <p className="text-xs text-gray-500 mt-1">El cliente debe realizar el pago desde su app.</p>
            </div>
          )}

          {(service.status === 'PAID' || service.status === 'RATED') && (
            <button 
              disabled={actionLoading || service.status === 'RATED'}
              onClick={handleRateClient} 
              className="w-full py-4 bg-yellow-500 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-yellow-600 disabled:opacity-50 transition-colors shadow-lg shadow-yellow-200"
            >
              <Star className="w-5 h-5" />
              {service.status === 'RATED' ? 'Cliente Calificado' : 'Calificar Cliente'}
            </button>
          )}

          {['CONFIRMED', 'ON_THE_WAY', 'ARRIVED'].includes(service.status) && (
            <button 
              disabled={actionLoading}
              onClick={() => {
                if(confirm('¿Estás seguro que deseas cancelar este servicio? Esto puede afectar tu reputación.')) {
                  handleStatusChange('CANCELLED_BY_TECHNICIAN');
                }
              }} 
              className="w-full mt-3 py-3 bg-white text-red-600 rounded-xl font-bold text-sm border border-gray-200 hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar Servicio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
