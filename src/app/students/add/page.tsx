

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
import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { Textarea } from '@/components/ui/textarea';
import { useSchoolId } from '@/hooks/use-school-id';
import { customAlphabet } from 'nanoid';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { disabilityOptions } from '@/lib/disability-options';

// Create a secondary auth instance for creating student accounts
// This prevents the admin from being logged out
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const secondaryApp = getApps().length > 1 ? getApp("secondary") : initializeApp(auth.app.options, "secondary");
const secondaryAuth = getAuth(secondaryApp);

type Class = {
  id: string;
  name: string;
};

// Generate a unique, human-readable admission number
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export default function AddStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [admissionNo, setAdmissionNo] = useState('');
  
  useEffect(() => {
    setAdmissionNo(nanoid());
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;

    const classesRef = ref(database, `schools/${schoolId}/classes`);
    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
      const classesData = snapshot.val();
      const classesList = classesData ? Object.keys(classesData).map(id => ({ id, ...classesData[id] })) : [];
      setClasses(classesList);
    });

    return () => unsubscribeClasses();
  }, [user, schoolId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!user || !schoolId) {
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
    const password = formData.get('password') as string;
    const admissionNo = formData.get('admission-no') as string;
    const enrollmentDate = formData.get('enrollment-date') as string;
    const parentName = formData.get('parent-name') as string;
    const parentPhone = formData.get('parent-phone') as string;
    const parentEmail = formData.get('parent-email') as string;
    const parentNrcPassport = formData.get('parent-nrc-passport') as string;
    const healthStatus = formData.get('health-status') as string;
    const guardianshipStatus = formData.get('guardianship-status') as string;
    
    const selectedDisabilities = disabilityOptions
        .filter(option => formData.get(option.id))
        .map(option => option.label);
    const otherDisability = formData.get('disabilities-other') as string;
    if (otherDisability) {
        selectedDisabilities.push(otherDisability);
    }
    const disabilities = selectedDisabilities.join(', ');
    
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    if (!name || !selectedClassId || !enrollmentDate || !parentName || !parentPhone || !password) {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all required fields, including password.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }
     if (password.length < 6) {
        toast({
            title: 'Weak Password',
            description: 'The student password must be at least 6 characters long.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    try {
      // Use admission number to create a unique, non-public email
      const studentEmail = `${admissionNo.toLowerCase()}@school.app`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, studentEmail, password);
      const studentUser = userCredential.user;

      const studentsRef = ref(database, `schools/${schoolId}/students`);
      const newStudentRef = push(studentsRef);
      await set(newStudentRef, {
        uid: studentUser.uid,
        name,
        admissionNo: admissionNo,
        classId: selectedClassId,
        className: selectedClass?.name,
        enrollmentDate,
        parentName,
        parentPhone,
        parentEmail,
        parentNrcPassport,
        healthStatus,
        disabilities,
        guardianshipStatus,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Success!',
        description: `Student '${name}' has been added and their account created.`,
      });
      router.push('/students');

    } catch (error: any) {
      console.error("Failed to add student:", error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This admission number has already been used to create an account.';
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
          <CardTitle>Add New Student</CardTitle>
          <CardDescription>
            Fill out the form below to enroll a new student and create their portal account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 border-b pb-6">
                 <h3 className="text-lg font-medium">Student Details</h3>
                 <div className="space-y-2">
                    <Label htmlFor="name">Student's Full Name</Label>
                    <Input id="name" name="name" placeholder="e.g. John Smith" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="admission-no">Admission Number</Label>
                    <Input id="admission-no" name="admission-no" value={admissionNo} readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="enrollment-date">Enrollment Date</Label>
                    <Input id="enrollment-date" name="enrollment-date" type="date" required />
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class">Starting Class</Label>
                        <Select name="class" required value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger id="class">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.length > 0 ? (
                            classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                                </SelectItem>
                            ))
                            ) : (
                            <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Set Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                </div>
            </div>
            
            <div className="space-y-4 border-b pb-6">
                 <h3 className="text-lg font-medium">Parent/Guardian Details</h3>
                 <div className="space-y-2">
                    <Label htmlFor="parent-name">Parent's Full Name</Label>
                    <Input id="parent-name" name="parent-name" placeholder="e.g. Jane Smith" required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="parent-email">Parent's Email</Label>
                        <Input id="parent-email" name="parent-email" type="email" placeholder="parent@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parent-phone">Parent's Phone</Label>
                        <Input id="parent-phone" name="parent-phone" type="tel" placeholder="+260 97 123 4567" required />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="parent-nrc-passport">Parent's NRC / Passport</Label>
                        <Input id="parent-nrc-passport" name="parent-nrc-passport" placeholder="Enter ID number" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianship-status">Guardianship Status</Label>
                        <Select name="guardianship-status">
                            <SelectTrigger id="guardianship-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Both Parents">Both Parents</SelectItem>
                                <SelectItem value="Single Parent">Single Parent</SelectItem>
                                <SelectItem value="Guardian / Orphan">Guardian / Orphan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </div>
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="space-y-2">
                    <Label htmlFor="health-status">Student's Health Status</Label>
                    <Textarea id="health-status" name="health-status" placeholder="e.g. Allergies, medical conditions, etc."/>
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
            </div>
           
            <div className="flex justify-end gap-2 pt-4">
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
