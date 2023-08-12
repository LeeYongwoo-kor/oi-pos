import { ME_ENDPOINT } from "@/constants/endpoint";
import { Method } from "@/constants/fetch";
import {
  createOrDeleteRestaurantTables,
  getRestaurantAllInfoById,
  upsertTableTypeAssignments,
} from "@/database";
import setInCache from "@/lib/server/cache/setInCache";
import withApiHandler from "@/lib/server/withApiHandler";
import { TableType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";
import { ValidationError } from "yup";

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
  if (req.method === Method.PUT) {
    const body: IPutRestaurantTableBody[] = req.body;
    const upsertTableType = await upsertTableTypeAssignments(body);

    return res.status(200).json(upsertTableType);
  }
}

export default withApiHandler({
  methods: ["POST", "PUT"],
  handler,
});
