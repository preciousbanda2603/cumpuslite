
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
import { TrendingUp, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { format, parseISO } from 'date-fns';

type Income = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

const incomeCategories = ['Donation', 'Grant', 'Fundraiser', 'Other'];

export default function IncomePage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Partial<Income> | null>(null);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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

    const incomeRef = ref(database, `schools/${schoolId}/income`);
    const unsubscribeIncome = onValue(incomeRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Income[] = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setIncome(list);
      setLoading(false);
    });

    return () => unsubscribeIncome();
  }, [user, schoolId]);

  const openDialog = (incomeItem: Partial<Income> | null = null) => {
    setEditingIncome(incomeItem);
    setTitle(incomeItem?.title || '');
    setCategory(incomeItem?.category || '');
    setAmount(incomeItem?.amount?.toString() || '');
    setIncomeDate(incomeItem?.date || format(new Date(), 'yyyy-MM-dd'));
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingIncome(null);
    setTitle('');
    setCategory('');
    setAmount('');
    setIncomeDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSubmit = async () => {
    if (!user || !schoolId || !title || !category || !amount || !incomeDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const incomeAmount = parseFloat(amount);
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid amount.', variant: 'destructive' });
        return;
    }

    const incomeData = {
      title,
      category,
      amount: incomeAmount,
      date: incomeDate,
      createdAt: editingIncome?.id ? (editingIncome as Income).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (editingIncome?.id) {
        const incomeRef = ref(database, `schools/${schoolId}/income/${editingIncome.id}`);
        await set(incomeRef, incomeData);
        toast({ title: 'Success!', description: 'Income record updated successfully.' });
      } else {
        const incomeRef = ref(database, `schools/${schoolId}/income`);
        const newIncomeRef = push(incomeRef);
        await set(newIncomeRef, incomeData);
        toast({ title: 'Success!', description: 'Income recorded successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save income:", error);
      toast({ title: 'Error', description: 'Failed to save income record.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (incomeId: string) => {
      if (!user || !schoolId) return;
      try {
          const incomeRef = ref(database, `schools/${schoolId}/income/${incomeId}`);
          await remove(incomeRef);
          toast({ title: 'Success!', description: 'Income record deleted.' });
      } catch (error) {
           console.error("Failed to delete income:", error);
           toast({ title: 'Error', description: 'Failed to delete income record.', variant: 'destructive' });
      }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-8 w-8" />
                    Manual Income
                </h1>
                <p className="text-muted-foreground">Record income from sources other than school fees.</p>
            </div>
            {isAdmin && (
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Income
                </Button>
            )}
        </div>
        <Card>
             <CardHeader>
                <CardTitle>Income Log</CardTitle>
                <CardDescription>Detailed list of manually recorded income.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title/Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (ZMW)</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading income records...</TableCell></TableRow>
                ) : income.length > 0 ? (
                    income.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{format(parseISO(item.date), 'PPP')}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
                        {isAdmin && (
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" onClick={() => openDialog(item)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        )}
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No income has been recorded yet.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingIncome?.id ? 'Edit Income Record' : 'Add New Income'}</DialogTitle>
                    <DialogDescription>Fill in the details for the income source.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title/Source</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PTA Fundraiser"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {incomeCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (ZMW)</Label>
                            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000.00" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="incomeDate">Date Received</Label>
                        <Input id="incomeDate" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>{editingIncome?.id ? 'Save Changes' : 'Add Income'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
