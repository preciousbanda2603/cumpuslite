import Link from "next/link";
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
import { students } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function StudentsPage() {
  const getStudentCurrentGrade = (enrollmentDate: string, startingGrade: number) => {
    const enrollmentYear = new Date(enrollmentDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsPassed = currentYear - enrollmentYear;
    const currentGrade = startingGrade + yearsPassed;
    // Cap grade at 12
    return Math.min(currentGrade, 12);
  }

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
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{getStudentCurrentGrade(student.enrollmentDate, student.startingGrade)}</TableCell>
                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge></TableCell>
                    <TableCell>{student.enrollmentDate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
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
