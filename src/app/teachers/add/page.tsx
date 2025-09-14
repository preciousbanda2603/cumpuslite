
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { useState } from 'react';

// A simple function to generate a random password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

export default function AddTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const email = formData.get('email') as string;
    const qualifications = formData.get('qualifications') as string;
    
    const schoolAdmin = auth.currentUser;
    if (!schoolAdmin) {
        toast({
            title: 'Error',
            description: 'You must be logged in as a school administrator to add teachers.',
            variant: 'destructive',
        });
        setLoading(false);
        router.push('/login');
        return;
    }

    const tempPassword = generateTempPassword();

    try {
      // We can't create a user from the client-side without re-authenticating the admin.
      // For this prototype, we'll store the teacher info and assume an admin will create the user in the Firebase console.
      // In a real app, this would be a server-side function.

      const teachersRef = ref(database, `schools/${schoolAdmin.uid}/teachers`);
      const newTeacherRef = push(teachersRef);
      await set(newTeacherRef, {
        name,
        subject,
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
              <Input id="subject" name="subject" placeholder="e.g. History" required />
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
