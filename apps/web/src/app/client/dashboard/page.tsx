'use client';

import { useEffect, useState } from 'react';
import { ServiceRequestService } from '@/services/service-request.service';
import { ServiceRequest } from '@/types/service-request';
import { useRouter } from 'next/navigation';
import { Plus, Wrench, Clock, Activity, FileText, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    ServiceRequestService.getMyRequests()
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'TECHNICIAN_SELECTED');
  const activeServices = requests.filter(r => r.status === 'IN_PROGRESS');
  const pastServices = requests.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 shadow-none font-semibold">Buscando Técnico</Badge>;
      case 'TECHNICIAN_SELECTED': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 shadow-none font-semibold">Técnico Asignado</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 shadow-none font-semibold">En Progreso</Badge>;
      case 'COMPLETED': return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-0 shadow-none font-semibold">Completado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
        <p className="text-slate-500 font-medium">Cargando tu información...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header & CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de vuelta 👋</h1>
          <p className="text-slate-500 mt-2 text-lg max-w-xl">¿En qué podemos ayudarte el día de hoy? Encuentra a los mejores profesionales en minutos.</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => router.push('/client/requests')}
          className="gap-2 text-base h-14 px-8 rounded-xl bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-600/20 transition-all hover:-translate-y-0.5 relative z-10 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Solicitar Servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Requests */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Activity className="w-5 h-5 text-blue-500" />
                Solicitudes Activas
              </h2>
            </div>
            
            {activeRequests.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center shadow-sm">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No tienes solicitudes activas</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Crea una nueva solicitud detallando tu problema para recibir propuestas de técnicos calificados.</p>
                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => router.push('/client/requests')}>
                  Crear Solicitud
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeRequests.map(req => (
                  <Card key={req.id} className="hover:shadow-md transition-shadow border-slate-200 rounded-2xl overflow-hidden group">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 bg-slate-50/50 group-hover:bg-primary-50/30 transition-colors">
                      <div>
                        <CardTitle className="text-lg mb-1.5 font-bold text-slate-900">{req.title}</CardTitle>
                        <CardDescription className="font-medium">Publicada el {new Date(req.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      {getStatusBadge(req.status)}
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">{req.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0 justify-end">
                      <Button variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-semibold rounded-lg" onClick={() => router.push(`/client/requests/${req.id}`)}>
                        Ver Detalles y Técnicos <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Active Services */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Wrench className="w-5 h-5 text-green-500" />
                Servicios en Progreso
              </h2>
            </div>
            
            {activeServices.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay servicios en curso en este momento.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeServices.map(req => (
                  <Card key={req.id} className="border-l-4 border-l-green-500 rounded-2xl shadow-sm border-y-slate-200 border-r-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">{req.title}</CardTitle>
                        {getStatusBadge(req.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">El técnico se encuentra trabajando en tu solicitud. Puedes hacer seguimiento del progreso.</p>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => router.push(`/client/services/${req.id}`)}>
                        Ver Seguimiento
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* History Widget */}
          <Card className="bg-slate-50/50 border-slate-200 rounded-3xl shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Clock className="w-5 h-5 text-slate-400" />
                Historial Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {pastServices.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Clock className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Sin historial de servicios</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastServices.slice(0, 4).map(req => (
                    <div key={req.id} className="flex flex-col gap-1.5 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <span className="font-semibold text-slate-900 text-sm truncate">{req.title}</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {pastServices.length > 0 && (
              <CardFooter className="pt-2 border-t border-slate-100">
                <Button variant="ghost" className="w-full text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl" onClick={() => router.push('/client/history')}>
                  Ver todo el historial
                </Button>
              </CardFooter>
            )}
          </Card>

        </div>

      </div>
    </div>
  );
}
