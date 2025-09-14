import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClassesPage() {
  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Online Classes</h1>
            <p className="text-muted-foreground">Access video lessons and course materials.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <div className="aspect-video overflow-hidden rounded-md mb-4">
                        <Image src="https://picsum.photos/seed/physics/400/225" data-ai-hint="science classroom" alt="Physics Class" width={400} height={225} className="object-cover"/>
                    </div>
                    <CardTitle>Advanced Physics</CardTitle>
                    <CardDescription>with Ms. Curie</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Dive deep into the laws of thermodynamics and quantum mechanics.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Join Class</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <div className="aspect-video overflow-hidden rounded-md mb-4">
                        <Image src="https://picsum.photos/seed/coding/400/225" data-ai-hint="computer code" alt="Coding Class" width={400} height={225} className="object-cover"/>
                    </div>
                    <CardTitle>Introduction to Python</CardTitle>
                    <CardDescription>with Dr. Turing</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Learn the fundamentals of programming with Python.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Join Class</Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                    <div className="aspect-video overflow-hidden rounded-md mb-4">
                        <Image src="https://picsum.photos/seed/literature/400/225" data-ai-hint="old books" alt="Literature Class" width={400} height={225} className="object-cover"/>
                    </div>
                    <CardTitle>Modernist Literature</CardTitle>
                    <CardDescription>with Mrs. Woolf</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Explore the works of Joyce, Eliot, and Faulkner.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Join Class</Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
