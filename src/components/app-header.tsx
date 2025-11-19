
'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Menu,
  Search,
  School,
  ChevronDown,
  User,
  DoorOpen,
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
import { useEffect, useState, useCallback } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User as FirebaseUser } from 'firebase/auth';
import { Separator } from './ui/separator';
import { useSchoolId, SCHOOL_ID_LOCAL_STORAGE_KEY } from '@/hooks/use-school-id';
import { useStudentSelection } from '@/hooks/use-student-selection';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type ModuleSettings = { [key: string]: boolean };
type Student = { id: string; name: string };
type Class = { id: string; name: string };
type Room = { id: string; name: string };

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [schoolName, setSchoolName] = useState('Your School');
  const schoolId = useSchoolId();
  const { students: parentStudents, selectedStudent, selectStudent } = useStudentSelection();
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings | null>(null);
  const [openSearch, setOpenSearch] = useState(false);

  // Data for search
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const isParentPortal = pathname.startsWith('/parent');
  const isStudentPortal = pathname.startsWith('/student');
  const navLinks = isParentPortal ? parentNavLinks : isStudentPortal ? studentNavLinks : adminNavLinks;
  
  const dashboardHref = isParentPortal ? '/parent/dashboard' : isStudentPortal ? '/student/dashboard' : '/dashboard';

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenSearch((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (schoolId) {
      const schoolRef = ref(database, `schools/${schoolId}`);
      const studentsRef = ref(database, `schools/${schoolId}/students`);
      const classesRef = ref(database, `schools/${schoolId}/classes`);
      const roomsRef = ref(database, `schools/${schoolId}/rooms`);
      
      const unsubSchool = onValue(schoolRef, (snapshot) => {
        if (snapshot.exists()) {
          const schoolData = snapshot.val();
          setSchoolName(schoolData.name);
          setModuleSettings(schoolData.settings?.modules || {});
        } else {
          setSchoolName('School Not Found');
          setModuleSettings({});
        }
      });
      
      const unsubStudents = onValue(studentsRef, (snapshot) => {
          const data = snapshot.val() || {};
          setStudents(Object.keys(data).map(id => ({ id, ...data[id] })));
      });
      const unsubClasses = onValue(classesRef, (snapshot) => {
          const data = snapshot.val() || {};
          setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
      });
       const unsubRooms = onValue(roomsRef, (snapshot) => {
          const data = snapshot.val() || {};
          setRooms(Object.keys(data).map(id => ({ id, ...data[id] })));
      });

      return () => {
          unsubSchool();
          unsubStudents();
          unsubClasses();
          unsubRooms();
      };
    }
  }, [schoolId]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem(SCHOOL_ID_LOCAL_STORAGE_KEY);
      localStorage.removeItem('selected-student-id'); // Clear selected student on logout
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const visibleLinks = navLinks.filter(link => {
    if (link.isHidden) return false;
    if (moduleSettings) {
      const moduleId = link.href.substring(1);
      return moduleSettings[moduleId] !== false; // Default to visible if not set
    }
    return true; // Show if settings haven't loaded
  });

  const mainLinks = visibleLinks.filter(link => !link.isSettings);
  const settingsLinks = visibleLinks.filter(link => link.isSettings);

  const runCommand = useCallback((command: () => unknown) => {
    setOpenSearch(false)
    command()
  }, [])

  return (
    <>
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
                <span>Compass Lite</span>
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

           {isParentPortal && parentStudents.length > 0 && (
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
                {parentStudents.map(student => (
                  <DropdownMenuItem key={student.id} onSelect={() => selectStudent(student)}>
                    {student.name} ({student.className})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
           )}
          
            <div className="ml-auto flex-1 sm:flex-initial">
                 <Button
                    variant="outline"
                    className={cn(
                        "relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                    )}
                    onClick={() => setOpenSearch(true)}
                    >
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search...</span>
                    <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
            </div>
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
     <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Search students, classes, rooms, or pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Links">
            {visibleLinks.map((link) => (
              <CommandItem
                key={link.href}
                value={link.label}
                onSelect={() => {
                  runCommand(() => router.push(link.href as string))
                }}
              >
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
           <CommandGroup heading="Students">
            {students.map((student) => (
              <CommandItem
                key={student.id}
                value={student.name}
                onSelect={() => {
                  runCommand(() => router.push(`/students`))
                }}
              >
                <User className="mr-2 h-4 w-4" />
                {student.name}
              </CommandItem>
            ))}
          </CommandGroup>
           <CommandGroup heading="Classes">
            {classes.map((cls) => (
              <CommandItem
                key={cls.id}
                value={cls.name}
                onSelect={() => {
                  runCommand(() => router.push(`/classes/${cls.id}`))
                }}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                {cls.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Rooms">
            {rooms.map((room) => (
              <CommandItem
                key={room.id}
                value={room.name}
                onSelect={() => {
                  runCommand(() => router.push(`/rooms`))
                }}
              >
                <DoorOpen className="mr-2 h-4 w-4" />
                {room.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
