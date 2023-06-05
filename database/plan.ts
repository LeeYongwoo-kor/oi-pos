import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import checkNullUndefined from "@/utils/checkNullUndefined";
import convertDatesToISOString from "@/utils/convertDatesToISOString";
import { Plan, PlanType as PlanDbType } from "@prisma/client";
import { ValidationError } from "yup";

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

export async function getAllPlans(): Promise<Plan[] | null> {
  const plans = await prismaRequestHandler(
    prisma.plan.findMany({}),
    "getAllPlans"
  );

  return plans ? plans.map((plan) => convertDatesToISOString(plan)) : null;
}

export async function upsertPlan(plansParam: CreatePlanParams): Promise<Plan> {
  const { hasNullUndefined, nullOrUndefinedKeys } =
    checkNullUndefined(plansParam);

  if (hasNullUndefined) {
    throw new ValidationError(
      "Failed to create plans. Please try again",
      nullOrUndefinedKeys
    );
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
