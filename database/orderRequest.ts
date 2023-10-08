import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { IGetMyOrderRequestQuery } from "@/pages/api/v1/me/restaurants/tables/orders/requests";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import {
  OrderItem,
  OrderRequest,
  OrderRequestStatus,
  OrderStatus,
  Prisma,
  TableStatus,
} from "@prisma/client";
import { IOrder } from "./order";
import { CreateOrderItemParams, IOrderItem } from "./orderItem";
import { IGetOrderRequestQuery } from "@/pages/api/v1/orders/[orderId]/requests";

export interface IOrderRequest extends OrderRequest {
  order: IOrder[];
  orderItems: IOrderItem[];
}

export interface IOrderRequestForAlarm extends OrderRequest {
  order: {
    orderNumber: number;
    table: {
      id: string;
      number: number;
      tableType: TableType;
    };
  };
  orderItems: IOrderItem[];
}

export interface IOrderRequestForDashboard extends OrderRequest {
  orderItems: OrderItem[];
}

export async function getOrderRequestsByOrderId(
  orderId: string | undefined | null
): Promise<OrderRequest[] | null> {
  if (!orderId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.orderRequest.findMany({
      where: {
        orderId,
      },
      include: {
        orderItems: true,
      },
    }),
    "getOrderRequestsByOrderId"
  );
}

export async function getOrderRequestsByOrderIdAndTableId(
  tableId: string | undefined | null,
  orderId: string | undefined | null
): Promise<OrderRequest[] | null> {
  if (!orderId || !tableId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.orderRequest.findMany({
      where: {
        orderId,
        order: {
          tableId,
        },
      },
      include: {
        orderItems: true,
      },
    }),
    "getOrderRequestsByOrderIdAndTableId"
  );
}

export async function getOrderRequestsByOrderIdAndStatus(
  orderId: string | undefined | null,
  status: OrderRequestStatus | undefined | null
): Promise<OrderRequest[] | null> {
  if (!orderId || !status) {
    return null;
  }

  return prismaRequestHandler(
    prisma.orderRequest.findMany({
      where: {
        orderId,
        status,
      },
      include: {
        orderItems: true,
      },
    }),
    "getOrderRequestsByOrderIdAndStatus"
  );
}

export async function getOrderRequestsForAlarm(
  restaurantId: string | undefined | null,
  { status, tableType, tableNumber, limit, offset }: IGetMyOrderRequestQuery
): Promise<IOrderRequestForAlarm[] | null> {
  if (!restaurantId) {
    return null;
  }

  const orderRequestConditions: Prisma.OrderRequestWhereInput = status
    ? { status: { in: status } }
    : {
        status: {
          notIn: [OrderRequestStatus.COMPLETED],
        },
      };

  const tableConditions: Prisma.RestaurantTableWhereInput = {
    restaurantId,
    status: TableStatus.OCCUPIED,
    ...(tableType && { tableType: { in: tableType } }),
    ...(tableNumber && { number: tableNumber }),
  };

  return prismaRequestHandler(
    prisma.orderRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit || 20,
      skip: offset || 0,
      where: {
        ...orderRequestConditions,
        order: {
          table: {
            ...tableConditions,
          },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
          },
        },
      },
      include: {
        orderItems: {
          include: {
            selectedOptions: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            table: {
              select: {
                id: true,
                number: true,
                tableType: true,
              },
            },
          },
        },
      },
    }),
    "getOrderRequestsForAlarm"
  );
}

export async function getOrderRequestByConditions(
  orderId: string | undefined | null,
  { rejected, status, ...conditions }: IGetOrderRequestQuery
): Promise<OrderRequest[] | null> {
  if (!orderId) {
    return null;
  }

  const orderRequestConditions: Prisma.OrderRequestWhereInput = {
    ...(status && { status: { in: status } }),
    ...(typeof rejected !== "undefined" && {
      rejectedReasonDisplay: rejected,
    }),
    ...conditions,
  };

  return prismaRequestHandler(
    prisma.orderRequest.findMany({
      where: {
        orderId,
        ...orderRequestConditions,
      },
      include: {
        orderItems: true,
      },
    }),
    "getOrderRequestByConditions"
  );
}

export async function createOrderRequest(
  orderId: string,
  status?: OrderRequestStatus
): Promise<OrderRequest> {
  if (!orderId || !status) {
    throw new ValidationError(
      "Failed to create order request. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderRequest.create({
      data: {
        orderId,
        status: status || OrderRequestStatus.PLACED,
      },
    }),
    "createOrderRequest"
  );
}

export async function createOrderRequestWithItemsAndOptions(
  orderId: string | undefined | null,
  orderItemInfo: CreateOrderItemParams[],
  status?: OrderRequestStatus | undefined | null
): Promise<OrderRequest> {
  if (!orderId || isEmpty(orderItemInfo)) {
    throw new ValidationError(
      "Failed to create order request. Please try again later"
    );
  }

  const createOrderRequestInput: Prisma.OrderRequestCreateInput = {
    order: {
      connect: {
        id: orderId,
      },
    },
    status: status || OrderRequestStatus.PLACED,
    orderItems: {
      create: orderItemInfo.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        selectedOptions: {
          create: item.selectedOptions,
        },
      })),
    },
  };

  return prismaRequestHandler(
    prisma.orderRequest.create({
      data: createOrderRequestInput,
    }),
    "createOrderRequestWithItemsAndOptions"
  );
}

export async function updateOrderRequest(
  orderId: string | undefined | null,
  orderRequestId: string | undefined | null,
  updateInfo: Prisma.OrderRequestUpdateInput
): Promise<OrderRequest> {
  const { hasNullUndefined } = checkNullUndefined(updateInfo);

  if (!orderId || !orderRequestId || hasNullUndefined) {
    throw new ValidationError(
      "Failed to update order request. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderRequest.update({
      where: {
        id: orderRequestId,
      },
      data: {
        order: {
          connect: {
            id: orderId,
          },
        },
        ...updateInfo,
      },
    }),
    "updateOrderRequest"
  );
}

export async function updateOrderRequestStatus(
  orderRequestId: string | undefined | null,
  status: OrderRequestStatus
): Promise<OrderRequest> {
  if (!orderRequestId || !status) {
    throw new ValidationError(
      "Failed to update order request status. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderRequest.update({
      where: {
        id: orderRequestId,
      },
      data: {
        status,
      },
    }),
    "updateOrderRequestStatus"
  );
}

export async function updateOrderRequestRejectedReasonDisplay(
  orderId: string | undefined | null,
  rejectedFlag: boolean | undefined
): Promise<Prisma.BatchPayload> {
  if (!orderId || rejectedFlag === undefined) {
    throw new ValidationError(
      "Failed to update order request status. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderRequest.updateMany({
      where: {
        orderId,
      },
      data: {
        rejectedReasonDisplay: rejectedFlag,
      },
    }),
    "updateOrderRequestRejectedReasonDisplay"
  );
}
