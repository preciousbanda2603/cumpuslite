
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolId } from '@/hooks/use-school-id';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Student = { id: string; name: string; classId: string; };
type Subject = { id: string; name: string; grade: number; };
type Results = { [subjectId: string]: { test1?: number; test2?: number; midTerm?: number; finalExam?: number; } };
type ReportCardExtras = {
    attendance?: { totalDays?: string; daysPresent?: string; daysAbsent?: string; punctuality?: string; };
    development?: { participation?: string; homework?: string; sports?: string; behaviour?: string; };
    comments?: { strengths?: string; improvements?: string; };
};
type UserRole = 'admin' | 'class_teacher' | 'subject_teacher' | 'other';

const assessmentTypes = [
    { key: 'test1', label: 'Test 1' },
    { key: 'test2', label: 'Test 2' },
    { key: 'midTerm', label: 'Mid-Term' },
    { key: 'finalExam', label: 'Final Exam' },
];

export default function StudentResultsPage() {
  const params = useParams();
  const { id: classId, studentId } = params as { id: string; studentId: string };
  const router = useRouter();
  const { toast } = useToast();
  const schoolId = useSchoolId();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('other');
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Results>({});
  const [extras, setExtras] = useState<ReportCardExtras>({});
  const [loading, setLoading] = useState(true);
  
  const canPerformActions = userRole === 'admin' || userRole === 'class_teacher';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId || !classId || !studentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {

        // Fetch Student Info
        const studentRef = ref(database, `schools/${schoolId}/students/${studentId}`);
        const studentSnap = await get(studentRef);
        if (!studentSnap.exists()) {
          toast({ title: 'Error', description: 'Student not found.', variant: 'destructive' });
          router.back();
          return;
        }
        const studentData = { id: studentId, ...studentSnap.val() };
        setStudent(studentData);
        
        // Fetch Class Info to get grade
        const classRef = ref(database, `schools/${schoolId}/classes/${studentData.classId}`);
        const classSnap = await get(classRef);
        if (!classSnap.exists()) {
           toast({ title: 'Error', description: 'Class data is missing for this student.', variant: 'destructive' });
           setLoading(false);
           return;
        }
        const classData = classSnap.val();

        // Determine user role
        if (user.uid === schoolId) {
            setUserRole('admin');
        } else {
            const teachersRef = ref(database, `schools/${schoolId}/teachers`);
            const teachersSnap = await get(teachersRef);
            const teachersData = teachersSnap.val() || {};
            const currentTeacher = Object.values(teachersData).find((t: any) => t.uid === user.uid) as any;
            
            if (currentTeacher) {
                const teacherId = Object.keys(teachersData).find(key => teachersData[key].uid === user.uid);
                if (teacherId === classData.classTeacherId) {
                    setUserRole('class_teacher');
                } else {
                    setUserRole('subject_teacher');
                }
            }
        }


        // Fetch Subjects for the class's grade, only if grade exists
        if (classData && typeof classData.grade !== 'undefined') {
            const subjectsQuery = query(ref(database, `schools/${schoolId}/subjects`), orderByChild('grade'), equalTo(classData.grade));
            const subjectsSnap = await get(subjectsQuery);
            const subjectsData = subjectsSnap.val() || {};
            setSubjects(Object.keys(subjectsData).map(id => ({ id, ...subjectsData[id] })));
        } else {
             // Fallback to loading all subjects if grade is not set on the class
             const allSubjectsRef = ref(database, `schools/${schoolId}/subjects`);
             const allSubjectsSnap = await get(allSubjectsRef);
             const allSubjectsData = allSubjectsSnap.val() || {};
             setSubjects(Object.keys(allSubjectsData).map(id => ({ id, ...allSubjectsData[id] })));
        }


        // Fetch existing results
        const resultsRef = ref(database, `schools/${schoolId}/results/${studentId}`);
        const resultsSnap = await get(resultsRef);
        if (resultsSnap.exists()) {
          setResults(resultsSnap.val());
        }
        
        // Fetch existing extra report card data
        const extrasRef = ref(database, `schools/${schoolId}/reportCardExtras/${studentId}`);
        const extrasSnap = await get(extrasRef);
        if (extrasSnap.exists()) {
          setExtras(extrasSnap.val());
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: 'Error', description: 'Failed to fetch student or subject data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, schoolId, classId, studentId, router, toast]);

  const handleScoreChange = (subjectId: string, assessment: string, value: string) => {
    const score = value === '' ? undefined : parseInt(value, 10);
     if (score !== undefined && (isNaN(score) || score < 0 || score > 100)) {
        toast({ title: 'Invalid Score', description: 'Score must be between 0 and 100.', variant: 'destructive'});
        return;
    }

    setResults(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [assessment]: score,
      },
    }));
  };
  
  const handleExtrasChange = (section: keyof ReportCardExtras, field: string, value: string) => {
    setExtras(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            [field]: value
        }
    }));
  };

  const calculateTotal = (subjectId: string) => {
    const subjectScores = results[subjectId];
    if (!subjectScores) return 'N/A';
    const total = Object.values(subjectScores).reduce((sum, score) => sum + (score || 0), 0);
    const count = Object.values(subjectScores).filter(s => s !== undefined).length;
    return count > 0 ? (total / count).toFixed(1) : 'N/A';
  };
  
  const handleSaveChanges = async () => {
    if (!user || !schoolId) return;
    setLoading(true);
    try {
        const resultsRef = ref(database, `schools/${schoolId}/results/${studentId}`);
        await set(resultsRef, results);

        const extrasRef = ref(database, `schools/${schoolId}/reportCardExtras/${studentId}`);
        await set(extrasRef, extras);

        toast({ title: 'Success', description: "Student's results and report data have been saved." });
    } catch (error) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: 'Failed to save results.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Class
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
                Manage Results & Report Data
            </h1>
            <p className="text-muted-foreground">Editing term information for <span className="font-semibold text-primary">{student.name}</span>.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>Enter scores for each subject. Scores should be between 0 and 100.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">Subject</TableHead>
                            {assessmentTypes.map(assessment => (
                                <TableHead key={assessment.key} className="text-center">{assessment.label}</TableHead>
                            ))}
                            <TableHead className="text-center font-bold">Total Avg.</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {subjects.map(subject => (
                        <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            {assessmentTypes.map(assessment => (
                                <TableCell key={assessment.key}>
                                    <Input 
                                        type="number"
                                        className="w-24 text-center mx-auto"
                                        value={results[subject.id]?.[assessment.key as keyof Results[string]] ?? ''}
                                        onChange={(e) => handleScoreChange(subject.id, assessment.key, e.target.value)}
                                        min={0}
                                        max={100}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                            ))}
                            <TableCell className="text-center font-bold text-lg">
                                {calculateTotal(subject.id)}
                            </TableCell>
                        </TableRow>
                       ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance</CardTitle>
                    <CardDescription>Enter student's term attendance record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Total Days</Label>
                            <Input type="number" value={extras.attendance?.totalDays || ''} onChange={e => handleExtrasChange('attendance', 'totalDays', e.target.value)} disabled={!canPerformActions} />
                        </div>
                         <div className="grid gap-2">
                            <Label>Days Present</Label>
                            <Input type="number" value={extras.attendance?.daysPresent || ''} onChange={e => handleExtrasChange('attendance', 'daysPresent', e.target.value)} disabled={!canPerformActions} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Days Absent</Label>
                            <Input type="number" value={extras.attendance?.daysAbsent || ''} onChange={e => handleExtrasChange('attendance', 'daysAbsent', e.target.value)} disabled={!canPerformActions} />
                        </div>
                         <div className="grid gap-2">
                            <Label>Punctuality</Label>
                            <Input value={extras.attendance?.punctuality || ''} onChange={e => handleExtrasChange('attendance', 'punctuality', e.target.value)} placeholder="e.g. Good" disabled={!canPerformActions} />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Personal Development</CardTitle>
                    <CardDescription>Enter remarks on student's development.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label>Class Participation</Label>
                        <Input value={extras.development?.participation || ''} onChange={e => handleExtrasChange('development', 'participation', e.target.value)} disabled={!canPerformActions} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Homework & Assignments</Label>
                        <Input value={extras.development?.homework || ''} onChange={e => handleExtrasChange('development', 'homework', e.target.value)} disabled={!canPerformActions} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Sports & Games</Label>
                        <Input value={extras.development?.sports || ''} onChange={e => handleExtrasChange('development', 'sports', e.target.value)} disabled={!canPerformActions} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Behaviour / Social Skills</Label>
                        <Input value={extras.development?.behaviour || ''} onChange={e => handleExtrasChange('development', 'behaviour', e.target.value)} disabled={!canPerformActions} />
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Comments & Next Steps</CardTitle>
                <CardDescription>Provide overall comments for the student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Strengths</Label>
                    <Textarea value={extras.comments?.strengths || ''} onChange={e => handleExtrasChange('comments', 'strengths', e.target.value)} disabled={!canPerformActions} />
                </div>
                 <div className="grid gap-2">
                    <Label>Areas for Improvement</Label>
                    <Textarea value={extras.comments?.improvements || ''} onChange={e => handleExtrasChange('comments', 'improvements', e.target.value)} disabled={!canPerformActions} />
                </div>
            </CardContent>
        </Card>

        {canPerformActions && (
             <div className="flex justify-end mt-4">
                <Button size="lg" onClick={handleSaveChanges} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save All Changes'}
                </Button>
            </div>
        )}
    </div>
  );
}
