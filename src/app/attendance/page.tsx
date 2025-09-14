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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Tracking</CardTitle>
        <CardDescription>Record student attendance for Grade 10 - Mathematics.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-center">Late</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alex Johnson</TableCell>
              <TableCell className="text-center"><Checkbox id="p1" /></TableCell>
              <TableCell className="text-center"><Checkbox id="a1" /></TableCell>
              <TableCell className="text-center"><Checkbox id="l1" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Emily White</TableCell>
              <TableCell className="text-center"><Checkbox id="p2" /></TableCell>
              <TableCell className="text-center"><Checkbox id="a2" /></TableCell>
              <TableCell className="text-center"><Checkbox id="l2" /></TableCell>
            </TableRow>
             <TableRow>
              <TableCell>John Davis</TableCell>
              <TableCell className="text-center"><Checkbox id="p3" /></TableCell>
              <TableCell className="text-center"><Checkbox id="a3" /></TableCell>
              <TableCell className="text-center"><Checkbox id="l3" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex justify-end mt-6">
            <Button>Submit Attendance</Button>
        </div>
      </CardContent>
    </Card>
  );
}
