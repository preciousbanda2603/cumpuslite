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
import { classes as initialClasses, rooms } from '@/lib/mock-data';
import { GraduationCap, PlusCircle, Edit, Trash2 } from 'lucide-react';

type Class = {
  id: string;
  name: string;
  roomId: string;
};

export default function GradesPage() {
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateClass = () => {
    if (!newClassName.trim() || !selectedRoomId) {
      toast({
        title: 'Error',
        description: 'Class name and room are required.',
        variant: 'destructive',
      });
      return;
    }

    if (editingClass) {
      setClasses(
        classes.map((c) =>
          c.id === editingClass.id
            ? { ...c, name: newClassName, roomId: selectedRoomId }
            : c
        )
      );
      toast({
        title: 'Success!',
        description: 'Class has been updated.',
      });
    } else {
      const newClass = {
        id: `class-${Date.now()}`,
        name: newClassName,
        roomId: selectedRoomId,
      };
      setClasses([...classes, newClass]);
      toast({
        title: 'Success!',
        description: 'New class has been added.',
      });
    }

    closeDialog();
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter((c) => c.id !== classId));
    toast({
      title: 'Success!',
      description: 'Class has been deleted.',
    });
  };

  const openDialog = (cls: Class | null = null) => {
    setEditingClass(cls);
    setNewClassName(cls ? cls.name : '');
    setSelectedRoomId(cls ? cls.roomId : '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setNewClassName('');
    setSelectedRoomId('');
  };

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'Unassigned';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Class Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage the classes and their assigned rooms.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class List</CardTitle>
          <CardDescription>
            View, edit, or delete existing classes and their room assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Assigned Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{getRoomName(cls.roomId)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(cls)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClass(cls.id)}
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
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Update the class's name and assigned room."
                : 'Enter the details for the new class.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Grade 1A, Grade 7B"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="room" className="col-span-3">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
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
            <Button type="button" onClick={handleAddOrUpdateClass}>
              {editingClass ? 'Save Changes' : 'Add Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
