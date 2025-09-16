
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, database } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get, query, orderByChild, equalTo, update } from "firebase/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Create a secondary auth instance for creating parent accounts
// This prevents any logged-in admin from being logged out
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const secondaryApp = getApps().length > 1 ? getApp("secondary") : initializeApp(auth.app.options, "secondary");
const secondaryAuth = getAuth(secondaryApp);

type School = {
  uid: string;
  name: string;
};

export default function ParentRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    const fetchSchools = async () => {
      const dbRef = ref(database);
      const snapshot = await get(ref(dbRef, 'schools'));
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const schoolsList = Object.keys(schoolsData).map(key => ({
          uid: key,
          name: schoolsData[key].name,
        }));
        setSchools(schoolsList);
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const schoolUid = formData.get('school') as string;
    const admissionNo = formData.get('admission-no') as string;

    if (!schoolUid || !admissionNo) {
        toast({ title: "Error", description: "School and Admission Number are required.", variant: "destructive"});
        setLoading(false);
        return;
    }

    try {
      // Step 1: Find the student
      const studentsRef = ref(database, `schools/${schoolUid}/students`);
      const q = query(studentsRef, orderByChild('admissionNo'), equalTo(admissionNo));
      const studentSnapshot = await get(q);

      if (!studentSnapshot.exists()) {
        throw new Error("No student found with that Admission Number at the selected school.");
      }
      
      let studentId: string | null = null;
      let studentData: any = null;
      studentSnapshot.forEach((child) => {
          studentId = child.key;
          studentData = child.val();
      });

      if (!studentId || !studentData) throw new Error("Could not retrieve student data.");
      
      if (studentData.parentUid) {
        throw new Error("This student is already linked to a parent account.");
      }
      
      // Step 2: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;

      // Step 3: Update student record with parent's UID
      const studentRef = ref(database, `schools/${schoolUid}/students/${studentId}`);
      await update(studentRef, { parentUid: user.uid });

      toast({
        title: "Success!",
        description: "Your parent account has been created and linked. Please log in.",
      });

      router.push('/parent-login');

    } catch (error: any) {
      console.error("Registration failed:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please use a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Campus.ZM</span>
       </Link>
        <Card className="mx-auto max-w-lg w-full">
        <CardHeader>
            <CardTitle className="text-xl">Create Parent Account</CardTitle>
            <CardDescription>
            Register to link with your child and access the parent portal.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="school">School</Label>
                    <Select name="school" required>
                        <SelectTrigger id="school">
                            <SelectValue placeholder="Select your child's school" />
                        </SelectTrigger>
                        <SelectContent>
                            {schools.map(school => (
                                <SelectItem key={school.uid} value={school.uid}>{school.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="admission-no">Student's Admission Number</Label>
                    <Input name="admission-no" id="admission-no" placeholder="Enter your child's unique ID" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                    name="email"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input name="password" id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Register and Link Account'}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/parent-login" className="underline">
                Sign in
            </Link>
            </div>
        </CardContent>
        </Card>
     </div>
  )
}
