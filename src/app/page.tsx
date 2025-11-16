'use client';

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
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    image: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=800&auto=format&fit=crop',
    hint: 'admin dashboard school',
  },
  {
    icon: BookUser,
    title: 'For Teachers',
    description: 'Spend more time teaching and less time on paperwork. Manage lesson plans, track student progress, and communicate with parents effortlessly.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    hint: 'teacher in classroom with students',
  },
  {
    icon: Heart,
    title: 'For Parents & Students',
    description: 'Stay engaged with your child’s educational journey. Access report cards, view attendance, and communicate directly with the school through a dedicated portal.',
    image: 'https://images.unsplash.com/photo-1588075592446-4f1e91894e9f?q=80&w=800&auto=format&fit=crop',
    hint: 'parent and child using tablet education',
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Enhanced Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <GraduationCap className="h-7 w-7 text-blue-600 group-hover:scale-110 transition-transform" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Campus.ZM
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
              <Link href="/register">Register School</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section - Student Background with Blur + Gradient */}
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1498243691581-b145660463ae?q=80&w=2070&auto=format&fit=crop"
              alt="Students learning together in modern classroom"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm" />
          </div>

          <div className="container px-4 md:px-6 text-center text-white">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Trusted by 200+ schools in Zambia
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Empowering Education,<br />One School at a Time
              </h1>
              <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto">
                Streamline administration, engage parents, and elevate learning with Zambia’s most trusted school management platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-xl">
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20">
                  <Link href="/login">Login to Portal</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Modern Cards */}
        <section className="w-full py-20 bg-white dark:bg-slate-900">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                Core Features
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Everything Your School Needs
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                Built to reduce workload, improve transparency, and drive academic success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="group relative p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:-translate-y-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles Section - Glassmorphism + Floating Images */}
        <section className="w-full py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Designed for Everyone
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                A unified platform that works seamlessly for admins, teachers, parents, and students.
              </p>
            </div>

            {roles.map((role, index) => (
              <div
                key={role.title}
                className={`grid lg:grid-cols-2 gap-12 items-center mb-20 last:mb-0 ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <role.icon className="h-4 w-4" />
                    {role.title}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    {role.title.replace('For ', '')}
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <Image
                    src={role.image}
                    alt={role.title}
                    width={600}
                    height={400}
                    className="relative rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="container px-4 md:px-6 text-center text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Modernize Your School?
              </h2>
              <p className="text-xl text-blue-100">
                Join hundreds of Zambian schools already using Campus.ZM to save time and improve outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 shadow-xl"
                >
                  <Link href="/register">
                    Register Your School Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold text-white">Campus.ZM</span>
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} Campus.ZM. All rights reserved.</p>
            <nav className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
