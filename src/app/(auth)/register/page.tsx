
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const schoolName = formData.get('school-name') as string;
    const schoolAddress = formData.get('school-address') as string;
    const contactPerson = formData.get('contact-person') as string;
    const contactPhone = formData.get('contact-phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save school profile to Firestore
      await setDoc(doc(db, "schools", user.uid), {
        name: schoolName,
        address: schoolAddress,
        contactPerson: contactPerson,
        contactPhone: contactPhone,
        adminEmail: email,
        createdAt: new Date(),
      });

      toast({
        title: "Success!",
        description: "Your school account has been created. Please log in.",
      });

      router.push('/login');

    } catch (error: any) {
      console.error("Registration failed:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please use a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
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
            <CardTitle className="text-xl">Register Your School</CardTitle>
            <CardDescription>
            Enter your school's information to create an account
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input name="school-name" id="school-name" placeholder="e.g. Northwood High School" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="school-address">School Address</Label>
                    <Textarea name="school-address" id="school-address" placeholder="Enter the full physical address of the school" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="contact-person">Contact Person</Label>
                      <Input name="contact-person" id="contact-person" placeholder="e.g. Jane Doe" required />
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="contact-phone">Contact Phone</Label>
                      <Input name="contact-phone" id="contact-phone" type="tel" placeholder="+260 97 123 4567" required />
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Administrator Email</Label>
                    <Input
                    name="email"
                    id="email"
                    type="email"
                    placeholder="admin@northwood.ac.zm"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input name="password" id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create School Account'}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
                Sign in
            </Link>
            </div>
        </CardContent>
        </Card>
     </div>
  )
}
