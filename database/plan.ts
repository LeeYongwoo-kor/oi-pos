import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { Plan } from "@prisma/client";

export async function getPlan(
  planId: string | null | undefined
): Promise<Plan | null> {
  if (!planId) {
    return null;
  }

  const [plan, error] = await prismaRequestHandler(
    prisma.plan.findUnique({
      where: {
        id: planId,
      },
    }),
    "getPlan"
  );

  if (error) {
    throw new Error(error.message);
  }

  return plan;
}

export async function getPlanDuration(
  planId: string | null | undefined
): Promise<{ duration: number } | null> {
  if (!planId) {
    return null;
  }

  const [planDuration, error] = await prismaRequestHandler(
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

  if (error) {
    throw new Error(error.message);
  }

  return planDuration;
}

export async function getAllPlans(): Promise<Plan[] | null> {
  const [plans, error] = await prismaRequestHandler(
    prisma.plan.findMany({}),
    "getAllPlans"
  );

  if (error) {
    throw new Error(error.message);
  }

  return plans;
}
