

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ChevronLeft } from 'lucide-react';
import { navLinks as adminNavLinks } from '@/lib/nav-links';
import { navLinks as parentNavLinks } from '@/lib/parent-nav-links';
import { navLinks as studentNavLinks } from '@/lib/student-nav-links';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from './ui/separator';
import { useSchoolId } from '@/hooks/use-school-id';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type ModuleSettings = { [key: string]: boolean };

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AppSidebar({ isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const schoolId = useSchoolId();
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings | null>(null);

  const isParentPortal = pathname.startsWith('/parent');
  const isStudentPortal = pathname.startsWith('/student');
  const navLinks = isParentPortal ? parentNavLinks : isStudentPortal ? studentNavLinks : adminNavLinks;
  
  const dashboardHref = isParentPortal ? "/parent/dashboard" : isStudentPortal ? "/student/dashboard" : "/dashboard";

  useEffect(() => {
    if (schoolId) {
      const settingsRef = ref(database, `schools/${schoolId}/settings/modules`);
      const unsubscribe = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setModuleSettings(snapshot.val());
        } else {
          setModuleSettings({}); // No settings means all are visible by default
        }
      });
      return () => unsubscribe();
    }
  }, [schoolId]);

  const visibleLinks = navLinks.filter(link => {
    if (link.isHidden) return false;
    if (moduleSettings) {
      const moduleId = link.href.substring(1);
      // If setting exists, use it. Otherwise, default to visible.
      return moduleSettings[moduleId] !== false;
    }
    return true; // Show if settings haven't loaded yet or don't exist
  });

  const mainLinks = visibleLinks.filter(link => !link.isSettings);
  const settingsLinks = visibleLinks.filter(link => link.isSettings);

  return (
    <TooltipProvider>
      <div className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-10 md:flex flex-col border-r bg-muted/40", 
        isCollapsed ? "w-[80px]" : "w-[220px] lg:w-[280px]", 
        "transition-[width] duration-300 ease-in-out"
        )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href={dashboardHref} className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-6 w-6 text-primary" />
              {!isCollapsed && <span className="">Campus.ZM</span>}
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {mainLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return isCollapsed ? (
                    <Tooltip key={link.label} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                            isActive && 'bg-accent text-accent-foreground',
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          <span className="sr-only">{link.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{link.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        isActive && 'bg-muted text-primary'
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              {!isCollapsed && settingsLinks.length > 0 && (
                  <div className="mt-4">
                      <Separator />
                      <p className="px-4 pt-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">Settings</p>
                       <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-2">
                          {settingsLinks.map((link) => {
                              const isActive = pathname.startsWith(link.href);
                              return (
                              <Link
                                  key={link.label}
                                  href={link.href}
                                  className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                  isActive && 'bg-muted text-primary'
                                  )}
                              >
                                  <link.icon className="h-4 w-4" />
                                  {link.label}
                              </Link>
                              );
                          })}
                      </nav>
                  </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-5 top-7 z-10 bg-background hover:bg-muted"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn("h-5 w-5", isCollapsed && "rotate-180")} />
        </Button>
      </div>
    </TooltipProvider>
  );
}
