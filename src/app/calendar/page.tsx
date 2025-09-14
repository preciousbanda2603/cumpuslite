import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarPage() {
  return (
     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              className="p-3 w-full"
            />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>A list of key dates and deadlines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-md text-center p-2">
                <p className="font-bold text-lg">25</p>
                <p className="text-xs">DEC</p>
              </div>
              <div>
                <p className="font-semibold">Science Fair</p>
                <p className="text-sm text-muted-foreground">All day event in the auditorium.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-accent text-accent-foreground rounded-md text-center p-2">
                <p className="font-bold text-lg">28</p>
                <p className="text-xs">DEC</p>
              </div>
              <div>
                <p className="font-semibold">Parent-Teacher Conferences</p>
                <p className="text-sm text-muted-foreground">3:00 PM - 7:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
