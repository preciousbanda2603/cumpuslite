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
import { rooms as initialRooms } from '@/lib/mock-data';
import { DoorOpen, PlusCircle, Edit, Trash2 } from 'lucide-react';

type Room = {
  id: string;
  name: string;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: 'Error',
        description: 'Room name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (editingRoom) {
      // Update existing room
      setRooms(
        rooms.map((r) =>
          r.id === editingRoom.id ? { ...r, name: newRoomName } : r
        )
      );
      toast({
        title: 'Success!',
        description: 'Room has been updated.',
      });
    } else {
      // Add new room
      const newRoom = {
        id: `room-${Date.now()}`,
        name: newRoomName,
      };
      setRooms([...rooms, newRoom]);
      toast({
        title: 'Success!',
        description: 'New room has been added.',
      });
    }

    closeDialog();
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter((r) => r.id !== roomId));
    toast({
      title: 'Success!',
      description: 'Room has been deleted.',
    });
  };

  const openDialog = (room: Room | null = null) => {
    setEditingRoom(room);
    setNewRoomName(room ? room.name : '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
    setNewRoomName('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DoorOpen className="h-8 w-8" />
            School Room Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage the rooms and locations in the school.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room List</CardTitle>
          <CardDescription>
            View, edit, or delete existing school rooms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name / Number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(room)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteRoom(room.id)}
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
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Update the room's name or number."
                : 'Enter the name or number for the new room.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Room 101, Science Lab"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddOrUpdateRoom}>
              {editingRoom ? 'Save Changes' : 'Add Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
