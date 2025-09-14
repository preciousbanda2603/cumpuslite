
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookText, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';

type Subject = {
  id: string;
  name: string;
  grade: number;
};

export default function SubjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGrade, setNewSubjectGrade] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const subjectsRef = ref(database, `schools/${user.uid}/subjects`);
    const unsubscribe = onValue(
      subjectsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const subjectsData = snapshot.val();
          const subjectsList: Subject[] = Object.keys(subjectsData).map((key) => ({
            id: key,
            ...subjectsData[key],
          }));
          setSubjects(subjectsList);
        } else {
          setSubjects([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subjects:', error);
        toast({
          title: 'Error',
          description: 'Could not fetch subjects.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  const handleAddOrUpdateSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectGrade) {
      toast({ title: 'Error', description: 'Subject name and grade are required.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    const grade = parseInt(newSubjectGrade, 10);
    const subjectData = { name: newSubjectName, grade };

    try {
      if (editingSubject) {
        const subjectRef = ref(database, `schools/${user.uid}/subjects/${editingSubject.id}`);
        await set(subjectRef, subjectData);
        toast({ title: 'Success!', description: 'Subject has been updated.' });
      } else {
        const subjectsRef = ref(database, `schools/${user.uid}/subjects`);
        const newSubjectRef = push(subjectsRef);
        await set(newSubjectRef, subjectData);
        toast({ title: 'Success!', description: 'New subject has been added.' });
      }
      closeDialog();
    } catch (error: any) {
      console.error("Failed to save subject:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    try {
      const subjectRef = ref(database, `schools/${user.uid}/subjects/${subjectId}`);
      await remove(subjectRef);
      toast({ title: 'Success!', description: 'Subject has been deleted.' });
    } catch (error: any) {
      console.error("Failed to delete subject:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openDialog = (subject: Subject | null = null) => {
    setEditingSubject(subject);
    setNewSubjectName(subject ? subject.name : '');
    setNewSubjectGrade(subject ? String(subject.grade) : '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setNewSubjectName('');
    setNewSubjectGrade('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="h-8 w-8" />
            Subjects Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage the subjects offered by the school.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>
            View, edit, or delete existing subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">Loading subjects...</TableCell>
                </TableRow>
              ) : subjects.length > 0 ? (
                subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>Grade {subject.grade}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openDialog(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No subjects found. Add one to get started.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <DialogDescription>{editingSubject ? "Update the subject's details." : 'Enter the details for the new subject.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="col-span-3" placeholder="e.g. Chemistry" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade-select" className="text-right">Grade</Label>
              <Select value={newSubjectGrade} onValueChange={setNewSubjectGrade}>
                <SelectTrigger id="grade-select" className="col-span-3">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" onClick={handleAddOrUpdateSubject}>{editingSubject ? 'Save Changes' : 'Add Subject'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
