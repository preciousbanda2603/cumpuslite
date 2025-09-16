
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

type Student = {
    id: string;
    name: string;
    className: string;
    classId: string;
    schoolId: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};


export default function ParentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Handle user not logged in
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Find the student linked to the logged-in parent
    const schoolsRef = ref(database, 'schools');
    get(schoolsRef).then(snapshot => {
        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            let foundStudent: Student | null = null;

            for (const schoolId in schoolsData) {
                if(foundStudent) break;
                const students = schoolsData[schoolId].students || {};
                for (const studentId in students) {
                    if (students[studentId].parentUid === user.uid) {
                        foundStudent = { id: studentId, ...students[studentId], schoolId };
                        break;
                    }
                }
            }
            
            if (foundStudent) {
                setStudent(foundStudent);
                // Fetch announcements for the student's school
                const announcementsRef = ref(database, `schools/${foundStudent.schoolId}/announcements`);
                onValue(announcementsRef, (announcementSnapshot) => {
                    const data = announcementSnapshot.val() || {};
                    const list = Object.keys(data)
                        .map(id => ({ id, ...data[id] }))
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3); // Get latest 3
                    setAnnouncements(list);
                });
            }
        }
    }).finally(() => setLoading(false));

  }, [user]);

  if (loading) {
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
  
  if (!user || !student) {
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
        <p className="text-muted-foreground">Welcome! Here's a quick overview for <span className="font-semibold text-primary">{student.name}</span> ({student.className}).</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/parent/results">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Results</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View report cards and exam scores.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/parent/attendance">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Check daily attendance records.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/parent/fees">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fees</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View invoices and payment status.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/parent/events">
            <Card className="hover:bg-muted/50 transition-colors">
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
                {announcements.length > 0 ? (
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
