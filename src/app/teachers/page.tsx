import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { teachers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function TeachersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Directory</h1>
        <p className="text-muted-foreground">Find contact details and qualifications for all teachers.</p>
      </div>
       <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a teacher..."
            className="pl-8 w-full md:w-1/3"
          />
        </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teachers.map(teacher => (
            <Card key={teacher.id}>
                <CardHeader className="items-center">
                    <Avatar className="h-24 w-24 mb-2">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} data-ai-hint="teacher portrait" />
                        <AvatarFallback>{teacher.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{teacher.name}</CardTitle>
                    <CardDescription>{teacher.subject}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">{teacher.qualifications}</p>
                    <p className="text-sm text-muted-foreground mb-4">{teacher.email}</p>
                    <Button variant="outline">View Profile</Button>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
