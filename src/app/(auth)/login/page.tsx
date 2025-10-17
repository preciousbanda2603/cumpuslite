
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
import { ref, get } from "firebase/database";
import { SCHOOL_ID_LOCAL_STORAGE_KEY } from "@/hooks/use-school-id";
import { getSchools } from "@/app/actions";

type School = {
  uid: string;
  name: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsList = await getSchools();
        setSchools(schoolsList);
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast({
          title: "Error",
          description: "Could not fetch the list of schools.",
          variant: "destructive",
        });
      }
    };

    fetchSchools();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const schoolUid = formData.get('school') as string;

     if (!schoolUid) {
      toast({
        title: "Login Failed",
        description: "Please select a school.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUserUid = userCredential.user.uid;

      if (loggedInUserUid === schoolUid) {
        localStorage.setItem(SCHOOL_ID_LOCAL_STORAGE_KEY, schoolUid);
        toast({ title: "Success!", description: "Admin logged in." });
        router.push('/dashboard');
        return;
      }

      const teachersRef = ref(database, `schools/${schoolUid}/teachers`);
      const teacherSnapshot = await get(teachersRef);

      if (teacherSnapshot.exists()) {
        const teachersData = teacherSnapshot.val();
        const isTeacherForSchool = Object.values(teachersData).some((teacher: any) => teacher.uid === loggedInUserUid);
        
        if (isTeacherForSchool) {
            localStorage.setItem(SCHOOL_ID_LOCAL_STORAGE_KEY, schoolUid);
            toast({ title: "Success!", description: "Teacher logged in." });
            router.push('/dashboard');
            return;
        }
      }

      await auth.signOut();
      throw new Error("Your account is not associated with the selected school.");

    } catch (error: any) {
       console.error("Login failed:", error);
       let errorMessage = "Invalid credentials or school mismatch. Please try again.";
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password. Please try again.";
       } else if (error.message) {
            errorMessage = error.message;
       }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
          <CardTitle className="text-2xl">School Staff Login</CardTitle>
          <CardDescription>
            Enter your credentials and select your school to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="school">School</Label>
                <Select name="school">
                    <SelectTrigger id="school">
                        <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                        {schools.length > 0 ? (
                            schools.map(school => (
                                <SelectItem key={school.uid} value={school.uid}>{school.name}</SelectItem>
                            ))
                        ) : (
                             <SelectItem value="no-schools" disabled>Loading schools...</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Are you a student or parent?{" "}
             <div className="flex justify-center gap-4 mt-2">
                <Link href="/student-login" className="underline">
                    Student Login
                </Link>
                <Link href="/parent-login" className="underline">
                    Parent Login
                </Link>
            </div>
          </div>
        </CardContent>
      </Card>
       <div className="mt-4 text-sm text-center space-y-2">
            <p>
                Don't have a school account?{" "}
                <Link href="/register" className="underline">
                Register a School
                </Link>
            </p>
             <p>
                Ministry of Education?{" "}
                <Link href="/super-admin-login" className="underline">
                Ministry Portal Login
                </Link>
            </p>
       </div>
    </div>
  )
}
