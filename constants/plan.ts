export const PlanId = {
  TRIAL_PLAN: "10001",
  MONTHLY_PLAN: "20001",
  YEARLY_PLAN: "20002",
} as const;

export type PlanEnumType = (typeof PlanId)[keyof typeof PlanId];
