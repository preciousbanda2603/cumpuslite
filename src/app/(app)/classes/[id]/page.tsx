
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get, set, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, BookUser, Edit, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ClassInfo = { id: string; name: string; classTeacherId?: string; grade: number };
type Teacher = { id: string; name: string };
type Student = { id: string; name: string; classId: string; };
type SubjectAssignment = {
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
};
type DialogState = {
  isOpen: boolean;
  type: 'classTeacher' | 'subjectTeacher' | null;
  data: any;
};

export default function ViewClassPage() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [classTeacher, setClassTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, type: null, data: null });
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !classId) return;
    const schoolUid = user.uid;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch All Teachers
        const teachersRef = ref(database, `schools/${schoolUid}/teachers`);
        const teachersSnap = await get(teachersRef);
        const teachersData = teachersSnap.val() || {};
        const teachersList: Teacher[] = Object.keys(teachersData).map(id => ({ id, ...teachersData[id] }));
        setAllTeachers(teachersList);

        // Fetch Class Info
        const classRef = ref(database, `schools/${schoolUid}/classes/${classId}`);
        const classSnap = await get(classRef);
        if (!classSnap.exists()) {
          toast({ title: 'Error', description: 'Class not found.', variant: 'destructive' });
          router.push('/grades');
          return;
        }
        const classData = { id: classId, ...classSnap.val() };
        setClassInfo(classData);

        if (classData.classTeacherId) {
          setClassTeacher(teachersList.find(t => t.id === classData.classTeacherId) || null);
        }

        // Fetch All Students and filter for the class
        const allStudentsRef = ref(database, `schools/${schoolUid}/students`);
        const allStudentsSnap = await get(allStudentsRef);
        const allStudentsData = allStudentsSnap.val() || {};
        const allStudentsList: Student[] = Object.keys(allStudentsData).map(id => ({ id, ...allStudentsData[id] }));
        setStudents(allStudentsList.filter(s => s.classId === classId));


        // Fetch Subjects and their Assignments for the class grade
        const subjectsQuery = query(ref(database, `schools/${schoolUid}/subjects`), orderByChild('grade'), equalTo(classData.grade));
        const subjectsSnap = await get(subjectsQuery);
        const subjectsData = subjectsSnap.val() || {};
        const subjectIds = Object.keys(subjectsData);

        const assignmentsRef = ref(database, `schools/${schoolUid}/assignments`);
        const assignmentsSnap = await get(assignmentsRef);
        const assignmentsData = assignmentsSnap.val() || {};

        const assignments: SubjectAssignment[] = subjectIds.map(subId => {
          const assignment = Object.values(assignmentsData).find((a: any) => a.subjectId === subId && a.classId === classId) as any;
          const teacher = teachersList.find(t => t.id === assignment?.teacherId);
          return {
            subjectId: subId,
            subjectName: subjectsData[subId].name,
            teacherId: assignment?.teacherId || null,
            teacherName: teacher?.name || 'Unassigned',
          };
        });
        setSubjectAssignments(assignments);

      } catch (error) {
        console.error("Error fetching class details:", error);
        toast({ title: 'Error', description: 'Failed to fetch class details.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, classId, router, toast]);

  const openDialog = (type: 'classTeacher' | 'subjectTeacher', data: any) => {
    setSelectedTeacherId(data.teacherId || '');
    setDialogState({ isOpen: true, type, data });
  };
  
  const closeDialog = () => setDialogState({ isOpen: false, type: null, data: null });

  const handleSaveChanges = async () => {
    if (!user || !dialogState.type || !selectedTeacherId) {
      toast({ title: 'Error', description: 'Please select a teacher.', variant: 'destructive' });
      return;
    }
    const schoolUid = user.uid;
    
    try {
      if (dialogState.type === 'classTeacher' && classInfo) {
        const classRef = ref(database, `schools/${schoolUid}/classes/${classInfo.id}`);
        await set(ref(database, `schools/${schoolUid}/classes/${classInfo.id}`), { ...classInfo, classTeacherId: selectedTeacherId });

        setClassTeacher(allTeachers.find(t => t.id === selectedTeacherId) || null);
        toast({ title: 'Success', description: 'Class teacher updated.' });
      } else if (dialogState.type === 'subjectTeacher') {
        const assignmentRef = ref(database, `schools/${schoolUid}/assignments/${classId}_${dialogState.data.subjectId}`);
        await set(assignmentRef, { classId: classId, subjectId: dialogState.data.subjectId, teacherId: selectedTeacherId });
        setSubjectAssignments(prev => prev.map(sa => sa.subjectId === dialogState.data.subjectId ? { ...sa, teacherId: selectedTeacherId, teacherName: allTeachers.find(t => t.id === selectedTeacherId)?.name || 'Unassigned' } : sa));
        toast({ title: 'Success', description: 'Subject teacher updated.' });
      }
      closeDialog();
    } catch (error) {
       console.error("Error saving changes:", error);
       toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (!classInfo) {
    return <div className="text-center text-muted-foreground">Class not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
        <div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Classes
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
                Class Overview: {classInfo.name}
            </h1>
            <p className="text-muted-foreground">Detailed view of the class, teachers, and students.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Class Teacher</span>
                        <Button variant="outline" size="icon" onClick={() => openDialog('classTeacher', { teacherId: classTeacher?.id })}>
                            <Edit className="h-4 w-4"/>
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={`https://picsum.photos/seed/${classTeacher?.id}/100/100`} data-ai-hint="teacher portrait" />
                        <AvatarFallback>{classTeacher?.name.split(' ').map(n => n[0]).join('') || 'N/A'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{classTeacher?.name || 'Unassigned'}</p>
                        <p className="text-sm text-muted-foreground">Oversees class activities</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Total Students</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-4">
                        <Users className="h-8 w-8" />
                    </div>
                     <div>
                        <p className="font-bold text-3xl">{students.length}</p>
                        <p className="text-sm text-muted-foreground">Currently enrolled</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Subject Teachers</CardTitle>
                    <CardDescription>Teachers assigned to subjects for this class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjectAssignments.map(sa => (
                                <TableRow key={sa.subjectId}>
                                    <TableCell className="font-medium">{sa.subjectName}</TableCell>
                                    <TableCell>{sa.teacherName}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openDialog('subjectTeacher', sa)}>
                                            Change
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Results Sheet</CardTitle>
                    <CardDescription>Enter and view student performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => router.push(`/classes/${classId}/results/${student.id}`)}
                                    >
                                        Manage Results
                                    </Button>
                                </TableCell>
                            </TableRow>
                           ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Teacher</DialogTitle>
                    <DialogDescription>
                        {dialogState.type === 'classTeacher'
                            ? 'Assign a new class teacher.'
                            : `Assign a new teacher for ${dialogState.data?.subjectName}.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="teacher-select">Select Teacher</Label>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger id="teacher-select">
                            <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                            {allTeachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
