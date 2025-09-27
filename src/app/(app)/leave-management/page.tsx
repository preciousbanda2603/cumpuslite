
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';
import { useSchoolId } from '@/hooks/use-school-id';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { User } from 'firebase/auth';

type UserRole = 'admin' | 'teacher';

export default function LeaveManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;

    const determineUserRole = async () => {
      if (user.uid === schoolId) {
        setUserRole('admin');
        setLoading(false);
        return;
      }

      const teachersRef = ref(database, `schools/${schoolId}/teachers`);
      const snapshot = await get(teachersRef);
      if (snapshot.exists()) {
        const teachersData = snapshot.val();
        const foundTeacherId = Object.keys(teachersData).find(
          (id) => teachersData[id].uid === user.uid
        );
        if (foundTeacherId) {
          setUserRole('teacher');
          setTeacherId(foundTeacherId);
        }
      }
      setLoading(false);
    };

    determineUserRole();
  }, [user, schoolId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-8 w-8" />
            Leave Management
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin'
              ? 'Review and manage leave requests from all teachers.'
              : 'Submit and track your leave requests.'}
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              The leave management system is under construction. This page will soon allow you to request and manage leave.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              {userRole === 'admin'
                ? 'You will be able to view all pending requests, approve or reject them, and see a history of all leave taken by teachers.'
                : 'You will be able to submit a new leave request and see the status of your previous requests right here.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
