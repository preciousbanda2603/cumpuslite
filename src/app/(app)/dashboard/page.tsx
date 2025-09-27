
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
  Clapperboard,
  BookUser,
  Megaphone,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { auth, database } from '@/lib/firebase';
import { onValue, ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format, subMonths } from 'date-fns';
import { useSchoolId } from '@/hooks/use-school-id';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const chartConfig = {
  enrollments: {
    label: 'Students',
    color: 'hsl(var(--primary))',
  },
  students: {
    label: 'Students',
  },
  male: {
    label: 'Male',
    color: 'hsl(var(--chart-1))',
  },
  female: {
    label: 'Female',
    color: 'hsl(var(--chart-2))',
  },
};

type DashboardStats = {
  students: number;
  classes: number;
  teachers: number;
  events: number;
  maleStudents: number;
  femaleStudents: number;
};

type Student = { name: string; enrollmentDate: string; createdAt: string; gender?: 'Male' | 'Female' };
type Teacher = { name: string; createdAt: string; };
type Activity = { id: string, type: 'student' | 'teacher', text: string, time: string };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    classes: 0,
    teachers: 0,
    events: 0,
    maleStudents: 0,
    femaleStudents: 0,
  });
  const [chartData, setChartData] = useState<{ month: string, enrollments: number }[]>([]);
  const [genderChartData, setGenderChartData] = useState<{ name: string, value: number, fill: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;

    const processStudentData = (studentsData: { [key: string]: Student }) => {
      const studentsArray = Object.values(studentsData);
      const studentCount = studentsArray.length;
      const maleCount = studentsArray.filter(s => s.gender === 'Male').length;
      const femaleCount = studentsArray.filter(s => s.gender === 'Female').length;
      
      setStats(prevStats => ({ 
        ...prevStats, 
        students: studentCount,
        maleStudents: maleCount,
        femaleStudents: femaleCount
      }));

      setGenderChartData([
        { name: 'Male', value: maleCount, fill: 'hsl(var(--chart-1))' },
        { name: 'Female', value: femaleCount, fill: 'hsl(var(--chart-2))' },
      ]);


      // Chart Processing
      const enrollmentsByMonth: { [key: string]: number } = {};
      const today = new Date();
      const last6Months: { month: string, enrollments: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        enrollmentsByMonth[monthKey] = 0;
        last6Months.push({ month: format(monthDate, 'MMMM'), enrollments: 0 });
      }

      studentsArray.forEach(student => {
        if (student.enrollmentDate) {
          const enrollmentMonth = format(new Date(student.enrollmentDate), 'yyyy-MM');
          if (enrollmentsByMonth.hasOwnProperty(enrollmentMonth)) {
            enrollmentsByMonth[enrollmentMonth]++;
          }
        }
      });
      
      const updatedChartData = last6Months.map(data => {
        const yearMonthKey = format(subMonths(today, 5 - last6Months.findIndex(m => m.month === data.month)), 'yyyy-MM');
         return {
            ...data,
            enrollments: enrollmentsByMonth[yearMonthKey] || 0,
         };
      });

      setChartData(updatedChartData);
    };

    setLoading(true);
    const pathsToFetch = [
      { key: 'classes', path: `schools/${schoolId}/classes` },
      { key: 'teachers', path: `schools/${schoolId}/teachers` },
      { key: 'events', path: `schools/${schoolId}/events` },
    ];
    
    // Separate listener for students to handle complex processing
    const studentsRef = ref(database, `schools/${schoolId}/students`);
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
        const data = snapshot.val() || {};
        processStudentData(data);
    });

    const otherListeners = pathsToFetch.map(({ key, path }) => {
      const dbRef = ref(database, path);
      return onValue(dbRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        setStats((prevStats) => ({ ...prevStats, [key]: count }));
      });
    });

    const studentsActivityRef = query(ref(database, `schools/${schoolId}/students`), orderByChild('createdAt'), limitToLast(3));
    const teachersActivityRef = query(ref(database, `schools/${schoolId}/teachers`), orderByChild('createdAt'), limitToLast(2));

    const unsubscribeStudentsActivity = onValue(studentsActivityRef, (snapshot) => {
        const newActivities: Activity[] = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const student = childSnapshot.val() as Student;
                newActivities.push({
                    id: `student-${childSnapshot.key}`,
                    type: 'student',
                    text: `${student.name} was enrolled.`,
                    time: student.createdAt,
                });
            });
        }
        setRecentActivity(prev => [...prev.filter(a => a.type !== 'student'), ...newActivities].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    });
    
    const unsubscribeTeachersActivity = onValue(teachersActivityRef, (snapshot) => {
        const newActivities: Activity[] = [];
        if (snapshot.exists()) {
             snapshot.forEach(childSnapshot => {
                const teacher = childSnapshot.val() as Teacher;
                newActivities.push({
                    id: `teacher-${childSnapshot.key}`,
                    type: 'teacher',
                    text: `${teacher.name} joined the staff.`,
                    time: teacher.createdAt,
                });
            });
        }
        setRecentActivity(prev => [...prev.filter(a => a.type !== 'teacher'), ...newActivities].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    });
    
     Promise.all([
        get(studentsRef),
        ...pathsToFetch.map(({path}) => get(ref(database, path)))
    ]).finally(() => setLoading(false));

    return () => {
      unsubscribeStudents();
      otherListeners.forEach((unsubscribe) => unsubscribe());
      unsubscribeStudentsActivity();
      unsubscribeTeachersActivity();
    };
  }, [user, schoolId]);

  return (
    <div className="flex flex-col gap-8">
       <section>
        <h1 className="text-3xl font-bold tracking-tight">School Dashboard</h1>
        <p className="text-muted-foreground">An overview of your school's key metrics and activities.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[250px]">
              <RadialBarChart
                data={[{ name: 'students', value: stats.students, fill: 'hsl(var(--primary))' }]}
                startAngle={-90}
                endAngle={270}
                innerRadius="70%"
                outerRadius="100%"
                barSize={20}
              >
                <PolarAngleAxis type="number" domain={[0, stats.students > 0 ? stats.students : 1]} tick={false} />
                <RadialBar dataKey="value" background cornerRadius={10} />
                 <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
          <CardHeader className="items-center pb-6 -mt-12">
            <p className="text-5xl font-bold">{loading ? '...' : stats.students}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Student Gender Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[250px]">
              <RadialBarChart
                data={genderChartData}
                startAngle={-90}
                endAngle={270}
                innerRadius="70%"
                outerRadius="100%"
                barSize={20}
              >
                <PolarAngleAxis type="number" domain={[0, stats.students]} tick={false} />
                <RadialBar dataKey="value" background cornerRadius={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
          <CardHeader className="items-center pb-6 -mt-12">
             <div className="text-center">
              <p className="text-2xl font-bold">{loading ? '...' : `${stats.maleStudents} Male`}</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${stats.femaleStudents} Female`}</p>
             </div>
          </CardHeader>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[250px]">
              <RadialBarChart
                data={[{ name: 'teachers', value: stats.teachers, fill: 'hsl(var(--primary))' }]}
                startAngle={-90}
                endAngle={270}
                innerRadius="70%"
                outerRadius="100%"
                barSize={20}
              >
                <PolarAngleAxis type="number" domain={[0, stats.teachers > 0 ? stats.teachers : 1]} tick={false} />
                <RadialBar dataKey="value" background cornerRadius={10} />
                 <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
          <CardHeader className="items-center pb-6 -mt-12">
            <p className="text-5xl font-bold">{loading ? '...' : stats.teachers}</p>
          </CardHeader>
        </Card>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Enrollment Overview</CardTitle>
            <CardDescription>
              Monthly new student enrollments for the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[300px]">
              <BarChart accessibilityLayer data={chartData} >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              A log of recent system events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {loading ? (
                <div className="text-center text-muted-foreground pt-8">Loading activity...</div>
             ) : recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                       <div className="bg-muted rounded-full p-2">
                            {activity.type === 'student' ? <Users className="h-4 w-4 text-muted-foreground"/> : <BookUser className="h-4 w-4 text-muted-foreground"/>}
                       </div>
                       <div>
                            <p className="text-sm">{activity.text}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(activity.time), "PPp")}</p>
                       </div>
                    </div>
                ))
             ) : (
                <div className="text-center text-muted-foreground pt-8">
                    No recent activity.
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
