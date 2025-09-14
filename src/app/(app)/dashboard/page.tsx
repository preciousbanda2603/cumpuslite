
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  CalendarDays,
  Clapperboard,
  BookUser,
  Activity,
  ArrowRight,
  FileText,
  Megaphone,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="relative w-full h-80 rounded-lg overflow-hidden">
        <Image
          src="https://picsum.photos/seed/vr-classroom/1200/400"
          data-ai-hint="virtual reality classroom"
          alt="Virtual Reality Classroom"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to the Future of Education
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl">
            Experience immersive learning with our virtual reality platform.
            Manage your school effortlessly and step into the new era of
            education.
          </p>
          <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            Enter VR Classroom
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
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
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
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
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              +15 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">
              +2 new hires this month
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
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Science Fair next week
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
              <BarChart accessibilityLayer data={chartData}>
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
            <div className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">New Student Added</p>
                <p className="text-sm text-muted-foreground">
                  Sam Lee was enrolled in Grade 9.
                </p>
                <time className="text-xs text-muted-foreground">
                  10 minutes ago
                </time>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Grades Published</p>
                <p className="text-sm text-muted-foreground">
                  Physics mid-term results are now available.
                </p>
                <time className="text-xs text-muted-foreground">
                  1 hour ago
                </time>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-full">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">New Announcement</p>
                <p className="text-sm text-muted-foreground">
                  Soccer team tryouts next Tuesday.
                </p>
                <time className="text-xs text-muted-foreground">
                  2 hours ago
                </time>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
