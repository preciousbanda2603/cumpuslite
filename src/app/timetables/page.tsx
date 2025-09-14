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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function TimetablesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Timetables</CardTitle>
        <CardDescription>View schedules for students, teachers, or classrooms.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="student">
            <TabsList>
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
                <TabsTrigger value="classroom">Classroom</TabsTrigger>
            </TabsList>
            <TabsContent value="student">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Monday</TableHead>
                        <TableHead>Tuesday</TableHead>
                        <TableHead>Wednesday</TableHead>
                        <TableHead>Thursday</TableHead>
                        <TableHead>Friday</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>09:00 - 10:00</TableCell>
                            <TableCell>Math</TableCell>
                            <TableCell>Science</TableCell>
                            <TableCell>English</TableCell>
                            <TableCell>Math</TableCell>
                            <TableCell>Art</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>10:00 - 11:00</TableCell>
                            <TableCell>History</TableCell>
                            <TableCell>Math</TableCell>
                            <TableCell>Science</TableCell>
                            <TableCell>English</TableCell>
                            <TableCell>PE</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
