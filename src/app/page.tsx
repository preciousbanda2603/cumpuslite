'use client';

import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookUser,
  Calendar,
  CreditCard,
  ClipboardList,
  Bell,
  Clock,
  BookOpen,
} from "lucide-react";
import { AnnouncementsWidget } from "@/components/announcements-widget";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Attendance",
    color: "hsl(var(--primary))",
  },
};

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin!</h1>
        <p className="text-muted-foreground">Here's a summary of your school's activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82</div>
            <p className="text-xs text-muted-foreground">+2 new hires this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Science Fair next week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW 125,430</div>
            <p className="text-xs text-muted-foreground">85% of total fees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AnnouncementsWidget />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Upcoming Homework</CardTitle>
            <CardDescription>Deadlines approaching soon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Maths - Algebra II</span>
                <span className="text-sm text-muted-foreground">Due in 2 days</span>
              </div>
              <Progress value={50} aria-label="50% progress on Algebra II homework" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">History - The Romans</span>
                <span className="text-sm text-muted-foreground">Due in 4 days</span>
              </div>
              <Progress value={20} aria-label="20% progress on The Romans homework" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Science - Photosynthesis Essay</span>
                <span className="text-sm text-muted-foreground">Due in 5 days</span>
              </div>
              <Progress value={80} aria-label="80% progress on Photosynthesis Essay" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Today's Schedule</CardTitle>
            <CardDescription>Classes and events for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Room</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>09:00 - 10:00</TableCell>
                  <TableCell>Mathematics</TableCell>
                  <TableCell>Mr. Armstrong</TableCell>
                  <TableCell className="text-right">201</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>10:00 - 11:00</TableCell>
                  <TableCell>Physics</TableCell>
                  <TableCell>Ms. Curie</TableCell>
                  <TableCell className="text-right">305</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>11:00 - 12:00</TableCell>
                  <TableCell>English Literature</TableCell>
                  <TableCell>Mrs. Woolf</TableCell>
                  <TableCell className="text-right">112</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>13:00 - 14:00</TableCell>
                  <TableCell>Assembly</TableCell>
                  <TableCell>Principal</TableCell>
                  <TableCell className="text-right">Auditorium</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
