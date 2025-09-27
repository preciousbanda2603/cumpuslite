
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, PlusCircle, CalendarCheck, Check, X } from 'lucide-react';
import { useSchoolId } from '@/hooks/use-school-id';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get, push, set, update } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type UserRole = 'admin' | 'teacher' | null;
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
type LeaveRequest = {
  id: string;
  teacherId: string;
  teacherName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
};

const leaveTypes = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

export default function LeaveManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;

    const determineUserRole = async () => {
      if (user.uid === schoolId) {
        setUserRole('admin');
        return;
      }

      const teachersRef = ref(database, `schools/${schoolId}/teachers`);
      const snapshot = await get(teachersRef);
      if (snapshot.exists()) {
        const teachersData = snapshot.val();
        const foundTeacherId = Object.keys(teachersData).find(
          (id) => teachersData[id].uid === user.uid
        );
        if (foundTeacherId) {
          setUserRole('teacher');
          setTeacherId(foundTeacherId);
          setTeacherName(teachersData[foundTeacherId].name);
        }
      }
    };
    determineUserRole();
  }, [user, schoolId]);

  useEffect(() => {
    if (!userRole || !schoolId) {
        setLoading(false);
        return;
    };
    setLoading(true);

    const requestsRef = ref(database, `schools/${schoolId}/leaveRequests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const list: LeaveRequest[] = Object.keys(data).map(id => ({ id, ...data[id] }));

        if (userRole === 'admin') {
            setLeaveRequests(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else if (userRole === 'teacher' && teacherId) {
            setLeaveRequests(list.filter(req => req.teacherId === teacherId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
        setLoading(false);
    });

    return () => unsubscribe();

  }, [userRole, schoolId, teacherId]);

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => {
    setIsDialogOpen(false);
    setLeaveType('');
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
  };

  const handleSubmitRequest = async () => {
    if (!user || !schoolId || !teacherId || !leaveType || !startDate || !endDate || !reason) {
        toast({ title: 'Error', description: 'Please fill out all fields.', variant: 'destructive' });
        return;
    }
    
    const requestData = {
        teacherId,
        teacherName,
        leaveType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reason,
        status: 'Pending' as LeaveStatus,
        createdAt: new Date().toISOString(),
    };

    try {
        const requestsRef = ref(database, `schools/${schoolId}/leaveRequests`);
        const newRequestRef = push(requestsRef);
        await set(newRequestRef, requestData);
        toast({ title: 'Success', description: 'Your leave request has been submitted.' });
        closeDialog();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to submit request.', variant: 'destructive' });
    }
  };
  
  const handleUpdateRequestStatus = async (requestId: string, status: LeaveStatus) => {
    if (userRole !== 'admin' || !schoolId) return;
    try {
        const requestRef = ref(database, `schools/${schoolId}/leaveRequests/${requestId}/status`);
        await set(requestRef, status);
        toast({ title: 'Success', description: `Request has been ${status.toLowerCase()}.` });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update request status.', variant: 'destructive' });
    }
  };
  
  const getStatusBadge = (status: LeaveStatus) => {
      const variant: "default" | "destructive" | "secondary" = status === 'Approved' ? 'default' : status === 'Rejected' ? 'destructive' : 'secondary';
      return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck className="h-8 w-8" />
            Leave Management
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin'
              ? 'Review and manage leave requests from all teachers.'
              : 'Submit and track your leave requests.'}
          </p>
        </div>
         {userRole === 'teacher' && (
            <Button onClick={openDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request Leave
            </Button>
        )}
      </div>

       <Card>
        <CardHeader>
            <CardTitle>{userRole === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        {userRole === 'admin' && <TableHead>Teacher</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        {userRole === 'admin' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={userRole === 'admin' ? 7 : 6} className="h-24 text-center">Loading requests...</TableCell></TableRow>
                    ) : leaveRequests.length > 0 ? (
                        leaveRequests.map(req => (
                            <TableRow key={req.id}>
                                {userRole === 'admin' && <TableCell className="font-medium">{req.teacherName}</TableCell>}
                                <TableCell>{req.leaveType}</TableCell>
                                <TableCell>{format(new Date(req.startDate), 'PPP')}</TableCell>
                                <TableCell>{format(new Date(req.endDate), 'PPP')}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                                <TableCell>{getStatusBadge(req.status)}</TableCell>
                                {userRole === 'admin' && (
                                    <TableCell className="text-right">
                                        {req.status === 'Pending' ? (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="icon" variant="outline" onClick={() => handleUpdateRequestStatus(req.id, 'Approved')}><Check className="h-4 w-4 text-green-600"/></Button>
                                                <Button size="icon" variant="outline" onClick={() => handleUpdateRequestStatus(req.id, 'Rejected')}><X className="h-4 w-4 text-red-600" /></Button>
                                            </div>
                                        ) : 'N/A'}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                         <TableRow><TableCell colSpan={userRole === 'admin' ? 7 : 6} className="h-24 text-center">No leave requests found.</TableCell></TableRow>
                    )}
                 </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                  <DialogDescription>Fill out the form below to request time off.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="leave-type">Leave Type</Label>
                      <Select value={leaveType} onValueChange={setLeaveType}>
                          <SelectTrigger id="leave-type"><SelectValue placeholder="Select type"/></SelectTrigger>
                          <SelectContent>
                              {leaveTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label>Start Date</Label>
                           <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                           </Popover>
                      </div>
                      <div className="grid gap-2">
                          <Label>End Date</Label>
                           <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                           </Popover>
                      </div>
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="reason">Reason for Leave</Label>
                      <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please provide a brief reason for your absence..." />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={handleSubmitRequest}>Submit Request</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
