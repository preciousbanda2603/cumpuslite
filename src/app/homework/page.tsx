
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, PlusCircle, Edit, Trash2, CalendarIcon } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Homework = {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  subjectName: string;
  dueDate: string;
};
type Class = { id: string; name: string, grade: number };
type Subject = { id: string; name: string, grade: number };

export default function HomeworkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Partial<Homework> | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const schoolUid = user.uid;
    const homeworkRef = ref(database, `schools/${schoolUid}/homework`);
    const classesRef = ref(database, `schools/${schoolUid}/classes`);

    const unsubscribeHomework = onValue(homeworkRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(id => ({ id, ...data[id] }));
      setHomework(list);
      setLoading(false);
    });

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    return () => {
      unsubscribeHomework();
      unsubscribeClasses();
    };
  }, [user]);

  const openDialog = (hw: Partial<Homework> | null = null) => {
    setEditingHomework(hw);
    setTitle(hw?.title || '');
    setDescription(hw?.description || '');
    setSelectedClassId(hw?.classId || '');
    setSubjectName(hw?.subjectName || '');
    setDueDate(hw?.dueDate ? new Date(hw.dueDate) : new Date());
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
      setIsDialogOpen(false);
      setEditingHomework(null);
      setTitle('');
      setDescription('');
      setSelectedClassId('');
      setSubjectName('');
      setDueDate(new Date());
  };

  const handleSubmit = async () => {
    if (!user || !title || !selectedClassId || !subjectName || !dueDate) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) {
      toast({ title: 'Error', description: 'Invalid class.', variant: 'destructive' });
      return;
    }
    
    const homeworkData = {
      title,
      description,
      classId: selectedClassId,
      className: selectedClass.name,
      subjectName,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
    };
    
    try {
      if (editingHomework?.id) {
        const homeworkRef = ref(database, `schools/${user.uid}/homework/${editingHomework.id}`);
        await set(homeworkRef, homeworkData);
        toast({ title: 'Success!', description: 'Homework updated successfully.' });
      } else {
        const homeworkRef = ref(database, `schools/${user.uid}/homework`);
        const newHomeworkRef = push(homeworkRef);
        await set(newHomeworkRef, homeworkData);
        toast({ title: 'Success!', description: 'Homework added successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save homework:", error);
      toast({ title: 'Error', description: 'Failed to save homework.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (homeworkId: string) => {
      if (!user) return;
      try {
          const homeworkRef = ref(database, `schools/${user.uid}/homework/${homeworkId}`);
          await remove(homeworkRef);
          toast({ title: 'Success!', description: 'Homework deleted.' });
      } catch (error) {
           console.error("Failed to delete homework:", error);
           toast({ title: 'Error', description: 'Failed to delete homework.', variant: 'destructive' });
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Homework & Assignments
          </h1>
          <p className="text-muted-foreground">Create and manage assignments for your classes.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Homework
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : homework.length > 0 ? (
                homework.map((hw) => (
                  <TableRow key={hw.id}>
                    <TableCell className="font-medium">{hw.title}</TableCell>
                    <TableCell>{hw.className}</TableCell>
                    <TableCell>{hw.subjectName}</TableCell>
                    <TableCell>{hw.dueDate}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openDialog(hw)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(hw.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center">No homework assignments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHomework?.id ? 'Edit Homework' : 'Add New Homework'}</DialogTitle>
            <DialogDescription>Fill in the details for the assignment.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger id="class"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="subject">Subject</Label>
                 <Input id="subject" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" />
               </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" onClick={handleSubmit}>{editingHomework?.id ? 'Save Changes' : 'Add Homework'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
