import { Method } from "@/constants/fetch";
import { getOrderItemsByOrderIdAndTableIdAndConditions } from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { ValidationError } from "@/lib/shared/error/ApiError";
import validateAndConvertQuery from "@/utils/validation/validateAndConvertQuery";
import { OrderRequestStatus } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export type IGetOrderItemRawQuery = ToRawQuery<IGetOrderItemQuery>;

export interface IGetOrderItemQuery {
  requestStatus?: OrderRequestStatus | OrderRequestStatus[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.GET) {
    const { restaurantTableId, orderId, ...params } = req.query;
    if (typeof restaurantTableId !== "string" || typeof orderId !== "string") {
      throw new ValidationError(
        "Failed to get active order items info. Please try again"
      );
    }

    const validatedQuery = validateAndConvertQuery<IGetOrderItemQuery>(params, {
      requestStatus: { type: { enum: OrderRequestStatus } },
    });

    const result = await getOrderItemsByOrderIdAndTableIdAndConditions(
      restaurantTableId,
      orderId,
      validatedQuery
    );

    return res.status(200).json(result);
  }
}

export default withApiHandler({
  methods: ["GET"],
  handler,
  isLoginRequired: false,
});
