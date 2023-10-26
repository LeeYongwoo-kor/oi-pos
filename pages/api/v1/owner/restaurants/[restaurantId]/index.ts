import { ME_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import {
  UpsertRestaurantInfoParams,
  createOrDeleteRestaurantTables,
  getActiveOrderByRestaurantId,
  getRestaurantAllInfoById,
  updateRestaurantInfo,
  upsertRestaurantInfo,
} from "@/database";
import setInCache from "@/lib/server/cache/setInCache";
import { updateCache } from "@/lib/server/cache/updateCache";
import withApiHandler from "@/lib/server/withApiHandler";
import { ForbiddenError, ValidationError } from "@/lib/shared/error/ApiError";
import { Restaurant, TableType } from "@prisma/client";
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

export type IPutRestaurantInfoBody = Omit<UpsertRestaurantInfoParams, "userId">;

export type IPatchRestaurantInfoBody = Pick<
  Restaurant,
  "startTime" | "endTime" | "holidays" | "lastOrder"
>;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session | null
) {
  if (req.method === Method.POST) {
    const { restaurantId, seatingConfig }: IPostRestaurantTableBody = req.body;
    if (seatingConfig?.tableNumber < 0 && seatingConfig?.counterNumber < 0) {
      throw new ValidationError(
        "Cannot put 0 or negative number in tableNumber and counterNumber at the same time"
      );
    }

    if (session?.isAllInfoRegistered) {
      const activeOrder = await getActiveOrderByRestaurantId(restaurantId);
      if (activeOrder) {
        throw new ForbiddenError(
          "Cannot change table number or counter number while there is an active order. Please try again after closing the order"
        );
      }
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

  if (req.method === Method.PUT) {
    const body: IPutRestaurantInfoBody = req.body;
    const upsertSubscription = await upsertRestaurantInfo({
      userId: session?.id,
      ...body,
    });

    await setInCache(ME_ENDPOINT.RESTAURANT, upsertSubscription, session?.id);
    return res.status(200).json(upsertSubscription);
  }

  if (req.method === Method.PATCH) {
    const body: IPatchRestaurantInfoBody = req.body;
    const updateSubscription =
      await updateRestaurantInfo<IPatchRestaurantInfoBody>(session?.id, body);

    await updateCache(ME_ENDPOINT.RESTAURANT, updateSubscription, session?.id);
    return res.status(200).json(updateSubscription);
  }
}

export default withApiHandler({
  methods: ["POST", "PUT", "PATCH"],
  handler,
});
