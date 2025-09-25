
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Receipt, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function FinancePage() {
  const financeSections = [
    {
      title: 'Financial Overview',
      description: 'Analyze income, expenditure, and view financial summaries.',
      href: '/finance/overview',
      icon: Receipt,
    },
    {
      title: 'Manual Income',
      description: 'Record income from sources other than school fees.',
      href: '/finance/income',
      icon: TrendingUp,
    },
    {
      title: 'Payroll',
      description: 'Manage monthly salary payments for teachers.',
      href: '/finance/payroll',
      icon: DollarSign,
    },
     {
      title: 'Fee Collection',
      description: 'Track student payments and generate invoices.',
      href: '/fees',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Hub</h1>
        <p className="text-muted-foreground">
          Your central place for managing all school finances.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {financeSections.map((section) => (
          <Card key={section.href}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="h-6 w-6" />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{section.description}</CardDescription>
                </div>
                <Button asChild variant="outline" size="icon">
                  <Link href={section.href}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
