

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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type Subject = {
  id: string;
  name: string;
  grade: number;
};

// Create a secondary auth instance for creating teacher accounts
// This prevents the admin from being logged out
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const secondaryApp = getApps().length > 1 ? getApp("secondary") : initializeApp(auth.app.options, "secondary");
const secondaryAuth = getAuth(secondaryApp);

const disabilityOptions = [
    { id: 'visual', label: 'Visual Impairment' },
    { id: 'hearing', label: 'Hearing Impairment' },
    { id: 'physical', label: 'Physical/Motor Disability' },
    { id: 'speech', label: 'Speech and Language Disorder' },
    { id: 'learning', label: 'Learning Disability' },
    { id: 'asd', label: 'Autism Spectrum Disorder (ASD)' },
    { id: 'adhd', label: 'Attention-Deficit/Hyperactivity Disorder (ADHD)' },
];


export default function AddTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
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
    if (!user || !schoolId) return;

    const subjectsRef = ref(database, `schools/${schoolId}/subjects`);
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
  }, [user, schoolId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const qualifications = formData.get('qualifications') as string;
    const salary = formData.get('salary') as string;
    const startDate = formData.get('start-date') as string;
    
    const selectedDisabilities = disabilityOptions
        .filter(option => formData.get(option.id))
        .map(option => option.label);
    const otherDisability = formData.get('disabilities-other') as string;
    if (otherDisability) {
        selectedDisabilities.push(otherDisability);
    }
    const disabilities = selectedDisabilities.join(', ');
    
    if (!user || !schoolId) {
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
     if (!password || password.length < 6) {
        toast({
            title: 'Invalid Password',
            description: 'Password must be at least 6 characters long.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }


    try {
      // 1. Create teacher auth account without logging out the admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const teacherUser = userCredential.user;

      // 2. Save teacher profile to Realtime Database
      const teachersRef = ref(database, `schools/${schoolId}/teachers`);
      const newTeacherRef = push(teachersRef);
      await set(newTeacherRef, {
        uid: teacherUser.uid, // Store the auth UID
        name,
        subject: selectedSubject,
        email,
        qualifications,
        salary: parseFloat(salary),
        startDate,
        disabilities,
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Success!',
        description: `New teacher '${name}' has been added.`,
      });
      
      router.push('/teachers');

    } catch (error: any) {
      console.error('Failed to add teacher:', error);
       let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another teacher or administrator.';
      }
      toast({
        title: 'Error',
        description: errorMessage,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. Jane Doe" required />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Set Initial Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Must be at least 6 characters"
                required
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input
                        id="qualifications"
                        name="qualifications"
                        placeholder="e.g. M.A. in History"
                        required
                    />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary (ZMW)</Label>
                    <Input
                        id="salary"
                        name="salary"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 8500.00"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                        id="start-date"
                        name="start-date"
                        type="date"
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Disabilities (if any)</Label>
                <div className="space-y-2 p-4 border rounded-md">
                    {disabilityOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox id={option.id} name={option.id} />
                            <label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {option.label}
                            </label>
                        </div>
                    ))}
                    <div className="pt-2">
                        <Label htmlFor="disabilities-other">Other</Label>
                        <Input id="disabilities-other" name="disabilities-other" placeholder="Please specify" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
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
