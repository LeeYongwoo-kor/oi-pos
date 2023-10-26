import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { IGetMyOrderQuery } from "@/pages/api/v1/me/restaurants/tables/orders";
import checkNullUndefined, {
  hasNullUndefined,
} from "@/utils/validation/checkNullUndefined";
import {
  CurrencyType,
  Order,
  OrderPayment,
  OrderRequestStatus,
  OrderStatus,
  PaymentType,
  Prisma,
  TableStatus,
} from "@prisma/client";
import { IOrderRequestForDashboard } from "./orderRequest";
import { IRestaurantTable } from "./restaurantTable";
import { IGetOrderQuery } from "@/pages/api/v1/restaurants/tables/[restaurantTableId]/orders";

export interface IOrder extends Order {
  table: IRestaurantTable;
}

export interface IOrderForDashboard extends Order {
  orderRequests: IOrderRequestForDashboard[];
}

export interface IOrderForOrderDetail extends Order {
  orderPayment: OrderPayment;
}

export async function getOrdersByTableId(
  restaurantTableId: string | undefined | null
): Promise<Order[] | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.order.findMany({
      where: {
        tableId: restaurantTableId,
      },
    }),
    "getOrdersByRestaurantTableId"
  );
}

export async function getActiveOrderByTableIdAndOrderId(
  orderId: string | undefined | null,
  restaurantTableId: string | undefined | null
): Promise<Order | null> {
  if (!restaurantTableId || !orderId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.order.findFirst({
      where: {
        id: orderId,
        tableId: restaurantTableId,
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
        },
      },
      include: {
        table: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    "getActiveOrderByTableIdAndOrderId"
  );
}

export async function getActiveOrderByRestaurantId(
  restaurantId: string | undefined | null
): Promise<Order | null> {
  if (!restaurantId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.order.findFirst({
      where: {
        table: {
          restaurantId,
        },
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
        },
      },
      include: {
        table: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    "getActiveOrderByRestaurantId"
  );
}

export async function getOrderById(
  orderId: string | undefined | null
): Promise<Order | null> {
  if (!orderId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        table: {
          include: {
            restaurant: true,
          },
        },
      },
    }),
    "getOrderById"
  );
}

export async function getActiveOrderByTableId(
  restaurantTableId: string | undefined | null
): Promise<Order | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestHandler(
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

  return prismaRequestHandler(
    prisma.order.findMany({
      where: {
        tableId: restaurantTableId,
        status: OrderStatus.COMPLETED,
      },
    }),
    "getCompletedOrdersByTableId"
  );
}

export async function getActiveOrderForOrderPayment(
  restaurantId: string | undefined | null,
  { tableType, tableNumber, orderNumber }: IGetMyOrderQuery
): Promise<Order | null> {
  if (
    !restaurantId ||
    hasNullUndefined({ tableType, tableNumber, orderNumber })
  ) {
    return null;
  }

  return prismaRequestHandler(
    prisma.order.findFirst({
      where: {
        orderNumber,
        table: {
          tableType: {
            in: tableType,
          },
          number: tableNumber,
          restaurantId,
        },
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
        },
      },
      include: {
        table: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    "getActiveOrderForOrderPayment"
  );
}

export async function getOrderTableIdAndConditions(
  tableId: string | undefined | null,
  { orderStatus, startDate, endDate }: IGetOrderQuery
): Promise<Order[] | null> {
  if (!tableId) {
    return null;
  }

  const orderConditions: Prisma.OrderWhereInput = {
    ...(orderStatus && { status: { in: orderStatus } }),
    ...(startDate &&
      endDate && {
        AND: [
          { createdAt: { gte: startDate } },
          { createdAt: { lte: endDate } },
        ],
      }),
  };

  return prismaRequestHandler(
    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        tableId,
        ...orderConditions,
      },
      include: {
        orderPayment: {
          select: {
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    }),
    "getOrderTableIdAndConditions"
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

  return prismaRequestHandler(
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

export async function updateOrderById(
  orderId: string | undefined | null,
  updateInfo: Prisma.OrderUpdateInput
): Promise<Order> {
  const { hasNullUndefined } = checkNullUndefined(updateInfo);

  if (!orderId || hasNullUndefined) {
    throw new ValidationError("Failed to update order. Please try again later");
  }

  return prismaRequestHandler(
    prisma.order.update({
      where: {
        id: orderId,
      },
      data: updateInfo,
    }),
    "updateOrderById"
  );
}

export async function createOrderPaymentAndUpateOrderStatus(
  orderId: string | undefined | null,
  totalAmount: number,
  paymentType?: PaymentType,
  currencyType?: CurrencyType
): Promise<Order> {
  if (!orderId || !totalAmount) {
    throw new ValidationError(
      "Failed to update order status and create order payment. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.COMPLETED,
        table: {
          update: {
            status: TableStatus.AVAILABLE,
          },
        },
        orderPayment: {
          create: {
            totalAmount,
            currency: currencyType || CurrencyType.JPY,
            paymentType: paymentType || PaymentType.CASH,
          },
        },
        orderRequests: {
          updateMany: [
            {
              where: {
                orderId,
                status: OrderRequestStatus.ACCEPTED,
              },
              data: {
                status: OrderRequestStatus.COMPLETED,
              },
            },
            {
              where: {
                orderId,
                status: OrderRequestStatus.PLACED,
              },
              data: {
                status: OrderRequestStatus.CANCELLED,
              },
            },
          ],
        },
      },
    }),
    "updateOrderStatusAndCreateOrderPayment"
  );
}
