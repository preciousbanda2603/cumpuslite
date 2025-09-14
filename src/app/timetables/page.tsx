
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
import { CalendarDays, PlusCircle } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import type { User } from 'firebase/auth';

type Class = { id: string; name: string };
type Subject = { id: string; name: string, grade: number };
type TimetableSlot = { subjectId: string | null };
type TimetableDay = { [time: string]: TimetableSlot };
type TimetableData = { [day: string]: TimetableDay };

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
];

export default function TimetablesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
    if (!user) return;
    const schoolUid = user.uid;
    const classesRef = ref(database, `schools/${schoolUid}/classes`);
    const subjectsRef = ref(database, `schools/${schoolUid}/subjects`);

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });
    
    const unsubscribeSubjects = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSubjects(Object.keys(data).map(id => ({ id, ...data[id] })));
    });
    
    setLoading(false);

    return () => {
      unsubscribeClasses();
      unsubscribeSubjects();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedClassId || !user) {
        setTimetable(null);
        return;
    };

    const timetableRef = ref(database, `schools/${user.uid}/timetables/${selectedClassId}`);
    get(timetableRef).then((snapshot) => {
      if (snapshot.exists()) {
        setTimetable(snapshot.val());
      } else {
        setTimetable(null);
      }
    });
  }, [selectedClassId, user]);
  
  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return '';
    return subjects.find(s => s.id === subjectId)?.name || 'N/A';
  };

  const handleOpenDialog = () => {
    setEditingTimetable(timetable || {});
    setIsDialogOpen(true);
  };
  
  const handleTimetableChange = (day: string, time: string, subjectId: string) => {
    setEditingTimetable(prev => {
        const newTimetable = { ...prev };
        if (!newTimetable[day]) newTimetable[day] = {};
        newTimetable[day][time] = { subjectId: subjectId === 'none' ? null : subjectId };
        return newTimetable;
    });
  };

  const handleSaveChanges = async () => {
    if (!user || !selectedClassId || !editingTimetable) return;

    const timetableRef = ref(database, `schools/${user.uid}/timetables/${selectedClassId}`);
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
            {selectedClassId && (
                <Button onClick={handleOpenDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Manage Timetable
                </Button>
            )}
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
            timetable ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    {daysOfWeek.map(day => <TableHead key={day}>{day}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map(time => (
                    <TableRow key={time}>
                      <TableCell>{time}</TableCell>
                      {daysOfWeek.map(day => (
                        <TableCell key={day}>
                            {getSubjectName(timetable[day]?.[time]?.subjectId)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    No timetable has been created for this class yet.
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
                        {timeSlots.map(time => (
                            <TableRow key={time}>
                                <TableCell className="font-medium">{time}</TableCell>
                                {daysOfWeek.map(day => (
                                    <TableCell key={day}>
                                        <Select
                                          value={editingTimetable?.[day]?.[time]?.subjectId || 'none'}
                                          onValueChange={(subjectId) => handleTimetableChange(day, time, subjectId)}
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
