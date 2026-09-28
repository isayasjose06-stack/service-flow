'use client';

import { useEffect, useState } from 'react';
import { ServiceManager } from '@/services/service.service';
import { useRouter } from 'next/navigation';
import { ChatBox } from '@/components/ChatBox';

export default function ClientServiceDetailsPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [externalRef, setExternalRef] = useState('');
  
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');

  const router = useRouter();

  const loadService = () => {
    ServiceManager.getById(params.id).then(data => {
      setService(data);
      if (data.serviceRequest.budgetMax) {
        setPaymentAmount(data.serviceRequest.budgetMax);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadService();
  }, [params.id]);

  const handlePayment = async () => {
    try {
      await ServiceManager.registerPayment(params.id, Number(paymentAmount), paymentMethod, externalRef);
      alert('Pago registrado correctamente');
      loadService();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registrando pago');
    }
  };

  const handleRating = async () => {
    try {
      await ServiceManager.submitRating(params.id, ratingScore, ratingComment);
      alert('Calificación enviada exitosamente');
      loadService();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error enviando calificación');
    }
  };

  if (!service) return <div className="p-8">Cargando...</div>;

  const hasRated = service.ratings?.some((r: any) => r.fromUserId === service.clientId);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Servicio Confirmado</h1>
      <p className="text-gray-500 mb-6">Estado actual: <span className="font-bold">{service.status}</span></p>

      <div className="bg-white p-4 rounded shadow-sm border mb-6">
        <h2 className="text-lg font-bold mb-2">Detalles</h2>
        <p><strong>Solicitud:</strong> {service.serviceRequest.title}</p>
        <p><strong>Técnico ID:</strong> {service.technicianId}</p>
        <p><strong>Fecha Creación:</strong> {new Date(service.createdAt).toLocaleString()}</p>
      </div>

      {service.status === 'COMPLETED' && !service.payment && (
        <div className="bg-blue-50 p-6 rounded shadow-sm border border-blue-200 mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Registrar Pago al Técnico</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium">Método de Pago</label>
              <select className="border p-2 w-full rounded" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="CASH">Efectivo (CASH)</option>
                <option value="NEQUI">Nequi (NEQUI)</option>
                <option value="TRANSFER">Transferencia (TRANSFER)</option>
                <option value="OTHER">Otro (OTHER)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Monto Pagado (COP)</label>
              <input type="number" min="1" className="border p-2 w-full rounded" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
            </div>
            {(paymentMethod === 'NEQUI' || paymentMethod === 'TRANSFER') && (
              <div>
                <label className="block text-sm font-medium">Referencia (Opcional)</label>
                <input type="text" className="border p-2 w-full rounded" value={externalRef} onChange={e => setExternalRef(e.target.value)} />
              </div>
            )}
            <button onClick={handlePayment} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
              Confirmar Pago Realizado
            </button>
          </div>
        </div>
      )}

      {(service.status === 'PAID' || service.status === 'RATED') && service.payment && (
        <div className="bg-green-50 p-4 rounded shadow-sm border border-green-200 mb-6">
          <h2 className="text-lg font-bold text-green-900">Pago Registrado</h2>
          <p><strong>Monto:</strong> {service.payment.amount} {service.payment.currency}</p>
          <p><strong>Método:</strong> {service.payment.method}</p>
          {service.payment.externalReference && <p><strong>Ref:</strong> {service.payment.externalReference}</p>}
        </div>
      )}

      {(service.status === 'PAID' || service.status === 'RATED') && !hasRated && (
        <div className="bg-yellow-50 p-6 rounded shadow-sm border border-yellow-200 mb-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-900">Calificar al Técnico</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium">Calificación (1 a 5)</label>
              <select className="border p-2 w-full rounded" value={ratingScore} onChange={e => setRatingScore(Number(e.target.value))}>
                <option value={5}>⭐⭐⭐⭐⭐ (5) Excelente</option>
                <option value={4}>⭐⭐⭐⭐ (4) Muy Bueno</option>
                <option value={3}>⭐⭐⭐ (3) Bueno</option>
                <option value={2}>⭐⭐ (2) Regular</option>
                <option value={1}>⭐ (1) Malo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Comentario (Opcional)</label>
              <textarea className="border p-2 w-full rounded" rows={3} value={ratingComment} onChange={e => setRatingComment(e.target.value)}></textarea>
            </div>
            <button onClick={handleRating} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600">
              Enviar Calificación
            </button>
          </div>
        </div>
      )}

      {hasRated && (
        <div className="bg-gray-50 p-4 rounded shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-700">Ya calificaste este servicio</h2>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Chat con el Técnico</h2>
        <ChatBox 
          serviceId={params.id} 
          currentUserId={service.clientId}
          // Assuming token is saved in localStorage or cookie for auth (for MVP we'll just pull from localStorage)
          token={typeof window !== 'undefined' ? (document.cookie.split('jwt=')[1]?.split(';')[0] || '') : ''} 
        />
      </div>
    </div>
  );
}
