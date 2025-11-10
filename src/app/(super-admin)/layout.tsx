
'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { ThemeProvider } from '@/components/theme-provider';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';

function SuperAdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      const superAdminEmail = 'adminenock@gmail.com';
      if (user && user.email === superAdminEmail) {
        setIsAuthorized(true);
      } else {
        router.replace('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <SuperAdminAuthGuard>
        <div
          className={`grid min-h-screen w-full md:grid-cols-[${
            isSidebarCollapsed ? '80px' : '220px'
          }_1fr] lg:grid-cols-[${isSidebarCollapsed ? '80px' : '280px'}_1fr] transition-[grid-template-columns] duration-300 ease-in-out`}
        >
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          <div className="flex flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SuperAdminAuthGuard>
    </ThemeProvider>
  );
}
