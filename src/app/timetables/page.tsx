
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, PlusCircle, Settings } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';

type Class = { id: string; name: string };
type Subject = { id: string; name: string, grade: number };
type TimeSlot = { id: string; time: string };
type TimetableSlot = { subjectId: string | null };
type TimetableDay = { [time: string]: TimetableSlot };
type TimetableData = { [day: string]: TimetableDay };

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablesPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<TimetableData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;
    const classesRef = ref(database, `schools/${schoolId}/classes`);
    const subjectsRef = ref(database, `schools/${schoolId}/subjects`);
    const timeSlotsRef = ref(database, `schools/${schoolId}/settings/timeSlots`);

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });
    
    const unsubscribeSubjects = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSubjects(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    const unsubscribeTimeSlots = onValue(timeSlotsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(id => ({ id, ...data[id] }));
      setTimeSlots(list);
    });
    
    setLoading(false);

    return () => {
      unsubscribeClasses();
      unsubscribeSubjects();
      unsubscribeTimeSlots();
    };
  }, [user, schoolId]);

  useEffect(() => {
    if (!selectedClassId || !user || !schoolId) {
        setTimetable(null);
        return;
    };

    const timetableRef = ref(database, `schools/${schoolId}/timetables/${selectedClassId}`);
    get(timetableRef).then((snapshot) => {
      if (snapshot.exists()) {
        setTimetable(snapshot.val());
      } else {
        setTimetable(null);
      }
    });
  }, [selectedClassId, user, schoolId]);
  
  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return '';
    return subjects.find(s => s.id === subjectId)?.name || 'N/A';
  };

  const handleOpenDialog = () => {
    if (timeSlots.length === 0) {
        toast({
            title: "Configuration Needed",
            description: "Please configure time slots before managing a timetable.",
            variant: "destructive"
        });
        return;
    }
    setEditingTimetable(timetable || {});
    setIsDialogOpen(true);
  };
  
  const handleTimetableChange = (day: string, time: string, subjectId: string) => {
    setEditingTimetable(prev => {
        const newTimetable = { ...prev };
        if (!newTimetable[day]) newTimetable[day] = {};
        newTimetable[day][time] = { subjectId: subjectId === 'none' ? null : subjectId };
        return newTimetable as TimetableData;
    });
  };

  const handleSaveChanges = async () => {
    if (!user || !schoolId || !selectedClassId || !editingTimetable) return;

    const timetableRef = ref(database, `schools/${schoolId}/timetables/${selectedClassId}`);
    try {
        await set(timetableRef, editingTimetable);
        setTimetable(editingTimetable);
        toast({ title: 'Success', description: 'Timetable updated successfully.' });
        setIsDialogOpen(false);
    } catch(error) {
        toast({ title: 'Error', description: 'Failed to save timetable.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            Class Timetables
        </h1>
        <p className="text-muted-foreground">View and manage schedules for each class.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div>
                 <CardTitle>View Timetable</CardTitle>
                 <CardDescription>Select a class to see its weekly schedule.</CardDescription>
            </div>
             <div className="flex items-center gap-2">
              <Link href="/timetables/configure">
                  <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Time Slots
                  </Button>
              </Link>
              {selectedClassId && (
                  <Button onClick={handleOpenDialog}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Manage Timetable
                  </Button>
              )}
            </div>
          </div>
          <div className="pt-4">
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
        </CardHeader>
        <CardContent>
          {selectedClassId ? (
            timetable && timeSlots.length > 0 ? (
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
                      <TableCell>{slot.time}</TableCell>
                      {daysOfWeek.map(day => (
                        <TableCell key={day}>
                            {getSubjectName(timetable[day]?.[slot.time]?.subjectId)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                   {timeSlots.length === 0 ? "No time slots configured. Please configure them first." : "No timetable has been created for this class yet."}
                </div>
            )
          ) : (
             <div className="text-center text-muted-foreground py-12">
                Please select a class to view the timetable.
             </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Manage Timetable</DialogTitle>
                  <DialogDescription>
                      Assign subjects to time slots for the selected class.
                  </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto py-4">
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
                                        <Select
                                          value={editingTimetable?.[day]?.[slot.time]?.subjectId || 'none'}
                                          onValueChange={(subjectId) => handleTimetableChange(day, slot.time, subjectId)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- None --</SelectItem>
                                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
