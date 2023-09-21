import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { hasNullUndefined } from "@/utils/validation/checkNullUndefined";
import isEmpty from "@/utils/validation/isEmpty";
import { OrderItemOption, Prisma } from "@prisma/client";

export interface CreateOrderItemOptionParams {
  menuItemOptionId: string;
  name: string;
  price: number;
}

export async function createManyOrderItemOptions(
  orderItemId: string | undefined | null,
  orderItemOptionInfo: CreateOrderItemOptionParams[]
): Promise<Prisma.BatchPayload> {
  if (!orderItemId || !orderItemOptionInfo || isEmpty(orderItemOptionInfo)) {
    throw new ValidationError(
      "Failed to create order item options. Please try again later"
    );
  }

  const transformedData = orderItemOptionInfo.map((item) => {
    if (hasNullUndefined(item)) {
      throw new ValidationError(
        "Failed to create order item options. Please try again later"
      );
    }

    return {
      orderItemId,
      menuItemOptionId: item.menuItemOptionId,
      name: item.name,
      price: item.price,
    };
  });

  return prismaRequestHandler(
    prisma.orderItemOption.createMany({
      data: transformedData,
    }),
    "createManyOrderItemOptions"
  );
}

export async function deleteOrderItemOption(
  orderItemOptionId: string | undefined | null
): Promise<OrderItemOption> {
  if (!orderItemOptionId) {
    throw new ValidationError(
      "Failed to delete order item. Please try again later"
    );
  }

  return prismaRequestHandler(
    prisma.orderItemOption.delete({
      where: {
        id: orderItemOptionId,
      },
    }),
    "deleteOrderItemOption"
  );
}
