
'use client';

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import type { User } from "firebase/auth";
import { useSchoolId } from "@/hooks/use-school-id";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  email: string;
  qualifications: string;
  avatar: string;
};


export default function TeachersPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (user && schoolId) {
        setIsAdmin(user.uid === schoolId);
    }
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    const teachersRef = ref(database, `schools/${schoolId}/teachers`);
    const unsubscribe = onValue(teachersRef, (snapshot) => {
      if (snapshot.exists()) {
        const teachersData = snapshot.val();
        const teachersList = Object.keys(teachersData).map(key => ({
          id: key,
          ...teachersData[key],
          avatar: `https://picsum.photos/seed/${key}/100/100`, // Generate consistent avatar
        }));
        setTeachers(teachersList);
      } else {
        setTeachers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teachers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, schoolId]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Directory</h1>
            <p className="text-muted-foreground">Find contact details and qualifications for all teachers.</p>
        </div>
        {isAdmin && (
            <div className="flex items-center gap-2">
            <Link href="/teachers/add">
                <Button className="flex items-center gap-2">
                <PlusCircle />
                Add Teacher
                </Button>
            </Link>
            <Link href="/teachers/assign">
                <Button variant="outline" className="flex items-center gap-2">
                <UserPlus />
                Assign Class Teacher
                </Button>
            </Link>
            </div>
        )}
      </div>
       <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a teacher..."
            className="pl-8 w-full md:w-1/3"
          />
        </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
                Loading teachers...
            </div>
        ) : teachers.length > 0 ? (
            teachers.map(teacher => (
                <Card key={teacher.id}>
                    <CardHeader className="items-center">
                        <Avatar className="h-24 w-24 mb-2">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} data-ai-hint="teacher portrait" />
                            <AvatarFallback>{teacher.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{teacher.name}</CardTitle>
                        <CardDescription>{teacher.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">{teacher.qualifications}</p>
                        <p className="text-sm text-muted-foreground mb-4">{teacher.email}</p>
                        <Button variant="outline">View Profile</Button>
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground py-12">
                No teachers found. Click "Add Teacher" to get started.
            </div>
        )}
      </div>
    </div>
  );
}
