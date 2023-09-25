import { getActiveOrderByTableIdAndOrderId } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NotFoundError } from "@/lib/shared/error/ApiError";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantTableId, orderId } = req.query;
  if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
    throw new NotFoundError(
      "Failed to get active order info. Please try again"
    );
  }

  const order = await getActiveOrderByTableIdAndOrderId(
    orderId,
    restaurantTableId
  );
  if (!order) {
    throw new NotFoundError(
      "Failed to get active order info. Please try again"
    );
  }

  return res.status(200).json(order);
}

export default withApiHandler({
  methods: ["GET"],
  handler,
});
