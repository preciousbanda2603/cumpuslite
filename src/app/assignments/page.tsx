
'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { teachers, classAssignments as initialAssignments } from '@/lib/mock-data';
import { BookCopy } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const { toast } = useToast();

  const handleTeacherChange = (className: string, newTeacherId: string) => {
    setAssignments(prevAssignments =>
      prevAssignments.map(assignment =>
        assignment.class === className
          ? { ...assignment, teacherId: newTeacherId }
          : assignment
      )
    );
  };

  const handleSaveChanges = () => {
    // Here you would typically send the updated assignments to your backend.
    console.log('Saving updated assignments:', assignments);
    toast({
      title: 'Success!',
      description: 'Class assignments have been updated.',
    });
  };

  const getTeacherById = (id: string) => teachers.find(t => t.id === id);

  return (
    <div className="flex flex-col gap-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookCopy className="h-8 w-8" />
                Class Assignments
            </h1>
            <p className="text-muted-foreground">View and manage teacher assignments for each class.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Assignments</CardTitle>
          <CardDescription>
            Assign or re-assign teachers to different classes. Click 'Save Changes' to apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(({ class: className, teacherId }) => {
                  const teacher = getTeacherById(teacherId);
                  return (
                    <TableRow key={className}>
                      <TableCell className="font-medium">{className}</TableCell>
                      <TableCell>
                        <Select
                          value={teacherId}
                          onValueChange={(newTeacherId) => handleTeacherChange(className, newTeacherId)}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select a teacher">
                              {teacher ? teacher.name : 'Unassigned'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
