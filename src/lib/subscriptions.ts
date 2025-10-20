
export const subscriptionPlans = ['free', 'basic', 'premium'] as const;
export type SubscriptionPlan = typeof subscriptionPlans[number];

export const featuresByPlan = {
    free: {
        canViewFinance: false,
        canUsePayroll: false,
        canUseAi: false,
    },
    basic: {
        canViewFinance: true,
        canUsePayroll: false,
        canUseAi: true,
    },
    premium: {
        canViewFinance: true,
        canUsePayroll: true,
        canUseAi: true,
    }
};
