import prismaRequestHandler from "@/lib/server/prisma/prismaRequestHandler";
import prisma from "@/lib/services/prismadb";
import { OrderPayment } from "@prisma/client";

export async function getOrderPaymentsByRestaurantTableId(
  restaurantTableId: string | undefined | null
): Promise<OrderPayment[] | null> {
  if (!restaurantTableId) {
    return null;
  }

  return prismaRequestHandler(
    prisma.orderPayment.findMany({
      where: {
        order: {
          tableId: restaurantTableId,
        },
      },
    }),
    "getOrderPaymentsByRestaurantTableId"
  );
}
