
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
import { ref, onValue, set } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Teacher = {
  id: string;
  name: string;
  salary?: number;
};

type PayrollRecord = {
    id: string;
    teacherId: string;
    teacherName: string;
    amount: number;
    month: string;
    status: 'Paid' | 'Pending';
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
  
  const getPaymentStatus = (teacherId: string) => {
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
            </CardHeader>
            <CardContent className="p-0">
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
                                    <TableCell>{teacher.salary?.toFixed(2) || 'Not Set'}</TableCell>
                                    <TableCell>
                                        <Badge variant={status === 'Paid' ? 'default' : 'secondary'}>{status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isAdmin && teacher.salary && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleStatusChange(teacher.id, teacher.salary!)}
                                            >
                                                Mark as {status === 'Paid' ? 'Pending' : 'Paid'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No teachers found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
