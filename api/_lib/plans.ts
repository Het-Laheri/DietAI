// Server-side source of truth for subscription prices. The browser only sends a planId.
// Keep in sync with SUBSCRIPTION_PLANS in src/services/subscription.ts (a test checks this).
export interface ServerPlan {
  id: '1_month' | '2_months' | '3_months';
  name: string;
  durationDays: number;
  priceInPaise: number;
}

export const SERVER_PLANS: Record<ServerPlan['id'], ServerPlan> = {
  '1_month': { id: '1_month', name: '1 Month Kickstart', durationDays: 30, priceInPaise: 150000 },
  '2_months': { id: '2_months', name: '2 Months Transformation', durationDays: 60, priceInPaise: 250000 },
  '3_months': { id: '3_months', name: '3 Months Total Health', durationDays: 90, priceInPaise: 400000 },
};

export function getPlan(planId: unknown): ServerPlan | null {
  return typeof planId === 'string' && Object.prototype.hasOwnProperty.call(SERVER_PLANS, planId)
    ? SERVER_PLANS[planId as ServerPlan['id']]
    : null;
}
