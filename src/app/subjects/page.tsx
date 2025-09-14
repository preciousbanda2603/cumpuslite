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
import { subjects as initialSubjects } from '@/lib/mock-data';
import { BookText, PlusCircle, Edit, Trash2 } from 'lucide-react';

type Subject = {
  id: string;
  name: string;
  grade: number;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGrade, setNewSubjectGrade] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateSubject = () => {
    if (!newSubjectName.trim() || !newSubjectGrade) {
      toast({
        title: 'Error',
        description: 'Subject name and grade are required.',
        variant: 'destructive',
      });
      return;
    }

    const grade = parseInt(newSubjectGrade, 10);

    if (editingSubject) {
      // Update existing subject
      setSubjects(
        subjects.map((s) =>
          s.id === editingSubject.id
            ? { ...s, name: newSubjectName, grade }
            : s
        )
      );
      toast({
        title: 'Success!',
        description: 'Subject has been updated.',
      });
    } else {
      // Add new subject
      const newSubject = {
        id: `sub-${Date.now()}`,
        name: newSubjectName,
        grade,
      };
      setSubjects([...subjects, newSubject]);
      toast({
        title: 'Success!',
        description: 'New subject has been added.',
      });
    }

    closeDialog();
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(subjects.filter((s) => s.id !== subjectId));
    toast({
      title: 'Success!',
      description: 'Subject has been deleted.',
    });
  };

  const openDialog = (subject: Subject | null = null) => {
    setEditingSubject(subject);
    setNewSubjectName(subject ? subject.name : '');
    setNewSubjectGrade(subject ? String(subject.grade) : '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setNewSubjectName('');
    setNewSubjectGrade('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookText className="h-8 w-8" />
            Subjects Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage the subjects offered by the school.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>
            View, edit, or delete existing subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>Grade {subject.grade}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(subject)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? "Update the subject's details."
                : 'Enter the details for the new subject.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Chemistry"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade-select" className="text-right">
                Grade
              </Label>
              <Select value={newSubjectGrade} onValueChange={setNewSubjectGrade}>
                <SelectTrigger id="grade-select" className="col-span-3">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddOrUpdateSubject}>
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
