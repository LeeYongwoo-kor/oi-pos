import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import convertDatesToISOString from "@/utils/converter/convertDatesToISOString";
import { CurrencyType, Plan, PlanType as PlanDbType } from "@prisma/client";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { LocaleType } from "@/constants/type";

export type CreatePlanParams = {
  id: PlanType;
  planType: PlanDbType;
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  duration: number;
  maxMenus: number;
  maxTables: number;
};

export async function getPlan(
  planId: string | null | undefined
): Promise<Plan | null> {
  if (!planId) {
    return null;
  }

  const plan = await prismaRequestHandler(
    prisma.plan.findUnique({
      where: {
        id: planId,
      },
    }),
    "getPlan"
  );

  return plan ? convertDatesToISOString(plan) : null;
}

export async function getPlanDuration(
  planId: string | null | undefined
): Promise<{ duration: number } | null> {
  if (!planId) {
    return null;
  }

  const planDuration = await prismaRequestHandler(
    prisma.plan.findUnique({
      where: {
        id: planId,
      },
      select: {
        duration: true,
      },
    }),
    "getPlanDuration"
  );

  return planDuration;
}

export async function getAllPlansByLocale(
  locale?: Locale | undefined
): Promise<Plan[] | null> {
  const plans = await prismaRequestHandler(
    prisma.plan.findMany({
      where: {
        currency:
          locale === LocaleType.ja ? CurrencyType.JPY : CurrencyType.USD,
      },
    }),
    "getAllPlansByLocale"
  );

  return plans ? plans.map((plan) => convertDatesToISOString(plan)) : null;
}

export async function getAllPlans(): Promise<Plan[] | null> {
  const plans = await prismaRequestHandler(
    prisma.plan.findMany({}),
    "getAllPlans"
  );

  return plans ? plans.map((plan) => convertDatesToISOString(plan)) : null;
}

export async function upsertPlan(plansParam: CreatePlanParams): Promise<Plan> {
  const { hasNullUndefined } = checkNullUndefined(plansParam);

  if (hasNullUndefined) {
    throw new ValidationError("Failed to create plans. Please try again later");
  }

  const plan = await prismaRequestHandler(
    prisma.plan.upsert({
      where: {
        id: plansParam.id,
      },
      create: {
        id: plansParam.id,
        planType: plansParam.planType,
        name: plansParam.name,
        description: plansParam.description,
        price: plansParam.price,
        currency: plansParam.currency,
        duration: plansParam.duration,
        maxMenus: plansParam.maxMenus,
        maxTables: plansParam.maxTables,
      },
      update: {
        planType: plansParam.planType,
        name: plansParam.name,
        description: plansParam.description,
        price: plansParam.price,
        currency: plansParam.currency,
        duration: plansParam.duration,
        maxMenus: plansParam.maxMenus,
        maxTables: plansParam.maxTables,
      },
    }),
    "upsertPlan"
  );

  return plan;
}
