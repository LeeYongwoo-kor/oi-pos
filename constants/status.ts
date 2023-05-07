export const SubscriptionStatus = {
  ACTIVE: 1,
  TRIAL: 2,
  EXPIRED: 3,
  PENDING: 4,
  CANCELLED: 5,
} as const;

export const PaypalStatus = {
  CREATED: "CREATED",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  VOIDED: "VOIDED",
} as const;
