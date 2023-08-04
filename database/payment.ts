import prisma from "@/lib/services/prismadb";
import { PlanPayment } from "@prisma/client";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";

export async function getPlanPaymentByOrderId(
  orderId: string | undefined
): Promise<PlanPayment | null> {
  if (!orderId) {
    return null;
  }

  const planPayment = await prismaRequestHandler(
    prisma.planPayment.findUnique({
      where: {
        planOrderId: orderId,
      },
      include: { plan: true },
    }),
    "getPlanPaymentByOrderId"
  );

  return planPayment;
}

export async function getAllplanPayments(): Promise<PlanPayment[] | null> {
  return null;
}

export async function createPlanPayment(
  planId: string,
  orderId: string,
  status: string,
  amount: number,
  currency: Currency
): Promise<PlanPayment> {
  const { hasNullUndefined } = checkNullUndefined({
    planId,
    orderId,
    status,
    amount,
    currency,
  });

  if (hasNullUndefined) {
    throw new ValidationError("Failed to create planPayment. Please try again");
  }

  const newPlanPayment = await prismaRequestHandler(
    prisma.planPayment.create({
      data: {
        planId,
        planOrderId: orderId,
        status,
        amount,
        currency,
      },
    }),
    "createPlanPayment"
  );

  return newPlanPayment;
}

export async function updatePlanPaymentStatus(
  orderId: string,
  newStatus: PaypalStatusType
): Promise<PlanPayment> {
  const { hasNullUndefined } = checkNullUndefined({ orderId, newStatus });
  if (hasNullUndefined) {
    throw new ValidationError(
      "Failed to update planPayment status. Please try again"
    );
  }

  const updatedPlanPayment = await prismaRequestHandler(
    prisma.planPayment.update({
      where: { planOrderId: orderId },
      data: { status: newStatus },
    }),
    "updatePlanPaymentStatus"
  );

  return updatedPlanPayment;
}

export async function deletePlanPayments(
  orderId: string | unknown
): Promise<{ count: number } | null> {
  if (!orderId) {
    throw new ValidationError(
      "Failed to delete planPayments. Please try again"
    );
  }

  const deletedPlanPayment = await prismaRequestHandler(
    prisma.planPayment.deleteMany({
      where: { planOrderId: orderId },
    }),
    "deletePlanPayments"
  );

  return deletedPlanPayment;
}
