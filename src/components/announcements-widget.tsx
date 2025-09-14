'use client';

import { useState, useEffect, useMemo } from 'react';
import { Megaphone, Bot, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPersonalizedAnnouncements } from '@/app/actions';
import { allAnnouncements, students } from '@/lib/mock-data';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export function AnnouncementsWidget() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(students[0]?.id);
  const [personalizedAnnouncements, setPersonalizedAnnouncements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!selectedStudent) {
          setPersonalizedAnnouncements([]);
          setIsLoading(false);
          return;
      };
      setIsLoading(true);
      try {
        const result = await getPersonalizedAnnouncements({
          studentInterests: selectedStudent.interests.join(', '),
          studentActivities: selectedStudent.activities.join(', '),
          allAnnouncements: allAnnouncements.join(', '),
        });
        setPersonalizedAnnouncements(result.personalizedAnnouncements.split(',').map(s => s.trim()));
      } catch (error) {
        console.error('Failed to fetch personalized announcements:', error);
        setPersonalizedAnnouncements(['Error fetching announcements.']);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncements();
  }, [selectedStudent]);
  
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Personalized Announcements
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
                <Bot className="h-3 w-3" /> AI Powered
            </Badge>
        </div>
        <CardDescription>
          Announcements tailored to the selected student's profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="mb-4">
          <label htmlFor="student-select" className="text-sm font-medium mb-2 block">
            Viewing As
          </label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger id="student-select" className="w-full sm:w-[250px]">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a student" />
                </div>
            </SelectTrigger>
            <SelectContent>
              {students.length > 0 ? (
                students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-students" disabled>
                  No students available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedStudent && (
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <p><b>Interests:</b> {selectedStudent.interests.join(', ')}</p>
              <p><b>Activities:</b> {selectedStudent.activities.join(', ')}</p>
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <div className="flex-grow">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-5/6 rounded-md" />
              <Skeleton className="h-5 w-4/6 rounded-md" />
              <Skeleton className="h-5 w-3/6 rounded-md" />
            </div>
          ) : (
            <ul className="space-y-2 list-disc pl-5">
              {personalizedAnnouncements.length > 0 && personalizedAnnouncements[0] !== "" ? (
                personalizedAnnouncements.map((announcement, index) => (
                  <li key={index} className="text-sm">
                    {announcement}
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No relevant announcements for this student.</p>
              )}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
