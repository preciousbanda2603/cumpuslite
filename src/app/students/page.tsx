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

export default function StudentsPage() {
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
            <TableRow>
              <TableCell>Alex Johnson</TableCell>
              <TableCell>10</TableCell>
              <TableCell><Badge>Active</Badge></TableCell>
              <TableCell>2022-09-01</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Maria Garcia</TableCell>
              <TableCell>11</TableCell>
              <TableCell><Badge>Active</Badge></TableCell>
              <TableCell>2021-09-01</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Sam Lee</TableCell>
              <TableCell>9</TableCell>
              <TableCell><Badge variant="secondary">Withdrawn</Badge></TableCell>
              <TableCell>2023-09-01</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
