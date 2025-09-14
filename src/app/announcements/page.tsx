
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
import { useToast } from '@/hooks/use-toast';
import { Megaphone, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function AnnouncementsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !schoolId) return;
    setLoading(true);
    const announcementsRef = ref(database, `schools/${schoolId}/announcements`);
    const unsubscribeAnnouncements = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(list);
      setLoading(false);
    });

    return () => unsubscribeAnnouncements();
  }, [user, schoolId]);

  const openDialog = (announcement: Partial<Announcement> | null = null) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement?.title || '');
    setContent(announcement?.content || '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!user || !schoolId || !title || !content) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }

    const announcementData = {
      title,
      content,
      createdAt: editingAnnouncement?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingAnnouncement?.id) {
        const announcementRef = ref(database, `schools/${schoolId}/announcements/${editingAnnouncement.id}`);
        await set(announcementRef, announcementData);
        toast({ title: 'Success!', description: 'Announcement updated successfully.' });
      } else {
        const announcementsRef = ref(database, `schools/${schoolId}/announcements`);
        const newAnnouncementRef = push(announcementsRef);
        await set(newAnnouncementRef, announcementData);
        toast({ title: 'Success!', description: 'Announcement posted successfully.' });
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save announcement:", error);
      toast({ title: 'Error', description: 'Failed to save announcement.', variant: 'destructive' });
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!user || !schoolId) return;
    try {
      const announcementRef = ref(database, `schools/${schoolId}/announcements/${announcementId}`);
      await remove(announcementRef);
      toast({ title: 'Success!', description: 'Announcement deleted.' });
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            School Announcements
          </h1>
          <p className="text-muted-foreground">Manage and post important updates for the school.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Announcement
        </Button>
      </div>
      <div className="space-y-4">
        {loading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading announcements...</CardContent></Card>
        ) : announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{announcement.title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openDialog(announcement)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(announcement.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
                <CardDescription>
                  Posted on {new Date(announcement.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No announcements have been posted yet.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement?.id ? 'Edit Announcement' : 'Add New Announcement'}</DialogTitle>
            <DialogDescription>Fill in the details for the announcement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" onClick={handleSubmit}>{editingAnnouncement?.id ? 'Save Changes' : 'Post Announcement'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
