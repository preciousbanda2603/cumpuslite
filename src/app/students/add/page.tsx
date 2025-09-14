
'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

export default function AddStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const schoolAdmin = auth.currentUser;
    if (!schoolAdmin) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to add a student.',
        variant: 'destructive',
      });
      setLoading(false);
      router.push('/login');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const startingGrade = parseInt(formData.get('grade') as string, 10);
    const enrollmentDate = formData.get('enrollment-date') as string;

    if (!name || isNaN(startingGrade) || !enrollmentDate) {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all fields.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    try {
      const studentsRef = ref(database, `schools/${schoolAdmin.uid}/students`);
      const newStudentRef = push(studentsRef);
      await set(newStudentRef, {
        name,
        startingGrade,
        enrollmentDate,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Success!',
        description: `Student '${name}' has been added.`,
      });
      router.push('/students');

    } catch (error: any) {
      console.error("Failed to add student:", error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
          <CardDescription>
            Fill out the form below to enroll a new student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="e.g. John Smith" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Starting Grade</Label>
                <Select name="grade" required>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <SelectItem key={grade} value={String(grade)}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="enrollment-date">Enrollment Date</Label>
                <Input id="enrollment-date" name="enrollment-date" type="date" required />
              </div>
            </div>
           
            <div className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding Student...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
