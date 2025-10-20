
'use client';

import { useState, useEffect } from 'react';
import { useSchoolId } from './use-school-id';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { featuresByPlan, type SubscriptionPlan } from '@/lib/subscriptions';

type SubscriptionFeatures = {
    [key in keyof typeof featuresByPlan['free']]: boolean;
};

type SubscriptionInfo = {
    plan: SubscriptionPlan;
    loading: boolean;
} & SubscriptionFeatures;

export function useSubscription(): SubscriptionInfo {
    const schoolId = useSchoolId();
    const [plan, setPlan] = useState<SubscriptionPlan>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!schoolId) {
            setLoading(false);
            setPlan('free'); // Default to free if no schoolId
            return;
        }

        setLoading(true);
        const schoolRef = ref(database, `schools/${schoolId}/subscription`);
        const unsubscribe = onValue(schoolRef, (snapshot) => {
            if (snapshot.exists()) {
                setPlan(snapshot.val());
            } else {
                setPlan('free'); // Default to free if not set in DB
            }
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch subscription", error);
            setPlan('free');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId]);

    const features = featuresByPlan[plan] || featuresByPlan.free;

    return {
        plan,
        loading,
        ...features,
    };
}
