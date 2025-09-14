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
import { useToast } from '@/hooks/use-toast';
import { grades as initialGrades } from '@/lib/mock-data';
import { GraduationCap, PlusCircle, Edit, Trash2 } from 'lucide-react';

type Grade = {
  id: string;
  name: string;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [newGradeName, setNewGradeName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateGrade = () => {
    if (!newGradeName.trim()) {
      toast({
        title: 'Error',
        description: 'Grade name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (editingGrade) {
      // Update existing grade
      setGrades(
        grades.map((g) =>
          g.id === editingGrade.id
            ? { ...g, name: newGradeName }
            : g
        )
      );
      toast({
        title: 'Success!',
        description: 'Grade has been updated.',
      });
    } else {
      // Add new grade
      const newGrade = {
        id: `grade-${Date.now()}`,
        name: newGradeName,
      };
      setGrades([...grades, newGrade]);
      toast({
        title: 'Success!',
        description: 'New grade has been added.',
      });
    }

    closeDialog();
  };

  const handleDeleteGrade = (gradeId: string) => {
    setGrades(grades.filter((g) => g.id !== gradeId));
    toast({
      title: 'Success!',
      description: 'Grade has been deleted.',
    });
  };

  const openDialog = (grade: Grade | null = null) => {
    setEditingGrade(grade);
    setNewGradeName(grade ? grade.name : '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingGrade(null);
    setNewGradeName('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Grade Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage the grades offered by the school.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Grade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade List</CardTitle>
          <CardDescription>
            View, edit, or delete existing grades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-medium">{grade.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(grade)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteGrade(grade.id)}
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
              {editingGrade ? 'Edit Grade' : 'Add New Grade'}
            </DialogTitle>
            <DialogDescription>
              {editingGrade
                ? "Update the grade's name."
                : 'Enter the name for the new grade.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Grade 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddOrUpdateGrade}>
              {editingGrade ? 'Save Changes' : 'Add Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
