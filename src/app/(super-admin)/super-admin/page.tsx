
'use client';

import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, School, BookUser, MoreHorizontal } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteSchool, updateSchool } from '@/app/actions';
import { subscriptionPlans, type SubscriptionPlan } from '@/lib/subscriptions';

type SchoolData = {
  id: string;
  name: string;
  address: string;
  studentCount: number;
  teacherCount: number;
  status?: 'active' | 'suspended';
  subscription?: SubscriptionPlan;
};

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [formState, setFormState] = useState<Partial<SchoolData>>({});
  const { toast } = useToast();

  const totalStudents = schools.reduce((acc, school) => acc + school.studentCount, 0);
  const totalTeachers = schools.reduce((acc, school) => acc + school.teacherCount, 0);

  useEffect(() => {
    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    
    const unsubscribe = onValue(schoolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const schoolsList: SchoolData[] = Object.keys(schoolsData).map(key => {
          const school = schoolsData[key];
          return {
            id: key,
            name: school.name,
            address: school.address,
            status: school.status || 'active',
            subscription: school.subscription || 'free',
            studentCount: school.students ? Object.keys(school.students).length : 0,
            teacherCount: school.teachers ? Object.keys(school.teachers).length : 0,
          };
        });
        setSchools(schoolsList);
      } else {
        setSchools([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openManageDialog = (school: SchoolData) => {
    setSelectedSchool(school);
    setFormState({
        name: school.name,
        status: school.status,
        subscription: school.subscription,
    });
    setIsManageOpen(true);
  };

  const openDeleteDialog = (school: SchoolData) => {
    setSelectedSchool(school);
    setIsDeleteOpen(true);
  };
  
  const handleUpdateSchool = async () => {
    if (!selectedSchool || !formState.name) return;

    try {
        await updateSchool(selectedSchool.id, {
            name: formState.name,
            status: formState.status,
            subscription: formState.subscription,
        });
        toast({ title: 'Success', description: `${formState.name} has been updated.` });
        setIsManageOpen(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update school.', variant: 'destructive' });
    }
  };
  
  const handleDeleteSchool = async () => {
    if (!selectedSchool) return;

    try {
        await deleteSchool(selectedSchool.id);
        toast({ title: 'Success', description: `School '${selectedSchool.name}' has been deleted.`});
        setIsDeleteOpen(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete school.', variant: 'destructive'});
    }
  };
  
  const handleToggleStatus = async (school: SchoolData) => {
    const newStatus = school.status === 'active' ? 'suspended' : 'active';
    try {
        await updateSchool(school.id, { status: newStatus });
        toast({ title: 'Success', description: `${school.name} has been ${newStatus}.` });
    } catch(error) {
        toast({ title: 'Error', description: 'Failed to update school status.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Live overview and management of all registered schools.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{schools.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalStudents}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalTeachers}</div>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Registered Schools</CardTitle>
          <CardDescription>A list of all schools on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading data...</TableCell></TableRow>
              ) : schools.length > 0 ? (
                schools.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.studentCount}</TableCell>
                    <TableCell>{school.teacherCount}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{school.subscription}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={school.status === 'active' ? 'default' : 'destructive'} className="capitalize">{school.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openManageDialog(school)}>Manage School</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(school)}>{school.status === 'active' ? 'Suspend' : 'Activate'}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(school)}>Delete School</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center">No schools found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Manage School</DialogTitle>
                  <DialogDescription>Update details for {selectedSchool?.name}.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="name">School Name</Label>
                      <Input id="name" value={formState.name || ''} onChange={(e) => setFormState(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                           <Label htmlFor="subscription">Subscription</Label>
                            <Select value={formState.subscription || 'free'} onValueChange={(value: SubscriptionPlan) => setFormState(p => ({...p, subscription: value}))}>
                                <SelectTrigger id="subscription"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {subscriptionPlans.map(plan => (
                                        <SelectItem key={plan} value={plan} className="capitalize">{plan}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="grid gap-2">
                           <Label htmlFor="status">Status</Label>
                             <Select value={formState.status || 'active'} onValueChange={(value: 'active' | 'suspended') => setFormState(p => ({...p, status: value}))}>
                                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                       </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateSchool}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the school <strong>{selectedSchool?.name}</strong> and all associated data, including students, teachers, and financial records.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSchool}>Delete School</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
