
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { database } from '@/lib/firebase';
import { ref, onValue, query } from 'firebase/database';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentSelection } from '@/hooks/use-student-selection';


type AttendanceRecord = { [date: string]: 'present' | 'absent' | 'late' | 'sick' };

export default function ParentAttendancePage() {
  const { selectedStudent, loading: studentLoading } = useStudentSelection();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedStudent) {
      setLoading(false);
      setAttendance(null);
      return;
    };
    
    setLoading(true);

    const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

    const attendanceRef = query(
        ref(database, `schools/${selectedStudent.schoolId}/attendance/${selectedStudent.classId}`),
    );

    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const records: AttendanceRecord = {};
      if (snapshot.exists()) {
        snapshot.forEach(dateSnapshot => {
          const date = dateSnapshot.key;
          if(date && date >= monthStart && date <= monthEnd) {
            const data = dateSnapshot.val();
            if (data[selectedStudent.id]) {
              records[date] = data[selectedStudent.id];
            }
          }
        });
      }
      setAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedStudent, selectedDate]);
  
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

  if (studentLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-96 w-full" />
          </div>
      )
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Record</h1>
        <p className="text-muted-foreground">
          {selectedStudent ? `Viewing attendance for ${selectedStudent.name}` : 'Please select a child to view their attendance.'}
        </p>
      </div>

      {!selectedStudent ? (
           <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <p>Please select a child from the header to view their attendance record.</p>
          </div>
      ) : loading ? (
          <Skeleton className="h-96 w-full" />
      ) : (
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
      )}
    </div>
  );
}
