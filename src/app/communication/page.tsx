import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

export default function CommunicationPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Select a conversation to start chatting.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
                <Avatar><AvatarImage src="https://picsum.photos/seed/t1/100/100" data-ai-hint="person avatar" /></Avatar>
                <div>
                    <p className="font-semibold">Mr. David Armstrong</p>
                    <p className="text-sm text-muted-foreground">Math Class</p>
                </div>
            </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>Chat with Mr. David Armstrong</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Avatar><AvatarImage src="https://picsum.photos/seed/t1/100/100" data-ai-hint="person avatar" /></Avatar>
                    <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Hi there! Just wanted to check on Alex's progress in Algebra.</p>
                        <p className="text-xs text-muted-foreground mt-1">2:14 PM</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Hi! Alex is doing great. He scored an A on the last test. I've uploaded the results.</p>
                        <p className="text-xs text-primary-foreground/80 mt-1">2:15 PM</p>
                    </div>
                    <Avatar><AvatarImage src="https://picsum.photos/seed/admin/100/100" data-ai-hint="person avatar" /></Avatar>
                </div>
            </div>
            </ScrollArea>
        </CardContent>
        <div className="p-4 border-t">
            <div className="relative">
                <Input placeholder="Type a message..." className="pr-12"/>
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                    <Send className="h-4 w-4"/>
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
}
