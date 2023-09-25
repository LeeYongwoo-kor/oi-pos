import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import {
  OrderItem,
  OrderItemOption,
  OrderRequestStatus,
  Prisma,
} from "@prisma/client";
import { CreateOrderItemOptionParams } from "./orderItemOption";

export interface IOrderItem extends OrderItem {
  selectedOptions: OrderItemOption[];
}

export interface IOrderItemForHistory extends OrderItem {
  selectedOptions: OrderItemOption[];
  menuItem: {
    imageUrl: string | null;
    imageVersion: number;
  } | null;
}

export interface CreateOrderItemParams {
  menuItemId: string;
  quantity: number;
  name: string;
  price: number;
  selectedOptions: CreateOrderItemOptionParams[];
}

export async function getOrderItemsByOrderIdAndTableId(
  tableId: string | undefined | null,
  orderId: string | undefined | null
): Promise<IOrderItemForHistory[] | null> {
  if (!tableId || !orderId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.orderItem.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: {
        orderRequest: {
          orderId,
          status: {
            notIn: [OrderRequestStatus.CANCELLED],
          },
          order: {
            tableId,
          },
        },
      },
      include: {
        menuItem: {
          select: {
            imageUrl: true,
            imageVersion: true,
          },
        },
        selectedOptions: true,
      },
    }),
    "getOrderItemsByOrderIdAndTableId"
  );
}

export async function createManyOrderItems(
  orderRequestId: string | undefined | null,
  orderItemInfo: CreateOrderItemParams[]
): Promise<Prisma.BatchPayload> {
  if (!orderRequestId || !orderItemInfo || isEmpty(orderItemInfo)) {
    throw new ValidationError(
      "Failed to create order items. Please try again later"
    );
  }

  const transformedData = orderItemInfo.map((item) => {
    if (hasNullUndefined(item)) {
      throw new ValidationError(
        "Failed to create order items. Please try again later"
      );
    }

    return {
      orderRequestId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
    };
  });

  return prismaRequestHandler(
    prisma.orderItem.createMany({
      data: transformedData,
    }),
    "createManyOrderItems"
  );
}

export async function deleteOrderItem(
  orderItemId: string | undefined | null
): Promise<OrderItem> {
  if (!orderItemId) {
    throw new ValidationError(
      "Failed to delete order item. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderItem.delete({
      where: {
        id: orderItemId,
      },
    }),
    "deleteOrderItem"
  );
}
