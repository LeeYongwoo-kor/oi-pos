import { RequestMethodType } from "@/constants/fetch";
import { PlanEnumType } from "@/constants/plan";
import {
  PaypalStatusEnumType,
  SubscriptionStatusEnumType,
  UserStatusEnumType,
} from "@/constants/status";
import { TableEnumType, UserRoleEnumType } from "@/constants/type";

declare global {
  type Currency = "USD" | "JPY";
  type Method = RequestMethodType;
  type SubscriptionStatusType = SubscriptionStatusEnumType;
  type PaypalStatusType = PaypalStatusEnumType;
  type UserStatusType = UserStatusEnumType;
  type PlanType = PlanEnumType;
  type TableType = TableEnumType;
  type UserRoleType = UserRoleEnumType;
}
