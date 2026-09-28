'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Clock, User, Menu, X, LayoutDashboard, Wrench, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@serviceflow/shared';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
    { name: 'Solicitar Servicio', href: '/client/requests', icon: PlusCircle },
    { name: 'Mis Servicios', href: '/client/services', icon: Wrench },
    { name: 'Historial', href: '/client/history', icon: Clock },
    { name: 'Perfil', href: '/client/profile', icon: User },
  ];

  return (
    <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        
        {/* Mobile Top Navigation */}
        <header className="md:hidden bg-white shadow-sm z-30 sticky top-0 w-full flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ServiceFlow</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Slide-over Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl animate-in slide-in-from-left-full duration-300">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <span className="text-xl font-bold text-slate-900">Menú</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-700">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <nav className="mt-2 px-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 shadow-sm z-10 sticky top-0 h-screen">
          <div className="flex items-center h-20 px-8 border-b border-slate-100">
            <div className="bg-primary-600 p-2 rounded-xl shadow-sm shadow-primary-600/30">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-slate-900 tracking-tight">ServiceFlow</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6">
            <div className="px-6 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menú Principal</p>
            </div>
            <nav className="px-4 space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <button className="flex items-center w-full px-4 py-3 text-sm font-semibold text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100">
              <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden relative">
          <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 pb-safe z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center h-16 px-2">
            {navigation.slice(0, 4).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                    isActive ? 'text-primary-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {isActive && <div className="absolute top-0 w-8 h-1 bg-primary-600 rounded-b-full" />}
                  <item.icon className={`h-5 w-5 transition-transform ${isActive ? 'text-primary-600 scale-110' : 'text-slate-400'}`} />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary-700 font-semibold' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
