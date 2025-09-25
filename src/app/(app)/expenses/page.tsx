
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Receipt, PlusCircle, Edit, Trash2, CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
};

type Payment = {
  amount: number;
  date: string; // ISO String
};
type Fee = {
  id: string;
  payments?: { [paymentId: string]: Payment };
};
type Income = {
    id: string;
    amount: number;
    date: string; // YYYY-MM-DD
};


const expenseCategories = ['Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Transport', 'Other'];

export default function ExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Filtering state
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        setUser(user);
        if (user && schoolId) {
            setIsAdmin(user.uid === schoolId);
        }
    });
    return () => unsubscribeAuth();
  }, [schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;
    setLoading(true);

    const expensesRef = ref(database, `schools/${schoolId}/expenses`);
    const feesRef = ref(database, `schools/${schoolId}/fees`);
    const incomeRef = ref(database, `schools/${schoolId}/income`);

    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Expense[] = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
      setExpenses(list);
    });
    
    const unsubscribeFees = onValue(feesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Fee[] = Object.keys(data).map(id => ({ id, ...data[id] }));
      setFees(list);
    });

    const unsubscribeIncome = onValue(incomeRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list: Income[] = Object.keys(data).map(id => ({ id, ...data[id] }));
        setIncome(list);
    });

    Promise.all([
        new Promise(res => onValue(expensesRef, res, { onlyOnce: true })),
        new Promise(res => onValue(feesRef, res, { onlyOnce: true })),
        new Promise(res => onValue(incomeRef, res, { onlyOnce: true }))
    ]).finally(() => setLoading(false));

    return () => {
      unsubscribeExpenses();
      unsubscribeFees();
      unsubscribeIncome();
    }
  }, [user, schoolId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
        const date = parseISO(expense.expenseDate);
        const start = startDate ? new Date(startDate.setHours(0,0,0,0)) : null;
        const end = endDate ? new Date(endDate.setHours(23,59,59,999)) : null;
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
    });
  }, [expenses, startDate, endDate]);
  
  const financialSummary = useMemo(() => {
    const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
    const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

    const totalExpenditure = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);

    const feesIncome = fees.reduce((incomeTotal, fee) => {
        if (!fee.payments) return incomeTotal;
        const paymentsInDateRange = Object.values(fee.payments).filter(payment => {
            const paymentDate = parseISO(payment.date);
            if (start && paymentDate < start) return false;
            if (end && paymentDate > end) return false;
            return true;
        });
        return incomeTotal + paymentsInDateRange.reduce((paymentSum, p) => paymentSum + p.amount, 0);
    }, 0);

    const manualIncome = income.reduce((total, inc) => {
        const incDate = parseISO(inc.date);
        if (start && incDate < start) return total;
        if (end && incDate > end) return total;
        return total + inc.amount;
    }, 0);

    const totalIncome = feesIncome + manualIncome;

    const netIncome = totalIncome - totalExpenditure;
    const expenditurePercentage = totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenditure, netIncome, expenditurePercentage };
  }, [filteredExpenses, fees, income, startDate, endDate]);


  const openDialog = (expense: Partial<Expense> | null = null) => {
    setEditingExpense(expense);
    setTitle(expense?.title || '');
    setCategory(expense?.category || '');
    setAmount(expense?.amount?.toString() || '');
    setExpenseDate(expense?.expenseDate || format(new Date(), 'yyyy-MM-dd'));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    setTitle('');
    setCategory('');
    setAmount('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSubmit = async () => {
    if (!user || !schoolId || !title || !category || !amount || !expenseDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid amount.', variant: 'destructive' });
        return;
    }

    const expenseData: Omit<Expense, 'id'> = {
      title,
      category,
      amount: expenseAmount,
      expenseDate,
      createdAt: editingExpense?.id ? (editingExpense as Expense).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (editingExpense?.id) {
        const expenseRef = ref(database, `schools/${schoolId}/expenses/${editingExpense.id}`);
        await set(expenseRef, expenseData);
        toast({ title: 'Success!', description: 'Expense updated successfully.' });
      } else {
        const expensesRef = ref(database, `schools/${schoolId}/expenses`);
        const newExpenseRef = push(expensesRef);
        await set(newExpenseRef, expenseData);
        toast({ title: 'Success!', description: 'Expense recorded successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({ title: 'Error', description: 'Failed to save expense.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (expenseId: string) => {
      if (!user || !schoolId) return;
      try {
          const expenseRef = ref(database, `schools/${schoolId}/expenses/${expenseId}`);
          await remove(expenseRef);
          toast({ title: 'Success!', description: 'Expense deleted.' });
      } catch (error) {
           console.error("Failed to delete expense:", error);
           toast({ title: 'Error', description: 'Failed to delete expense.', variant: 'destructive' });
      }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Receipt className="h-8 w-8" />
                    Financial Overview
                </h1>
                <p className="text-muted-foreground">Manage school expenditures and view income analysis.</p>
            </div>
            {isAdmin && (
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            )}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Select a date range to analyze income and expenditure.</CardDescription>
                 <div className="flex flex-col md:flex-row gap-4 items-end pt-4">
                    <div className="grid gap-2">
                        <Label>Start Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full md:w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid gap-2">
                        <Label>End Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("w-full md:w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-lg p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-green-500" /> Total Income</div>
                        <p className="text-2xl font-bold">ZMW {financialSummary.totalIncome.toFixed(2)}</p>
                    </div>
                     <div className="border rounded-lg p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4 text-red-500"/> Total Expenditure</div>
                        <p className="text-2xl font-bold">ZMW {financialSummary.totalExpenditure.toFixed(2)}</p>
                    </div>
                     <div className="border rounded-lg p-4 flex flex-col justify-between">
                        <div className="text-sm text-muted-foreground">Net Income</div>
                        <p className={cn("text-2xl font-bold", financialSummary.netIncome >= 0 ? "text-green-600" : "text-red-600")}>
                           ZMW {financialSummary.netIncome.toFixed(2)}
                        </p>
                    </div>
               </div>
                <div className="mt-4 border rounded-lg p-4">
                    <Label className="text-sm text-muted-foreground">Expenditure as % of Income</Label>
                    <div className="flex items-center gap-4 mt-2">
                        <Progress value={financialSummary.expenditurePercentage} className="w-full" />
                        <span className="font-bold text-lg">{financialSummary.expenditurePercentage.toFixed(1)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Expense Log</CardTitle>
                <CardDescription>Detailed list of expenses for the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (ZMW)</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading expenses...</TableCell></TableRow>
                ) : filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell>{format(parseISO(expense.expenseDate), 'PPP')}</TableCell>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right">{expense.amount.toFixed(2)}</TableCell>
                        {isAdmin && (
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" onClick={() => openDialog(expense)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        )}
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No expenses recorded for the selected period.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingExpense?.id ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    <DialogDescription>Fill in the details for the expenditure.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title/Description</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly Electricity Bill"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (ZMW)</Label>
                            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1500.00" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="expenseDate">Date of Expense</Label>
                        <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>{editingExpense?.id ? 'Save Changes' : 'Add Expense'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
