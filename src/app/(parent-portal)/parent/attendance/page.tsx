
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
import { Calendar } from '@/components/ui/calendar';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type Student = { id: string; name: string; classId: string, schoolId: string };
type AttendanceRecord = { [date: string]: 'present' | 'absent' | 'late' | 'sick' };

export default function ParentAttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    get(schoolsRef).then(snapshot => {
        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            let foundStudent: Student | null = null;
            for (const schoolId in schoolsData) {
                const students = schoolsData[schoolId].students || {};
                for (const studentId in students) {
                    if (students[studentId].parentUid === user.uid) {
                        foundStudent = { id: studentId, ...students[studentId], schoolId };
                        break;
                    }
                }
                if (foundStudent) break;
            }
            setStudent(foundStudent);
        }
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!student) return;

    const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

    const attendanceRef = query(
        ref(database, `schools/${student.schoolId}/attendance/${student.classId}`),
        orderByChild('date'),
    );

    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const records: AttendanceRecord = {};
      if (snapshot.exists()) {
        snapshot.forEach(dateSnapshot => {
          const date = dateSnapshot.key;
          if(date && date >= monthStart && date <= monthEnd) {
            const data = dateSnapshot.val();
            if (data[student.id]) {
              records[date] = data[student.id];
            }
          }
        });
      }
      setAttendance(records);
    });

    return () => unsubscribe();
  }, [student, selectedDate]);
  
  const getStatusForDay = (day: Date) => {
    if (!attendance) return 'default';
    const dateStr = format(day, 'yyyy-MM-dd');
    const status = attendance[dateStr];
    switch (status) {
      case 'present': return 'bg-green-200';
      case 'absent': return 'bg-red-200';
      case 'late': return 'bg-yellow-200';
      case 'sick': return 'bg-blue-200';
      default: return 'default';
    }
  };
  
   const getStatusBadge = (status: string | undefined) => {
      if (!status) return null;
      const variant: "default" | "destructive" | "secondary" = status === 'present' ? 'default' : status === 'absent' ? 'destructive' : 'secondary';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
  }


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Record</h1>
        <p className="text-muted-foreground">
          {student ? `Viewing attendance for ${student.name}` : 'Loading student information...'}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-0 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(day) => day && setSelectedDate(day)}
                        onMonthChange={setSelectedDate}
                        className="p-3"
                        modifiers={{
                           present: (day) => getStatusForDay(day) === 'bg-green-200',
                           absent: (day) => getStatusForDay(day) === 'bg-red-200',
                           late: (day) => getStatusForDay(day) === 'bg-yellow-200',
                           sick: (day) => getStatusForDay(day) === 'bg-blue-200',
                        }}
                        modifiersClassNames={{
                           present: 'bg-green-200 rounded-full',
                           absent: 'bg-red-200 rounded-full',
                           late: 'bg-yellow-200 rounded-full',
                           sick: 'bg-blue-200 rounded-full',
                        }}
                    />
                </CardContent>
            </Card>
        </div>
         <div>
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-200" /> Present</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-200" /> Absent</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-200" /> Late</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-200" /> Sick</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border" /> No Record</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
