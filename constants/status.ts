const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  TRIAL: "TRIAL",
  EXPIRED: "EXPIRED",
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
} as const;

const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
  BANNED: "BANNED",
};

export const PaypalStatus = {
  CREATED: "CREATED",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  VOIDED: "VOIDED",
} as const;

export type SubscriptionStatusEnumType = keyof typeof SubscriptionStatus;
export type PaypalStatusEnumType = keyof typeof PaypalStatus;
export type UserStatusEnumType = keyof typeof UserStatus;
