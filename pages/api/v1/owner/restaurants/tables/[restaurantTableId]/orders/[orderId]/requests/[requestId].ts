import { Method } from "@/constants/fetch";
import { updateOrderRequest } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPatchOrderRequestBody {
  updateOrderRequestInfo: Prisma.OrderRequestUpdateInput;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.PATCH) {
    const { requestId, restaurantTableId, orderId } = req.query;
    const { updateOrderRequestInfo }: IPatchOrderRequestBody = req.body;
    if (
      typeof requestId !== "string" ||
      typeof restaurantTableId !== "string" ||
      typeof orderId !== "string"
    ) {
      throw new ValidationError(
        "Failed to update order request info. Please try again"
      );
    }

    const result = await updateOrderRequest(
      orderId,
      requestId,
      updateOrderRequestInfo
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["PATCH"],
  handler,
});
