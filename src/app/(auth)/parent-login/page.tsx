
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { SCHOOL_ID_LOCAL_STORAGE_KEY } from "@/hooks/use-school-id";


export default function ParentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Verify this user is linked to a student
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication failed.");

      const schoolsRef = ref(database, 'schools');
      const schoolsSnap = await get(schoolsRef);
      if(!schoolsSnap.exists()) throw new Error("No student records found in the system.");

      let isParent = false;
      const schoolsData = schoolsSnap.val();
      for (const schoolId in schoolsData) {
        const students = schoolsData[schoolId].students || {};
        for(const studentId in students) {
          if (students[studentId].parentUid === user.uid) {
            isParent = true;
            // Store schoolId in local storage for the parent portal to use
            localStorage.setItem(SCHOOL_ID_LOCAL_STORAGE_KEY, schoolId);
            break;
          }
        }
        if (isParent) break;
      }
      
      if (!isParent) {
        await auth.signOut();
        throw new Error("This account is not linked to any student. Please register first.");
      }

      toast({ title: "Success!", description: "Parent logged in." });
      router.push('/parent/dashboard');

    } catch (error: any) {
       console.error("Login failed:", error);
       let errorMessage = "Invalid credentials. Please try again.";
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
          <CardTitle className="text-2xl">Parent Portal Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your child's information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
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
                <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/parent-register" className="underline">
              Register here
            </Link>
          </div>
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
