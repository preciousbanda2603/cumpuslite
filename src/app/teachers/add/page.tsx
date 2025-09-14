
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
import { auth, database } from '@/lib/firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';

type Subject = {
  id: string;
  name: string;
  grade: number;
};

export default function AddTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const subjectsRef = ref(database, `schools/${user.uid}/subjects`);
    const unsubscribeSubjects = onValue(subjectsRef, (snapshot) => {
      const subjectsData = snapshot.val();
      const subjectsList = subjectsData
        ? Object.keys(subjectsData).map((id) => ({ id, ...subjectsData[id] }))
        : [];
      // Get unique subject names
      const uniqueSubjects = Array.from(new Set(subjectsList.map(s => s.name)))
        .map(name => {
            return subjectsList.find(s => s.name === name)!
        });
      setSubjects(uniqueSubjects);
    });

    return () => unsubscribeSubjects();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const qualifications = formData.get('qualifications') as string;
    
    if (!user) {
        toast({
            title: 'Error',
            description: 'You must be logged in as a school administrator to add teachers.',
            variant: 'destructive',
        });
        setLoading(false);
        router.push('/login');
        return;
    }

    if (!selectedSubject) {
        toast({
            title: 'Missing Information',
            description: 'Please select a primary subject.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    try {
      const teachersRef = ref(database, `schools/${user.uid}/teachers`);
      const newTeacherRef = push(teachersRef);
      await set(newTeacherRef, {
        name,
        subject: selectedSubject,
        email,
        qualifications,
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Success!',
        description: `New teacher '${name}' has been added.`,
      });
      
      router.push('/teachers');

    } catch (error: any) {
      console.error('Failed to add teacher:', error);
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
          <CardTitle>Add New Teacher</CardTitle>
          <CardDescription>
            Fill out the form below to add a new teacher to the directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="e.g. Jane Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Primary Subject</Label>
              <Select name="subject" required value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                       subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>No subjects configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. j.doe@campus.zm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                name="qualifications"
                placeholder="e.g. M.A. in History"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding Teacher...' : 'Add Teacher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
