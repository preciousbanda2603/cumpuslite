
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
import { teachers, subjects as initialSubjects } from '@/lib/mock-data';
import { BookCopy } from 'lucide-react';

// Mocking subject assignments
const initialSubjectAssignments = initialSubjects.map(subject => ({
    subjectId: subject.id,
    subjectName: subject.name,
    grade: subject.grade,
    teacherId: teachers.length > 0 ? teachers[Math.floor(Math.random() * teachers.length)].id : '',
}));


export default function SubjectAssignmentsPage() {
  const [assignments, setAssignments] = useState(initialSubjectAssignments);
  const { toast } = useToast();

  const handleTeacherChange = (subjectId: string, newTeacherId: string) => {
    setAssignments(prevAssignments =>
      prevAssignments.map(assignment =>
        assignment.subjectId === subjectId
          ? { ...assignment, teacherId: newTeacherId }
          : assignment
      )
    );
  };

  const handleSaveChanges = () => {
    console.log('Saving updated subject assignments:', assignments);
    toast({
      title: 'Success!',
      description: 'Subject assignments have been updated.',
    });
  };

  const getTeacherById = (id: string) => teachers.find(t => t.id === id);

  return (
    <div className="flex flex-col gap-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookCopy className="h-8 w-8" />
                Subject Assignments
            </h1>
            <p className="text-muted-foreground">Assign teachers to specific subjects for each grade.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Subject Teachers</CardTitle>
          <CardDescription>
            Assign or re-assign teachers to different subjects. Click 'Save Changes' to apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.sort((a, b) => a.grade - b.grade).map(({ subjectId, subjectName, grade, teacherId }) => {
                    const teacher = getTeacherById(teacherId);
                    return (
                      <TableRow key={subjectId}>
                        <TableCell className="font-medium">{subjectName}</TableCell>
                        <TableCell>Grade {grade}</TableCell>
                        <TableCell>
                          <Select
                            value={teacherId}
                            onValueChange={(newTeacherId) => handleTeacherChange(subjectId, newTeacherId)}
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
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No subjects available to assign.
                    </TableCell>
                  </TableRow>
                )}
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
