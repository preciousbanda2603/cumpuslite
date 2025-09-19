
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm fixed top-0 w-full z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Campus.ZM</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-screen flex items-center justify-center text-center">
           <Image
            src="https://picsum.photos/seed/student-uniform/1200/800"
            data-ai-hint="student uniform"
            alt="Student in school uniform"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 p-4 sm:p-6 text-white space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to the Future of Education
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-300 md:text-xl">
              Experience immersive learning with our virtual reality platform.
              Manage your school effortlessly and step into the new era of
              education.
            </p>
            <Button
              size="lg"
              className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
              asChild
            >
              <Link href="/login">
                Enter VR Classroom
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
