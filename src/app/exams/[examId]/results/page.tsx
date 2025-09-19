
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchoolId } from '@/hooks/use-school-id';
import { auth, database } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

type Exam = { title: string };
type Attempt = { score: number; totalQuestions: number; answers: { [questionId: string]: string } };
type Question = { id: string; text: string; options: string[]; correctAnswer: string };

export default function ExamResultsPage() {
    const params = useParams();
    const examId = params.examId as string;
    const router = useRouter();
    const schoolId = useSchoolId();
    const [user, setUser] = useState<User | null>(null);
    const [exam, setExam] = useState<Exam | null>(null);
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || !schoolId || !examId) return;

        const fetchData = async () => {
            try {
                const examRef = ref(database, `schools/${schoolId}/exams/${examId}`);
                const attemptRef = ref(database, `schools/${schoolId}/examAttempts/${examId}/${user.uid}`);
                const questionsRef = ref(database, `schools/${schoolId}/examQuestions/${examId}`);

                const [examSnap, attemptSnap, questionsSnap] = await Promise.all([
                    get(examRef),
                    get(attemptRef),
                    get(questionsRef),
                ]);

                if (!examSnap.exists() || !attemptSnap.exists()) {
                    router.push('/exams');
                    return;
                }
                
                setExam(examSnap.val());
                setAttempt(attemptSnap.val());
                
                const questionsData = questionsSnap.val() || {};
                setQuestions(Object.keys(questionsData).map(id => ({ id, ...questionsData[id] })));

            } catch (error) {
                console.error("Error fetching results:", error);
                router.push('/exams');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, schoolId, examId, router]);
    
    if (loading) return <div>Loading your results...</div>;
    if (!exam || !attempt) return <div>Could not load results.</div>;
    
    const percentage = ((attempt.score / attempt.totalQuestions) * 100).toFixed(0);

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <Button variant="outline" size="sm" onClick={() => router.push('/exams')} className="self-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exams
            </Button>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Exam Results</CardTitle>
                    <CardDescription>{exam.title}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-xl">Your Score:</p>
                    <div className="text-6xl font-bold text-primary">{attempt.score} / {attempt.totalQuestions}</div>
                    <p className="text-4xl font-semibold">{percentage}%</p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Review Your Answers</h2>
                {questions.map((q, index) => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle>Question {index + 1}</CardTitle>
                            <p>{q.text}</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {q.options.map(option => {
                                const isCorrect = option === q.correctAnswer;
                                const isSelected = option === attempt.answers[q.id];
                                const isCorrectSelection = isSelected && isCorrect;
                                const isIncorrectSelection = isSelected && !isCorrect;

                                return (
                                <div
                                    key={option}
                                    className={`flex items-center gap-2 p-2 rounded-md border ${
                                        isCorrectSelection ? 'bg-green-100 border-green-500' :
                                        isIncorrectSelection ? 'bg-red-100 border-red-500' :
                                        isCorrect ? 'border-green-500' : ''
                                    }`}
                                >
                                    {isCorrectSelection && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {isIncorrectSelection && <XCircle className="h-5 w-5 text-red-500" />}
                                    {!isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    <span className={isCorrect ? 'font-semibold' : ''}>{option}</span>
                                </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
