import { Method } from "@/constants/fetch";
import { getOrderItemsByOrderIdAndTableId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { restaurantTableId, orderId } = req.query;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to get active order items info. Please try again"
      );
    }

    const result = await getOrderItemsByOrderIdAndTableId(
      restaurantTableId,
      orderId
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
