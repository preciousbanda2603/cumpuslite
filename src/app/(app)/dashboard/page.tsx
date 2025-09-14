
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
  FileText,
  Megaphone,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { auth, database } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import type { User } from 'firebase/auth';

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--primary))',
  },
};

type DashboardStats = {
  students: number;
  classes: number;
  teachers: number;
  events: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    classes: 0,
    teachers: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const schoolUid = user.uid;
    const statsToFetch = [
      { key: 'students', path: `schools/${schoolUid}/students` },
      { key: 'classes', path: `schools/${schoolUid}/classes` },
      { key: 'teachers', path: `schools/${schoolUid}/teachers` },
      { key: 'events', path: `schools/${schoolUid}/events` },
    ];

    const listeners = statsToFetch.map(({ key, path }) => {
      const dbRef = ref(database, path);
      return onValue(dbRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        setStats((prevStats) => ({ ...prevStats, [key]: count }));
      }, (error) => {
        console.error(`Error fetching ${key}:`, error);
      });
    });

    // Cleanup listeners on component unmount
    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
       <section>
        <h1 className="text-3xl font-bold tracking-tight">School Dashboard</h1>
        <p className="text-muted-foreground">An overview of your school's key metrics and activities.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.students}</div>
            <p className="text-xs text-muted-foreground">
              {stats.students === 0 ? 'No students enrolled' : 'Currently enrolled'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Online Classes
            </CardTitle>
            <Clapperboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.classes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.classes === 0 ? 'No classes available' : 'Active classes'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.teachers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.teachers === 0 ? 'No teachers registered' : 'Currently active'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.events}</div>
            <p className="text-xs text-muted-foreground">
              {stats.events === 0 ? 'No upcoming events' : 'Scheduled events'}
            </p>
          </CardContent>
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
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
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
             <div className="text-center text-muted-foreground pt-8">
                No recent activity.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
