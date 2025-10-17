
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, child } from "firebase/database";
import { SCHOOL_ID_LOCAL_STORAGE_KEY } from "@/hooks/use-school-id";

type School = {
  uid: string;
  name: string;
};

export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'schools'));
        if (snapshot.exists()) {
          const schoolsData = snapshot.val();
          const schoolsList = Object.keys(schoolsData).map(key => ({
            uid: key,
            name: schoolsData[key].name,
          }));
          setSchools(schoolsList);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const admissionNo = formData.get('admission-no') as string;
    const password = formData.get('password') as string;
    const schoolUid = formData.get('school') as string;

    if (!schoolUid || !admissionNo) {
      toast({ title: "Login Failed", description: "Please select a school and enter your admission number.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      // Construct the email from the admission number
      const email = `${admissionNo.toLowerCase()}@school.app`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify this student belongs to the selected school
      const studentRef = ref(database, `schools/${schoolUid}/students`);
      const studentSnap = await get(studentRef);

      if (!studentSnap.exists()) {
          await auth.signOut();
          throw new Error("No student records found for the selected school.");
      }

      const studentsData = studentSnap.val();
      const isStudentForSchool = Object.values(studentsData).some((student: any) => student.uid === userCredential.user.uid);

      if (!isStudentForSchool) {
          await auth.signOut();
          throw new Error("Your student account is not associated with the selected school.");
      }
      
      // Create session cookie
      const idToken = await userCredential.user.getIdToken();
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session.');
      }

      localStorage.setItem(SCHOOL_ID_LOCAL_STORAGE_KEY, schoolUid);
      toast({ title: "Success!", description: "Student logged in." });
      router.push('/student/dashboard');

    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = "Invalid credentials. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid admission number or password. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
       <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">Campus.ZM</span>
       </Link>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Student Portal Login</CardTitle>
          <CardDescription>
            Enter your admission number and password to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
             <div className="grid gap-2">
                <Label htmlFor="school">School</Label>
                <Select name="school" required>
                    <SelectTrigger id="school">
                        <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                        {schools.map(school => (
                            <SelectItem key={school.uid} value={school.uid}>{school.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admission-no">Admission Number</Label>
              <Input
                id="admission-no"
                name="admission-no"
                placeholder="Enter your admission number"
                required
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            Back to School Staff Login
          </Link>
        </div>
    </div>
  )
}
