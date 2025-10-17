
'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  Search,
  School,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { navLinks as adminNavLinks } from '@/lib/nav-links';
import { navLinks as parentNavLinks } from '@/lib/parent-nav-links';
import { navLinks as studentNavLinks } from '@/lib/student-nav-links';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import { Separator } from './ui/separator';
import { useSchoolId, SCHOOL_ID_LOCAL_STORAGE_KEY } from '@/hooks/use-school-id';
import { useStudentSelection } from '@/hooks/use-student-selection';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [schoolName, setSchoolName] = useState('Your School');
  const schoolId = useSchoolId();
  const { students, selectedStudent, selectStudent } = useStudentSelection();
  
  const isParentPortal = pathname.startsWith('/parent');
  const isStudentPortal = pathname.startsWith('/student');
  const navLinks = isParentPortal ? parentNavLinks : isStudentPortal ? studentNavLinks : adminNavLinks;
  
  const dashboardHref = isParentPortal ? '/parent/dashboard' : isStudentPortal ? '/student/dashboard' : '/dashboard';


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (schoolId) {
      const schoolRef = ref(database, `schools/${schoolId}`);
      const unsubscribe = onValue(schoolRef, (snapshot) => {
        if (snapshot.exists()) {
          setSchoolName(snapshot.val().name);
        } else {
          setSchoolName('School Not Found');
        }
      });
      return () => unsubscribe();
    }
  }, [schoolId]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      localStorage.removeItem(SCHOOL_ID_LOCAL_STORAGE_KEY);
      localStorage.removeItem('selected-student-id'); // Clear selected student on logout
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const visibleLinks = navLinks.filter(link => !link.isHidden);
  const mainLinks = visibleLinks.filter(link => !link.isSettings);
  const settingsLinks = visibleLinks.filter(link => link.isSettings);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <GraduationCap className="h-6 w-6 text-primary" />
                <span>Campus.ZM</span>
              </Link>
            </SheetTitle>
            <SheetDescription>
              A modern school management system.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            <ScrollArea className="h-full pr-4">
              <nav className="grid gap-2 text-lg font-medium pt-4">
                {mainLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        'mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                        isActive && 'bg-muted text-foreground'
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              {settingsLinks.length > 0 && (
              <div className="mt-4">
                  <Separator />
                  <p className="px-2 pt-4 text-sm font-semibold uppercase text-muted-foreground tracking-wider">Settings</p>
                    <nav className="grid gap-2 text-lg font-medium mt-2">
                      {settingsLinks.map((link) => {
                          const isActive = pathname.startsWith(link.href);
                          return (
                          <Link
                              key={link.label}
                              href={link.href}
                              className={cn(
                              'mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                              isActive && 'bg-muted text-foreground'
                              )}
                          >
                              <link.icon className="h-5 w-5" />
                              {link.label}
                          </Link>
                          );
                      })}
                  </nav>
              </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <div className="flex items-center gap-4">
           {!isParentPortal && (
             <Button variant="outline" className="flex items-center gap-2 cursor-default">
                <School className="h-4 w-4" />
                <span>{schoolName}</span>
              </Button>
           )}

           {isParentPortal && students.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedStudent ? selectedStudent.name : "Select a Child"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>My Children</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {students.map(student => (
                  <DropdownMenuItem key={student.id} onSelect={() => selectStudent(student)}>
                    {student.name} ({student.className})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
           )}
          
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} data-ai-hint="person avatar" alt="User" />
                <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isParentPortal && !isStudentPortal && <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => router.push('#')}>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
