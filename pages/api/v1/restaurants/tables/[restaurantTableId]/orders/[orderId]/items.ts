import { Method } from "@/constants/fetch";
import { getOrderItemsByOrderIdAndTableIdAndStauts } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import isEmpty from "@/utils/validation/isEmpty";
import { OrderRequestStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { restaurantTableId, orderId, requestStatus } = req.query;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to get active order items info. Please try again"
      );
    }

    const statuses = requestStatus
      ? Array.isArray(requestStatus)
        ? requestStatus
        : [requestStatus]
      : [];

    if (
      !isEmpty(statuses) &&
      !statuses.every((status) =>
        Object.values(OrderRequestStatus).includes(
          status.toUpperCase() as OrderRequestStatus
        )
      )
    ) {
      throw new ValidationError(
        "Invalid request status parameter. Please try again"
      );
    }

    const result = await getOrderItemsByOrderIdAndTableIdAndStauts(
      restaurantTableId,
      orderId,
      statuses as OrderRequestStatus[]
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
