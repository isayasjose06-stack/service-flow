'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@serviceflow/shared';

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to correct dashboard if trying to access another role's route
      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'TECHNICIAN') router.push('/technician/dashboard');
      else router.push('/client/dashboard');
    }
  }, [isAuthenticated, isMounted, router, allowedRoles, user, pathname]);

  if (!isMounted || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
