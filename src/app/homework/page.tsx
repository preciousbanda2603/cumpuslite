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

export default function HomeworkPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homework & Assignments</CardTitle>
        <CardDescription>View and submit your assignments online.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Mathematics</TableCell>
              <TableCell>Algebra II Worksheet</TableCell>
              <TableCell>2024-12-18</TableCell>
              <TableCell><Badge variant="secondary">Not Submitted</Badge></TableCell>
              <TableCell><Button size="sm">Submit</Button></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>History</TableCell>
              <TableCell>The Romans Essay</TableCell>
              <TableCell>2024-12-20</TableCell>
              <TableCell><Badge variant="outline">Submitted</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" disabled>View</Button></TableCell>
            </TableRow>
             <TableRow>
              <TableCell>Science</TableCell>
              <TableCell>Photosynthesis Lab Report</TableCell>
              <TableCell>2024-12-15</TableCell>
              <TableCell><Badge>Graded (A-)</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
