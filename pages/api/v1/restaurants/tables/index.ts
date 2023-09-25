import { ME_ENDPOINT, RESTAURANT_TABLE_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import {
  createOrDeleteRestaurantTables,
  getRestaurantAllInfoById,
  getRestaurantTablesByRestaurantId,
} from "@/database";
import setInCache from "@/lib/server/cache/setInCache";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { OrderStatus, TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export interface ISeatingConfig {
  tableNumber: number;
  counterNumber: number;
}
export interface IPostRestaurantTableBody {
  restaurantId: string;
  seatingConfig: ISeatingConfig;
}
export interface IPutRestaurantTableBody {
  restaurantTableId: string;
  tableType: TableType;
  number: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (req.method === Method.GET) {
    if (!session?.restaurantId) {
      throw ValidationError.builder()
        .setMessage("Failed to get restaurant tables")
        .setEndpoint(RESTAURANT_TABLE_ENDPOINT.BASE)
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

  if (req.method === Method.POST) {
    const { restaurantId, seatingConfig }: IPostRestaurantTableBody = req.body;
    if (seatingConfig?.tableNumber < 0 && seatingConfig?.counterNumber < 0) {
      throw new ValidationError(
        "Cannot put 0 or negative number in tableNumber and counterNumber at the same time"
      );
    }
    await createOrDeleteRestaurantTables(
      restaurantId,
      TableType.TABLE,
      seatingConfig.tableNumber
    );
    await createOrDeleteRestaurantTables(
      restaurantId,
      TableType.COUNTER,
      seatingConfig.counterNumber
    );

    const restaurant = await getRestaurantAllInfoById(restaurantId);
    await setInCache(ME_ENDPOINT.RESTAURANT, restaurant, session?.id);
    return res.status(201).json(restaurant);
  }
}

export default withApiHandler({
  methods: ["GET", "POST"],
  handler,
});
