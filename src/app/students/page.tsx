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
import { differenceInYears } from 'date-fns';

export default function StudentsPage() {
  const getStudentCurrentGrade = (enrollmentDate: string, startingGrade: number) => {
    const yearsSinceEnrollment = differenceInYears(new Date(), new Date(enrollmentDate));
    const currentGrade = startingGrade + yearsSinceEnrollment;
    // Cap grade at 12
    return Math.min(currentGrade, 12);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profiles</CardTitle>
        <CardDescription>Manage student information and records.</CardDescription>
      </CardHeader>
      <CardContent>
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
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{getStudentCurrentGrade(student.enrollmentDate, student.startingGrade)}</TableCell>
                <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge></TableCell>
                <TableCell>{student.enrollmentDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
