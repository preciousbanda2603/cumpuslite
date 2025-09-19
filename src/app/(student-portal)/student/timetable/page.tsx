
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
import { useToast } from '@/hooks/use-toast';
import { CalendarDays } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { User } from 'firebase/auth';

type Student = { classId: string, schoolId: string };
type Subject = { id: string; name: string };
type TimeSlot = { id: string; time: string };
type TimetableSlot = { subjectId: string | null };
type TimetableDay = { [time: string]: TimetableSlot };
type TimetableData = { [day: string]: TimetableDay };

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentTimetablePage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const findStudent = async () => {
        const schoolsRef = ref(database, 'schools');
        const schoolsSnap = await get(schoolsRef);
        if (!schoolsSnap.exists()) return null;

        const schoolsData = schoolsSnap.val();
        for (const schoolId in schoolsData) {
            const students = schoolsData[schoolId].students || {};
            for (const studentId in students) {
                if (students[studentId].uid === user.uid) {
                    return { schoolId, classId: students[studentId].classId };
                }
            }
        }
        return null;
    };
    
    findStudent().then(foundStudent => {
        if (foundStudent) {
            setStudent(foundStudent);
        } else {
            setLoading(false);
            toast({ title: "Error", description: "Could not find your data.", variant: "destructive" });
        }
    });

  }, [user, toast]);

  useEffect(() => {
    if (!student) return;

    const { schoolId, classId } = student;
    const subjectsRef = ref(database, `schools/${schoolId}/subjects`);
    const timeSlotsRef = ref(database, `schools/${schoolId}/settings/timeSlots`);
    const timetableRef = ref(database, `schools/${schoolId}/timetables/${classId}`);

    const unsubSubjects = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSubjects(Object.keys(data).map(id => ({ id, ...data[id] })));
    });
    
    const unsubTimeSlots = onValue(timeSlotsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTimeSlots(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    const unsubTimetable = onValue(timetableRef, (snapshot) => {
      if (snapshot.exists()) {
        setTimetable(snapshot.val());
      }
      setLoading(false);
    });

    return () => {
        unsubSubjects();
        unsubTimeSlots();
        unsubTimetable();
    }

  }, [student]);
  
  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return '';
    return subjects.find(s => s.id === subjectId)?.name || 'N/A';
  };

  if (loading) {
      return <div>Loading timetable...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            My Timetable
        </h1>
        <p className="text-muted-foreground">Your weekly class schedule.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {timetable && timeSlots.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    {daysOfWeek.map(day => <TableHead key={day}>{day}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map(slot => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">{slot.time}</TableCell>
                      {daysOfWeek.map(day => (
                        <TableCell key={day}>
                            {getSubjectName(timetable[day]?.[slot.time]?.subjectId)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
                <div className="text-center text-muted-foreground py-24">
                   Your timetable has not been set up yet.
                </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
