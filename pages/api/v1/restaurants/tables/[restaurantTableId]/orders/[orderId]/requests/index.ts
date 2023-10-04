import { Method } from "@/constants/fetch";
import {
  CreateOrderItemParams,
  createOrderRequestWithItemsAndOptions,
  getOrderRequestsByOrderIdAndTableId,
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
  if (req.method === Method.GET) {
    const { restaurantTableId, orderId } = req.query;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to get active order request info. Please try again"
      );
    }

    const result = await getOrderRequestsByOrderIdAndTableId(
      restaurantTableId,
      orderId
    );

    return res.status(200).json(result);
  }

  if (req.method === Method.POST) {
    const { restaurantTableId, orderId } = req.query;
    const { orderItemInfo, status }: IPostRestaurantTableOrderBody = req.body;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to get active order request info. Please try again"
      );
    }

    const result = await createOrderRequestWithItemsAndOptions(
      orderId,
      orderItemInfo,
      status
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["GET", "POST"],
  handler,
  isLoginRequired: false,
});
