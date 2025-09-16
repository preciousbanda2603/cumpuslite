
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
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format, parseISO } from 'date-fns';

type SchoolEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
};

type Student = {
    schoolId: string;
}

export default function ParentEventsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
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
                        foundStudent = { schoolId };
                        break;
                    }
                }
                if (foundStudent) break;
            }
            setStudent(foundStudent);
            
            if (foundStudent) {
                 const eventsRef = ref(database, `schools/${foundStudent.schoolId}/events`);
                 const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    const list: SchoolEvent[] = Object.keys(data)
                        .map(id => ({ id, ...data[id] }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setEvents(list);
                    setLoading(false);
                });
                return () => unsubscribeEvents();
            } else {
                 setLoading(false);
            }
        } else {
            setLoading(false);
        }
    });
  }, [user]);
  
  const eventDays = events.map(event => parseISO(event.date));

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Events Calendar</h1>
            <p className="text-muted-foreground">Key school dates and deadlines.</p>
            </div>
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
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center pt-8">No upcoming events.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
