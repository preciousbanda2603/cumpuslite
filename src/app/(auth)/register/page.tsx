
import Link from "next/link"

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

export default function RegisterPage() {
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
            <form>
              <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input id="school-name" placeholder="e.g. Northwood High School" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="school-address">School Address</Label>
                    <Textarea id="school-address" placeholder="Enter the full physical address of the school" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="contact-person">Contact Person</Label>
                      <Input id="contact-person" placeholder="e.g. Jane Doe" required />
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="contact-phone">Contact Phone</Label>
                      <Input id="contact-phone" type="tel" placeholder="+260 97 123 4567" required />
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Administrator Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="admin@northwood.ac.zm"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                    Create School Account
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
