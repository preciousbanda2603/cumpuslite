
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Receipt, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FinancePage() {
  const { subscription, loading } = useSubscription();

  const financeSections = [
    {
      title: 'Financial Overview',
      description: 'Analyze income, expenditure, and view financial summaries.',
      href: '/finance/overview',
      icon: Receipt,
      permission: subscription.canViewFinance,
    },
    {
      title: 'Manual Income',
      description: 'Record income from sources other than school fees.',
      href: '/finance/income',
      icon: TrendingUp,
      permission: subscription.canViewFinance,
    },
    {
      title: 'Payroll',
      description: 'Manage monthly salary payments for teachers.',
      href: '/finance/payroll',
      icon: DollarSign,
      permission: subscription.canUsePayroll,
    },
     {
      title: 'Fee Collection',
      description: 'Track student payments and generate invoices.',
      href: '/fees',
      icon: TrendingUp,
      permission: subscription.canViewFinance,
    },
  ];
  
  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
          </div>
      )
  }

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
            <TooltipProvider key={section.href}>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(!section.permission && "pointer-events-none")}>
                        <Card className={cn("hover:bg-muted/50 transition-colors", !section.permission && 'opacity-50')}>
                            <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                <CardTitle className="flex items-center gap-2">
                                    <section.icon className="h-6 w-6" />
                                    {section.title}
                                </CardTitle>
                                <CardDescription className="mt-2">{section.description}</CardDescription>
                                </div>
                                <Button asChild variant="outline" size="icon" disabled={!section.permission}>
                                <Link href={section.href}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                </Button>
                            </div>
                            </CardHeader>
                        </Card>
                      </div>
                    </TooltipTrigger>
                    {!section.permission && (
                        <TooltipContent>
                            <p>This feature requires a higher subscription plan.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
