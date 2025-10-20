
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
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolId } from '@/hooks/use-school-id';
import { Textarea } from '@/components/ui/textarea';
import { generateReportCardComments } from '@/ai/flows/report-card-assistant';
import type { ReportCardData } from '@/ai/schemas/report-card-schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscription } from '@/hooks/use-subscription';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Student = { id: string; name: string; classId: string; };
type Subject = { id: string; name: string; grade: number; };
type Result = { test1?: number; test2?: number; midTerm?: number; finalExam?: number; grade?: string; comment?: string; };
type Results = { [subjectId: string]: Result };
type ReportCardExtras = {
    attendance?: { totalDays?: string; daysPresent?: string; punctuality?: string; };
    development?: { participation?: string; homework?: string; behaviour?: string; };
    comments?: { strengths?: string; improvements?: string; principalComment?: string; };
};
type UserRole = 'admin' | 'class_teacher' | 'subject_teacher' | 'other';

const terms = ["Term 1", "Term 2", "Term 3"];

export default function ReportBookEditorPage() {
  const params = useParams();
  const { id: classId, studentId } = params as { id: string; studentId: string };
  const router = useRouter();
  const { toast } = useToast();
  const schoolId = useSchoolId();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('other');
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Results>({});
  const [extras, setExtras] = useState<ReportCardExtras>({});
  const [loading, setLoading] = useState(true); // Manages loading state for term-specific data
  const [pageLoading, setPageLoading] = useState(true); // Manages initial page load
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState(`Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`);

  const canPerformActions = userRole === 'admin' || userRole === 'class_teacher';
  
  const termId = `${selectedTerm} ${currentYear}`;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId || !classId || !studentId) return;

    const fetchStaticData = async () => {
        setPageLoading(true);
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
                setSubjects([]);
            }
        } catch (error) {
            console.error("Error fetching static data:", error);
            toast({ title: 'Error', description: 'Failed to fetch student or subject data.', variant: 'destructive' });
        } finally {
            setPageLoading(false);
        }
    };
    
    fetchStaticData();
  }, [user, schoolId, classId, studentId, router, toast]);

  useEffect(() => {
    if (pageLoading) return; // Wait for student and subject data
    
    const fetchTermData = async () => {
        setLoading(true);
        try {
            // Fetch existing results for the term
            const resultsRef = ref(database, `schools/${schoolId}/results/${studentId}/${termId}`);
            const resultsSnap = await get(resultsRef);
            setResults(resultsSnap.exists() ? resultsSnap.val() : {});
            
            // Fetch existing extra report card data for the term
            const extrasRef = ref(database, `schools/${schoolId}/reportCardExtras/${studentId}/${termId}`);
            const extrasSnap = await get(extrasRef);
            setExtras(extrasSnap.exists() ? extrasSnap.val() : {});
        } catch (error) {
            console.error("Error fetching term data:", error);
            toast({ title: 'Error', description: `Failed to fetch data for ${termId}.`, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    fetchTermData();

  }, [pageLoading, schoolId, studentId, termId, toast]);

  const handleResultChange = (subjectId: string, field: keyof Result, value: string) => {
    let finalValue: string | number | undefined = value;
    if (['test1', 'test2', 'midTerm', 'finalExam'].includes(field)) {
      finalValue = value === '' ? undefined : parseInt(value, 10);
      if (finalValue !== undefined && (isNaN(finalValue) || finalValue < 0 || finalValue > 100)) {
          toast({ title: 'Invalid Score', description: 'Score must be between 0 and 100.', variant: 'destructive'});
          return;
      }
    }
    
    setResults(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: finalValue,
      },
    }));
  };
  
  const handleExtrasChange = (section: keyof ReportCardExtras, field: string, value: string) => {
    setExtras(prev => ({
        ...prev,
        [section]: {
            ...(prev[section] as object),
            [field]: value
        }
    }));
  };
  
  const calculatePerformance = (subjectId: string) => {
    const subjectResults = results[subjectId] || {};
    const caScores = [subjectResults.test1, subjectResults.test2, subjectResults.midTerm].filter(s => typeof s === 'number') as number[];
    const examScore = subjectResults.finalExam;

    const caAvg = caScores.length > 0 ? (caScores.reduce((a, b) => a + b, 0) / caScores.length) : 'N/A';
    
    const allScores = [...caScores, examScore].filter(s => typeof s === 'number') as number[];
    const total = allScores.length > 0 ? (allScores.reduce((a,b) => a + b, 0) / allScores.length) : 'N/A';

    return {
        continuousAssessment: typeof caAvg === 'number' ? caAvg.toFixed(1) : caAvg,
        examMarks: typeof examScore === 'number' ? examScore : 'N/A',
        total: typeof total === 'number' ? total.toFixed(1) : total,
    };
  };

  const handleGenerateComments = async () => {
    if (!student) return;
    setIsGenerating(true);
    
    const performanceData = subjects.map(subject => {
        const subjectResult: Result = results[subject.id] || {};
        return {
            subjectName: subject.name,
            ...subjectResult
        };
    });

    const reportCardInput: ReportCardData = {
        studentName: student.name,
        performanceData: performanceData
    };
    
    try {
        const comments = await generateReportCardComments(reportCardInput);
        setExtras(prev => ({
            ...prev,
            comments: {
                ...prev.comments,
                strengths: comments.strengths,
                improvements: comments.improvements,
            }
        }));
        toast({ title: "Success", description: "AI comments have been generated." });
    } catch (error) {
        console.error("AI generation failed:", error);
        toast({ title: "Error", description: "Failed to generate AI comments. Please ensure AI is set up correctly.", variant: "destructive" });
        router.push('/ai-setup-guide');
    } finally {
        setIsGenerating(false);
    }
  };

  
  const handleSaveChanges = async () => {
    if (!user || !schoolId) return;
    setLoading(true);
    try {
        const resultsRef = ref(database, `schools/${schoolId}/results/${studentId}/${termId}`);
        await set(resultsRef, results);

        const extrasRef = ref(database, `schools/${schoolId}/reportCardExtras/${studentId}/${termId}`);
        await set(extrasRef, extras);

        toast({ title: 'Success', description: `Student's report book for ${termId} has been saved.` });
    } catch (error) {
        console.error("Error saving results:", error);
        toast({ title: 'Error', description: 'Failed to save results.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  if (pageLoading || subscriptionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-12">Loading...</div>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Report Book Editor
                    </h1>
                    <p className="text-muted-foreground">Editing term report for <span className="font-semibold text-primary">{student?.name}</span>.</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="grid gap-2">
                        <Label>Term</Label>
                        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {terms.map(term => <SelectItem key={term} value={term}>{term}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Year</Label>
                        <Input className="w-[120px]" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} />
                    </div>
                </div>
            </div>
        </div>

        {loading ? (
             <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-96" />
                </CardContent>
            </Card>
        ) : (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Academic Performance</CardTitle>
                    <CardDescription>Enter scores for each subject (0-100). Averages are calculated automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px] font-bold">Subject</TableHead>
                                <TableHead className="text-center">Test 1</TableHead>
                                <TableHead className="text-center">Test 2</TableHead>
                                <TableHead className="text-center">Mid-Term</TableHead>
                                <TableHead className="text-center font-bold bg-muted/50">CA (Avg)</TableHead>
                                <TableHead className="text-center">Final Exam</TableHead>
                                <TableHead className="text-center font-bold bg-muted/50">Total (Avg)</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                                <TableHead className="text-center min-w-[200px]">Teacher's Comment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {subjects.length > 0 ? (
                          subjects.map(subject => {
                            const performance = calculatePerformance(subject.id);
                            return (
                            <TableRow key={subject.id}>
                                <TableCell className="font-medium">{subject.name}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        className="w-20 text-center mx-auto"
                                        value={results[subject.id]?.test1 ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'test1', e.target.value)}
                                        min={0}
                                        max={100}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <Input
                                        type="number"
                                        className="w-20 text-center mx-auto"
                                        value={results[subject.id]?.test2 ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'test2', e.target.value)}
                                        min={0}
                                        max={100}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <Input
                                        type="number"
                                        className="w-20 text-center mx-auto"
                                        value={results[subject.id]?.midTerm ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'midTerm', e.target.value)}
                                        min={0}
                                        max={100}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                                <TableCell className="text-center font-bold bg-muted/50">{performance.continuousAssessment}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number"
                                        className="w-20 text-center mx-auto"
                                        value={results[subject.id]?.finalExam ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'finalExam', e.target.value)}
                                        min={0}
                                        max={100}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                                <TableCell className="text-center font-bold bg-muted/50">{performance.total}</TableCell>
                                <TableCell>
                                    <Input 
                                        className="w-20 text-center mx-auto"
                                        value={results[subject.id]?.grade ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'grade', e.target.value)}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        className="w-full text-center mx-auto"
                                        value={results[subject.id]?.comment ?? ''}
                                        onChange={(e) => handleResultChange(subject.id, 'comment', e.target.value)}
                                        disabled={!canPerformActions}
                                    />
                                </TableCell>
                            </TableRow>
                        )})
                        ) : (
                           <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No subjects have been configured for this student's grade.
                                </TableCell>
                           </TableRow>
                        )}
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
                                <Label>Total School Days</Label>
                                <Input type="number" value={extras.attendance?.totalDays || ''} onChange={e => handleExtrasChange('attendance', 'totalDays', e.target.value)} disabled={!canPerformActions} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Days Present</Label>
                                <Input type="number" value={extras.attendance?.daysPresent || ''} onChange={e => handleExtrasChange('attendance', 'daysPresent', e.target.value)} disabled={!canPerformActions} />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label>Punctuality</Label>
                            <Input value={extras.attendance?.punctuality || ''} onChange={e => handleExtrasChange('attendance', 'punctuality', e.target.value)} placeholder="e.g. Excellent, Good, Needs Improvement" disabled={!canPerformActions} />
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
                            <Label>Behaviour / Social Skills</Label>
                            <Input value={extras.development?.behaviour || ''} onChange={e => handleExtrasChange('development', 'behaviour', e.target.value)} disabled={!canPerformActions} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Final Comments</CardTitle>
                            <CardDescription>Provide overall comments for the student's report book.</CardDescription>
                        </div>
                        {canPerformActions && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-block">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleGenerateComments} 
                                                disabled={isGenerating || !subscription.canUseAi}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!subscription.canUseAi && (
                                        <TooltipContent>
                                            <p>This feature requires a Basic or Premium subscription.</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Class Teacher's Comment on Strengths</Label>
                        <Textarea value={extras.comments?.strengths || ''} onChange={e => handleExtrasChange('comments', 'strengths', e.target.value)} disabled={!canPerformActions} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Class Teacher's Comment on Areas for Improvement</Label>
                        <Textarea value={extras.comments?.improvements || ''} onChange={e => handleExtrasChange('comments', 'improvements', e.target.value)} disabled={!canPerformActions} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Head Teacher / Principal's Comment</Label>
                        <Textarea value={extras.comments?.principalComment || ''} onChange={e => handleExtrasChange('comments', 'principalComment', e.target.value)} disabled={userRole !== 'admin'} />
                    </div>
                </CardContent>
            </Card>

            {canPerformActions && (
                <div className="flex justify-end mt-4">
                    <Button size="lg" onClick={handleSaveChanges} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Report Book'}
                    </Button>
                </div>
            )}
        </>
        )}
    </div>
  );
}
