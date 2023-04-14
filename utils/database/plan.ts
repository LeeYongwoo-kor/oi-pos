import { Plan } from "@prisma/client";

export async function getPlan(
  planId: string | null | undefined
): Promise<Plan | null | undefined> {
  if (!planId) {
    return null;
  }

  try {
    const planResult = await prisma?.plan.findUnique({
      where: {
        id: planId,
      },
    });

    return planResult;
  } catch (e) {
    console.error("Error fetching plan by ID: ", e);
    throw e;
  }
}

export async function getPlanDuration(
  planId: string | null | undefined
): Promise<{ duration: number } | null | undefined> {
  if (!planId) {
    return null;
  }

  try {
    const duration = await prisma?.plan.findUnique({
      where: {
        id: planId,
      },
      select: {
        duration: true,
      },
    });

    return duration;
  } catch (e) {
    console.error("Error fetching plan duration by ID: ", e);
    throw e;
  }
}

export async function getAllPlans(): Promise<Plan[] | null> {
  return null;
}
