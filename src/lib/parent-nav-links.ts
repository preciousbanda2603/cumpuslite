
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  CreditCard,
  CalendarDays,
  MessagesSquare,
} from 'lucide-react';

export const navLinks = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/results", label: "Results", icon: FileText },
  { href: "/parent/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/parent/fees", label: "Fees", icon: CreditCard },
  { href: "/parent/events", label: "School Events", icon: CalendarDays },
  { href: "/parent/communication", label: "Communication", icon: MessagesSquare },
];
