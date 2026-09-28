'use client';

import { useEffect, useState } from 'react';
import { ServiceRequestService } from '@/services/service-request.service';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Clock, MapPin, Search, UserCheck, AlertCircle, ShieldCheck, Star } from 'lucide-react';

export default function RequestDetailsPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      ServiceRequestService.getById(params.id),
      ServiceRequestService.getOffers(params.id)
    ])
      .then(([reqData, offersData]) => {
        setRequest(reqData);
        setOffers(offersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSelect = async (technicianId: string) => {
    if (!confirm('¿Seguro que deseas seleccionar a este técnico? Esto confirmará el servicio.')) return;
    setIsSelecting(technicianId);
    try {
      await ServiceRequestService.selectTechnician(params.id, technicianId);
      alert('¡Técnico seleccionado exitosamente!');
      router.push('/client/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al seleccionar técnico');
      setIsSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
        <p className="text-slate-500 font-medium">Cargando detalles de tu solicitud...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white p-12 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto mt-10">
        <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Solicitud no encontrada</h2>
        <p className="text-slate-500 mb-8">Es posible que haya sido eliminada o no tengas permiso para verla.</p>
        <Button onClick={() => router.push('/client/dashboard')} variant="outline" className="rounded-xl h-12 px-8 font-bold border-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Button>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Buscando Técnicos', color: 'bg-amber-100 text-amber-800' };
      case 'TECHNICIAN_SELECTED': return { label: 'Técnico Asignado', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS': return { label: 'En Progreso', color: 'bg-green-100 text-green-800' };
      case 'COMPLETED': return { label: 'Completado', color: 'bg-slate-100 text-slate-800' };
      default: return { label: status, color: 'bg-slate-100 text-slate-800' };
    }
  };

  const statusInfo = getStatusDisplay(request.status);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-4">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 font-semibold rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <Badge className={`${statusInfo.color} px-4 py-1.5 text-sm font-bold border-0 rounded-lg shadow-sm`}>
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Request Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm sticky top-28 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-5 pt-6">
              <CardTitle className="text-xl font-bold leading-tight text-slate-900">{request.title}</CardTitle>
              <CardDescription className="font-medium mt-1">Publicada el {new Date(request.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción del problema</h4>
                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{request.description}</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Ubicación</p>
                    <p className="text-sm text-slate-500">Se proporcionó en la solicitud</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <Clock className="w-5 h-5 text-primary-600 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Horario Preferido</p>
                    <p className="text-sm text-slate-500">Lo antes posible</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Offers / Match Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="bg-primary-50 p-2 rounded-xl">
                <UserCheck className="w-6 h-6 text-primary-600" />
              </div>
              Técnicos Interesados
            </h2>

            {offers.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-primary-400 animate-ping opacity-20"></div>
                  <Search className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Buscando a los mejores profesionales</h3>
                <p className="text-slate-500 max-w-md mx-auto text-base leading-relaxed">
                  Estamos notificando a los técnicos cercanos que coinciden con tu solicitud. Recibirás propuestas aquí pronto.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {offers.map(offer => (
                  <Card key={offer.id} className="overflow-hidden transition-all duration-300 hover:border-primary-300 hover:shadow-lg rounded-2xl group border-slate-200">
                    <div className="p-6 md:p-0 flex flex-col md:flex-row md:items-stretch">
                      
                      {/* Technician Avatar & Basic Info */}
                      <div className="md:w-1/3 p-6 md:p-8 bg-gradient-to-b from-slate-50 to-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-primary-100 rounded-full mb-4 flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-100">
                          <span className="text-3xl font-bold text-primary-700">{offer.technician.firstName[0]}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xl mb-1">
                          {offer.technician.firstName} {offer.technician.lastName}
                        </h3>
                        <div className="flex items-center gap-1 text-amber-500 mt-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold text-amber-700">4.8</span>
                          <span className="text-xs font-medium text-amber-600/70">(24 reseñas)</span>
                        </div>
                      </div>
                      
                      {/* Proposal Details & CTA */}
                      <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between h-full space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100">
                              Técnico Verificado
                            </span>
                          </div>
                          <p className="text-slate-600 text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            "{offer.technician.technicianProfile?.professionalDescription || 'Profesional altamente calificado y verificado por la plataforma, listo para resolver tu problema.'}"
                          </p>
                          <div className="mt-5 grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experiencia</p>
                              <p className="font-bold text-slate-900">{offer.technician.technicianProfile?.yearsOfExperience || 1} años</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trabajos Exitosos</p>
                              <p className="font-bold text-slate-900">100%</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Oferta recibida hoy
                          </div>
                          <Button 
                            onClick={() => handleSelect(offer.technicianId)}
                            disabled={request.status !== 'PENDING' || isSelecting === offer.technicianId}
                            className={`w-full sm:w-auto h-12 px-8 font-bold rounded-xl transition-all ${
                              request.status === 'PENDING' 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20' 
                                : ''
                            }`}
                            variant={request.status !== 'PENDING' ? 'outline' : 'default'}
                          >
                            {isSelecting === offer.technicianId ? (
                              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirmando...</>
                            ) : request.status !== 'PENDING' ? (
                              'Ya Seleccionado'
                            ) : (
                              'Aceptar Propuesta'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
