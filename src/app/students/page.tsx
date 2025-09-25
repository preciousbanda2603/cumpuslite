

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
import { onValue, ref, set, remove } from "firebase/database";
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

type Student = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  enrollmentDate: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Graduated';
  disabilities?: string;
  guardianshipStatus?: string;
};

export default function StudentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [guardianshipFilter, setGuardianshipFilter] = useState('all');
  const [disabilityFilter, setDisabilityFilter] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentStatus, setStudentStatus] = useState<Student['status']>('Active');
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
    const unsubscribe = onValue(
      studentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          const studentsList: Student[] = Object.keys(studentsData).map((key) => ({
            id: key,
            ...studentsData[key],
          }));
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

    return () => unsubscribe();
  }, [user, schoolId]);

  useEffect(() => {
    let results = students;

    if (searchTerm) {
        results = results.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (guardianshipFilter && guardianshipFilter !== 'all') {
        results = results.filter(student => student.guardianshipStatus === guardianshipFilter);
    }
    
    if (disabilityFilter && disabilityFilter !== 'all') {
        results = results.filter(student => student.disabilities?.includes(disabilityFilter));
    }


    setFilteredStudents(results);
  }, [searchTerm, guardianshipFilter, disabilityFilter, students]);

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setStudentStatus(student.status);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const handleStatusChange = async () => {
    if (!selectedStudent || !schoolId) return;

    const studentRef = ref(database, `schools/${schoolId}/students/${selectedStudent.id}/status`);
    try {
        await set(studentRef, studentStatus);
        toast({ title: "Success", description: "Student status updated." });
        setIsEditDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
                placeholder="Search by name or admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
             <Select value={guardianshipFilter} onValueChange={setGuardianshipFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission No.</TableHead>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Student Status</DialogTitle>
                <DialogDescription>Change the status for {selectedStudent?.name}.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="status-select">Status</Label>
                <Select value={studentStatus} onValueChange={(value: Student['status']) => setStudentStatus(value)}>
                    <SelectTrigger id="status-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Graduated">Graduated</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStatusChange}>Save Changes</Button>
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
