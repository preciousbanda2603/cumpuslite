
'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { ClipboardList } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, get, query, orderByChild, equalTo } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';

type Homework = {
  id: string;
  title: string;
  description: string;
  className: string;
  subjectName: string;
  dueDate: string;
};
type Student = {
    classId: string;
    schoolId: string;
};

export default function StudentHomeworkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const schoolsRef = ref(database, 'schools');
    get(schoolsRef).then(snapshot => {
        if (snapshot.exists()) {
            const schoolsData = snapshot.val();
            let foundStudent: Student | null = null;
            for (const schoolId in schoolsData) {
                const students = schoolsData[schoolId].students || {};
                for (const studentId in students) {
                    if (students[studentId].uid === user.uid) {
                        foundStudent = { schoolId, classId: students[studentId].classId };
                        break;
                    }
                }
                if (foundStudent) break;
            }
            setStudent(foundStudent);
        }
    }).finally(() => setLoading(false));

  }, [user]);
  
   useEffect(() => {
    if (!student) return;

    const homeworkQuery = query(
        ref(database, `schools/${student.schoolId}/homework`),
        orderByChild('classId'),
        equalTo(student.classId)
    );

    const unsubscribe = onValue(homeworkQuery, (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.keys(data)
            .map(id => ({ id, ...data[id] }))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setHomework(list);
    });

    return () => unsubscribe();
  }, [student]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            My Homework
          </h1>
          <p className="text-muted-foreground">A list of your current and past assignments.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading assignments...</TableCell></TableRow>
              ) : homework.length > 0 ? (
                homework.map((hw) => (
                  <TableRow key={hw.id}>
                    <TableCell>{hw.subjectName}</TableCell>
                    <TableCell className="font-medium">{hw.title}</TableCell>
                    <TableCell>{format(new Date(hw.dueDate), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No homework assignments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
