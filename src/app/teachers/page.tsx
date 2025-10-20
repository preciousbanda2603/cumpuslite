
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
import { PlusCircle, Search, UserPlus, Edit, Upload } from "lucide-react";
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
import { disabilityOptions } from "@/lib/disability-options";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportDialog } from "@/components/import-dialog";
import { importTeachersFromCSV } from "@/app/actions";


type Teacher = {
  id: string;
  name: string;
  subject: string;
  email: string;
  qualifications: string;
  avatar: string;
  salary?: number;
  startDate?: string;
  dob?: string;
  gender?: string;
  disabilities?: string;
  role?: 'admin' | 'teacher';
  totalLeaveDays?: number;
};

const teacherSampleData = [
    { name: 'Alice Johnson', email: 'alice.j@example.com', subject: 'Mathematics', qualifications: 'M.Sc. Mathematics', salary: '9000', startDate: '2022-08-01', dob: '1985-03-12', gender: 'Female' },
    { name: 'Bob Williams', email: 'bob.w@example.com', subject: 'Physics', qualifications: 'Ph.D. in Physics', salary: '9500', startDate: '2021-07-15', dob: '1980-11-25', gender: 'Male' },
    { name: 'Charlie Brown', email: 'charlie.b@example.com', subject: 'English', qualifications: 'B.A. Literature', salary: '8000', startDate: '2023-01-10', dob: '1990-06-30', gender: 'Male' },
    { name: 'Diana Miller', email: 'diana.m@example.com', subject: 'History', qualifications: 'M.A. History', salary: '8200', startDate: '2022-09-01', dob: '1988-09-18', gender: 'Female' },
    { name: 'Ethan Davis', email: 'ethan.d@example.com', subject: 'Chemistry', qualifications: 'B.Sc. Chemistry', salary: '7800', startDate: '2023-08-20', dob: '1992-01-05', gender: 'Male' },
];

export default function TeachersPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formState, setFormState] = useState<Partial<Teacher>>({});
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [disabilityFilter, setDisabilityFilter] = useState('all');


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (user && schoolId) {
      const mainAdmin = user.uid === schoolId;
      setIsMainAdmin(mainAdmin);
      
      if (mainAdmin) {
          setIsAdmin(true);
      } else {
        const teacherRef = ref(database, `schools/${schoolId}/teachers`);
        get(teacherRef).then(snapshot => {
            if (snapshot.exists()) {
                const teachersData = snapshot.val();
                const currentTeacher = Object.values(teachersData).find((t: any) => t.uid === user.uid) as Teacher;
                if (currentTeacher?.role === 'admin') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            }
        });
      }
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
    let results = teachers;
    
    if (searchTerm) {
        results = results.filter(teacher =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (disabilityFilter && disabilityFilter !== 'all') {
        results = results.filter(teacher => teacher.disabilities?.includes(disabilityFilter));
    }

    setFilteredTeachers(results);
  }, [searchTerm, disabilityFilter, teachers]);

  const openDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormState({
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        qualifications: teacher.qualifications,
        salary: teacher.salary,
        dob: teacher.dob,
        gender: teacher.gender,
        disabilities: teacher.disabilities,
        role: teacher.role || 'teacher',
        totalLeaveDays: teacher.totalLeaveDays,
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
  
  const handleRoleChange = (role: 'admin' | 'teacher') => {
      setFormState(prev => ({ ...prev, role }));
  }
  
  const handleSelectChange = (name: keyof Teacher, value: string) => {
      setFormState(prev => ({ ...prev, [name]: value }));
  };

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
            totalLeaveDays: formState.totalLeaveDays ? parseInt(formState.totalLeaveDays.toString(), 10) : currentData.totalLeaveDays,
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
                <ImportDialog
                    title="Import Teachers"
                    description="Upload a CSV file to bulk-add new teachers. The system will automatically generate passwords for each teacher."
                    templateHeaders={["name", "email", "subject", "qualifications", "salary", "startDate (YYYY-MM-DD)", "dob (YYYY-MM-DD)", "gender (Male/Female)"]}
                    sampleData={teacherSampleData}
                    onImport={importTeachersFromCSV}
                    schoolId={schoolId!}
                    trigger={
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Teachers
                        </Button>
                    }
                />
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
       <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by name..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <Select value={disabilityFilter} onValueChange={setDisabilityFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Filter by Disability" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Disabilities</SelectItem>
                    {disabilityOptions.map(option => (
                        <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
                        <CardDescription>{teacher.subject} {teacher.role === 'admin' && <span className="font-semibold text-primary">(Admin)</span>}</CardDescription>
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
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formState.name || ''} onChange={handleFormChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formState.email || ''} onChange={handleFormChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" name="dob" type="date" value={formState.dob || ''} onChange={handleFormChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                     <Select name="gender" value={formState.gender || ''} onValueChange={(value) => handleSelectChange('gender', value)}>
                        <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="subject">Primary Subject</Label>
                <Input id="subject" name="subject" value={formState.subject || ''} onChange={handleFormChange} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input id="qualifications" name="qualifications" value={formState.qualifications || ''} onChange={handleFormChange} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="salary">Monthly Salary (ZMW)</Label>
                    <Input id="salary" name="salary" type="number" value={formState.salary || ''} onChange={handleFormChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="totalLeaveDays">Total Annual Leave</Label>
                    <Input id="totalLeaveDays" name="totalLeaveDays" type="number" value={formState.totalLeaveDays || ''} onChange={handleFormChange} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="disabilities">Disabilities</Label>
                <Textarea id="disabilities" name="disabilities" value={formState.disabilities || ''} onChange={handleFormChange} placeholder="List any disabilities, separated by commas."/>
            </div>
            {isMainAdmin && (
                 <div className="grid gap-2 border-t pt-4 mt-2">
                    <Label htmlFor="role">System Role</Label>
                     <Select value={formState.role || 'teacher'} onValueChange={handleRoleChange}>
                        <SelectTrigger id="role">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">Assigning the 'Admin' role gives this teacher full access to the system.</p>
                </div>
            )}
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
