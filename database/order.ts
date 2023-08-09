import { prismaRequestWithDateConversion } from "@/lib/server/prismaRequestWithDateConversion";
import { prismaRequestWithDateConversionForGet } from "@/lib/server/prismaRequestWithDateConversionForGet";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import { Order, OrderStatus, Prisma } from "@prisma/client";

export async function getOrdersByTableId(
  restaurantTableId: string | undefined | null
): Promise<Order[] | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestWithDateConversionForGet(
    prisma.order.findMany({
      where: {
        tableId: restaurantTableId,
      },
    }),
    "getOrdersByRestaurantTableId"
  );
}

export async function getActiveOrderById(
  orderId: string | undefined | null
): Promise<Order | null> {
  if (!orderId) {
    return null;
  }

  return prismaRequestWithDateConversionForGet(
    prisma.order.findFirst({
      where: {
        id: orderId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.ORDERED],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    "getActiveOrderById"
  );
}

export async function getActiveOrderByTableId(
  restaurantTableId: string | undefined | null
): Promise<Order | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestWithDateConversionForGet(
    prisma.order.findFirst({
      where: {
        tableId: restaurantTableId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.ORDERED],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    "getActiveOrderByTableId"
  );
}

export async function getCompletedOrdersByTableId(
  restaurantTableId: string | undefined | null
): Promise<Order[] | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestWithDateConversionForGet(
    prisma.order.findMany({
      where: {
        tableId: restaurantTableId,
        status: OrderStatus.COMPLETED,
      },
    }),
    "getCompletedOrdersByTableId"
  );
}

export async function getAllOrder(): Promise<Order[] | null> {
  return null;
}

export async function createOrder(
  restaurantTableId: string,
  customerName?: string
): Promise<Order> {
  if (!restaurantTableId) {
    throw new ValidationError("Failed to create order");
  }

  return prismaRequestWithDateConversion(
    prisma.order.create({
      data: {
        tableId: restaurantTableId,
        status: customerName ? OrderStatus.PENDING : OrderStatus.ORDERED,
        customerName: customerName || "",
      },
    }),
    "createOrder"
  );
}

export async function updateOrderById<
  T extends Partial<Omit<Order, "id" | "tableId">>
>(orderId: string | undefined | null, updateInfo: T): Promise<Order> {
  const { hasNullUndefined } = checkNullUndefined(updateInfo);

  if (!orderId || hasNullUndefined) {
    throw new ValidationError("Failed to update order. Please try again later");
  }

  return prismaRequestWithDateConversion(
    prisma.order.update({
      where: {
        id: orderId,
      },
      data: updateInfo as Prisma.OrderUpdateInput,
    }),
    "updateOrderById"
  );
}
