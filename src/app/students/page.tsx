

'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import type { User } from "firebase/auth";

type Student = {
  id: string;
  name: string;
  className: string;
  enrollmentDate: string;
  status: 'Active' | 'Inactive';
};

export default function StudentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const studentsRef = ref(database, `schools/${user.uid}/students`);
    const unsubscribe = onValue(
      studentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          const studentsList: Student[] = Object.keys(studentsData).map((key) => ({
            id: key,
            ...studentsData[key],
          }));
          setStudents(studentsList);
        } else {
          setStudents([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Student Profiles</CardTitle>
          <CardDescription>Manage student information and records.</CardDescription>
        </div>
        <Link href="/students/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge></TableCell>
                    <TableCell>{student.enrollmentDate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No students found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
