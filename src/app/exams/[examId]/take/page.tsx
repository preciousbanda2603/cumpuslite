
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { auth, database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Exam = { title: string; duration: number };
type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
};

export default function TakeExamPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const { toast } = useToast();
  const schoolId = useSchoolId();
  const [user, setUser] = useState<User | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId || !examId) return;

    const fetchData = async () => {
      try {
        const examRef = ref(database, `schools/${schoolId}/exams/${examId}`);
        const questionsRef = ref(database, `schools/${schoolId}/examQuestions/${examId}`);
        
        const [examSnap, questionsSnap] = await Promise.all([get(examRef), get(questionsRef)]);
        
        if (!examSnap.exists() || !questionsSnap.exists()) {
            toast({ title: 'Error', description: 'Exam or questions not found.', variant: 'destructive' });
            router.push('/exams');
            return;
        }

        setExam(examSnap.val());
        const questionsData = questionsSnap.val() || {};
        setQuestions(Object.keys(questionsData).map(id => ({ id, ...questionsData[id] })));
      } catch (error) {
          console.error("Error fetching exam:", error);
          toast({ title: 'Error', description: 'Could not load exam.', variant: 'destructive' });
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [user, schoolId, examId, router, toast]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    if (!user || !schoolId || !examId) return;

    let score = 0;
    questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) {
            score++;
        }
    });

    try {
        const attemptRef = ref(database, `schools/${schoolId}/examAttempts/${examId}/${user.uid}`);
        await set(attemptRef, {
            score,
            totalQuestions: questions.length,
            answers,
            submittedAt: new Date().toISOString()
        });
        toast({ title: 'Success', description: 'Your exam has been submitted.' });
        router.push(`/exams/${examId}/results`);
    } catch (error) {
        console.error("Failed to submit exam:", error);
        toast({ title: 'Error', description: 'Failed to submit exam.', variant: 'destructive' });
        setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading exam...</div>;
  if (!exam || !currentQuestion) return <div>Could not load exam questions.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">{exam.title}</CardTitle>
          <CardDescription className="text-center">Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <p className="font-semibold text-lg">{currentQuestion.text}</p>
                <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    className="space-y-2"
                >
                    {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`}>{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                disabled={currentQuestionIndex === 0}
            >
                Previous
            </Button>
            {currentQuestionIndex < questions.length - 1 ? (
                 <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next</Button>
            ) : (
                <Button onClick={() => setShowConfirmDialog(true)} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                </Button>
            )}
        </CardFooter>
      </Card>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will submit your exam. You cannot change your answers after this.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
