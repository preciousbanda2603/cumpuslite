
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessagesSquare } from 'lucide-react';
import { useSchoolId } from '@/hooks/use-school-id';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, push, set, serverTimestamp, query, orderByChild, get } from 'firebase/database';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type Teacher = {
  id: string;
  name: string;
  uid: string;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
};

type UserProfile = {
  id: string;
  uid: string;
  name: string;
};

export default function CommunicationPage() {
  const schoolId = useSchoolId();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && schoolId) {
      setIsAdmin(user.uid === schoolId);
    }
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    setLoading(true);
    const teachersRef = ref(database, `schools/${schoolId}/teachers`);
    const schoolAdminRef = ref(database, `schools/${schoolId}`);

    const unsubscribeTeachers = onValue(teachersRef, (snapshot) => {
      const teachersData = snapshot.val() || {};
      const teachersList: UserProfile[] = Object.keys(teachersData).map((key) => ({
        id: key,
        uid: teachersData[key].uid,
        name: teachersData[key].name,
      }));

      get(schoolAdminRef).then((schoolSnapshot) => {
         const schoolData = schoolSnapshot.val();
         const adminProfile: UserProfile = {
            id: schoolId,
            uid: schoolId,
            name: `${schoolData.name} (Admin)`,
         };
         const combinedUsers = [adminProfile, ...teachersList];
         setAllUsers(combinedUsers.filter(u => u.uid !== user.uid));
         setLoading(false);
      });
    });

    return () => unsubscribeTeachers();
  }, [user, schoolId]);

  useEffect(() => {
    if (!activeChat || !user) return;

    const getChatId = (uid1: string, uid2: string) => {
        return [uid1, uid2].sort().join('_');
    }
    
    const chatId = getChatId(user.uid, activeChat.uid);
    const messagesRef = query(ref(database, `schools/${schoolId}/chats/${chatId}/messages`), orderByChild('timestamp'));
    
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val() || {};
        const messageList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMessages(messageList);
    });
    
    return () => unsubscribeMessages();

  }, [activeChat, user, schoolId]);
  
   useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeChat || !schoolId) return;
    
    const getChatId = (uid1: string, uid2: string) => {
        return [uid1, uid2].sort().join('_');
    }
    const chatId = getChatId(user.uid, activeChat.uid);
    const messagesRef = ref(database, `schools/${schoolId}/chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);

    try {
      await set(newMessageRef, {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
        console.error("Failed to send message", error);
    }
  };
  
  const getAvatarFallback = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Select a conversation to start chatting.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
            <ScrollArea className="h-full pr-4">
            <div className="space-y-2">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="flex items-center gap-4 p-2 rounded-lg">
                     <Skeleton className="h-12 w-12 rounded-full" />
                     <div className="space-y-2">
                       <Skeleton className="h-4 w-[150px]" />
                       <Skeleton className="h-4 w-[100px]" />
                     </div>
                   </div>
                ))
            ) : allUsers.length > 0 ? (
                 allUsers.map(chatUser => (
                     <div 
                        key={chatUser.id} 
                        className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-muted ${activeChat?.id === chatUser.id ? 'bg-muted' : ''}`}
                        onClick={() => setActiveChat(chatUser)}
                    >
                        <Avatar>
                           <AvatarImage src={`https://picsum.photos/seed/${chatUser.id}/100/100`} data-ai-hint="person avatar" />
                           <AvatarFallback>{getAvatarFallback(chatUser.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{chatUser.name}</p>
                            <p className="text-sm text-muted-foreground">{chatUser.uid === schoolId ? 'School Administrator' : 'Teacher'}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-10">No other staff to chat with.</p>
            )}
            </div>
            </ScrollArea>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 flex flex-col">
       {activeChat && user ? (
         <>
            <CardHeader>
                <CardTitle>Chat with {activeChat.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                   {messages.map(msg => {
                     const isSender = msg.senderId === user.uid;
                     const senderProfile = isSender ? { name: user.displayName || 'Me', id: user.uid } : allUsers.find(u => u.uid === msg.senderId) || activeChat;
                     return (
                         <div key={msg.id} className={`flex items-start gap-3 ${isSender ? 'justify-end' : ''}`}>
                            {!isSender && (
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${senderProfile.id}/100/100`} data-ai-hint="person avatar" />
                                    <AvatarFallback>{getAvatarFallback(senderProfile.name)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg max-w-xs`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${isSender ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {format(new Date(msg.timestamp), 'p')}
                                </p>
                            </div>
                             {isSender && (
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${senderProfile.id}/100/100`} data-ai-hint="person avatar" />
                                    <AvatarFallback>Me</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                     );
                   })}
                </div>
                </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="relative">
                    <Input 
                        placeholder="Type a message..." 
                        className="pr-12"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                        <Send className="h-4 w-4"/>
                    </Button>
                </form>
            </div>
         </>
       ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
             <MessagesSquare className="h-12 w-12 mb-4"/>
             <h3 className="text-lg font-semibold">Welcome to the Chat</h3>
             <p>Select a conversation from the left to start messaging.</p>
          </div>
       )}
      </Card>
    </div>
  );
}
