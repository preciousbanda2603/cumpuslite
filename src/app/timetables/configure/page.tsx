
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, PlusCircle, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useSchoolId } from '@/hooks/use-school-id';

type TimeSlot = {
  id: string;
  time: string;
};

export default function ConfigureTimeSlotsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;

    const timeSlotsRef = ref(database, `schools/${schoolId}/settings/timeSlots`);
    const unsubscribe = onValue(
      timeSlotsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setTimeSlots(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching time slots:', error);
        toast({ title: 'Error', description: 'Could not fetch time slots.', variant: 'destructive' });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, schoolId, toast]);

  const handleAddTimeSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTimeSlot.trim()) {
      toast({ title: 'Error', description: 'Time slot cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!user || !schoolId) return;

    try {
      const timeSlotsRef = ref(database, `schools/${schoolId}/settings/timeSlots`);
      const newSlotRef = push(timeSlotsRef);
      await set(newSlotRef, { time: newTimeSlot });
      toast({ title: 'Success!', description: 'New time slot has been added.' });
      setNewTimeSlot('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    if (!user || !schoolId) return;
    try {
      const slotRef = ref(database, `schools/${schoolId}/settings/timeSlots/${slotId}`);
      await remove(slotRef);
      toast({ title: 'Success!', description: 'Time slot has been deleted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="h-8 w-8" />
                Time Slot Configuration
            </h1>
            <p className="text-muted-foreground">
                Manage the time slots for class timetables.
            </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Back to Timetables
            </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>Add New Time Slot</CardTitle>
                <CardDescription>
                    Enter a time range for a class period.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddTimeSlot} className="flex items-end gap-2">
                    <div className="grid gap-2 flex-grow">
                        <Label htmlFor="time-slot">Time Slot</Label>
                        <Input 
                            id="time-slot" 
                            placeholder="e.g. 08:00 - 09:00"
                            value={newTimeSlot}
                            onChange={(e) => setNewTimeSlot(e.target.value)}
                        />
                    </div>
                    <Button type="submit">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add
                    </Button>
                </form>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Existing Time Slots</CardTitle>
            <CardDescription>
                A list of all configured time slots.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                ) : timeSlots.length > 0 ? (
                    timeSlots.map((slot) => (
                    <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.time}</TableCell>
                        <TableCell className="text-right">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteTimeSlot(slot.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No time slots configured.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
