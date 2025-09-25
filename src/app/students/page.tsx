

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
import { useSchoolId } from "@/hooks/use-school-id";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  enrollmentDate: string;
  status: 'Active' | 'Inactive';
  disabilities?: string;
};

export default function StudentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (user && schoolId) {
        setIsAdmin(user.uid === schoolId);
    }
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    const studentsRef = ref(database, `schools/${schoolId}/students`);
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
          setFilteredStudents(studentsList);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, schoolId]);

  useEffect(() => {
    const results = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.disabilities?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Student Profiles</CardTitle>
          <CardDescription>Manage student information and records.</CardDescription>
        </div>
        {isAdmin && (
            <Link href="/students/add">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
            </Button>
            </Link>
        )}
      </div>
      <Card>
        <CardHeader>
           <Input
            placeholder="Search by name, admission no, or disability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Disabilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge></TableCell>
                    <TableCell>{student.enrollmentDate}</TableCell>
                    <TableCell>{student.disabilities || 'None'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No students found.
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
