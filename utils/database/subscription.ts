import { SubscriptionStatus } from "@/constants/status";
import { Subscription } from "@prisma/client";
import { hasNullUndefined } from "../hasNullUndefined";
import { getPlanDuration } from "./plan";

export async function getSubscription(
  userId: string
): Promise<Subscription | null | undefined> {
  if (!userId) {
    return null;
  }

  try {
    const subscriptionResult = await prisma?.subscription.findUnique({
      where: {
        userId,
      },
      include: { plan: true },
    });

    return subscriptionResult;
  } catch (e) {
    console.error("Error fetching restaurant by ID: ", e);
    throw e;
  }
}

export async function getAllSubscriptions(): Promise<Subscription[] | null> {
  return null;
}

export async function createSubscription(
  userId: string,
  planId: "10001" | "20001" | "20002"
): Promise<Subscription | null | undefined> {
  if (hasNullUndefined({ userId, planId })) {
    return null;
  }

  try {
    const planDuration = await getPlanDuration(planId);

    if (!planDuration) {
      throw new Error("failed to get plan duration");
    }

    // Calculate the current period start and end dates (Unix timestamps in seconds)
    const currentPeriodStart = Math.floor(new Date().getTime() / 1000);
    const currentPeriodEnd = currentPeriodStart + planDuration.duration;

    // Create a new subscription for the user with the free-trial plan
    const newSubscription = await prisma?.subscription.create({
      data: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE, // Set the subscription status to active
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      },
    });

    if (!newSubscription) {
      throw new Error("failed to create subscription");
    }

    return newSubscription;
  } catch (e) {
    console.error("Error creating subscription: ", e);
    throw e;
  }
}
