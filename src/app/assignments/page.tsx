
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookCopy } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';

type Teacher = { id: string; name: string };
type Subject = { id: string; name: string; grade: number };
type Assignment = { subjectId: string; subjectName: string; grade: number; teacherId: string | null };

export default function SubjectAssignmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;
    setLoading(true);

    const teachersRef = ref(database, `schools/${schoolId}/teachers`);
    const subjectsRef = ref(database, `schools/${schoolId}/subjects`);
    const assignmentsRef = ref(database, `schools/${schoolId}/assignments`);

    const unsubscribeTeachers = onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
      setTeachers(list);
    });

    const fetchInitialData = async () => {
      try {
        const [subjectsSnapshot, assignmentsSnapshot] = await Promise.all([
          get(subjectsRef),
          get(assignmentsRef),
        ]);
        
        const subjectsData = subjectsSnapshot.val();
        const assignmentsData = assignmentsSnapshot.val() || {};

        if (subjectsData) {
          const subjectsList: Subject[] = Object.keys(subjectsData).map(id => ({ id, ...subjectsData[id] }));
          const newAssignments: Assignment[] = subjectsList.map(subject => ({
            subjectId: subject.id,
            subjectName: subject.name,
            grade: subject.grade,
            teacherId: assignmentsData[subject.id]?.teacherId || null,
          }));
          setAssignments(newAssignments);
        } else {
          setAssignments([]);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({ title: 'Error', description: 'Could not fetch initial subject and assignment data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();

    return () => {
      unsubscribeTeachers();
    };
  }, [user, schoolId, toast]);

  const handleTeacherChange = (subjectId: string, newTeacherId: string) => {
    setAssignments(prev =>
      prev.map(a => (a.subjectId === subjectId ? { ...a, teacherId: newTeacherId === 'unassigned' ? null : newTeacherId } : a))
    );
  };

  const handleSaveChanges = async () => {
    if (!user || !schoolId) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    const assignmentsRef = ref(database, `schools/${schoolId}/assignments`);
    try {
      const updates: { [key: string]: { teacherId: string | null } } = {};
      assignments.forEach(a => {
        updates[a.subjectId] = { teacherId: a.teacherId };
      });
      await set(assignmentsRef, updates);
      toast({ title: 'Success!', description: 'Subject assignments have been updated.' });
    } catch (error: any) {
      console.error("Failed to save assignments:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookCopy className="h-8 w-8" />
                Subject Assignments
            </h1>
            <p className="text-muted-foreground">Assign teachers to specific subjects for each grade.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Subject Teachers</CardTitle>
          <CardDescription>Assign or re-assign teachers to different subjects. Click 'Save Changes' to apply.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : assignments.length > 0 ? (
                  assignments.sort((a, b) => a.grade - b.grade).map(({ subjectId, subjectName, grade, teacherId }) => (
                    <TableRow key={subjectId}>
                      <TableCell className="font-medium">{subjectName}</TableCell>
                      <TableCell>Grade {grade}</TableCell>
                      <TableCell>
                        <Select
                          value={teacherId || 'unassigned'}
                          onValueChange={(newTeacherId) => handleTeacherChange(subjectId, newTeacherId)}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select a teacher">
                              {teachers.find(t => t.id === teacherId)?.name || 'Unassigned'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teachers.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-center">No subjects available to assign.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveChanges} disabled={loading}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
