
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
import { database } from "@/lib/firebase";
import { ref, get, child } from "firebase/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createParentUser } from "@/app/actions";


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
      const snapshot = await get(child(dbRef, 'schools'));
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
      const result = await createParentUser({ email, password, schoolUid, admissionNo });

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your parent account has been created and linked. Please log in.",
        });
        router.push('/parent-login');
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description: error.message,
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
            Register to link with your child and access the parent portal. If you already have an account, you can link another child from your dashboard.
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
