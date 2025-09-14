
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { FileText, PlusCircle, Edit, Trash2, CalendarIcon, Clock, FileQuestion, HelpCircle } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Exam = {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  subjectName: string;
  dueDate: string;
  duration: number; // in minutes
  questionCount: number;
  status: 'Available' | 'Unavailable';
};
type Class = { id: string; name: string };

export default function ExamsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [status, setStatus] = useState<'Available' | 'Unavailable'>('Available');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const schoolUid = user.uid;
    const examsRef = ref(database, `schools/${schoolUid}/exams`);
    const classesRef = ref(database, `schools/${schoolUid}/classes`);

    const unsubscribeExams = onValue(examsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(id => ({ id, ...data[id] }));
      setExams(list);
      setLoading(false);
    });

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    return () => {
      unsubscribeExams();
      unsubscribeClasses();
    };
  }, [user]);

  const openDialog = (exam: Partial<Exam> | null = null) => {
    setEditingExam(exam);
    setTitle(exam?.title || '');
    setDescription(exam?.description || '');
    setSelectedClassId(exam?.classId || '');
    setSubjectName(exam?.subjectName || '');
    setDueDate(exam?.dueDate ? new Date(exam.dueDate) : new Date());
    setDuration(exam?.duration?.toString() || '');
    setQuestionCount(exam?.questionCount?.toString() || '');
    setStatus(exam?.status || 'Available');
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
      setIsDialogOpen(false);
      setEditingExam(null);
      // Reset form state
      setTitle('');
      setDescription('');
      setSelectedClassId('');
      setSubjectName('');
      setDueDate(new Date());
      setDuration('');
      setQuestionCount('');
      setStatus('Available');
  };

  const handleSubmit = async () => {
    if (!user || !title || !selectedClassId || !subjectName || !dueDate || !duration || !questionCount) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) {
      toast({ title: 'Error', description: 'Invalid class selected.', variant: 'destructive' });
      return;
    }
    
    const examData = {
      title,
      description,
      classId: selectedClassId,
      className: selectedClass.name,
      subjectName,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      duration: parseInt(duration, 10),
      questionCount: parseInt(questionCount, 10),
      status,
      createdAt: new Date().toISOString(),
    };
    
    try {
      if (editingExam?.id) {
        const examRef = ref(database, `schools/${user.uid}/exams/${editingExam.id}`);
        await set(examRef, examData);
        toast({ title: 'Success!', description: 'Exam updated successfully.' });
      } else {
        const examsRef = ref(database, `schools/${user.uid}/exams`);
        const newExamRef = push(examsRef);
        await set(newExamRef, examData);
        toast({ title: 'Success!', description: 'Exam added successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save exam:", error);
      toast({ title: 'Error', description: 'Failed to save exam.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (examId: string) => {
      if (!user) return;
      try {
          const examRef = ref(database, `schools/${user.uid}/exams/${examId}`);
          await remove(examRef);
          toast({ title: 'Success!', description: 'Exam deleted.' });
      } catch (error) {
           console.error("Failed to delete exam:", error);
           toast({ title: 'Error', description: 'Failed to delete exam.', variant: 'destructive' });
      }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Quizzes & Exams
                </h1>
                <p className="text-muted-foreground">Your portal for online assessments.</p>
            </div>
            <Button onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Exam/Quiz
            </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
                <p className="text-muted-foreground col-span-full text-center">Loading exams...</p>
            ) : exams.length > 0 ? (
                exams.map(exam => (
                    <Card key={exam.id} className={cn(exam.status === 'Unavailable' && 'opacity-60')}>
                        <CardHeader>
                            <CardTitle>{exam.title}</CardTitle>
                            <CardDescription>{exam.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileQuestion className="h-4 w-4" /> {exam.questionCount} Questions</div>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {exam.duration} Minutes</div>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /> Due by {format(new Date(exam.dueDate), 'PPP')}</div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2">
                            <Button className="w-full" disabled={exam.status === 'Unavailable'}>
                                {exam.status === 'Available' ? 'Start Exam' : 'Not Available'}
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="w-full" onClick={() => openDialog(exam)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                <Button variant="destructive" className="w-full" onClick={() => handleDelete(exam.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center text-muted-foreground py-12">
                    No exams or quizzes have been created yet.
                </div>
            )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingExam?.id ? 'Edit Exam' : 'Add New Exam/Quiz'}</DialogTitle>
                <DialogDescription>Fill in the details for the assessment.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Term: Physics"/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Covering chapters 4-7."/>
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
                        <Input id="subject" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Physics" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="question-count">Number of Questions</Label>
                        <Input id="question-count" type="number" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} placeholder="e.g. 50" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 60" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(value: 'Available' | 'Unavailable') => setStatus(value)}>
                            <SelectTrigger id="status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Unavailable">Unavailable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="button" onClick={handleSubmit}>{editingExam?.id ? 'Save Changes' : 'Add Exam'}</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    