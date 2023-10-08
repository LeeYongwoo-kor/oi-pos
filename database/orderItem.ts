import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { IGetOrderItemQuery } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders/[orderId]/items";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import {
  OrderItem,
  OrderItemOption,
  OrderStatus,
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

export interface ITopSellingItemResponse {
  _sum: {
    quantity: number;
  };
  menuItemId: string;
}

export interface CreateOrderItemParams {
  menuItemId: string;
  quantity: number;
  name: string;
  price: number;
  selectedOptions: CreateOrderItemOptionParams[];
}

export async function getOrderItemsByOrderIdAndTableIdAndConditions(
  tableId: string | undefined | null,
  orderId: string | undefined | null,
  { requestStatus }: IGetOrderItemQuery
): Promise<IOrderItemForHistory[] | null> {
  if (!tableId || !orderId) {
    return null;
  }

  const statusCondition: Prisma.OrderRequestWhereInput = requestStatus
    ? {
        status: { in: requestStatus },
      }
    : {};

  return prismaRequestHandler(
    prisma.orderItem.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: {
        orderRequest: {
          orderId,
          order: {
            tableId,
          },
          ...statusCondition,
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
    "getOrderItemsByOrderIdAndTableIdAndStauts"
  );
}

export async function getTopSellingItems(
  restaurantId: string,
  top?: number
): Promise<ITopSellingItemResponse[] | []> {
  if (!restaurantId) {
    return [];
  }

  const topSellingItemsArgs: Prisma.OrderItemGroupByArgs = {
    by: ["menuItemId"],
    take: top || 10,
    _sum: {
      quantity: true,
    },
    where: {
      AND: [
        {
          orderRequest: {
            order: {
              status: OrderStatus.COMPLETED,
              table: {
                restaurantId,
              },
            },
          },
        },
        {
          price: {
            not: 0,
          },
        },
      ],
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
  };

  return prismaRequestHandler(
    prisma.orderItem.groupBy(topSellingItemsArgs as any),
    "getTopSellingItems"
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
