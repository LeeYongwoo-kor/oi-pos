import {
  CreateOrderItemParams,
  createOrderRequestWithItemsAndOptions,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import { OrderRequestStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface IPostRestaurantTableOrderBody {
  orderItemInfo: CreateOrderItemParams[];
  status?: OrderRequestStatus;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantTableId, orderId } = req.query;
  const { orderItemInfo, status }: IPostRestaurantTableOrderBody = req.body;
  if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
    throw new ValidationError(
      "Failed to get active order info. Please try again"
    );
  }

  const result = await createOrderRequestWithItemsAndOptions(
    orderId,
    orderItemInfo,
    status
  );
  return res.status(200).json(result);
}

export default withApiHandler({
  methods: ["POST"],
  handler,
  isLoginRequired: false,
});
