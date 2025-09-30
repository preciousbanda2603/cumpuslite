

'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { onValue, ref, set, remove, get, update } from "firebase/database";
import type { User } from "firebase/auth";
import { useSchoolId } from "@/hooks/use-school-id";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { disabilityOptions } from "@/lib/disability-options";
import { Textarea } from "@/components/ui/textarea";
import { differenceInYears } from "date-fns";

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  dob?: string;
  gender?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Graduated';
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentNrcPassport?: string;
  healthStatus?: string;
  disabilities?: string;
  guardianshipStatus?: string;
  age?: number;
};

type Class = {
  id: string;
  name: string;
};

export default function StudentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [guardianshipFilter, setGuardianshipFilter] = useState('all');
  const [disabilityFilter, setDisabilityFilter] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editFormState, setEditFormState] = useState<Partial<Student>>({});
  const { toast } = useToast();

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

    const studentsRef = ref(database, `schools/${schoolId}/students`);
    const classesRef = ref(database, `schools/${schoolId}/classes`);

    const unsubscribeStudents = onValue(
      studentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          const studentsList: Student[] = Object.keys(studentsData).map((key) => {
            const student = studentsData[key];
            const age = student.dob ? differenceInYears(new Date(), new Date(student.dob)) : undefined;
            return {
                id: key,
                ...student,
                age: age,
            };
          });
          setStudents(studentsList);
          setFilteredStudents(studentsList);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    );

    const unsubscribeClasses = onValue(classesRef, (snapshot) => {
        const data = snapshot.val() || {};
        setClasses(Object.keys(data).map(id => ({ id, ...data[id] })));
    });

    return () => {
        unsubscribeStudents();
        unsubscribeClasses();
    };
  }, [user, schoolId]);

  useEffect(() => {
    let results = students;

    if (searchTerm) {
        results = results.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (ageFilter) {
        const ageNum = parseInt(ageFilter, 10);
        if (!isNaN(ageNum)) {
            results = results.filter(student => student.age === ageNum);
        }
    }
    
    if (genderFilter && genderFilter !== 'all') {
        results = results.filter(student => student.gender === genderFilter);
    }

    if (guardianshipFilter && guardianshipFilter !== 'all') {
        results = results.filter(student => student.guardianshipStatus === guardianshipFilter);
    }
    
    if (disabilityFilter && disabilityFilter !== 'all') {
        results = results.filter(student => student.disabilities?.includes(disabilityFilter));
    }


    setFilteredStudents(results);
  }, [searchTerm, ageFilter, genderFilter, guardianshipFilter, disabilityFilter, students]);

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setEditFormState(student);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditSelectChange = (name: keyof Student, value: string) => {
      setEditFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdateStudent = async () => {
    if (!selectedStudent || !schoolId) return;
  
    const studentRef = ref(database, `schools/${schoolId}/students/${selectedStudent.id}`);
    try {
      const selectedClass = classes.find(c => c.id === editFormState.classId);
      
      const updatePayload: Partial<Student> = {
        ...editFormState,
      };

      if (selectedClass && selectedClass.id !== selectedStudent.classId) {
        updatePayload.className = selectedClass.name;
      }
      
      // Remove id and age from the payload as they are client-side only
      delete updatePayload.id;
      delete updatePayload.age;

      await update(studentRef, updatePayload);
      
      toast({ title: "Success", description: "Student profile updated." });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update student:", error);
      toast({ title: "Error", description: "Failed to update student profile.", variant: "destructive" });
    }
  };
  
  const handleDeleteStudent = async () => {
    if (!selectedStudent || !schoolId) return;
    
    const studentRef = ref(database, `schools/${schoolId}/students/${selectedStudent.id}`);
    try {
        await remove(studentRef);
        toast({ title: "Success", description: "Student record has been deleted." });
        setIsDeleteDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Student Profiles</CardTitle>
          <CardDescription>Manage student information and records.</CardDescription>
        </div>
        {isAdmin && (
            <Link href="/students/add">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
            </Button>
            </Link>
        )}
      </div>
      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
                placeholder="Search by name or admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lg:col-span-2"
            />
            <Input
                placeholder="Filter by age..."
                type="number"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
            />
             <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Gender" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
            </Select>
             <Select value={guardianshipFilter} onValueChange={setGuardianshipFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Guardianship" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Guardianships</SelectItem>
                    <SelectItem value="Both Parents">Both Parents</SelectItem>
                    <SelectItem value="Single Parent">Single Parent</SelectItem>
                    <SelectItem value="Guardian / Orphan">Guardian / Orphan</SelectItem>
                </SelectContent>
            </Select>
            <Select value={disabilityFilter} onValueChange={setDisabilityFilter}>
                <SelectTrigger className="lg:col-span-2">
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guardianship</TableHead>
                <TableHead>Disabilities</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>{student.age}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge></TableCell>
                    <TableCell>{student.guardianshipStatus || 'N/A'}</TableCell>
                    <TableCell>{student.disabilities || 'None'}</TableCell>
                    {isAdmin && (
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(student)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(student)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Student Profile</DialogTitle>
                <DialogDescription>Update the details for {selectedStudent?.name}.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Student's Full Name</Label>
                        <Input id="name" name="name" value={editFormState.name || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admissionNo">Admission Number</Label>
                        <Input id="admissionNo" name="admissionNo" value={editFormState.admissionNo || ''} readOnly disabled />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" name="dob" type="date" value={editFormState.dob || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select name="gender" value={editFormState.gender || ''} onValueChange={(value) => handleEditSelectChange('gender', value)}>
                            <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="classId">Class</Label>
                        <Select name="classId" value={editFormState.classId || ''} onValueChange={(value) => handleEditSelectChange('classId', value)}>
                            <SelectTrigger id="classId"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" value={editFormState.status || 'Active'} onValueChange={(value: Student['status']) => handleEditSelectChange('status', value)}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                                <SelectItem value="Graduated">Graduated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2 border-t pt-4 mt-4">
                     <h3 className="text-md font-semibold">Parent/Guardian Details</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="parentName">Parent's Full Name</Label>
                            <Input id="parentName" name="parentName" value={editFormState.parentName || ''} onChange={handleEditFormChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parentPhone">Parent's Phone</Label>
                            <Input id="parentPhone" name="parentPhone" value={editFormState.parentPhone || ''} onChange={handleEditFormChange} />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="parentEmail">Parent's Email</Label>
                            <Input id="parentEmail" name="parentEmail" type="email" value={editFormState.parentEmail || ''} onChange={handleEditFormChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="parentNrcPassport">Parent's NRC / Passport</Label>
                            <Input id="parentNrcPassport" name="parentNrcPassport" value={editFormState.parentNrcPassport || ''} onChange={handleEditFormChange} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="guardianshipStatus">Guardianship Status</Label>
                        <Select name="guardianshipStatus" value={editFormState.guardianshipStatus || ''} onValueChange={(value) => handleEditSelectChange('guardianshipStatus', value)}>
                            <SelectTrigger id="guardianshipStatus"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Both Parents">Both Parents</SelectItem>
                                <SelectItem value="Single Parent">Single Parent</SelectItem>
                                <SelectItem value="Guardian / Orphan">Guardian / Orphan</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
                 <div className="space-y-2 border-t pt-4 mt-4">
                    <h3 className="text-md font-semibold">Additional Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="healthStatus">Health Status</Label>
                        <Textarea id="healthStatus" name="healthStatus" value={editFormState.healthStatus || ''} onChange={handleEditFormChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="disabilities">Disabilities</Label>
                        <Textarea id="disabilities" name="disabilities" value={editFormState.disabilities || ''} onChange={handleEditFormChange} placeholder="List any disabilities, separated by commas." />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateStudent}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the student record for {selectedStudent?.name}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStudent}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
