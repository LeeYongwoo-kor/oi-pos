import { Method } from "@/constants/fetch";
import { updateRestaurantTable } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPatchRestaurantTableBody {
  updateTableInfo: Prisma.RestaurantTableUpdateInput;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.PATCH) {
    const { restaurantTableId } = req.query;
    const { updateTableInfo }: IPatchRestaurantTableBody = req.body;
    if (typeof restaurantTableId !== "string") {
      throw new ValidationError(
        "Failed to update table info. Please try again"
      );
    }

    const result = await updateRestaurantTable(
      restaurantTableId,
      updateTableInfo
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["PATCH"],
  handler,
});
