
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, CheckSquare } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Class = { id: string; name: string };
type Student = { id: string; name: string; classId: string; };
type AttendanceStatus = 'present' | 'absent' | 'late' | 'sick' | 'unmarked';
type AttendanceRecord = { [studentId: string]: AttendanceStatus };

export default function AttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const classesRef = ref(database, `schools/${user.uid}/classes`);
    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setClasses(list);
      setLoading(false);
    });
    return () => unsubscribeClasses();
  }, [user]);

  useEffect(() => {
    if (!selectedClassId || !user) {
      setStudents([]);
      return;
    }

    const studentsRef = ref(database, `schools/${user.uid}/students`);
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      const allStudents = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      const classStudents = allStudents.filter(s => s.classId === selectedClassId);
      setStudents(classStudents);
      
      const initialAttendance: AttendanceRecord = {};
      classStudents.forEach(student => {
        initialAttendance[student.id] = 'unmarked'; 
      });
      setAttendance(initialAttendance);
    });

    return () => unsubscribeStudents();
  }, [selectedClassId, user]);
  
  useEffect(() => {
    if (!selectedClassId || !date || !user) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const attendanceRef = ref(database, `schools/${user.uid}/attendance/${selectedClassId}/${formattedDate}`);
    
    get(attendanceRef).then((snapshot) => {
      if (snapshot.exists()) {
        setAttendance(snapshot.val());
      } else {
        const initialAttendance: AttendanceRecord = {};
        students.forEach(student => {
          initialAttendance[student.id] = 'unmarked';
        });
        setAttendance(initialAttendance);
      }
    });
  }, [selectedClassId, date, user, students]);


  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!user || !selectedClassId || !date) {
      toast({ title: 'Error', description: 'Please select a class and date.', variant: 'destructive' });
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const attendanceRef = ref(database, `schools/${user.uid}/attendance/${selectedClassId}/${formattedDate}`);

    try {
      await set(attendanceRef, attendance);
      toast({ title: 'Success', description: 'Attendance has been submitted successfully.' });
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      toast({ title: 'Error', description: 'Failed to submit attendance.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <CheckSquare className="h-8 w-8" />
                Attendance Tracking
            </h1>
            <p className="text-muted-foreground">Select a class and date to record student attendance.</p>
        </div>
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="class-select">Class</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger id="class-select" className="w-[250px]">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {loading ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[250px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {selectedClassId ? (
                <>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-center w-[100px]">Present</TableHead>
                        <TableHead className="text-center w-[100px]">Absent</TableHead>
                        <TableHead className="text-center w-[100px]">Late</TableHead>
                        <TableHead className="text-center w-[100px]">Sick</TableHead>
                        <TableHead className="text-center w-[100px]">Unmarked</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length > 0 ? students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell colSpan={5}>
                                    <RadioGroup
                                    value={attendance[student.id] || 'unmarked'}
                                    onValueChange={(value) => handleStatusChange(student.id, value as any)}
                                    className="flex justify-around"
                                    >
                                    <div className="flex items-center justify-center w-1/5">
                                        <RadioGroupItem value="present" id={`p-${student.id}`} />
                                    </div>
                                    <div className="flex items-center justify-center w-1/5">
                                        <RadioGroupItem value="absent" id={`a-${student.id}`} />
                                    </div>
                                    <div className="flex items-center justify-center w-1/5">
                                        <RadioGroupItem value="late" id={`l-${student.id}`} />
                                    </div>
                                    <div className="flex items-center justify-center w-1/5">
                                        <RadioGroupItem value="sick" id={`s-${student.id}`} />
                                    </div>
                                    <div className="flex items-center justify-center w-1/5">
                                        <RadioGroupItem value="unmarked" id={`u-${student.id}`} />
                                    </div>
                                    </RadioGroup>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No students enrolled in this class.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSubmit} disabled={students.length === 0}>Submit Attendance</Button>
                </div>
                </>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        Please select a class to view the attendance sheet.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
