
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
import { BookOpen, PlusCircle, Edit, Trash2, CalendarIcon } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSchoolId } from '@/hooks/use-school-id';

type LessonPlan = {
  id: string;
  title: string;
  classId: string;
  className: string;
  subjectName: string;
  lessonDate: string;
  objectives: string;
  materials: string;
  activities: string;
  assessment: string;
};
type Class = { id: string; name: string };

export default function LessonPlansPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<LessonPlan> | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [lessonDate, setLessonDate] = useState<Date | undefined>(new Date());
  const [objectives, setObjectives] = useState('');
  const [materials, setMaterials] = useState('');
  const [activities, setActivities] = useState('');
  const [assessment, setAssessment] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;
    setLoading(true);

    const plansRef = ref(database, `schools/${schoolId}/lessonPlans`);
    const classesRef = ref(database, `schools/${schoolId}/classes`);

    const unsubscribePlans = onValue(plansRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map(id => ({ id, ...data[id] }));
      setLessonPlans(list);
      setLoading(false);
    });

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    return () => {
      unsubscribePlans();
      unsubscribeClasses();
    };
  }, [user, schoolId]);

  const openDialog = (plan: Partial<LessonPlan> | null = null) => {
    setEditingPlan(plan);
    setTitle(plan?.title || '');
    setSelectedClassId(plan?.classId || '');
    setSubjectName(plan?.subjectName || '');
    setLessonDate(plan?.lessonDate ? new Date(plan.lessonDate) : new Date());
    setObjectives(plan?.objectives || '');
    setMaterials(plan?.materials || '');
    setActivities(plan?.activities || '');
    setAssessment(plan?.assessment || '');
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
      setIsDialogOpen(false);
      setEditingPlan(null);
      // Reset form state
      setTitle('');
      setSelectedClassId('');
      setSubjectName('');
      setLessonDate(new Date());
      setObjectives('');
      setMaterials('');
      setActivities('');
      setAssessment('');
  };

  const handleSubmit = async () => {
    if (!user || !schoolId || !title || !selectedClassId || !subjectName || !lessonDate) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) {
      toast({ title: 'Error', description: 'Invalid class selected.', variant: 'destructive' });
      return;
    }
    
    const lessonPlanData = {
      title,
      classId: selectedClassId,
      className: selectedClass.name,
      subjectName,
      lessonDate: format(lessonDate, 'yyyy-MM-dd'),
      objectives,
      materials,
      activities,
      assessment,
      createdBy: user.uid,
      createdAt: editingPlan?.id ? (editingPlan as LessonPlan).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (editingPlan?.id) {
        const planRef = ref(database, `schools/${schoolId}/lessonPlans/${editingPlan.id}`);
        await set(planRef, lessonPlanData);
        toast({ title: 'Success!', description: 'Lesson plan updated successfully.' });
      } else {
        const plansRef = ref(database, `schools/${schoolId}/lessonPlans`);
        const newPlanRef = push(plansRef);
        await set(newPlanRef, lessonPlanData);
        toast({ title: 'Success!', description: 'Lesson plan created successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save lesson plan:", error);
      toast({ title: 'Error', description: 'Failed to save lesson plan.', variant: 'destructive' });
    }
  };
  
  const handleDelete = async (planId: string) => {
      if (!user || !schoolId) return;
      try {
          const planRef = ref(database, `schools/${schoolId}/lessonPlans/${planId}`);
          await remove(planRef);
          toast({ title: 'Success!', description: 'Lesson plan deleted.' });
      } catch (error) {
           console.error("Failed to delete lesson plan:", error);
           toast({ title: 'Error', description: 'Failed to delete lesson plan.', variant: 'destructive' });
      }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BookOpen className="h-8 w-8" />
                    Lesson Plans
                </h1>
                <p className="text-muted-foreground">Create, manage, and view lesson plans for all classes.</p>
            </div>
            <Button onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Lesson Plan
            </Button>
        </div>
        <Card>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Lesson Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : lessonPlans.length > 0 ? (
                    lessonPlans.map((plan) => (
                    <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.title}</TableCell>
                        <TableCell>{plan.className}</TableCell>
                        <TableCell>{plan.subjectName}</TableCell>
                        <TableCell>{format(new Date(plan.lessonDate), 'PPP')}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => openDialog(plan)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={5} className="text-center">No lesson plans found.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingPlan?.id ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}</DialogTitle>
                    <DialogDescription>Fill in the details for your lesson.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Lesson Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Algebra"/>
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
                        <Label>Lesson Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !lessonDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {lessonDate ? format(lessonDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={lessonDate} onSelect={setLessonDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="objectives">Learning Objectives</Label>
                        <Textarea id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="What will students be able to do after this lesson?"/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="materials">Materials & Resources</Label>
                        <Textarea id="materials" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="List all required materials, textbooks, or links."/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="activities">Activities & Procedures</Label>
                        <Textarea id="activities" value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="Describe the sequence of activities for the lesson."/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="assessment">Assessment Methods</Label>
                        <Textarea id="assessment" value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="How will you measure student understanding? (e.g., quiz, worksheet, class participation)"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>{editingPlan?.id ? 'Save Changes' : 'Create Plan'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
