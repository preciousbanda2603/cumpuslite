
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Landmark } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

type PaymentTransaction = {
  id: string;
  plan: 'basic' | 'premium';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  failureReason?: string;
  schoolId: string;
  schoolName?: string;
};

type School = {
  id: string;
  name: string;
};

export default function SuperAdminBillingPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    
    const unsubscribe = onValue(schoolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const schoolsList: School[] = Object.keys(schoolsData).map(key => ({
            id: key,
            name: schoolsData[key].name,
        }));
        setSchools(schoolsList);

        const allTransactions: PaymentTransaction[] = [];
        schoolsList.forEach(school => {
            const payments = schoolsData[school.id]?.payments || {};
            Object.keys(payments).forEach(paymentId => {
                allTransactions.push({
                    id: paymentId,
                    ...payments[paymentId],
                    schoolId: school.id,
                    schoolName: school.name,
                });
            });
        });

        allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(allTransactions);

      } else {
        setSchools([]);
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    return transactions.filter(tx => 
        tx.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const getStatusBadge = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8" />
            Platform Billing
        </h1>
        <p className="text-muted-foreground">A unified log of all subscription payments across all schools.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Search and view payment history from every school on the platform.
          </CardDescription>
          <div className="pt-2">
            <Input 
                placeholder="Search by School Name or Transaction ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount (ZMW)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID / Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading transactions...</TableCell></TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.schoolName}</TableCell>
                    <TableCell>{format(new Date(tx.createdAt), 'PPP p')}</TableCell>
                    <TableCell className="capitalize">{tx.plan}</TableCell>
                    <TableCell>{tx.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.status === 'failed' ? tx.failureReason : tx.id}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center h-24">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
