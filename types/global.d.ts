import { RequestMethodType } from "@/constants/fetch";
import { PlanEnumType } from "@/constants/plan";
import {
  PaypalStatusEnumType,
  SubscriptionStatusEnumType,
  UserStatusEnumType,
} from "@/constants/status";
import {
  LocaleEnumType,
  TableEnumType,
  UserRoleEnumType,
} from "@/constants/type";

declare global {
  type Currency = "USD" | "JPY";
  type Locale = LocaleEnumType;
  type Method = RequestMethodType;
  type SubscriptionStatusType = SubscriptionStatusEnumType;
  type PaypalStatusType = PaypalStatusEnumType;
  type UserStatusType = UserStatusEnumType;
  type PlanType = PlanEnumType;
  type TableType = TableEnumType;
  type UserRoleType = UserRoleEnumType;
  type ActionTypes<T> = T extends { type: infer U } ? U : never;
  type ToRawQuery<T> = {
    [K in keyof T]?: string | number;
  };
}
