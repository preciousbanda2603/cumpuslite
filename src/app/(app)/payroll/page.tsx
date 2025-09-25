
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
import { ref, onValue, set, update } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { DollarSign, CheckCheck, XCircle, Ban } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type Teacher = {
  id: string;
  name: string;
  salary?: number;
};

type PayrollStatus = 'Paid' | 'Pending' | 'Suspended';

type PayrollRecord = {
    id: string;
    teacherId: string;
    teacherName: string;
    amount: number;
    month: string;
    status: PayrollStatus;
};

export default function PayrollPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setSelectedMonth(month);
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (user && schoolId) setIsAdmin(user.uid === schoolId);
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    setLoading(true);
    const teachersRef = ref(database, `schools/${schoolId}/teachers`);
    const payrollRef = ref(database, `schools/${schoolId}/payroll`);
    
    const unsubscribeTeachers = onValue(teachersRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        setTeachers(list);
    });

    const unsubscribePayroll = onValue(payrollRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        setPayroll(list);
    });

    Promise.all([
      new Promise(res => onValue(teachersRef, res, { onlyOnce: true })),
      new Promise(res => onValue(payrollRef, res, { onlyOnce: true }))
    ]).finally(() => setLoading(false));

    return () => {
      unsubscribeTeachers();
      unsubscribePayroll();
    };
  }, [user, schoolId]);

  const handleStatusChange = async (teacherId: string, amount: number) => {
    if (!isAdmin) return;
    
    const recordId = `${teacherId}_${selectedMonth.replace(' ', '_')}`;
    const recordRef = ref(database, `schools/${schoolId}/payroll/${recordId}`);

    try {
        const existingRecord = payroll.find(p => p.id === recordId);
        const newStatus = existingRecord?.status === 'Paid' ? 'Pending' : 'Paid';
        
        await set(recordRef, {
            teacherId,
            teacherName: teachers.find(t => t.id === teacherId)?.name,
            amount: amount,
            month: selectedMonth,
            status: newStatus,
        });

        toast({ title: "Success", description: `Payment status updated to ${newStatus}.` });
    } catch (error) {
        toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleBulkUpdate = async (status: PayrollStatus) => {
      if (!isAdmin || teachers.length === 0) return;

      const updates: { [key: string]: any } = {};
      teachers.forEach(teacher => {
          if (teacher.salary) {
            const recordId = `${teacher.id}_${selectedMonth.replace(' ', '_')}`;
            updates[`/${recordId}`] = {
                teacherId: teacher.id,
                teacherName: teacher.name,
                amount: teacher.salary,
                month: selectedMonth,
                status: status,
            };
          }
      });

      if (Object.keys(updates).length === 0) {
        toast({ title: "No Action Taken", description: "No teachers with salaries found to update.", variant: "destructive"});
        return;
      }

      try {
          const payrollRef = ref(database, `schools/${schoolId}/payroll`);
          await update(payrollRef, updates);
          toast({ title: "Success", description: `All teachers marked as ${status}.` });
      } catch (error) {
          toast({ title: "Error", description: "Failed to perform bulk update.", variant: "destructive" });
      }
  };
  
  const getPaymentStatus = (teacherId: string): PayrollStatus => {
      const record = payroll.find(p => p.teacherId === teacherId && p.month === selectedMonth);
      return record ? record.status : 'Pending';
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <DollarSign className="h-8 w-8" />
                Payroll Management
            </h1>
            <CardDescription>Manage monthly salary payments for teachers.</CardDescription>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="grid gap-2">
                            <Label>Month</Label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm"><CheckCheck className="mr-2"/> Mark all Paid</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle><AlertDialogDescription>This will mark all teachers with a set salary as 'Paid' for {selectedMonth}. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdate('Paid')}>Confirm</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm"><XCircle className="mr-2"/> Mark all Pending</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle><AlertDialogDescription>This will mark all teachers with a set salary as 'Pending' for {selectedMonth}. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdate('Pending')}>Confirm</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm"><Ban className="mr-2"/> Mark all Suspended</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle><AlertDialogDescription>This will mark all teachers with a set salary as 'Suspended' for {selectedMonth}. Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdate('Suspended')}>Confirm</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher Name</TableHead>
                            <TableHead>Monthly Salary (ZMW)</TableHead>
                            <TableHead>Status for {selectedMonth}</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading payroll data...</TableCell></TableRow>
                        ) : teachers.length > 0 ? (
                            teachers.map((teacher) => {
                                const status = getPaymentStatus(teacher.id);
                                return (
                                <TableRow key={teacher.id}>
                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                    <TableCell>{teacher.salary ? `ZMW ${teacher.salary.toFixed(2)}` : 'Not Set'}</TableCell>
                                    <TableCell>
                                        <Badge variant={status === 'Paid' ? 'default' : status === 'Suspended' ? 'destructive' : 'secondary'}>{status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isAdmin && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="inline-block">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleStatusChange(teacher.id, teacher.salary!)}
                                                            disabled={!teacher.salary}
                                                        >
                                                            Mark as {status === 'Paid' ? 'Pending' : 'Paid'}
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                {!teacher.salary && (
                                                    <TooltipContent>
                                                        <p>Please set a salary for this teacher first.</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No teachers found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                </TooltipProvider>
            </CardContent>
        </Card>
    </div>
  );
}
