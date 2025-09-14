
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';

type Teacher = { id: string; name: string };
type Class = { id: string; name: string };

export default function AssignClassTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const schoolUid = user.uid;
    const teachersRef = ref(database, `schools/${schoolUid}/teachers`);
    const classesRef = ref(database, `schools/${schoolUid}/classes`);

    const unsubscribeTeachers = onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map((id) => ({ id, ...data[id] })) : [];
      setTeachers(list);
    });

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map((id) => ({ id, ...data[id] })) : [];
      setClasses(list);
    });

    Promise.all([
        new Promise(res => onValue(teachersRef, res, { onlyOnce: true })),
        new Promise(res => onValue(classesRef, res, { onlyOnce: true }))
    ]).finally(() => setLoading(false));

    return () => {
      unsubscribeTeachers();
      unsubscribeClasses();
    };
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }

    const formData = new FormData(event.currentTarget);
    const teacherId = formData.get('teacher') as string;
    const classId = formData.get('class') as string;

    if (!teacherId || !classId) {
        toast({ title: 'Error', description: 'Please select both a teacher and a class.', variant: 'destructive' });
        return;
    }

    try {
        const classRef = ref(database, `schools/${user.uid}/classes/${classId}`);
        const snapshot = await get(classRef);
        if (snapshot.exists()) {
            const classData = snapshot.val();
            await set(classRef, { ...classData, classTeacherId: teacherId });
            toast({
                title: 'Success!',
                description: 'Class teacher has been assigned.',
            });
            router.push('/teachers');
        } else {
             throw new Error("Class not found.");
        }
    } catch (error: any) {
        console.error("Failed to assign class teacher:", error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Assign Class Teacher</CardTitle>
          <CardDescription>
            Select a teacher to manage a class's attendance and final results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select name="teacher" required>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                     <SelectItem value="loading" disabled>Loading teachers...</SelectItem>
                  ) : teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-teachers" disabled>
                      No teachers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
               <Select name="class" required>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                   {loading ? (
                     <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                  ) : classes.length > 0 ? (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>
                      No classes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>Assign Class Teacher</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
