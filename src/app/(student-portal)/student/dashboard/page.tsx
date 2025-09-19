
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
  FileText,
  CheckSquare,
  ClipboardList,
  CalendarDays
} from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Student = {
    id: string;
    name: string;
    className: string;
    classId: string;
    schoolId: string;
};

type Homework = {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
};

export default function StudentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [recentHomework, setRecentHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    // Find the student linked to the logged-in user
    const schoolsRef = ref(database, 'schools');
    get(schoolsRef).then(snapshot => {
        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            let foundStudent: Student | null = null;

            for (const schoolId in schoolsData) {
                if(foundStudent) break;
                const students = schoolsData[schoolId].students || {};
                for (const studentId in students) {
                    if (students[studentId].uid === user.uid) {
                        foundStudent = { id: studentId, ...students[studentId], schoolId };
                        break;
                    }
                }
            }
            
            if (foundStudent) {
                setStudent(foundStudent);
                // Fetch homework for the student's class
                const homeworkQuery = query(
                    ref(database, `schools/${foundStudent.schoolId}/homework`),
                    orderByChild('classId'),
                    equalTo(foundStudent.classId)
                );
                onValue(homeworkQuery, (homeworkSnapshot) => {
                    const data = homeworkSnapshot.val() || {};
                    const list = Object.keys(data)
                        .map(id => ({ id, ...data[id] }))
                        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                        .slice(0, 3); // Get latest 3
                    setRecentHomework(list);
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
              <p className="text-lg text-muted-foreground">Could not find your student information.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
       <section>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, <span className="font-semibold text-primary">{student.name}</span>! Here's your overview.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/student/results">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Results</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View your report cards and exam scores.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/student/attendance">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Check your daily attendance records.</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/student/homework">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Homework</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">View and submit your assignments.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/student/timetable">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Timetable</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">See your weekly class schedule.</p>
                </CardContent>
            </Card>
        </Link>
      </section>

      <div>
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Homework</CardTitle>
            </CardHeader>
            <CardContent>
                {recentHomework.length > 0 ? (
                    <div className="space-y-4">
                        {recentHomework.map(hw => (
                            <div key={hw.id} className="border-b pb-2">
                                <h3 className="font-semibold">{hw.title} <span className="text-sm text-muted-foreground">({hw.subjectName})</span></h3>
                                <p className="text-xs text-muted-foreground mt-1">Due on {new Date(hw.dueDate).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No upcoming homework.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
