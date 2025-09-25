
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
import { ref, onValue, set, get, push, update } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { PlusCircle, Edit, Info, School } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Student = {
  id: string;
  name: string;
  className: string;
  status: 'Active' | 'Inactive';
};
type Payment = {
    id: string;
    amount: number;
    date: string;
};
type Fee = {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';
  term: string;
  amountPaid: number;
  payments?: { [paymentId: string]: Payment };
};
type FeeSettings = { defaultAmount: number; defaultDueDate: string; isFreeEducation?: boolean; };
type StudentFeeSummary = {
  student: Student;
  fees: { [term: string]: Fee | undefined };
};

const terms = ["Term 1", "Term 2", "Term 3"];

export default function FeesPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeSummaries, setFeeSummaries] = useState<StudentFeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');

  const [feeSettings, setFeeSettings] = useState<Partial<FeeSettings>>({});
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [generateTerm, setGenerateTerm] = useState(`Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`);

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
    const studentsRef = ref(database, `schools/${schoolId}/students`);
    const feesRef = ref(database, `schools/${schoolId}/fees`);
    const settingsRef = ref(database, `schools/${schoolId}/settings/fees`);
    
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        setStudents(list);
    });

    const unsubscribeFees = onValue(feesRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        const updatedList = list.map(fee => {
            if (fee.status === 'Pending' && new Date(fee.dueDate) < new Date()) {
                return { ...fee, status: 'Overdue' };
            }
            return fee;
        });
        setFees(updatedList);
    });

    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) setFeeSettings(snapshot.val());
    });

    Promise.all([
      get(studentsRef), get(feesRef), get(settingsRef)
    ]).finally(() => setLoading(false));

    return () => {
      unsubscribeStudents();
      unsubscribeFees();
      unsubscribeSettings();
    };
  }, [user, schoolId]);
  
  useEffect(() => {
    if (students.length > 0) {
      const summaries = students.map(student => {
        const studentFees: { [term: string]: Fee | undefined } = {};
        terms.forEach(term => {
          const termNameWithYear = `${term} ${currentYear}`;
          studentFees[term] = fees.find(f => f.studentId === student.id && f.term === termNameWithYear);
        });
        return { student, fees: studentFees };
      });
      setFeeSummaries(summaries);
    } else {
      setFeeSummaries([]);
    }
  }, [students, fees, currentYear]);

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
     if (feeSettings.isFreeEducation) {
        toast({ title: "Action Blocked", description: "Cannot generate invoices while 'Free Education' mode is active.", variant: "destructive" });
        return;
    }

    setLoading(true);
    const termNameWithYear = `${generateTerm} ${currentYear}`;
    
    try {
        const activeStudents = students.filter(s => s.status === 'Active');
        if (activeStudents.length === 0) {
            toast({ title: "No Active Students", description: "There are no active students to generate invoices for.", variant: "destructive" });
            return;
        }

        const feesRef = ref(database, `schools/${schoolId}/fees`);
        let newInvoiceCount = 0;

        const allPromises = activeStudents.map(student => {
            const alreadyExists = fees.some(fee => fee.studentId === student.id && fee.term === termNameWithYear);
            if (!alreadyExists) {
                newInvoiceCount++;
                const newFeeRef = push(feesRef);
                return set(newFeeRef, {
                    studentId: student.id,
                    studentName: student.name,
                    className: student.className,
                    amount: feeSettings.defaultAmount,
                    dueDate: feeSettings.defaultDueDate,
                    status: 'Pending',
                    term: termNameWithYear,
                    amountPaid: 0,
                    createdAt: new Date().toISOString()
                });
            }
            return Promise.resolve();
        });
        
        await Promise.all(allPromises);

        if (newInvoiceCount > 0) {
           toast({ title: "Success", description: `${newInvoiceCount} new invoices have been generated for ${termNameWithYear}.` });
        } else {
           toast({ title: "No New Invoices", description: `All active students already have an invoice for ${termNameWithYear}.` });
        }
        
    } catch (error) {
        console.error("Invoice generation failed:", error);
        toast({ title: "Error", description: "Failed to generate invoices.", variant: "destructive" });
    } finally {
        setLoading(false);
        setIsGenerateOpen(false);
    }
  };
  
  const handleAddPayment = async () => {
    if (!isAdmin || !selectedFee || !newPaymentAmount) return;

    const paymentAmount = parseFloat(newPaymentAmount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid payment amount.", variant: "destructive" });
        return;
    }
    
    const feeRef = ref(database, `schools/${schoolId}/fees/${selectedFee.id}`);
    const currentPaid = selectedFee.amountPaid || 0;
    const newTotalPaid = currentPaid + paymentAmount;
    const newStatus = newTotalPaid >= selectedFee.amount ? 'Paid' : 'Partially Paid';
    
    try {
        const paymentRef = push(ref(database, `schools/${schoolId}/fees/${selectedFee.id}/payments`));
        await set(paymentRef, {
            amount: paymentAmount,
            date: new Date().toISOString()
        });
        
        await update(feeRef, {
            amountPaid: newTotalPaid,
            status: newStatus
        });
        
        toast({ title: "Success", description: "Payment recorded successfully." });
        setNewPaymentAmount('');
        setIsDetailsOpen(false);
        setSelectedFee(null);

    } catch (error) {
        console.error("Failed to add payment:", error);
        toast({ title: "Error", description: "Could not record payment.", variant: "destructive" });
    }
  };
  
  const openDetailsDialog = (fee: Fee) => {
      setSelectedFee(fee);
      setIsDetailsOpen(true);
      setNewPaymentAmount('');
  }

  const getStatusBadge = (fee: Fee | undefined) => {
      if (!fee) return <Badge variant="secondary">N/A</Badge>;
      
      const variant: "default" | "destructive" | "secondary" = fee.status === 'Paid' ? 'default' : fee.status === 'Overdue' ? 'destructive' : fee.status === 'Partially Paid' ? 'secondary': 'secondary';
      if (fee.status === 'Partially Paid') {
         return <Badge variant="secondary">Partially Paid</Badge>
      }
      return <Badge variant={variant}>{fee.status}</Badge>;
  }

  const years = Array.from(new Set(fees.map(f => f.term.split(' ')[2]).filter(Boolean))).sort().reverse();
  if (!years.includes(new Date().getFullYear().toString())) {
      years.unshift(new Date().getFullYear().toString());
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
                <CardDescription>Track student payments, generate invoices, and manage settings.</CardDescription>
            </div>
            {isAdmin && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)}><Edit className="mr-2 h-4 w-4"/> Settings</Button>
                    <Button onClick={() => setIsGenerateOpen(true)} disabled={feeSettings.isFreeEducation}><PlusCircle className="mr-2 h-4 w-4"/> Generate Invoices</Button>
                </div>
            )}
        </div>

        {feeSettings.isFreeEducation && (
            <Alert>
                <School className="h-4 w-4" />
                <AlertTitle>Free Education Mode</AlertTitle>
                <AlertDescription>
                    This school is currently set to 'Free Education'. Fee collection and invoice generation are disabled.
                </AlertDescription>
            </Alert>
        )}

        <Card>
            <CardHeader>
                 <div className="flex items-center gap-4">
                    <div className="grid gap-2">
                        <Label>Academic Year</Label>
                        <Select value={currentYear} onValueChange={setCurrentYear}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            {terms.map(term => <TableHead key={term}>{term}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading fee records...</TableCell></TableRow>
                        ) : feeSummaries.length > 0 ? (
                            feeSummaries.map(({ student, fees }) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.className}</TableCell>
                                    {terms.map(term => (
                                        <TableCell key={term}>
                                            <div className="flex items-center gap-2">
                                            {getStatusBadge(fees[term])}
                                            {fees[term] && isAdmin && (
                                                <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(fees[term]!)}>
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            )}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No students found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fee Settings</DialogTitle>
                    <DialogDescription>Set the default amount and due date, or enable free education mode.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="default-amount">Default Fee Amount (ZMW)</Label>
                        <Input id="default-amount" type="number" value={feeSettings.defaultAmount || ''} onChange={(e) => setFeeSettings(prev => ({ ...prev, defaultAmount: Number(e.target.value) }))} disabled={feeSettings.isFreeEducation} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="default-due-date">Default Due Date</Label>
                        <Input id="default-due-date" type="date" value={feeSettings.defaultDueDate || ''} onChange={(e) => setFeeSettings(prev => ({ ...prev, defaultDueDate: e.target.value }))} disabled={feeSettings.isFreeEducation} />
                    </div>
                    <div className="flex items-center space-x-2 border-t pt-4 mt-2">
                        <Switch 
                            id="free-education-mode"
                            checked={feeSettings.isFreeEducation || false}
                            onCheckedChange={(checked) => setFeeSettings(prev => ({ ...prev, isFreeEducation: checked }))}
                         />
                        <Label htmlFor="free-education-mode">Enable Free Education Mode</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSettings}>Save Settings</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Termly Invoices</DialogTitle>
                    <DialogDescription>
                        This will create new 'Pending' invoices for all active students who don't already have one for the selected term and year.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="term-select">Term</Label>
                            <Select value={generateTerm} onValueChange={setGenerateTerm}>
                                <SelectTrigger id="term-select"><SelectValue /></SelectTrigger>
                                <SelectContent>{terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="year-select">Year</Label>
                             <Input id="year-select" value={currentYear} readOnly disabled />
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground border-t pt-4 mt-2">
                        <h4 className="font-semibold mb-2 text-foreground">Invoice Details</h4>
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

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invoice Details</DialogTitle>
                </DialogHeader>
                {selectedFee && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="font-semibold block">Student:</span> {students.find(s => s.id === selectedFee.studentId)?.name}</div>
                            <div><span className="font-semibold block">Term:</span> {selectedFee.term}</div>
                            <div><span className="font-semibold block">Total Due:</span> ZMW {selectedFee.amount.toFixed(2)}</div>
                            <div><span className="font-semibold block">Amount Paid:</span> ZMW {(selectedFee.amountPaid || 0).toFixed(2)}</div>
                            <div><span className="font-semibold block">Balance:</span> ZMW {(selectedFee.amount - (selectedFee.amountPaid || 0)).toFixed(2)}</div>
                            <div><span className="font-semibold block">Status:</span> {getStatusBadge(selectedFee)}</div>
                        </div>

                         <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Payment History</h4>
                            {selectedFee.payments ? (
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                {Object.values(selectedFee.payments).map(p => (
                                    <li key={p.id}>ZMW {p.amount.toFixed(2)} on {format(new Date(p.date), 'PPP')}</li>
                                ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                            )}
                        </div>

                        {selectedFee.status !== 'Paid' && (
                        <div className="border-t pt-4 space-y-2">
                             <h4 className="font-semibold">Record New Payment</h4>
                             <div className="flex items-center gap-2">
                                <Label htmlFor="payment-amount" className="sr-only">Amount</Label>
                                <Input 
                                    id="payment-amount"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={newPaymentAmount}
                                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                                />
                                <Button onClick={handleAddPayment}>Add Payment</Button>
                             </div>
                        </div>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
