

export const subscriptionPlans = ['free', 'basic', 'premium'] as const;
export type SubscriptionPlan = typeof subscriptionPlans[number];

export type SubscriptionFeatures = {
    canViewFinance: boolean;
    canUsePayroll: boolean;
    canUseAi: boolean;
};

export const featuresByPlan: { [key in SubscriptionPlan]: SubscriptionFeatures } = {
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
