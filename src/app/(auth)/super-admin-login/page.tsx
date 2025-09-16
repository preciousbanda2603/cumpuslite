
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
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'superadmin@campus.zm';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // A simple check can be added here, but the ultimate authority is Firebase Auth rules
    if (email !== superAdminEmail) {
        toast({ title: "Access Denied", description: "This is not a recognized Ministry account.", variant: "destructive" });
        setLoading(false);
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Success!", description: "Ministry official logged in." });
        router.push('/super-admin');
    } catch (error) {
        toast({ title: "Login Failed", description: "Invalid credentials for Ministry account.", variant: "destructive" });
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
          <CardTitle className="text-2xl">Ministry Portal Login</CardTitle>
          <CardDescription>
            Enter your official credentials to access the national dashboard.
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
                placeholder="official@moe.gov.zm"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login to Ministry Portal'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/super-admin-register" className="underline">
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

