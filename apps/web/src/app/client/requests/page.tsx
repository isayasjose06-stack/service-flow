'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceRequestService } from '@/services/service-request.service';
import { CatalogService } from '@/services/catalog.service';
import { Category } from '@/types/service-request';
import { Hammer, Wrench, Zap, Droplets, PaintRoller, Sparkles, Truck, Home, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const requestSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Describe con más detalle lo que necesitas'),
  addressText: z.string().min(5, 'Dirección requerida'),
  scheduledDate: z.string().min(1, 'Selecciona una fecha'),
  scheduledTime: z.string().min(1, 'Selecciona una hora'),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional()
});

type RequestFormData = z.infer<typeof requestSchema>;

const ICONS: Record<string, any> = {
  'Electricidad': Zap,
  'Plomería': Droplets,
  'Limpieza': Sparkles,
  'Pintura': PaintRoller,
  'Carpintería': Hammer,
  'Mudanza': Truck,
  'Hogar': Home,
  'Mantenimiento': Wrench
};

export default function RequestWizardPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema)
  });

  useEffect(() => {
    CatalogService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const onSubmit = async (data: RequestFormData) => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      await ServiceRequestService.create({
        categoryId: selectedCategory.id,
        title: data.title,
        description: data.description,
        latitude: -12.046374, // Lima dummy
        longitude: -77.042793,
        addressText: data.addressText,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax
      });
      router.push('/client/dashboard');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al crear la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name: string) => {
    const Icon = ICONS[name] || Wrench;
    return <Icon className="w-8 h-8 text-primary-600 mb-2" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* STEPS HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Solicitar Servicio</h1>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`flex items-center justify-center w-8 h-8 border-2 rounded-full mr-2 font-bold ${step >= 1 ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>1</span>
            <span className="font-medium">Categoría</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
          <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`flex items-center justify-center w-8 h-8 border-2 rounded-full mr-2 font-bold ${step >= 2 ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>2</span>
            <span className="font-medium">Detalles</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold mb-6">¿En qué te podemos ayudar hoy?</h2>
          
          {categories.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setStep(2); }}
                  className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-center group"
                >
                  <div className="p-3 bg-primary-50 rounded-full group-hover:scale-110 transition-transform">
                    {getIcon(cat.name)}
                  </div>
                  <span className="mt-4 font-medium text-gray-800">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
          <button 
            onClick={() => setStep(1)}
            className="flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a categorías
          </button>
          
          <div className="flex items-center mb-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
            <CheckCircle2 className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-primary-900">Categoría seleccionada</p>
              <p className="font-semibold text-primary-700">{selectedCategory?.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la solicitud</label>
              <input 
                {...register('title')} 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border" 
                placeholder="Ej. Reparación de tubería rota en el baño"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
              <textarea 
                {...register('description')} 
                rows={4}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border resize-none" 
                placeholder="Describe el problema, materiales que tienes, medidas, etc."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección completa</label>
              <input 
                {...register('addressText')} 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border" 
                placeholder="Calle, número, distrito, ciudad"
              />
              {errors.addressText && <p className="mt-1 text-sm text-red-600">{errors.addressText.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha preferida</label>
                <input 
                  type="date"
                  {...register('scheduledDate')} 
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border" 
                />
                {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora aproximada</label>
                <input 
                  type="time"
                  {...register('scheduledTime')} 
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border" 
                />
                {errors.scheduledTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledTime.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Mín. (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input 
                    type="number"
                    {...register('budgetMin')} 
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 pl-8 border" 
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Máx. (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input 
                    type="number"
                    {...register('budgetMax')} 
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 pl-8 border" 
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center"><Zap className="animate-pulse mr-2 w-5 h-5" /> Procesando...</span>
                ) : (
                  'Publicar Solicitud de Servicio'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}