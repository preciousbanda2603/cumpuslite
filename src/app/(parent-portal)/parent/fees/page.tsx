
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
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { School } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  schoolId: string;
};
type Fee = {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  term: string;
};

export default function ParentFeesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isFreeEducation, setIsFreeEducation] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    get(schoolsRef).then(snapshot => {
        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            let foundStudent: Student | null = null;
            for (const schoolId in schoolsData) {
                const students = schoolsData[schoolId].students || {};
                for (const studentId in students) {
                    if (students[studentId].parentUid === user.uid) {
                        foundStudent = { id: studentId, name: students[studentId].name, schoolId };
                        break;
                    }
                }
                if (foundStudent) break;
            }
            
            if(foundStudent) {
                setStudent(foundStudent);
                const feesRef = ref(database, `schools/${foundStudent.schoolId}/fees`);
                const settingsRef = ref(database, `schools/${foundStudent.schoolId}/settings/fees`);
                
                onValue(settingsRef, (settingsSnap) => {
                    setIsFreeEducation(settingsSnap.val()?.isFreeEducation || false);
                });
                
                onValue(feesRef, (feesSnap) => {
                    const data = feesSnap.val() || {};
                    const list = Object.keys(data)
                        .map(id => ({ id, ...data[id] }))
                        .filter(fee => fee.studentId === foundStudent?.id)
                        .map(fee => {
                            if (fee.status === 'Pending' && new Date(fee.dueDate) < new Date()) {
                                return { ...fee, status: 'Overdue' };
                            }
                            return fee;
                        })
                        .sort((a,b) => b.term.localeCompare(a.term));
                    setFees(list);
                });
            }
        }
    }).finally(() => setLoading(false));

  }, [user]);

  const getStatusBadge = (fee: Fee) => {
      const variant: "default" | "destructive" | "secondary" = fee.status === 'Paid' ? 'default' : fee.status === 'Overdue' ? 'destructive' : 'secondary';
      return <Badge variant={variant}>{fee.status}</Badge>;
  }

  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Information</h1>
            <CardDescription>
                {student ? `Viewing fee history for ${student.name}` : 'Loading...'}
            </CardDescription>
        </div>

        {isFreeEducation && (
            <Alert>
                <School className="h-4 w-4" />
                <AlertTitle>Free Education</AlertTitle>
                <AlertDescription>
                    This school provides free education. No fees are due.
                </AlertDescription>
            </Alert>
        )}

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
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No fee records found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
