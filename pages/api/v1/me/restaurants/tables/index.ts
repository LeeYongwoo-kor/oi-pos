import { ME_ENDPOINT } from "@/constants/endpoint";
import { getRestaurantTablesByRestaurantId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { OrderStatus, TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (!session?.restaurantId) {
    throw ValidationError.builder()
      .setMessage("Failed to get restaurant tables")
      .setEndpoint(ME_ENDPOINT.TABLE)
      .build();
  }

  const restaurantTables = await getRestaurantTablesByRestaurantId(
    session.restaurantId
  );

  // Sort restaurant tables by status and number and tableType
  if (restaurantTables) {
    restaurantTables.sort((a, b) => {
      const aStatus = a.orders.length ? a.orders[0].status : "OTHER";
      const bStatus = b.orders.length ? b.orders[0].status : "OTHER";

      // Sort by status
      if (aStatus !== bStatus) {
        if (aStatus === OrderStatus.PAYMENT_REQUESTED) return -1;
        if (bStatus === OrderStatus.PAYMENT_REQUESTED) return 1;
        if (aStatus === OrderStatus.ORDERED) return -1;
        if (bStatus === OrderStatus.ORDERED) return 1;
        if (aStatus === OrderStatus.PENDING) return -1;
        if (bStatus === OrderStatus.PENDING) return 1;
      }

      // Sort by tableType
      if (a.tableType !== b.tableType) {
        return a.tableType === TableType.TABLE ? -1 : 1;
      }

      // Sort by number
      return a.number - b.number;
    });
  }

  return res.status(200).json(restaurantTables);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
