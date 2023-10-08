export const PLAN_ID = {
  TRIAL_PLAN: "10001",
  MONTHLY_PLAN: "20001",
  YEARLY_PLAN: "20002",
} as const;

export const TABLE_NUMBER_MAX = 200;
export const COUNTER_NUMBER_MAX = 100;
export const MENU_NUMBER_MAX = 500;
export const TRIAL_TABLE_NUMBER_MAX = 10;
export const TRIAL_COUNTER_NUMBER_MAX = 5;
export const TRIAL_MENU_NUMBER_MAX = 30;
export const TRIAL_DURATION = 7_776_000;
export const MONTHLY_DURATION = 2_678_400;
export const YEARLY_DURATION = 31_536_000;
export const TRIAL_PRICE = 0;
export const MONTHLY_PRICE = 4.99;
export const YEARLY_PRICE = 49.99;
export const TRIAL_PRICE_JPY = 0;
export const MONTHLY_PRICE_JPY = 590;
export const YEARLY_PRICE_JPY = 5900;

export type PlanEnumType = (typeof PLAN_ID)[keyof typeof PLAN_ID];
