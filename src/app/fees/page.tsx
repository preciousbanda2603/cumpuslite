
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get, push } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { PlusCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';

type Student = { id: string; name: string; className: string };
type Fee = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  term: string;
};
type FeeSettings = { defaultAmount: number; defaultDueDate: string };

export default function FeesPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [feeSettings, setFeeSettings] = useState<Partial<FeeSettings>>({});
  const [generateTerm, setGenerateTerm] = useState(`Term ${Math.ceil((new Date().getMonth() + 1) / 4)} ${new Date().getFullYear()}`);


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (user && schoolId) setIsAdmin(user.uid === schoolId);
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    setLoading(true);
    const feesRef = ref(database, `schools/${schoolId}/fees`);
    const settingsRef = ref(database, `schools/${schoolId}/settings/fees`);
    
    const unsubscribeFees = onValue(feesRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        // Simple check for overdue status
        const updatedList = list.map(fee => {
            if (fee.status === 'Pending' && new Date(fee.dueDate) < new Date()) {
                return { ...fee, status: 'Overdue' };
            }
            return fee;
        });
        setFees(updatedList);
        setLoading(false);
    });

    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            setFeeSettings(snapshot.val());
        }
    });

    return () => {
      unsubscribeFees();
      unsubscribeSettings();
    };
  }, [user, schoolId]);

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    try {
        const settingsRef = ref(database, `schools/${schoolId}/settings/fees`);
        await set(settingsRef, feeSettings);
        toast({ title: "Success", description: "Fee settings updated." });
        setIsSettingsOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  const handleGenerateInvoices = async () => {
    if (!isAdmin || !generateTerm.trim()) {
        toast({ title: "Error", description: "Term name is required.", variant: "destructive" });
        return;
    }
    if (!feeSettings.defaultAmount || !feeSettings.defaultDueDate) {
        toast({ title: "Error", description: "Please set the default fee amount and due date in settings first.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const studentsRef = ref(database, `schools/${schoolId}/students`);
        const studentsSnap = await get(studentsRef);
        if (!studentsSnap.exists()) {
            toast({ title: "No Students", description: "There are no students to generate invoices for.", variant: "destructive" });
            return;
        }

        const studentsData = studentsSnap.val();
        const feesRef = ref(database, `schools/${schoolId}/fees`);
        const existingFeesSnap = await get(feesRef);
        const existingFees = existingFeesSnap.val() || {};
        
        const newInvoices: Promise<void>[] = [];

        for (const studentId in studentsData) {
            const student = studentsData[studentId];
            // Check if an invoice for this student and term already exists
            const alreadyExists = Object.values(existingFees).some((fee: any) => fee.studentId === studentId && fee.term === generateTerm);
            
            if (!alreadyExists && student.status === 'Active') {
                const newFeeRef = push(feesRef);
                const invoicePromise = set(newFeeRef, {
                    studentId: studentId,
                    studentName: student.name,
                    className: student.className,
                    amount: feeSettings.defaultAmount,
                    dueDate: feeSettings.defaultDueDate,
                    status: 'Pending',
                    term: generateTerm,
                    createdAt: new Date().toISOString()
                });
                newInvoices.push(invoicePromise);
            }
        }
        
        await Promise.all(newInvoices);

        if (newInvoices.length > 0) {
           toast({ title: "Success", description: `${newInvoices.length} new invoices have been generated for ${generateTerm}.` });
        } else {
           toast({ title: "No New Invoices", description: `All active students already have an invoice for ${generateTerm}.` });
        }
        
    } catch (error) {
        console.error("Invoice generation failed:", error);
        toast({ title: "Error", description: "Failed to generate invoices.", variant: "destructive" });
    } finally {
        setLoading(false);
        setIsGenerateOpen(false);
    }
  };
  
  const handleMarkAsPaid = async (feeId: string) => {
    if (!isAdmin) return;
    const feeRef = ref(database, `schools/${schoolId}/fees/${feeId}/status`);
    try {
        await set(feeRef, 'Paid');
        toast({ title: "Success", description: "Fee marked as paid." });
    } catch (error) {
        toast({ title: "Error", description: "Could not update fee status.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Fee Collection</CardTitle>
                <CardDescription>Track student payments, generate invoices, and manage settings.</CardDescription>
            </div>
            {isAdmin && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)}><Edit className="mr-2 h-4 w-4"/> Settings</Button>
                    <Button onClick={() => setIsGenerateOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> Generate Invoices</Button>
                </div>
            )}
        </div>
        <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading fee records...</TableCell></TableRow>
                ) : fees.length > 0 ? (
                    fees.map((fee) => (
                        <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.studentName}</TableCell>
                            <TableCell>{fee.className}</TableCell>
                            <TableCell>{fee.term}</TableCell>
                            <TableCell>ZMW {fee.amount.toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(fee.dueDate), 'PPP')}</TableCell>
                            <TableCell>
                                <Badge variant={fee.status === 'Paid' ? 'default' : fee.status === 'Overdue' ? 'destructive' : 'secondary'}>
                                    {fee.status}
                                </Badge>
                            </TableCell>
                            {isAdmin && (
                                <TableCell className="text-right">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleMarkAsPaid(fee.id)}
                                        disabled={fee.status === 'Paid'}
                                    >
                                        Mark as Paid
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No fee records found. Try generating invoices.</TableCell></TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fee Settings</DialogTitle>
                    <DialogDescription>Set the default amount and due date for new invoices.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="default-amount">Default Fee Amount (ZMW)</Label>
                        <Input 
                            id="default-amount"
                            type="number"
                            value={feeSettings.defaultAmount || ''}
                            onChange={(e) => setFeeSettings(prev => ({ ...prev, defaultAmount: Number(e.target.value) }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="default-due-date">Default Due Date</Label>
                        <Input 
                             id="default-due-date"
                             type="date"
                             value={feeSettings.defaultDueDate || ''}
                             onChange={(e) => setFeeSettings(prev => ({ ...prev, defaultDueDate: e.target.value }))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSettings}>Save Settings</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Generate Invoices Dialog */}
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Termly Invoices</DialogTitle>
                    <DialogDescription>
                        This will create new 'Pending' invoices for all active students who don't already have one for the specified term.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="term-name">Term Name</Label>
                        <Input 
                            id="term-name"
                            value={generateTerm}
                            onChange={(e) => setGenerateTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p>Amount: ZMW {feeSettings.defaultAmount?.toFixed(2) || 'Not set'}</p>
                        <p>Due Date: {feeSettings.defaultDueDate ? format(new Date(feeSettings.defaultDueDate), 'PPP') : 'Not set'}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateInvoices} disabled={!feeSettings.defaultAmount || !feeSettings.defaultDueDate}>
                        Generate Invoices
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
