
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
import { useSchoolId } from '@/hooks/use-school-id';
import { auth, database } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';

type PaymentTransaction = {
  id: string;
  plan: 'basic' | 'premium';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  failureReason?: string;
};

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const paymentsRef = ref(database, `schools/${schoolId}/payments`);
    const unsubscribePayments = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: PaymentTransaction[] = Object.keys(data)
        .map((id) => ({ id, ...data[id] }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(list);
      setLoading(false);
    });

    return () => unsubscribePayments();
  }, [user, schoolId]);

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Billing & Payments
        </h1>
        <p className="text-muted-foreground">
          View your school's subscription payment history.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete log of all subscription payments made by your school.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount (ZMW)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Skeleton className="w-full h-8" />
                  </TableCell>
                </TableRow>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(new Date(tx.createdAt), 'PPP p')}</TableCell>
                    <TableCell className="capitalize">{tx.plan}</TableCell>
                    <TableCell>{tx.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.status === 'failed' ? tx.failureReason : tx.id}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No payment transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
