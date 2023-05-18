import prisma from "@/lib/services/prismadb";
import { Payment } from "@prisma/client";
import checkNullUndefined from "@/utils/checkNullUndefined";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";
import { ValidationError } from "@/lib/shared/CustomError";

export async function getPaymentByOrderId(
  orderId: string | undefined
): Promise<Payment | null> {
  if (!orderId) {
    return null;
  }

  const payment = await prismaRequestHandler(
    prisma.payment.findUnique({
      where: {
        orderId,
      },
      include: { plan: true },
    }),
    "getPaymentByOrderId"
  );

  return payment;
}

export async function getAllPayments(): Promise<Payment[] | null> {
  return null;
}

export async function createPayment(
  planId: string,
  orderId: string,
  status: string,
  amount: number,
  currency: Currency
): Promise<Payment> {
  const { hasNullUndefined } = checkNullUndefined({
    planId,
    orderId,
    status,
    amount,
    currency,
  });

  if (hasNullUndefined) {
    throw new ValidationError("Failed to create payment. Please try again");
  }

  const newPayment = await prismaRequestHandler(
    prisma.payment.create({
      data: {
        planId,
        orderId,
        status,
        amount,
        currency,
      },
    }),
    "createPayment"
  );

  return newPayment;
}

export async function updatePaymentStatus(
  orderId: string,
  newStatus: PaypalStatus
): Promise<Payment> {
  const { hasNullUndefined } = checkNullUndefined({ orderId, newStatus });
  if (hasNullUndefined) {
    throw new ValidationError(
      "Failed to update payment status. Please try again"
    );
  }

  const updatedPayment = await prismaRequestHandler(
    prisma.payment.update({
      where: { orderId },
      data: { status: newStatus },
    }),
    "updatePaymentStatus"
  );

  return updatedPayment;
}

export async function deletePayments(
  orderId: string | unknown
): Promise<{ count: number } | null> {
  if (!orderId) {
    throw new ValidationError("Failed to delete payments. Please try again");
  }

  const deletedPayment = await prismaRequestHandler(
    prisma.payment.deleteMany({
      where: { orderId },
    }),
    "deletePayments"
  );

  return deletedPayment;
}
