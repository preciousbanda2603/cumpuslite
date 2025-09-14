import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, HelpCircle } from "lucide-react";

export default function ExamsPage() {
  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Quizzes & Exams</h1>
            <p className="text-muted-foreground">Your portal for online assessments.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Mid-Term: Physics</CardTitle>
                    <CardDescription>Covering chapters 4-7.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileQuestion className="h-4 w-4" /> 50 Multiple Choice Questions</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> 60 Minutes</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /> Available until Dec 20th</div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Start Exam</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Quiz: English Vocabulary</CardTitle>
                    <CardDescription>Weekly vocabulary check.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileQuestion className="h-4 w-4" /> 20 Questions</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> 15 Minutes</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /> Due by Friday</div>
                </CardContent>
                <CardFooter>
                     <Button className="w-full">Start Quiz</Button>
                </CardFooter>
            </Card>
             <Card className="opacity-50">
                <CardHeader>
                    <CardTitle>Final Exam: Mathematics</CardTitle>
                    <CardDescription>Comprehensive final exam.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileQuestion className="h-4 w-4" /> 100 Questions</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> 120 Minutes</div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground"><HelpCircle className="h-4 w-4" /> Not yet available</div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" disabled>Not Available</Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
