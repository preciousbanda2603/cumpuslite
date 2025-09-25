

'use client';

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, UserPlus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { auth, database } from "@/lib/firebase";
import { onValue, ref, set, get } from "firebase/database";
import type { User } from "firebase/auth";
import { useSchoolId } from "@/hooks/use-school-id";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  email: string;
  qualifications: string;
  avatar: string;
  salary?: number;
  startDate?: string;
  disabilities?: string;
};


export default function TeachersPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formState, setFormState] = useState<Partial<Teacher>>({});
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

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
        setFilteredTeachers(teachersList);
      } else {
        setTeachers([]);
        setFilteredTeachers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teachers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, schoolId]);
  
  useEffect(() => {
    const results = teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.disabilities?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeachers(results);
  }, [searchTerm, teachers]);

  const openDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormState({
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        qualifications: teacher.qualifications,
        salary: teacher.salary,
        disabilities: teacher.disabilities,
    });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
      setIsDialogOpen(false);
      setEditingTeacher(null);
      setFormState({});
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
  }

  const handleSaveChanges = async () => {
    if (!editingTeacher || !schoolId) return;
    
    const teacherRef = ref(database, `schools/${schoolId}/teachers/${editingTeacher.id}`);
    
    try {
        const teacherDataSnapshot = await get(teacherRef);
        const currentData = teacherDataSnapshot.val();
        
        const updatedData = {
            ...currentData,
            ...formState,
            salary: formState.salary ? parseFloat(formState.salary.toString()) : currentData.salary,
        };
        
        await set(teacherRef, updatedData);
        
        toast({ title: "Success", description: "Teacher details updated." });
        closeDialog();
    } catch (error) {
        console.error("Failed to update teacher:", error);
        toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    }
  };


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
            placeholder="Search by name or disability..."
            className="pl-8 w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
                Loading teachers...
            </div>
        ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map(teacher => (
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
                         {teacher.salary && <p className="text-sm font-semibold mb-2">ZMW {teacher.salary.toFixed(2)}</p>}
                         {teacher.disabilities && <p className="text-xs text-muted-foreground italic mb-4">Disabilities: {teacher.disabilities}</p>}
                        {isAdmin ? (
                            <Button variant="outline" onClick={() => openDialog(teacher)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                        ) : (
                            <Button variant="outline">View Profile</Button>
                        )}
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground py-12">
                No teachers found. Click "Add Teacher" to get started.
            </div>
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher Profile</DialogTitle>
            <DialogDescription>
              Update the details for {editingTeacher?.name}. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formState.name || ''} onChange={handleFormChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formState.email || ''} onChange={handleFormChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="subject">Primary Subject</Label>
                <Input id="subject" name="subject" value={formState.subject || ''} onChange={handleFormChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input id="qualifications" name="qualifications" value={formState.qualifications || ''} onChange={handleFormChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="salary">Monthly Salary (ZMW)</Label>
                <Input id="salary" name="salary" type="number" value={formState.salary || ''} onChange={handleFormChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="disabilities">Disabilities</Label>
                <Textarea id="disabilities" name="disabilities" value={formState.disabilities || ''} onChange={handleFormChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
