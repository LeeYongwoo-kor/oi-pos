import { PlanId } from "@/constants/plan";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { Plan, Subscription, SubscriptionStatus } from "@prisma/client";
import { hasNullUndefined } from "../utils/checkNullUndefined";
import { getPlanDuration } from "./plan";
import { ValidationError } from "@/lib/shared/CustomError";
import convertDatesToISOString from "@/utils/convertDatesToISOString";

export async function getSubscription(
  userId: string | undefined | null
): Promise<(Subscription & { plan: Plan }) | null> {
  if (!userId) {
    return null;
  }

  const subscription = await prismaRequestHandler(
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    "getSubscription"
  );

  return subscription ? convertDatesToISOString(subscription) : null;
}

export async function getAllSubscriptions(): Promise<Subscription[] | null> {
  return null;
}

export async function upsertSubscription(
  userId: string | undefined | null,
  planId: PlanType
): Promise<Subscription> {
  if (hasNullUndefined({ userId, planId })) {
    throw new ValidationError(
      "Failed to create subscription. Please try again"
    );
  }

  const planDuration = await getPlanDuration(planId);
  if (!planDuration) {
    throw new ValidationError("Plan duration not found");
  }

  // Calculate the current period start and end dates (Unix timestamps in seconds)
  const currentPeriodStart = Math.floor(new Date().getTime() / 1000);
  const currentPeriodEnd = currentPeriodStart + planDuration.duration;

  // Determine the subscription status
  const subscriptionStatus =
    planId == PlanId.TRIAL_PLAN
      ? SubscriptionStatus.TRIAL
      : SubscriptionStatus.ACTIVE;

  // Upsert the subscription
  const newSubscription = await prismaRequestHandler(
    prisma.subscription.upsert({
      where: {
        userId: userId as string,
      },
      create: {
        userId: userId as string,
        planId,
        status: subscriptionStatus,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      },
      update: {
        planId,
        status: subscriptionStatus,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      },
    }),
    "upsertSubscription"
  );

  return convertDatesToISOString(newSubscription);
}

export async function updateSubscriptionStatus(
  userId: string | null | undefined,
  subscriptionStatus: SubscriptionStatus
): Promise<Subscription> {
  if (!userId) {
    throw new ValidationError("Not found user id");
  }

  const updateSubscription = await prismaRequestHandler(
    prisma.subscription.update({
      where: { userId: userId },
      data: { status: subscriptionStatus },
    }),
    "updateSubscriptionStatus"
  );

  return updateSubscription;
}
