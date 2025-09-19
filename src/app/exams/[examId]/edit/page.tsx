
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, push, remove, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Exam = { title: string };
type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
};

export default function EditExamPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();
  const { toast } = useToast();
  const schoolId = useSchoolId();
  const [user, setUser] = useState<User | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !schoolId || !examId) return;

    const examRef = ref(database, `schools/${schoolId}/exams/${examId}`);
    const questionsRef = ref(database, `schools/${schoolId}/examQuestions/${examId}`);
    
    const unsubscribeExam = onValue(examRef, (snapshot) => {
        if (snapshot.exists()) {
            setExam(snapshot.val());
        } else {
            toast({ title: 'Error', description: 'Exam not found.', variant: 'destructive' });
            router.push('/exams');
        }
    });

    const unsubscribeQuestions = onValue(questionsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data).map(id => ({ id, ...data[id] }));
        setQuestions(list);
        setLoading(false);
    });

    return () => {
        unsubscribeExam();
        unsubscribeQuestions();
    };
  }, [user, schoolId, examId, router, toast]);

  const addQuestion = () => {
    setQuestions([...questions, { id: `new-${Date.now()}`, text: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };
  
  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };
  
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };
  
  const handleSaveChanges = async () => {
    if (!user || !schoolId || !examId) return;
    setLoading(true);
    
    // Validate questions
    for (const q of questions) {
        if (!q.text.trim() || q.options.some(opt => !opt.trim()) || !q.correctAnswer.trim()) {
            toast({ title: 'Error', description: 'Please fill out all fields for every question.', variant: 'destructive' });
            setLoading(false);
            return;
        }
    }
    
    try {
        const questionsRef = ref(database, `schools/${schoolId}/examQuestions/${examId}`);
        const updates: { [key: string]: Omit<Question, 'id'> } = {};
        questions.forEach(q => {
            const questionId = q.id.startsWith('new-') ? push(questionsRef).key : q.id;
            if (questionId) {
                updates[questionId] = { text: q.text, options: q.options, correctAnswer: q.correctAnswer };
            }
        });
        
        await set(questionsRef, updates);
        
        // Also update question count on the exam object
        const examRef = ref(database, `schools/${schoolId}/exams/${examId}/questionCount`);
        await set(examRef, questions.length);

        toast({ title: 'Success', description: 'Questions have been saved.' });
    } catch (error) {
        console.error("Failed to save questions:", error);
        toast({ title: 'Error', description: 'Failed to save questions.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div>Loading exam questions...</div>;

  return (
    <div className="flex flex-col gap-6">
       <div>
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exams
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Manage Questions</h1>
            <p className="text-muted-foreground">Editing questions for <span className="font-semibold text-primary">{exam?.title}</span>.</p>
        </div>
        
        <div className="space-y-4">
            {questions.map((q, qIndex) => (
                <Card key={q.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Question {qIndex + 1}</CardTitle>
                        <Button variant="destructive" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`q-text-${qIndex}`}>Question Text</Label>
                            <Textarea id={`q-text-${qIndex}`} value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Options & Correct Answer</Label>
                            <RadioGroup value={q.correctAnswer} onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', value)}>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <RadioGroupItem value={opt} id={`q${qIndex}-opt${oIndex}`} />
                                        <Input
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={addQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
            </Button>
            <Button size="lg" onClick={handleSaveChanges} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save All Questions'}
            </Button>
        </div>
    </div>
  );
}
