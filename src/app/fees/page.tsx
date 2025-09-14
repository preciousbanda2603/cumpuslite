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

export default function FeesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Collection</CardTitle>
        <CardDescription>Track student payments, generate invoices, and send reminders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alex Johnson</TableCell>
              <TableCell>INV-001</TableCell>
              <TableCell>$500.00</TableCell>
              <TableCell>2024-12-15</TableCell>
              <TableCell><Badge>Paid</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm">View Receipt</Button></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Maria Garcia</TableCell>
              <TableCell>INV-002</TableCell>
              <TableCell>$500.00</TableCell>
              <TableCell>2024-12-15</TableCell>
              <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm">Send Reminder</Button></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Sam Lee</TableCell>
              <TableCell>INV-003</TableCell>
              <TableCell>$500.00</TableCell>
              <TableCell>2024-12-15</TableCell>
              <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm">Send Reminder</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
