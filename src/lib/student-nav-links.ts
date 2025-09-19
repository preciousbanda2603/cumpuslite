
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ClipboardList,
  CalendarDays,
} from 'lucide-react';

export const navLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/results", label: "My Results", icon: FileText, isHidden: true }, // Placeholder, will build page
  { href: "/student/attendance", label: "My Attendance", icon: CheckSquare },
  { href: "/student/homework", label: "Homework", icon: ClipboardList, isHidden: true }, // Placeholder, will build page
  { href: "/student/timetable", label: "My Timetable", icon: CalendarDays, isHidden: true }, // Placeholder, will build page
  { href: "/exams", label: "Quizzes & Exams", icon: FileText },
];
