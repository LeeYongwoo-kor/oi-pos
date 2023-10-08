import { Method } from "@/constants/fetch";
import { createAndReserveOrder } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostRestaurantTableReserveBody {
  customerName: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const { restaurantTableId } = req.query;
    const { customerName }: IPostRestaurantTableReserveBody = req.body;
    if (typeof restaurantTableId !== "string") {
      throw new ValidationError("Failed to reserve order. Please try again");
    }

    const result = await createAndReserveOrder(restaurantTableId, customerName);
    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["POST"],
  handler,
});
