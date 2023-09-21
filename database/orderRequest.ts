import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import checkNullUndefined from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import { OrderRequest, OrderRequestStatus, Prisma } from "@prisma/client";
import { CreateOrderItemParams } from "./orderItem";

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

export async function updateOrderRequest<
  T extends Partial<Omit<OrderRequest, "id" | "orderId">>
>(
  orderRequestId: string | undefined | null,
  updateInfo: T
): Promise<OrderRequest> {
  const { hasNullUndefined } = checkNullUndefined(updateInfo);

  if (!orderRequestId || hasNullUndefined) {
    throw new ValidationError(
      "Failed to update order request. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderRequest.update({
      where: {
        id: orderRequestId,
      },
      data: updateInfo,
    }),
    "updateOrderRequest"
  );
}
