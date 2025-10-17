
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  CalendarDays,
  CreditCard,
  BookUser,
  Megaphone,
  UserPlus,
  FileText,
  CheckSquare
} from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useStudentSelection } from '@/hooks/use-student-selection';

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};


export default function ParentDashboardPage() {
  const { selectedStudent, students, loading: studentLoading } = useStudentSelection();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    if (selectedStudent) {
      setLoadingAnnouncements(true);
      const announcementsRef = ref(database, `schools/${selectedStudent.schoolId}/announcements`);
      const unsubscribe = onValue(announcementsRef, (announcementSnapshot) => {
          const data = announcementSnapshot.val() || {};
          const list = Object.keys(data)
              .map(id => ({ id, ...data[id] }))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3); // Get latest 3
          setAnnouncements(list);
          setLoadingAnnouncements(false);
      });
      return () => unsubscribe();
    } else {
        setAnnouncements([]);
        setLoadingAnnouncements(false);
    }
  }, [selectedStudent]);

  if (studentLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
              </div>
               <Skeleton className="h-64" />
          </div>
      );
  }
  
  if (students.length === 0) {
      return (
          <div className="text-center">
              <p className="text-lg text-muted-foreground">Could not find linked student information.</p>
              <p>Please ensure you have registered correctly and are linked to a student.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
       <section>
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        {selectedStudent ? (
             <p className="text-muted-foreground">Welcome! Here's a quick overview for <span className="font-semibold text-primary">{selectedStudent.name}</span> ({selectedStudent.className}).</p>
        ) : (
            <p className="text-muted-foreground">Welcome! Please select a child from the dropdown above to view their information.</p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/parent/results" className={!selectedStudent ? 'pointer-events-none' : ''}>
            <Card className={cn("hover:bg-muted/50 transition-colors", !selectedStudent && 'opacity-50')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Results</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View report cards and exam scores.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/parent/attendance" className={!selectedStudent ? 'pointer-events-none' : ''}>
            <Card className={cn("hover:bg-muted/50 transition-colors", !selectedStudent && 'opacity-50')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Check daily attendance records.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/parent/fees" className={!selectedStudent ? 'pointer-events-none' : ''}>
            <Card className={cn("hover:bg-muted/50 transition-colors", !selectedStudent && 'opacity-50')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fees</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View invoices and payment status.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/parent/events" className={!selectedStudent ? 'pointer-events-none' : ''}>
            <Card className={cn("hover:bg-muted/50 transition-colors", !selectedStudent && 'opacity-50')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">School Events</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">See the upcoming school calendar.</p>
                </CardContent>
            </Card>
        </Link>
      </section>

      <div>
        <Card>
            <CardHeader>
                <CardTitle>Recent School Announcements</CardTitle>
            </CardHeader>
            <CardContent>
                {!selectedStudent ? (
                    <p className="text-muted-foreground">Select a child to view school announcements.</p>
                ) : loadingAnnouncements ? (
                    <p className="text-muted-foreground">Loading announcements...</p>
                ) : announcements.length > 0 ? (
                    <div className="space-y-4">
                        {announcements.map(ann => (
                            <div key={ann.id} className="border-b pb-2">
                                <h3 className="font-semibold">{ann.title}</h3>
                                <p className="text-sm text-muted-foreground">{ann.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">Posted on {new Date(ann.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No recent announcements.</p>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
