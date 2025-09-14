
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSchoolId } from '@/hooks/use-school-id';

type SchoolEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
};

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<SchoolEvent> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;
    setLoading(true);
    const eventsRef = ref(database, `schools/${schoolId}/events`);
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: SchoolEvent[] = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(list);
      setLoading(false);
    });

    return () => unsubscribeEvents();
  }, [user, schoolId]);
  
  const openDialog = (event: Partial<SchoolEvent> | null = null) => {
    setEditingEvent(event);
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setDate(event?.date ? parseISO(event.date) : new Date());
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setDate(new Date());
  };

  const handleSubmit = async () => {
    if (!user || !schoolId || !title || !description || !date) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const eventData = {
      title,
      description,
      date: format(date, 'yyyy-MM-dd'),
    };

    try {
      if (editingEvent?.id) {
        const eventRef = ref(database, `schools/${schoolId}/events/${editingEvent.id}`);
        await set(eventRef, eventData);
        toast({ title: 'Success!', description: 'Event updated successfully.' });
      } else {
        const eventsRef = ref(database, `schools/${schoolId}/events`);
        const newEventRef = push(eventsRef);
        await set(newEventRef, eventData);
        toast({ title: 'Success!', description: 'Event added successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save event:", error);
      toast({ title: 'Error', description: 'Failed to save event.', variant: 'destructive' });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user || !schoolId) return;
    try {
      const eventRef = ref(database, `schools/${schoolId}/events/${eventId}`);
      await remove(eventRef);
      toast({ title: 'Success!', description: 'Event deleted.' });
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    }
  };
  
  const eventDays = events.map(event => parseISO(event.date));

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Events Calendar</h1>
            <p className="text-muted-foreground">Manage and view key school dates and deadlines.</p>
            </div>
            <Button onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Event
            </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-3 w-full"
                modifiers={{ events: eventDays }}
                modifiersClassNames={{
                  events: 'bg-primary/20 rounded-full',
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>A list of key dates and deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading events...</p>
              ) : events.length > 0 ? (
                events.map(event => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground rounded-md text-center p-2">
                      <p className="font-bold text-lg">{format(parseISO(event.date), 'dd')}</p>
                      <p className="text-xs">{format(parseISO(event.date), 'MMM')}</p>
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={() => openDialog(event)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center pt-8">No upcoming events.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent?.id ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>Fill in the details for the event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" onClick={handleSubmit}>{editingEvent?.id ? 'Save Changes' : 'Add Event'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
