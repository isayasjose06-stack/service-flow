'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@serviceflow/shared';
import Link from 'next/link';
import { Home, Clock, User, Briefcase } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.TECHNICIAN]}>
      <TechnicianNav>{children}</TechnicianNav>
    </ProtectedRoute>
  );
}

function TechnicianNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', href: '/technician/dashboard', icon: Home },
    { name: 'Historial', href: '/technician/history', icon: Clock },
    { name: 'Perfil', href: '/technician/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">App TÃ©cnico</span>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary-600" />
          <span className="text-lg font-bold text-gray-900">App TÃ©cnico</span>
        </header>
        
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-20 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-3 px-4 flex-1 ${
                isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
