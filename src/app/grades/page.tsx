
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import type { User } from 'firebase/auth';

type Class = {
  id: string;
  name: string;
  roomId: string;
  grade: number;
  teacherName?: string;
  studentCount?: number;
};

type Room = {
  id: string;
  name: string;
};

type Teacher = {
  id: string;
  name: string;
}

export default function GradesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<Partial<Class> | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const schoolUid = user.uid;
    const classesRef = ref(database, `schools/${schoolUid}/classes`);
    const roomsRef = ref(database, `schools/${schoolUid}/rooms`);
    const teachersRef = ref(database, `schools/${schoolUid}/teachers`);
    const studentsRef = ref(database, `schools/${schoolUid}/students`);

    const fetchData = async () => {
      try {
        const [roomsSnap, teachersSnap, classesSnap, studentsSnap] = await Promise.all([
          get(roomsRef),
          get(teachersRef),
          get(classesRef),
          get(studentsRef)
        ]);
        
        const roomsData = roomsSnap.val() || {};
        const roomsList: Room[] = Object.keys(roomsData).map(id => ({ id, ...roomsData[id] }));
        setRooms(roomsList);

        const teachersData = teachersSnap.val() || {};
        const teachersList: Teacher[] = Object.keys(teachersData).map(id => ({ id, ...teachersData[id] }));

        const studentsData = studentsSnap.val() || {};
        const studentsList = Object.values(studentsData) as any[];

        const classesData = classesSnap.val() || {};
        const classesList: Class[] = Object.keys(classesData).map(id => {
          const classData = classesData[id];
          const teacher = teachersList.find(t => t.id === classData.classTeacherId);
          const studentCount = studentsList.filter(s => s.classId === id).length;
          return {
            id,
            ...classData,
            teacherName: teacher ? teacher.name : 'Unassigned',
            studentCount: studentCount
          };
        });
        setClasses(classesList);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({ title: "Error", description: "Could not fetch initial data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    const unsubscribeClasses = onValue(classesRef, () => fetchData());
    
    return () => {
      unsubscribeClasses();
    };

  }, [user, toast]);

  const handleAddOrUpdateClass = async () => {
    if (!newClassName.trim() || !selectedRoomId || !newClassGrade) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    const classData = { 
      name: newClassName, 
      roomId: selectedRoomId, 
      grade: parseInt(newClassGrade, 10),
      classTeacherId: editingClass?.classTeacherId || null,
    };

    try {
      if (editingClass?.id) {
        const classRef = ref(database, `schools/${user.uid}/classes/${editingClass.id}`);
        await set(classRef, classData);
        toast({ title: 'Success!', description: 'Class has been updated.' });
      } else {
        const classesRef = ref(database, `schools/${user.uid}/classes`);
        const newClassRef = push(classesRef);
        await set(newClassRef, classData);
        toast({ title: 'Success!', description: 'New class has been added.' });
      }
      closeDialog();
    } catch (error: any) {
      console.error("Failed to save class:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    try {
      // TODO: Add check for students in class before deleting
      const classRef = ref(database, `schools/${user.uid}/classes/${classId}`);
      await remove(classRef);
      toast({ title: 'Success!', description: 'Class has been deleted.' });
    } catch (error: any) {
      console.error("Failed to delete class:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openDialog = (cls: Partial<Class> | null = null) => {
    setEditingClass(cls);
    setNewClassName(cls?.name || '');
    setNewClassGrade(cls?.grade?.toString() || '');
    setSelectedRoomId(cls?.roomId || '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setNewClassName('');
    setNewClassGrade('');
    setSelectedRoomId('');
  };

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'N/A';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Class Configuration
          </h1>
          <p className="text-muted-foreground">Manage the classes and their assigned rooms.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class List</CardTitle>
          <CardDescription>View, edit, or delete existing classes and their room assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading classes...</TableCell></TableRow>
              ) : classes.length > 0 ? (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.grade}</TableCell>
                    <TableCell>{cls.teacherName}</TableCell>
                    <TableCell>{cls.studentCount}</TableCell>
                    <TableCell>{getRoomName(cls.roomId)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/classes/${cls.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => openDialog(cls)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteClass(cls.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No classes found. Add one to get started.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClass?.id ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>{editingClass?.id ? "Update the class's details." : 'Enter the details for the new class.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="col-span-3" placeholder="e.g. Grade 1A" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">Grade</Label>
               <Select value={newClassGrade} onValueChange={setNewClassGrade}>
                <SelectTrigger id="grade" className="col-span-3">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="room" className="col-span-3">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (<SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" onClick={handleAddOrUpdateClass}>{editingClass?.id ? 'Save Changes' : 'Add Class'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
