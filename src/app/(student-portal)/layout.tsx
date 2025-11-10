
'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { ThemeProvider } from '@/components/theme-provider';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <div className={cn(
          "flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out",
          isSidebarCollapsed ? "md:ml-[80px]" : "md:ml-[220px] lg:ml-[280px]"
          )}>
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
