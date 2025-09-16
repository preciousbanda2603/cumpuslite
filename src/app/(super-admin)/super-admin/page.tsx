
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, School, BookUser } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';

type SchoolData = {
  id: string;
  name: string;
  address: string;
  studentCount: number;
  teacherCount: number;
};

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const totalStudents = schools.reduce((acc, school) => acc + school.studentCount, 0);
  const totalTeachers = schools.reduce((acc, school) => acc + school.teacherCount, 0);

  useEffect(() => {
    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    
    const unsubscribe = onValue(schoolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const schoolsList: SchoolData[] = Object.keys(schoolsData).map(key => {
          const school = schoolsData[key];
          return {
            id: key,
            name: school.name,
            address: school.address,
            studentCount: school.students ? Object.keys(school.students).length : 0,
            teacherCount: school.teachers ? Object.keys(school.teachers).length : 0,
          };
        });
        setSchools(schoolsList);
      } else {
        setSchools([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Ministry Dashboard</h1>
        <p className="text-muted-foreground">Live overview of all registered schools.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{schools.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalStudents}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalTeachers}</div>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Registered Schools</CardTitle>
          <CardDescription>A list of all schools on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Teachers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading data...</TableCell></TableRow>
              ) : schools.length > 0 ? (
                schools.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.address}</TableCell>
                    <TableCell>{school.studentCount}</TableCell>
                    <TableCell>{school.teacherCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center">No schools found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
