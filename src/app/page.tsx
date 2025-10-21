
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  GraduationCap,
  Users,
  BarChart,
  CreditCard,
  MessagesSquare,
  ShieldCheck,
  BookUser,
  Heart,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Student & Staff Management',
    description: 'Centralize profiles, track records, and manage staff information all in one place.',
  },
  {
    icon: BarChart,
    title: 'Academic Excellence',
    description: 'Manage timetables, track attendance, and generate insightful report cards with ease.',
  },
  {
    icon: CreditCard,
    title: 'Financial Control',
    description: 'Streamline fee collection, manage payroll, and get a clear overview of school finances.',
  },
  {
    icon: MessagesSquare,
    title: 'Communication Hub',
    description: 'Foster a connected school community with integrated messaging for admins, teachers, and parents.',
  },
];

const roles = [
  {
    icon: ShieldCheck,
    title: 'For Administrators',
    description: 'Get a 360-degree view of your school operations. From admissions to finance, make data-driven decisions and reduce administrative overhead.',
    image: 'https://picsum.photos/seed/admin/600/400',
    hint: 'desk computer',
  },
  {
    icon: BookUser,
    title: 'For Teachers',
    description: 'Spend more time teaching and less time on paperwork. Manage lesson plans, track student progress, and communicate with parents effortlessly.',
    image: 'https://picsum.photos/seed/teacher/600/400',
    hint: 'teacher classroom',
  },
  {
    icon: Heart,
    title: 'For Parents & Students',
    description: 'Stay engaged with your child’s educational journey. Access report cards, view attendance, and communicate directly with the school through a dedicated portal.',
    image: 'https://picsum.photos/seed/parent/600/400',
    hint: 'parent child',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Campus.ZM</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/register">Register School</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-24 pb-12 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 flex items-center justify-center text-center">
           <div className="absolute inset-0 -z-10">
              <Image
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                data-ai-hint="graduation students"
                alt="Graduation ceremony"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-white/60 dark:bg-black/70" />
           </div>
          <div className="container px-4 md:px-6 text-foreground">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                The All-In-One Platform to Manage Your School
              </h1>
              <p className="text-lg text-foreground/80 md:text-xl">
                From student profiles and report cards to financial management and parent communication, Campus.ZM brings your entire school ecosystem into a single, easy-to-use platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button size="lg" asChild>
                    <Link href="/register">
                      Get Started for Free
                      <ArrowRight className="ml-2" />
                    </Link>
                </Button>
                 <Button size="lg" variant="secondary" asChild>
                    <Link href="/login">
                      Login to Your Portal
                    </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with powerful features designed to streamline administration, empower teachers, and engage parents.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <div key={feature.title} className="grid gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full p-3">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* For Who? Section */}
         <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 space-y-12">
             <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Built for Your Entire School Community</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Campus.ZM is designed to meet the unique needs of every member of your educational ecosystem.
                    </p>
                </div>
            </div>
            {roles.map((role, index) => (
                <div key={role.title} className={`grid gap-6 lg:grid-cols-2 lg:gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-row-dense' : ''}`}>
                    <div className={`space-y-4 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                            <role.icon className="h-5 w-5 inline-block mr-2" />
                            {role.title}
                        </div>
                        <p className="text-xl text-muted-foreground sm:text-2xl">{role.description}</p>
                    </div>
                     <Image
                        src={role.image}
                        data-ai-hint={role.hint}
                        alt={role.title}
                        width={600}
                        height={400}
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                    />
                </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Ready to Transform Your School?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join hundreds of institutions embracing the future of education. Register your school today and unlock a world of possibilities.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">Register Your School Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted p-6 md:py-8 w-full">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Campus.ZM</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Campus.ZM. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/login" className="text-sm hover:underline underline-offset-4">
              Login
            </Link>
            <Link href="/register" className="text-sm hover:underline underline-offset-4">
              Register
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
