'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import { User, Mail, Shield, LogOut, Star, Award, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TechnicianProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    authService.getMe()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      
      {/* Header Profile */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-4xl font-bold mb-4 relative">
          {user.firstName[0]}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
        <p className="text-gray-500 font-medium mt-1">Técnico Verificado</p>
        
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100 w-full justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xl">
              4.8 <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Calificación</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-900 font-bold text-xl">
              120+
            </div>
            <p className="text-xs text-gray-500 mt-1">Trabajos</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Correo Electrónico</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
        </div>
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Rol</p>
            <p className="font-medium text-gray-900">Técnico Especialista</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Nivel</p>
            <p className="font-medium text-gray-900">Premium</p>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100">
          <span className="font-medium text-gray-700">Notificaciones</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100">
          <span className="font-medium text-gray-700">Zona de Trabajo</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <span className="font-medium text-gray-700">Métodos de Cobro</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="w-full bg-white border border-red-200 text-red-600 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold hover:bg-red-50 transition-colors shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        Cerrar Sesión
      </button>

    </div>
  );
}
