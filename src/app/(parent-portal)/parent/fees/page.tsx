
'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { School } from 'lucide-react';
import { useStudentSelection } from '@/hooks/use-student-selection';
import { Skeleton } from '@/components/ui/skeleton';

type Fee = {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  term: string;
};

export default function ParentFeesPage() {
  const { selectedStudent, loading: studentLoading } = useStudentSelection();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreeEducation, setIsFreeEducation] = useState(false);

  useEffect(() => {
    if (!selectedStudent) {
        setFees([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);

    const feesRef = ref(database, `schools/${selectedStudent.schoolId}/fees`);
    const settingsRef = ref(database, `schools/${selectedStudent.schoolId}/settings/fees`);
    
    onValue(settingsRef, (settingsSnap) => {
        setIsFreeEducation(settingsSnap.val()?.isFreeEducation || false);
    });
    
    onValue(feesRef, (feesSnap) => {
        const data = feesSnap.val() || {};
        const list = Object.keys(data)
            .map(id => ({ id, ...data[id] }))
            .filter(fee => fee.studentId === selectedStudent.id)
            .map(fee => {
                if (fee.status === 'Pending' && new Date(fee.dueDate) < new Date()) {
                    return { ...fee, status: 'Overdue' };
                }
                return fee;
            })
            .sort((a,b) => b.term.localeCompare(a.term));
        setFees(list);
        setLoading(false);
    });

  }, [selectedStudent]);

  const getStatusBadge = (fee: Fee) => {
      const variant: "default" | "destructive" | "secondary" = fee.status === 'Paid' ? 'default' : fee.status === 'Overdue' ? 'destructive' : 'secondary';
      return <Badge variant={variant}>{fee.status}</Badge>;
  }
  
  const PageSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
    </div>
  )

  if (studentLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Information</h1>
            <CardDescription>
                {selectedStudent ? `Viewing fee history for ${selectedStudent.name}` : 'Please select a child to view their fee history.'}
            </CardDescription>
        </div>

        {!selectedStudent ? (
             <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
              <p>Please select a child from the header to view their fee information.</p>
          </div>
        ) : isFreeEducation ? (
            <Alert>
                <School className="h-4 w-4" />
                <AlertTitle>Free Education</AlertTitle>
                <AlertDescription>
                    This school provides free education. No fees are due for {selectedStudent.name}.
                </AlertDescription>
            </Alert>
        ) : (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Term</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading fee records...</TableCell></TableRow>
                        ) : fees.length > 0 ? (
                            fees.map((fee) => (
                                <TableRow key={fee.id}>
                                    <TableCell className="font-medium">{fee.term}</TableCell>
                                    <TableCell>ZMW {fee.amount.toFixed(2)}</TableCell>
                                    <TableCell>{format(new Date(fee.dueDate), 'PPP')}</TableCell>
                                    <TableCell>{getStatusBadge(fee)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" disabled={fee.status === 'Paid'}>Pay Now</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No fee records found for {selectedStudent.name}.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        )}
    </div>
  );
}
