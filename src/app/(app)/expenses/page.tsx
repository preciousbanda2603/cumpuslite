
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
import { useToast } from '@/hooks/use-toast';
import { Receipt, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { format, parseISO } from 'date-fns';

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
};

const expenseCategories = ['Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Transport', 'Other'];

export default function ExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Expense[] = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
      setExpenses(list);
      setLoading(false);
    });

    return () => unsubscribeExpenses();
  }, [user, schoolId]);

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

    const expenseData = {
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
                    Expense Tracking
                </h1>
                <p className="text-muted-foreground">Record and manage all school expenditures.</p>
            </div>
            {isAdmin && (
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            )}
        </div>
        <Card>
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
                ) : expenses.length > 0 ? (
                    expenses.map((expense) => (
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
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No expenses recorded yet.</TableCell></TableRow>
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
