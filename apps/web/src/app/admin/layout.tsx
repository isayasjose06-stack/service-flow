'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@serviceflow/shared';
import { 
  LayoutDashboard, Users, Wrench, ShieldCheck, 
  Tags, Bookmark, ClipboardList, Briefcase, 
  AlertTriangle, History, Menu, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/technicians', label: 'Technicians', icon: Wrench },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/subcategories', label: 'Subcategories', icon: Bookmark },
  { href: '/admin/service-requests', label: 'Service Requests', icon: ClipboardList },
  { href: '/admin/services', label: 'Services', icon: Briefcase },
  { href: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN' as UserRole) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-screen">Loading admin dashboard...</div>;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN' as UserRole) {
    return null; // Will redirect
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Generate breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b flex items-center justify-between">
          {isSidebarOpen && <span className="font-bold text-xl text-blue-600 truncate">Admin Panel</span>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center px-3 py-2 rounded-md font-medium transition-colors ${isActive ? 'bg-slate-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex items-center">
          <nav className="flex text-sm text-slate-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={crumb.href} className="inline-flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-slate-400" />}
                    {isLast ? (
                      <span className="text-slate-700 font-medium">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-blue-600 hover:underline">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
