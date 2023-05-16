import prisma from "@/lib/services/prismadb";
import { Payment } from "@prisma/client";
import hasNullUndefined from "../utils/hasNullUndefined";
import prismaRequestHandler from "@/lib/server/prismaRequestHandler";

export async function getPaymentByOrderId(
  orderId: string | undefined
): Promise<Payment | null> {
  if (!orderId) {
    return null;
  }

  const [payment, error] = await prismaRequestHandler(
    prisma.payment.findUnique({
      where: {
        orderId,
      },
      include: { plan: true },
    }),
    "getPaymentByOrderId"
  );

  if (error) {
    throw new Error(error.message);
  }

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
  if (hasNullUndefined({ planId, orderId, status, amount, currency })) {
    throw new Error("failed to create payment");
  }

  const [newPayment, error] = await prismaRequestHandler(
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

  if (error) {
    throw new Error(error.message);
  }

  return newPayment;
}

export async function updatePaymentStatus(
  orderId: string,
  newStatus: PaypalStatus
): Promise<Payment> {
  if (hasNullUndefined({ orderId, newStatus })) {
    throw Error("not found orderId or newStatus");
  }

  const [updatedPayment, error] = await prismaRequestHandler(
    prisma.payment.update({
      where: { orderId },
      data: { status: newStatus },
    }),
    "updatePaymentStatus"
  );

  if (error) {
    throw new Error(error.message);
  }

  return updatedPayment;
}

export async function deletePayments(
  orderId: string | unknown
): Promise<{ count: number } | null> {
  if (!orderId) {
    return null;
  }

  const [deletedPayment, error] = await prismaRequestHandler(
    prisma.payment.deleteMany({
      where: { orderId },
    }),
    "deletePayments"
  );

  if (error) {
    throw new Error(error.message);
  }

  return deletedPayment;
}
