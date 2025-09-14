
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
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

type Student = { id: string; name: string; classId: string; };
type Subject = { id: string; name: string; grade: number; };
type Results = { [subjectId: string]: { test1?: number; test2?: number; midTerm?: number; finalExam?: number; } };

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

  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !classId || !studentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const schoolUid = user.uid;

        // Fetch Student Info
        const studentRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
        const studentSnap = await get(studentRef);
        if (!studentSnap.exists()) {
          toast({ title: 'Error', description: 'Student not found.', variant: 'destructive' });
          router.back();
          return;
        }
        const studentData = { id: studentId, ...studentSnap.val() };
        setStudent(studentData);
        
        // Fetch Class Info to get grade
        const classRef = ref(database, `schools/${schoolUid}/classes/${studentData.classId}`);
        const classSnap = await get(classRef);
        if (!classSnap.exists()) {
           toast({ title: 'Error', description: 'Class not found.', variant: 'destructive' });
           return;
        }
        const classData = classSnap.val();

        // Fetch Subjects for the class's grade
        const subjectsRef = ref(database, `schools/${schoolUid}/subjects`);
        const subjectsSnap = await get(subjectsRef);
        const allSubjects = subjectsSnap.val() || {};
        const gradeSubjects = Object.keys(allSubjects)
          .map(id => ({ id, ...allSubjects[id] }))
          .filter(s => s.grade === classData.grade);
        setSubjects(gradeSubjects);

        // Fetch existing results
        const resultsRef = ref(database, `schools/${schoolUid}/results/${studentId}`);
        const resultsSnap = await get(resultsRef);
        if (resultsSnap.exists()) {
          setResults(resultsSnap.val());
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: 'Error', description: 'Failed to fetch student or subject data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, classId, studentId, router, toast]);

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

  const calculateTotal = (subjectId: string) => {
    const subjectScores = results[subjectId];
    if (!subjectScores) return 'N/A';
    const total = Object.values(subjectScores).reduce((sum, score) => sum + (score || 0), 0);
    const count = Object.values(subjectScores).filter(s => s !== undefined).length;
    return count > 0 ? (total / count).toFixed(1) : 'N/A';
  };
  
  const handleSaveChanges = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const resultsRef = ref(database, `schools/${user.uid}/results/${studentId}`);
        await set(resultsRef, results);
        toast({ title: 'Success', description: "Student's results have been saved." });
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
                Manage Results
            </h1>
            <p className="text-muted-foreground">Editing term results for <span className="font-semibold text-primary">{student.name}</span>.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Results Entry Sheet</CardTitle>
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
         <div className="flex justify-end mt-4">
            <Button size="lg" onClick={handleSaveChanges} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save All Changes'}
            </Button>
        </div>
    </div>
  );
}
