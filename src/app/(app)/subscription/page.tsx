
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { initiateSubscriptionPayment } from '@/app/actions';
import { useSchoolId } from '@/hooks/use-school-id';


const plans = {
    basic: {
        name: 'Basic',
        price: '1500',
        features: ['Full Student & Teacher Management', 'Class & Subject Configuration', 'Timetabling & Attendance', 'Report Card Generation', 'AI-Assisted Report Comments'],
        upgrade: true,
    },
    premium: {
        name: 'Premium',
        price: '3000',
        features: ['All Basic Features', 'Full Financial Suite (Fee Collection, Payroll)', 'Parent & Student Portals', 'Online Communication Hub', 'Advanced Admin Controls'],
        upgrade: true,
    }
}

function PaymentDialog({ plan, open, onOpenChange }: { plan: 'basic' | 'premium', open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const schoolId = useSchoolId();
    const [loading, setLoading] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');

    const handlePayment = async () => {
        if (!schoolId) {
            toast({ title: 'Error', description: 'School ID not found.', variant: 'destructive' });
            return;
        }
        if (!mobileNumber || !/^\d{10,12}$/.test(mobileNumber)) {
            toast({ title: 'Invalid Mobile Number', description: 'Please enter a valid mobile number (e.g., 260979600152).', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const amount = parseFloat(plans[plan].price);
            const result = await initiateSubscriptionPayment({ schoolId, plan, mobileNumber, amount });
            if (result.success) {
                toast({ title: 'Payment Initiated', description: result.message });
                onOpenChange(false);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to {plans[plan].name} Plan</DialogTitle>
                    <DialogDescription>
                        You are about to pay ZMW {plans[plan].price} for the {plans[plan].name} plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="mobile-number">Mobile Money Number</Label>
                    <Input 
                        id="mobile-number" 
                        placeholder="e.g. 260979600152" 
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">Enter the mobile number you wish to make the payment from. A payment prompt will be sent to this number.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handlePayment} disabled={loading}>{loading ? 'Processing...' : 'Pay Now'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SubscriptionPage() {
    const { plan, loading } = useSubscription();
    const [dialogPlan, setDialogPlan] = useState<'basic' | 'premium' | null>(null);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
                <p className="text-muted-foreground">View your current plan and available upgrade options.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
                <Card className={cn('flex flex-col', plan === 'free' && 'border-primary ring-2 ring-primary')}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Free Plan</CardTitle>
                            {plan === 'free' && <Badge>Current Plan</Badge>}
                        </div>
                        <p className="text-3xl font-bold">ZMW 0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-2 text-sm">
                            {['Basic Student & Teacher Profiles', 'Class & Subject Setup', 'Limited to 50 students'].map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className={cn('flex flex-col', plan === 'basic' && 'border-primary ring-2 ring-primary')}>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <CardTitle>Basic Plan</CardTitle>
                            {plan === 'basic' && <Badge>Current Plan</Badge>}
                        </div>
                        <p className="text-3xl font-bold">ZMW {plans.basic.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ul className="space-y-2 text-sm">
                            {plans.basic.features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {plan === 'free' && (
                            <Button className="w-full" onClick={() => setDialogPlan('basic')}>
                                <Star className="mr-2 h-4 w-4" /> Upgrade to Basic
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <Card className={cn('flex flex-col', plan === 'premium' && 'border-primary ring-2 ring-primary')}>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <CardTitle>Premium Plan</CardTitle>
                            {plan === 'premium' && <Badge>Current Plan</Badge>}
                        </div>
                        <p className="text-3xl font-bold">ZMW {plans.premium.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ul className="space-y-2 text-sm">
                            {plans.premium.features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                         {plan !== 'premium' && (
                            <Button className="w-full" onClick={() => setDialogPlan('premium')}>
                                <Star className="mr-2 h-4 w-4" /> Upgrade to Premium
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
            {dialogPlan && <PaymentDialog plan={dialogPlan} open={!!dialogPlan} onOpenChange={() => setDialogPlan(null)} />}
        </div>
    );
}
